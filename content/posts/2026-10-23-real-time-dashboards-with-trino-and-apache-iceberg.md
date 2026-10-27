---
title: Real-time dashboards with Trino and Apache Iceberg
description: How to build near real-time dashboards on Trino and Apache Iceberg: streaming ingestion, commit intervals, table layout, compaction and fast queries.
date: 2026-10-23
tags: trino, iceberg, data-engineering
---
Dashboards used to mean a nightly batch job and a warehouse. With streaming ingestion into Apache Iceberg and Trino as the query engine, the same lakehouse that stores history can serve dashboards that are only minutes, or less, behind reality.

Getting there takes a few deliberate choices about ingestion, table layout and maintenance. This post walks through them.

## The architecture

A typical setup has four parts.

- **Event stream:** Kafka or Redpanda carries events from applications.
- **Stream processor:** Apache Flink or Spark Structured Streaming cleans events and writes them to Iceberg tables.
- **Iceberg tables** on object storage, with a catalog such as Nessie, Hive Metastore or a REST catalog.
- **Trino** queries the tables, and a BI tool or custom dashboard reads from Trino.

Every write to Iceberg is a commit that creates a new snapshot. Trino reads the latest snapshot, so new data becomes visible as soon as it is committed.

## Freshness is set by the commit interval

The stream processor batches events and commits them periodically, often on each checkpoint.

- **Shorter intervals** mean fresher dashboards, but more snapshots and more small files.
- **Longer intervals** mean fewer, larger files and less metadata, but older data.

For most dashboards, commits every one to five minutes are a practical balance. If you truly need second-level freshness, query the stream or a real-time store for the latest minutes and the lakehouse for history.

## Lay tables out for the queries you run

Dashboard queries are usually filtered by time and a few dimensions. Design for that.

- **Partition by time** at a sensible grain, such as day or hour, using Iceberg's hidden partitioning so queries do not need to know the partition column.
- **Sort within files** on commonly filtered columns, like tenant or region, so Trino can skip data using file statistics.
- **Avoid over-partitioning.** Too many small partitions create too many small files.

```sql
CREATE TABLE lake.analytics.orders (
  order_id   VARCHAR,
  tenant_id  VARCHAR,
  amount     DECIMAL(12,2),
  status     VARCHAR,
  created_at TIMESTAMP(6) WITH TIME ZONE
)
WITH (
  partitioning = ARRAY['day(created_at)'],
  sorted_by = ARRAY['tenant_id']
);
```

## Keep tables healthy with maintenance

Streaming writes produce many small files and snapshots. Without maintenance, queries slow down over time.

- **Compaction:** rewrite small files into larger ones regularly, for example hourly for recent partitions.
- **Expire snapshots:** remove old snapshots you no longer need for time travel, which also lets unused files be deleted.
- **Remove orphan files** left behind by failed writes.
- **Rewrite manifests** when metadata grows large.

Trino can run several of these with `ALTER TABLE ... EXECUTE`, such as `optimize` and `expire_snapshots`, and they can be scheduled like any other job.

## Make dashboard queries fast

- **Pre-aggregate** for the busiest views. A streaming job can maintain a summary table by minute or hour, which is far cheaper to query than raw events.
- **Always filter on the partition column,** such as the last 24 hours, so Trino reads only recent data.
- **Select only needed columns.** Iceberg stores data in columnar Parquet files, so fewer columns means less I/O.
- **Size the Trino cluster** for concurrent dashboard refreshes, and set sensible refresh intervals in the dashboard tool.

## Bonus: history and audits for free

Because Iceberg keeps snapshots, the same tables support time travel. You can see what a dashboard showed at a past point, compare numbers before and after a fix, and audit changes without a separate archive.

## Takeaway

Trino on Iceberg can power near real-time dashboards when you choose a commit interval that matches your freshness needs, partition and sort for dashboard filters, run compaction and snapshot expiry regularly, and pre-aggregate the busiest views. You get fresh numbers and full history from one lakehouse.
