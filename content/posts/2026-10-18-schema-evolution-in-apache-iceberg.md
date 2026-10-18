---
title: Schema evolution in Apache Iceberg: change tables safely
description: How Apache Iceberg handles schema evolution with column IDs: adding, renaming, dropping and widening columns without rewriting data or breaking readers.
date: 2026-10-18
tags: iceberg, lakehouse, data-engineering
---
Data never keeps the same shape for long. Product teams add fields, rename confusing columns and change types, and the tables downstream have to keep up without breaking every dashboard and job that reads them.

Apache Iceberg was designed with this in mind. Its schema evolution lets you change a table's structure as a metadata operation, without rewriting existing data files and without silently corrupting results. This post explains how it works and how to use it well.

## Why schema changes hurt in plain data lakes

In a lake of raw Parquet files, the schema is mostly implied by the files themselves and by column names. That causes familiar problems:

- **Renames break history.** Old files still use the old name, so queries return nulls for older data.
- **Dropped and re-added columns collide.** A new column with an old name can accidentally pick up old values.
- **Type changes need rewrites.** Changing a type often means rewriting every file.
- **Readers disagree.** Different engines interpret mismatched files differently.

## How Iceberg tracks columns

Iceberg assigns every column a **unique field ID** when it is created and stores that ID in the table metadata and in the data files. Readers match columns by ID, not by name or position.

That one decision makes the common operations safe:

- **Rename:** only the name in metadata changes. Old and new files still map to the same ID, so history stays intact.
- **Drop:** the ID is removed from the current schema. Old data is not read for that column anymore.
- **Add:** a new column gets a new ID. It never picks up values from a previously dropped column with the same name, and older files simply return nulls for it.
- **Reorder:** position does not matter, so reordering is metadata only.

Every schema change creates a new table snapshot, so you can see when the change happened and query data as it was before.

## Supported changes

```sql
-- add a nullable column
ALTER TABLE lake.orders ADD COLUMN discount_code STRING;

-- rename without rewriting files
ALTER TABLE lake.orders RENAME COLUMN cust_id TO customer_id;

-- widen a type
ALTER TABLE lake.orders ALTER COLUMN quantity TYPE BIGINT;

-- drop a column
ALTER TABLE lake.orders DROP COLUMN legacy_flag;
```

- **Add columns,** including nested fields inside structs.
- **Rename columns** and nested fields.
- **Drop columns.**
- **Reorder columns.**
- **Widen types** safely, such as `int` to `long`, `float` to `double`, or increasing decimal precision.
- **Make required columns optional.** The reverse is not allowed, because older data may contain nulls.

Changes that could lose information, such as narrowing a type or converting a string to a number, are rejected. For those, add a new column, backfill it and switch readers over.

## Schema evolution vs partition evolution

Iceberg also supports **partition evolution**, which is related but different. You can change how new data is partitioned, for example from daily to hourly, without rewriting old data. Queries use hidden partitioning, so they keep working without users writing partition filters by hand. Plan both together when a table's usage changes.

## Streaming and CDC pipelines

Schema changes often start in a source database and arrive through change data capture.

- **Decide who owns the schema.** Either the pipeline applies compatible changes automatically, or a person reviews them first. Automatic is convenient; reviewed is safer for important tables.
- **Use a schema registry** for event formats, so producers cannot publish breaking changes unnoticed.
- **Let writers handle new fields.** Many writers can merge new nullable columns into the Iceberg schema as they appear.
- **Test with each query engine.** Spark, Flink and Trino all read Iceberg, but check their versions support the changes you plan.

## Good practices

- **Prefer additive changes.** Adding a nullable column is the safest change there is.
- **Rename for clarity, not on a whim.** Renames are safe in Iceberg, but downstream SQL, dashboards and APIs still reference names.
- **Communicate changes.** Keep a changelog or use table properties and comments so consumers know what changed and why.
- **Use branches or a catalog like Nessie** to test schema changes in isolation before merging them into the main table.
- **Keep old snapshots long enough** to compare results before and after a change, then expire them to control storage.

## Takeaway

Iceberg makes schema evolution safe by tracking columns with stable IDs instead of names or positions. Add, rename, drop, reorder and widen columns as metadata operations, avoid lossy type changes, and pair it with partition evolution, schema registries and catalog branches. Your tables can then change as fast as the business does without breaking the people who rely on them.
