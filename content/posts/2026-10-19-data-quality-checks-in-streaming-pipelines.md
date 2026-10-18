---
title: Data quality checks in streaming pipelines
description: How to add data quality checks to streaming pipelines: schema, validity, freshness, volume and duplicates, plus dead-letter queues and alerts that matter.
date: 2026-10-19
tags: data-quality, streaming, data-engineering
---
In a batch pipeline, bad data waits until the next run, and someone usually notices. In a streaming pipeline, bad data flows straight into dashboards, alerts, search indexes and AI features within seconds.

Data quality checks in streaming have to work continuously, cheaply and without stopping the whole flow for one bad record. This post covers what to check, where to check it and what to do when a check fails.

## What can go wrong

Streaming data fails in predictable ways:

- **Schema drift:** a producer adds, removes or renames a field, or changes a type.
- **Invalid values:** negative quantities, impossible dates, unknown status codes, empty IDs.
- **Duplicates:** at-least-once delivery and retries produce the same event more than once.
- **Late and out-of-order events:** mobile clients and network delays deliver old events after newer ones.
- **Missing data:** a producer stops sending, so volume drops quietly.
- **Broken references:** an event points to a customer or product that does not exist.

## Check at the right layer

**At the producer.** Validate before publishing. The cheapest bad event is the one never sent. Use typed models and a schema registry so incompatible changes are rejected at publish time.

**At ingestion.** Validate every event against the schema and basic rules as it enters the pipeline. Route failures aside instead of crashing the job.

**In stream processing.** Apply checks that need state or context: duplicates, ordering, rates and joins against reference data.

**At the sink.** Check aggregate properties of what lands in the lakehouse or warehouse: row counts, null rates and freshness per table.

## Record-level checks

These run on every event and should be fast.

- **Schema validation:** required fields present, types correct, no unexpected nulls.
- **Validity rules:** ranges, allowed values, formats for emails, phone numbers or currency codes.
- **Consistency rules:** totals equal the sum of line items, end time after start time.
- **Reference checks:** IDs exist in a cached lookup of known customers or products.

```python
def validate(e: dict) -> list[str]:
    errors = []
    if not e.get("order_id"):
        errors.append("missing order_id")
    if e.get("quantity", 0) <= 0:
        errors.append("quantity must be positive")
    if e.get("currency") not in {"INR", "USD", "EUR"}:
        errors.append("unknown currency")
    return errors
```

## Stream-level checks

Some problems only show up across many events.

- **Freshness:** time since the last event per source or partition. A silent producer is often worse than a noisy one.
- **Volume:** events per minute compared with the usual pattern for that time of day. Sudden drops and spikes both deserve attention.
- **Duplicate rate:** track how often the same event ID appears within a time window. Deduplicate with keyed state, and watch the rate itself as a signal.
- **Lateness:** how far behind event time is from processing time, and how many events arrive after the watermark.
- **Null and error rates:** the share of events failing each rule. A slow climb often points to an upstream change.

Stream processors like Apache Flink are well suited to these checks because they keep state per key and work in event-time windows.

## Handle failures without stopping the flow

Decide in advance what happens when a check fails.

- **Dead-letter queue:** send invalid events, together with the reason and the original payload, to a separate topic. The main flow continues, and nothing is lost.
- **Quarantine tables:** land failed records in a table people can query and fix, then replay them.
- **Flag, don't drop:** for minor problems, add a quality flag and let downstream consumers decide.
- **Stop the line only for critical failures,** such as a schema change that would corrupt a core table.
- **Make replays easy.** Fixed records should flow back through the same pipeline, so the logic stays in one place.

## Alerts people trust

Too many alerts get ignored. Keep them focused.

- **Alert on impact,** such as stale data on an important table or a sharp rise in failed records, not on every single bad event.
- **Use baselines per source and time of day** instead of fixed thresholds.
- **Include context in the alert:** which source, which rule, a sample of failing records and a link to the dead-letter topic.
- **Assign an owner** for each source, so alerts reach someone who can fix the producer.

## Measure quality over time

Record quality metrics as data too. Daily failure rates, freshness and duplicate rates per source show whether things are getting better, and they make conversations with producer teams concrete. They also matter for AI features, because retrieval and models are only as reliable as the data they read.

## Takeaway

Check quality at every layer of a streaming pipeline: validate records on the way in, watch freshness, volume, duplicates and lateness across the stream, and route failures to dead-letter queues instead of stopping the flow. Alert on impact, assign owners and track quality metrics over time, and your real-time data stays something people can rely on.
