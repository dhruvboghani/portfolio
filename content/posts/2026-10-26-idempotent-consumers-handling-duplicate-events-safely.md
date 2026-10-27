---
title: Idempotent consumers: handling duplicate events safely
description: How to build idempotent consumers in event-driven systems: why duplicates happen, idempotency keys, processed-event tables, upserts and the outbox pattern.
date: 2026-10-26
tags: event-driven, kafka, data-engineering
---
In an event-driven system, the same event will be delivered more than once. Producers retry, consumers crash after doing the work but before committing their offset, and rebalances replay messages.

Trying to guarantee each event arrives exactly once is hard. Making consumers safe to run twice is much easier, and that is what idempotent consumers do.

## Why duplicates happen

Most messaging systems, including Kafka and Redpanda in their common configurations, give at-least-once delivery to consumers.

- **Producer retries:** a send times out, the producer retries, and both attempts were actually written.
- **Consumer crashes:** the consumer processes a message, then crashes before committing the offset. On restart, it reads the message again.
- **Rebalances:** partitions move between consumers, and the new owner resumes from the last committed offset.
- **Replays:** you deliberately reprocess a topic after a bug fix.

Kafka offers idempotent producers and transactions that help within Kafka, but once a consumer writes to a database, sends an email or calls an API, you need idempotency on the consumer side.

## The idea

An operation is idempotent if doing it twice has the same effect as doing it once. Setting a status to "paid" is idempotent. Adding 500 to a balance is not.

The goal is to make every consumer's side effects idempotent, either naturally or by tracking what has already been processed.

## Technique 1: natural idempotency with upserts

Design writes so repeating them changes nothing.

- **Upserts by a stable key** instead of plain inserts.
- **Set values instead of incrementing them,** for example store the final total from the event rather than adding a delta.
- **Use versions:** only apply an update if the event's version is newer than the stored one, which also handles out-of-order events.

```sql
INSERT INTO orders (order_id, status, total, version)
VALUES (:order_id, :status, :total, :version)
ON CONFLICT (order_id) DO UPDATE
SET status = EXCLUDED.status, total = EXCLUDED.total, version = EXCLUDED.version
WHERE orders.version < EXCLUDED.version;
```

## Technique 2: a processed-events table

When the effect is not naturally idempotent, record which events you have handled.

1. Every event carries a unique ID, set by the producer.
2. In the same database transaction as the side effect, insert the event ID into a `processed_events` table with a unique constraint.
3. If the insert fails because the ID exists, the event was already handled, so skip it.

Doing both in one transaction is the key: either the effect and the record both happen, or neither does.

## Technique 3: idempotency keys for external calls

For payments, emails and third-party APIs, pass an idempotency key derived from the event ID. Many payment and messaging providers support this directly and will return the original result for a repeated key instead of acting twice. Where a provider does not, store the call's outcome against the key before retrying.

## Do not forget the producer side

Consumers can only deduplicate reliably if events have stable IDs. A common problem is a service that writes to its database and then publishes an event; if it crashes in between, the event is lost or published twice.

The **outbox pattern** fixes this: write the event to an outbox table in the same transaction as the business change, and have a separate process publish from the outbox. Change data capture tools can read the outbox and publish it for you.

## Testing idempotency

- **Replay tests:** feed the same event twice and assert the state is identical to feeding it once.
- **Crash tests:** kill the consumer between processing and committing, then restart.
- **Out-of-order tests:** deliver version 2 before version 1 and check the result.

## Takeaway

Assume every event can arrive more than once. Prefer naturally idempotent writes such as versioned upserts, track processed event IDs in the same transaction as the side effect, pass idempotency keys to external services, and use the outbox pattern so producers emit reliable, uniquely identified events.
