---
title: Apache Iceberg compaction and table maintenance
description: How to keep Apache Iceberg tables fast: compacting small files, expiring snapshots, removing orphan files, rewriting manifests and scheduling maintenance.
date: 2026-11-02
tags: iceberg, lakehouse, data-engineering
---
Apache Iceberg tables stay correct without maintenance, but they do not stay fast. Every streaming commit adds files and metadata, and over weeks a busy table can slow queries and raise storage costs.

The fix is routine maintenance: a handful of jobs that rewrite small files, clean up history and tidy metadata. This post covers each one and how to schedule them.

## Why tables degrade

- **Small files:** streaming jobs commit often, and each commit writes new data files. Thousands of small files mean more file opens, more metadata to read and slower planning.
- **Delete files:** row-level updates and deletes in merge-on-read mode write delete files that every query must apply until they are merged.
- **Snapshot history:** every commit creates a snapshot. Old snapshots keep old files alive for time travel.
- **Metadata growth:** manifests multiply and become less well organised.
- **Orphan files:** failed or interrupted writes can leave files that no snapshot references.

## Compaction: rewrite data files

Compaction combines many small files into fewer larger ones, often targeting a few hundred megabytes per file, and applies pending delete files.

- **Bin-packing** simply groups small files together. It is the cheapest option.
- **Sorting** rewrites data ordered by columns you filter on often, which improves file skipping.
- **Z-ordering** clusters data across several columns when queries filter on different combinations.

Compact the partitions that are actively changing, usually recent ones, rather than the whole table every time.

```sql
-- Spark
CALL catalog.system.rewrite_data_files(
  table => 'analytics.events',
  strategy => 'sort',
  sort_order => 'tenant_id, event_time',
  where => 'event_date >= current_date() - 2'
);

-- Trino
ALTER TABLE analytics.events EXECUTE optimize(file_size_threshold => '128MB');
```

## Expire old snapshots

Snapshots enable time travel and rollback, but you rarely need every one forever. Expiring snapshots older than a retention period lets Iceberg delete files that are no longer referenced.

```sql
CALL catalog.system.expire_snapshots(
  table => 'analytics.events',
  older_than => TIMESTAMP '2026-10-26 00:00:00',
  retain_last => 50
);
```

Choose retention based on how far back you need to audit or recover, and keep it consistent with any branches or tags you rely on.

## Remove orphan files

Orphan file cleanup finds files in the table location that no metadata references and deletes them. Only remove files older than your longest running write, typically a few days, so you never delete files from a commit still in progress.

## Rewrite manifests

When a table has many small or poorly grouped manifests, query planning slows down. Rewriting manifests regroups them, often by partition, so planning reads less metadata. This is cheap and worth running when planning time grows.

## Scheduling maintenance

- **Streaming tables:** compact recent partitions every hour or few hours; expire snapshots daily.
- **Batch tables:** compact after large loads; expire snapshots daily or weekly.
- **Orphan cleanup and manifest rewrites:** weekly is usually enough.
- **Avoid conflicts:** compaction commits like any writer. Iceberg handles concurrent commits with optimistic concurrency, but heavy overlap with streaming writes causes retries, so compact partitions that writers are no longer touching when possible.

Run these as scheduled jobs in your orchestrator, or use your platform's automatic table maintenance if it has one.

## Monitor table health

Track file count and average file size per partition, the number of snapshots, delete file counts, metadata size and query planning time. A rising file count or planning time is the signal that maintenance is falling behind.

## Takeaway

Iceberg tables need regular care to stay fast: compact small files with bin-packing or sorting, expire snapshots you no longer need, remove orphan files safely, and rewrite manifests when planning slows. Schedule each job to match how the table is written, and monitor file counts and planning time to know when to adjust.
