---
title: Change data capture (CDC) explained for data engineers
description: What change data capture is, how log-based CDC works, how it compares to batch extracts, and the pitfalls to plan for when streaming database changes.
date: 2026-10-17
tags: data-engineering, cdc, streaming
---
Most important data starts life in an application database: orders, invoices, users, leads. Getting that data into analytics, search indexes or AI systems quickly and reliably is one of the most common jobs in data engineering.

Change data capture, or CDC, solves it by streaming every insert, update and delete as it happens, instead of copying whole tables on a schedule. This post explains how CDC works, when to use it and what tends to go wrong.

## The problem with batch extracts

The traditional approach runs a query every night or every hour, such as `SELECT * FROM orders WHERE updated_at > :last_run`, and loads the result elsewhere.

It works, but it has known weaknesses:

- **Latency:** data is only as fresh as the last run.
- **Load:** large queries put pressure on the production database.
- **Missed changes:** rows deleted between runs disappear without a trace, and rows updated without touching `updated_at` are skipped.
- **No history:** if a row changes three times between runs, you only see the final state.

## How log-based CDC works

Databases already record every change in a log so they can recover from crashes and feed replicas. PostgreSQL has the write-ahead log, MySQL has the binlog. Log-based CDC reads that log and turns each change into an event.

- **Low impact:** reading the log does not run heavy queries against your tables.
- **Complete:** inserts, updates and deletes are all captured, in commit order.
- **Fast:** changes are available within seconds of the commit.

A typical setup uses a CDC connector such as Debezium to read the log and publish events to Kafka or Redpanda, one topic per table. Downstream consumers then apply the changes to a warehouse, a lakehouse, a search index or a cache.

Each event usually carries the operation type, the row before and after the change, and metadata such as the transaction and log position.

```json
{
  "op": "u",
  "before": { "id": 42, "status": "pending", "amount": 1200 },
  "after":  { "id": 42, "status": "paid",    "amount": 1200 },
  "source": { "table": "invoices", "lsn": 981234567 },
  "ts_ms": 1760680000000
}
```

## Other CDC approaches

- **Query-based CDC:** poll tables using a timestamp or incrementing column. Simple, but it misses deletes and adds load.
- **Trigger-based CDC:** database triggers write changes to an audit table. Complete, but it slows down every write and adds logic to the database.
- **Log-based CDC:** reads the transaction log. Usually the best choice for production systems, but it needs the right database settings and permissions.

## Where CDC events go

- **Lakehouse tables:** apply changes to Apache Iceberg tables with merge operations, keeping history through snapshots and making yesterday's state queryable.
- **Real-time analytics:** feed stream processors like Flink to compute live metrics and alerts.
- **Search and RAG:** re-embed and re-index a document as soon as its source row changes, so AI answers never rely on stale content.
- **Caches and microservices:** keep other services in sync without tight coupling to the main database.

## Pitfalls to plan for

**Initial snapshot.** CDC captures changes from a point in time. You also need a consistent initial copy of existing rows, and the connector must switch from snapshot to streaming without gaps or duplicates.

**Schema changes.** Adding or renaming columns changes the event shape. Use a schema registry or well-defined formats, and make sure downstream tables can evolve. Iceberg's schema evolution helps here.

**Ordering and duplicates.** Events for the same row must be applied in order, and most pipelines deliver at least once. Partition topics by primary key and make the consumer idempotent, for example by upserting on the key and ignoring events older than the stored log position.

**Deletes.** Decide how deletes appear downstream: removed rows, soft-delete flags or tombstones. Handle them deliberately so deleted data does not linger in search indexes or AI context.

**Log retention.** If the connector stops for longer than the database keeps its log, changes are lost and you need a new snapshot. Monitor connector lag and set retention with a safety margin.

**Sensitive data.** CDC copies everything, including personal data. Mask or drop sensitive columns early in the pipeline and respect tenant boundaries in multi-tenant systems.

## When to use CDC

CDC is a good fit when downstream systems need fresh data, when you must capture deletes and history, or when heavy extract queries are hurting production. A nightly batch is still fine for small tables, reports that tolerate delay, or teams without streaming infrastructure.

## Takeaway

Change data capture reads the database's own change log and streams every insert, update and delete to the systems that need them. Plan for the initial snapshot, schema changes, ordering, deletes and log retention, and CDC becomes the reliable backbone that keeps your lakehouse, analytics and AI features in step with production.
