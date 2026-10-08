---
title: Kafka vs Redpanda for real-time pipelines
description: How Kafka and Redpanda differ for streaming pipelines, covering the API, operations, storage, and when each one fits.
date: 2026-10-07
tags: data-engineering, kafka, streaming
---
Real-time pipelines need a durable log that producers can append to and consumers can read at their own pace. Apache Kafka is the usual choice. Redpanda speaks the same Kafka protocol and is often dropped in when a team wants that API without running the JVM stack. The protocol match is real. The operating model is not the same.

## What stays the same

Both systems are a partitioned, replicated log. A producer writes to a topic. A consumer group splits partitions across members. Offsets mark how far each group has read.

- Clients that use the Kafka protocol, including Kafka Connect and most language clients, can talk to either broker.
- Ordering is per partition, not per topic. Design keys the same way you would on Kafka.
- Retention, compaction, and consumer lag are still the knobs that decide whether the pipeline is a buffer or a system of record.

```text
producers -> topic partitions -> consumer group
                 |
            replicated log
```

If your application code only uses the public Kafka API, switching brokers is mostly a configuration change: bootstrap servers, TLS, and SASL. The pipeline shape does not change.

## Where the brokers differ

Kafka is a JVM process plus a metadata service. Older clusters used ZooKeeper. Current Kafka uses KRaft, so the controllers live in the cluster. You still plan JVM heap, garbage collection, disk, and a separate schema registry if you use Avro or Protobuf.

Redpanda is a single C++ binary. There is no JVM and no ZooKeeper. The broker, the Raft replication, and an HTTP admin API ship together. A schema registry compatible with the Confluent API is built in.

- **Kafka** fits teams that already run the JVM, use Kafka Streams or a large Connect plugin set, and want the widest ecosystem.
- **Redpanda** fits teams that want fewer moving parts on the broker and are comfortable staying on the Kafka client protocol.
- Tiered storage and disk behavior differ by version and product edition. Check the docs for the release you will actually run before you size disks.

Neither choice fixes a bad partition key, an unbounded topic, or a consumer that commits offsets before the side effect succeeds.

## How to choose for a pipeline

Start from the workload, not the logo.

- **High fan-out, many consumer groups.** Both handle this. Measure lag and disk, not brochure throughput.
- **Exactly-once into a database.** That is a consumer problem. Use idempotent writes and a transactional outbox. The broker will not make your sink exactly-once by itself.
- **Kafka Streams or ksqlDB.** Stay on Kafka unless you have verified those components against the broker you plan to use.
- **Small platform team.** A single-binary broker reduces the number of processes you patch. You still need monitoring, disk alerts, and a restore drill.
- **Regulated or air-gapped environments.** Confirm license, support, and which features are in the build you can install.

A practical test is a staging topic with your real message size, your partition count, and one consumer that does the same work as production. Watch produce latency, end-to-end lag, and what happens when you kill one broker.

## Operations that matter more than the brand

- Put TLS on the client port and lock down the admin API.
- Set retention from the business requirement. A seven-day debug window and a compacted changelog are different topics.
- Alert on consumer lag and on under-replicated partitions, not only on process uptime.
- Keep schemas versioned. A compatible registry on either broker still needs a change process so old consumers do not break.
- Practice a broker loss. Replication factor 3 with `min.insync.replicas=2` is the usual starting point for data you cannot drop.

## Takeaway

Use Kafka when you depend on the broader Kafka ecosystem or you already operate it well. Use Redpanda when you want the Kafka client protocol with a simpler broker process and you have checked that your connectors and stream processors work against it. The pipeline stays healthy for the same reasons on both: partition keys, bounded retention, idempotent consumers, and lag you actually alert on.
