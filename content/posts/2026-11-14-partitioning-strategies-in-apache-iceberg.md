---
title: Partitioning strategies in Apache Iceberg
description: How Apache Iceberg hidden partitioning works: partition transforms, partition evolution, avoiding small files, and optimizing query pruning.
date: 2026-11-14
tags: apache-iceberg, data-lakehouse, data-engineering
---
In traditional Hive-style data warehouses, partitioning is both explicit and fragile. Tables are physically structured into nested directory trees (such as `/year=2026/month=11/day=14/`), forcing queries to include explicit partition columns to avoid full table scans. If a user queries by timestamp instead of the synthetic date string, pruning fails.

Apache Iceberg eliminates this operational headache through hidden partitioning. Iceberg separates physical data layout from logical query syntax, providing fast query pruning while preserving table evolution.

## How hidden partitioning works

In Hive, users must know how the table was partitioned to write efficient queries:

```sql
-- Traditional Hive: User must supply synthetic date strings
SELECT * FROM events 
WHERE event_time >= '2026-11-14 00:00:00' 
  AND event_date = '2026-11-14';
```

In Apache Iceberg, partition values are produced directly from source columns via built-in transforms. The query engine reads table metadata, recognizes that `event_time` is partitioned by day, and prunes partitions automatically without requiring redundant predicates:

```sql
-- Apache Iceberg: Hidden partitioning prunes files automatically
SELECT * FROM events 
WHERE event_time >= TIMESTAMP '2026-11-14 00:00:00';
```

## Built-in partition transforms

Iceberg provides native partition transforms that maintain clean file layouts without requiring auxiliary columns:

- **Temporal transforms:** `years()`, `months()`, `days()`, and `hours()`. These automatically extract calendar units from timestamp or date columns.
- **Bucket transform:** `bucket(N, col)`. Hashes a column (such as `user_id`) into $N$ buckets, distributing high-cardinality keys evenly across files to prevent uneven skew.
- **Truncate transform:** `truncate(W, col)`. Truncates strings to $W$ characters, grouping similar text keys into manageable partition boundaries.
- **Identity transform:** Partitions directly on the raw column value, recommended only for low-cardinality categorical fields (such as region or department).

```sql
CREATE TABLE lakehouse.telemetry (
    device_id STRING,
    event_time TIMESTAMP,
    metric_value DOUBLE
)
USING iceberg
PARTITIONED BY (days(event_time), bucket(16, device_id));
```

## Partition evolution without rewrites

In legacy table formats, changing a table's partition scheme (for example, migrating from daily partitioning to hourly partitioning as data volume explodes) requires rewriting every terabyte of historical data into new directories.

Iceberg supports true **partition evolution**. When partition specs change, Iceberg assigns a new partition spec ID to newly written files while leaving historical data files untouched:

- Queries covering historical dates prune files using the original partition spec.
- Queries covering new dates prune files using the updated partition spec.
- No historical data files are moved, renamed, or rewritten.

This allows data engineering teams to adapt table architectures smoothly as ingestion throughput grows over time.

## Avoiding the small-files problem

Over-partitioning is a common pitfall. If you partition by hour on a dataset that only receives 10 megabytes of data per day, you create hundreds of tiny files. Small files overwhelm object store metadata APIs and severely degrade analytical query engines like Trino and Spark.

To prevent small-file degradation:

- Aim for parquet file sizes between 128MB and 512MB after compression.
- Do not partition on high-cardinality fields using identity transforms.
- Combine larger temporal partitions (such as `months` or `days`) with sorting (Z-ordering or clustering) inside each file rather than slicing into tiny physical directories.
- Schedule recurring background table maintenance jobs using `rewrite_data_files` to compact fragmented writes into optimal target file sizes.

## Takeaway

Apache Iceberg hidden partitioning decouples physical storage organization from user SQL queries. Use built-in transforms like `days` and `bucket` to avoid synthetic columns, evolve partition specs safely as data scales without table rewrites, and size partitions conservatively to maintain healthy file sizes.
