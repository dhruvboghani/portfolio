---
title: Real-time anomaly detection with Flink and Kafka
description: Building real-time anomaly detection pipelines with Apache Flink and Kafka: tumbling windows, keyed process functions, dynamic thresholding, and alerts.
date: 2026-11-22
tags: apache-flink, kafka, streaming
---
Detecting fraudulent transactions, system intrusions, and industrial sensor failures after the fact costs businesses millions in damage. Batch processing pipelines running overnight queries leave a dangerous multi-hour blind spot where malicious or faulty behavior goes unnoticed.

Building streaming anomaly detection using Apache Kafka for event ingestion and Apache Flink for stateful event processing enables organizations to identify abnormal patterns within milliseconds of occurrence.

## Architecture of a streaming anomaly pipeline

A production real-time detection pipeline separates event transportation, stateful window evaluation, and downstream notification into distinct decoupled layers:

- **Kafka ingestion:** High-throughput event logs ingest telemetry streams from microservices, financial terminals, or IoT devices partitioned by primary entity keys (such as `account_id` or `device_id`).
- **Flink stream processing:** A stateful Flink job consumes the Kafka topics, maintains historical running baselines in RocksDB state, and evaluates incoming events against dynamic statistical rules.
- **Alert sinks and dead-letter queues:** Flagged anomalies are published to dedicated Kafka alert topics that trigger automated account freezes, PagerDuty incidents, or webhook notifications.

This architecture ensures fault-tolerant, horizontally scalable detection with sub-second end-to-end processing latency.

## Stateful processing with KeyedProcessFunction

Simple thresholding (such as alerting if a single transaction exceeds $10,000) produces unacceptable false positives and misses sophisticated fraud. Effective anomaly detection requires maintaining state per entity over time.

In Apache Flink, `KeyedProcessFunction` provides low-level control over both state and timers, making it the ideal abstraction for behavioral tracking:

```java
public class TransactionVelocityAnomalyDetector 
    extends KeyedProcessFunction<String, TransactionEvent, AnomalyAlert> {

    private ValueState<Double> rollingSumState;
    private ValueState<Integer> transactionCountState;
    private ValueState<Long> windowEndTimerState;

    @Override
    public void open(Configuration parameters) {
        rollingSumState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("rollingSum", Double.class));
        transactionCountState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("txCount", Integer.class));
        windowEndTimerState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("timer", Long.class));
    }

    @Override
    public void processElement(TransactionEvent tx, Context ctx, Collector<AnomalyAlert> out) throws Exception {
        Double currentSum = rollingSumState.value();
        if (currentSum == null) currentSum = 0.0;
        int count = transactionCountState.value() == null ? 0 : transactionCountState.value();

        currentSum += tx.getAmount();
        count++;

        rollingSumState.update(currentSum);
        transactionCountState.update(count);

        // Velocity anomaly: sudden spike in small transactions followed by large drain
        if (count > 5 && tx.getAmount() > 5000.0) {
            out.collect(new AnomalyAlert(tx.getAccountId(), "VELOCITY_SPIKE", tx.getAmount()));
        }
    }
}
```

By storing state in Flink's managed state backends, checkpoints ensure exactly-once guarantees even if worker nodes fail during processing.

## Dynamic thresholds and sliding baselines

Hardcoded rules quickly become obsolete as normal user activity changes over time. Advanced Flink streaming pipelines maintain adaptive baselines:

- **Sliding and tumbling windows:** Aggregate metric distributions (such as moving average transaction amounts and standard deviations) across 1-hour or 24-hour sliding windows.
- **Z-score evaluation:** Flag incoming events whose values deviate by more than three standard deviations from the rolling keyed baseline: `(value - mean) / std_dev > 3.0`.
- **Broadcast state for runtime rule updates:** Use Flink's `BroadcastConnectedStream` to distribute updated risk rules and blacklist criteria from administrative dashboards to all stream workers in real time without restarting the Flink job.

## Watermarks and out-of-order events

In distributed networks, events frequently arrive out of chronological order due to mobile network latency or sensor retries:

- **Bounded-out-of-orderness watermarks:** Configure event-time extractors with an allowable delay window (for example, allowing up to 10 seconds of late arrivals).
- **Side outputs for delayed records:** Route events that arrive after the watermark has passed into a dedicated late-arriving side output for separate auditing, preventing late data from corrupting active state windows.
- **Idempotent alerting:** Dedup outgoing alert signals using a TTL-backed state buffer so a burst of out-of-order events from a single incident does not trigger duplicate downstream alerts.

## Takeaway

Detecting critical operational anomalies demands streaming stateful infrastructure. By combining Apache Kafka for distributed log ingestion with Apache Flink's `KeyedProcessFunction`, RocksDB state backends, and dynamic sliding windows, engineering teams can catch fraud and hardware failures in milliseconds with zero data loss.
