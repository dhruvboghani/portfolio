---
title: Apache Iceberg time travel: query your data as it was
description: How Iceberg snapshots let you query past versions of a table with Trino, debug bad loads and roll back safely.
date: 2026-10-04
tags: Data Engineering, Iceberg, Trino
---
Every write to an Apache Iceberg table creates a **snapshot**. Because old snapshots are kept, you can query the table exactly as it looked at an earlier point in time.

## Query a past version

In Trino you can read a table at a snapshot or at a timestamp:

```sql
SELECT count(*) FROM events FOR VERSION AS OF 8954597067493422955;
SELECT count(*) FROM events FOR TIMESTAMP AS OF TIMESTAMP '2026-10-01 00:00:00 UTC';
```

## Why it matters

- **Debugging**: compare today's table with yesterday's to find a bad load.
- **Audit**: reproduce a report exactly as it was produced.
- **Rollback**: return to a known-good snapshot after a faulty job.

## Keep storage under control

Old snapshots take space. Expire them on a schedule, and keep the window long enough for your audit needs. Catalogs such as Nessie add Git-like branches on top, so you can test changes safely before publishing them.
