---
title: Exactly-once processing in Apache Flink explained
description: How exactly-once processing works in Apache Flink: checkpoints and barriers, state recovery, transactional sinks with two-phase commit, and common pitfalls.
date: 2026-11-03
tags: flink, streaming, data-engineering
---
Exactly-once is one of the most cited and most misunderstood features of Apache Flink. It does not mean each event is physically processed once; after a failure, Flink replays events. It means the results, in Flink's state and in supported sinks, look as if each event was processed exactly once.

Understanding how that works tells you what Flink guarantees on its own and what your sources and sinks have to do.

## Checkpoints are the foundation

Flink periodically takes a consistent snapshot of the whole job, called a checkpoint.

- The job manager injects **checkpoint barriers** into the input streams.
- Barriers flow through the job with the data. When an operator has received the barrier on all its inputs, it snapshots its state to durable storage and passes the barrier on.
- Sources record their **positions**, such as Kafka offsets, as part of the same checkpoint.

When a checkpoint completes, Flink has a consistent picture: input positions plus every operator's state at the same logical point in the stream.

## Recovery: rewind and replay

When a task fails, Flink restores every operator's state from the last completed checkpoint and resets the sources to the stored positions. Events after the checkpoint are read and processed again.

Because state is rolled back to the same point, replayed events update it exactly as before. Counts, aggregations and windows end up as if no failure happened. That is exactly-once **for internal state**.

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60_000, CheckpointingMode.EXACTLY_ONCE);
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30_000);
env.getCheckpointConfig().setCheckpointTimeout(10 * 60_000);
```

## The sink is where it gets hard

Replay is harmless inside Flink, but outputs already written to the outside world would be written again. End-to-end exactly-once needs a sink that cooperates.

**Transactional sinks with two-phase commit.** The sink writes output inside a transaction that stays open until the checkpoint completes.

1. During processing, records are written to an open transaction.
2. On the checkpoint barrier, the sink pre-commits, flushing data so it is durable.
3. When the whole checkpoint succeeds, Flink tells sinks to commit.
4. If the job fails first, the open transaction is aborted and the replayed records are written again in a new one.

The Kafka sink supports this with Kafka transactions, and file and table sinks such as Iceberg commit files only when checkpoints complete.

**Idempotent sinks** are the other option: writes keyed by a stable ID, such as upserts into a database, so repeating them has no extra effect.

## Pitfalls to know about

- **Latency equals the checkpoint interval** for transactional sinks, because data becomes visible only on commit. Choose the interval with that in mind.
- **Consumers must read committed data only.** Kafka consumers downstream need `isolation.level=read_committed`, or they will see uncommitted records that may be aborted.
- **Transaction timeouts:** Kafka transaction timeouts must be longer than the maximum checkpoint duration plus recovery time, or transactions expire and data is lost.
- **Side effects inside operators,** such as calling an external API or sending an email from a map function, are not covered. They will repeat on replay unless you make them idempotent.
- **Non-deterministic logic,** like using processing time or random values, can produce different results on replay.
- **Large state** makes checkpoints slow. Use incremental checkpoints with the RocksDB state backend for big jobs.

## At-least-once can be enough

Exactly-once has a cost in latency and complexity. If your sink is naturally idempotent, or occasional duplicates are acceptable and handled downstream, at-least-once checkpointing with idempotent writes is simpler and faster.

## Takeaway

Flink achieves exactly-once results by checkpointing operator state and source positions together, then rewinding and replaying after failures. End-to-end guarantees also need a transactional or idempotent sink, read-committed consumers, sensible transaction timeouts and side-effect-free operators. Choose exactly-once where duplicates truly matter, and at-least-once with idempotent writes where they do not.
