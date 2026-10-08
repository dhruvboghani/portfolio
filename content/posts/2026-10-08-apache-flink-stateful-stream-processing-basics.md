---
title: Apache Flink stateful stream processing basics
description: How Flink keeps state in a streaming job, including keyed state, checkpoints, watermarks, and what fails in production.
date: 2026-10-08
tags: data-engineering, flink, streaming
---
Apache Flink is a stream processor that can remember data between events. A stateless map is easy to reason about. Counts, sessions, joins, and deduplication are not, because the answer depends on events that already passed. That memory is Flink state, and checkpoints are how a job gets it back after a failure.

## A job is a graph with state

A Flink job is a directed graph of operators. Source operators read from Kafka or another log. Downstream operators transform records. When an operator is keyed, Flink partitions the stream by key and keeps a state store for each key on the task that owns it.

- **Keyed state** belongs to one key, such as a user id or an account id. Use it for counts, last-seen timestamps, and small aggregates.
- **Operator state** belongs to a parallel task instance, not to a key. Sources often use it to remember offsets or split positions.
- State lives in memory with a disk-backed state backend for larger jobs. RocksDB is the common choice when key cardinality is high.

```text
Kafka source -> keyBy(accountId) -> process(count, lastEvent) -> sink
                      |
                 state per key
                      |
                 checkpoint to durable storage
```

If you do not call `keyBy`, every record on a task shares one state bucket. That is rarely what you want for per-entity logic.

## Checkpoints and recovery

A checkpoint is a consistent snapshot of operator state plus the source positions. Flink injects barriers into the stream. When an operator has received the barrier from all inputs, it snapshots its state and forwards the barrier.

- On failure, the job restarts from the last completed checkpoint and replays source records from those offsets.
- This is at-least-once unless the sink participates in the same snapshot. A transactional sink, such as the Kafka sink with exactly-once settings, commits output only when the checkpoint completes.
- If the sink is a plain database write, you still need idempotent upserts. Replay will send some records again.

Set a checkpoint interval you can afford. A one-minute interval means you may reprocess about a minute of data. Very frequent checkpoints add load on the state backend and on remote storage.

Keep checkpoints on durable storage the job can reach after a restart, such as S3 or a shared filesystem. A checkpoint that only sits on a dead task manager is not a recovery point.

## Time, watermarks, and windows

Event time is the timestamp inside the record. Processing time is the clock on the machine. For late data, event time is the one that matches the business.

Flink uses watermarks to estimate how complete the stream is. A window closes when the watermark passes the end of the window, plus any allowed lateness.

- Idle partitions stall watermarks. One quiet Kafka partition can hold windows open. Configure an idleness timeout when some partitions go quiet.
- Late events after the window has closed are dropped unless you send them to a side output and handle them.
- Session windows depend on state. A long gap defines the session end. High key cardinality plus long sessions makes a large state store.

## What usually breaks

- **Unbounded state.** A counter per user is fine. Storing every raw event in a list per user is not. Set state TTL when keys stop appearing.
- **Hot keys.** One account that produces most of the traffic lands on one task. Split the key or pre-aggregate.
- **Large records in state.** State should be aggregates and identifiers, not full payloads you could re-read from the log.
- **Sink commits that ignore replay.** If a restart duplicates rows, the sink key is wrong or the write is not an upsert.
- **Checkpoint timeouts.** The state backend or remote storage cannot keep up. Slow checkpoints are a capacity problem, not a retry problem.

## Takeaway

Treat Flink as a stateful service, not as a function that happens to run forever. Key the stream, keep state small, checkpoint to durable storage, and make the sink safe to replay. Watermarks decide when a window is done. If those four pieces are explicit in the job, recovery and late data stop being surprises.
