---
title: Feature stores explained for ML teams
description: What a feature store is and when ML teams need one: offline and online stores, point-in-time correctness, training-serving skew, and simpler alternatives.
date: 2026-11-04
tags: machine-learning, mlops, data-engineering
---
A model is only as good as the features it sees. In many teams, those features are computed once in a notebook for training and again, slightly differently, in production code for serving. The result is models that score well offline and disappoint in production.

A feature store is a system for defining features once and serving them consistently to both training and live predictions. This post explains what it does and when you actually need one.

## The problem it solves

- **Training-serving skew:** the training pipeline and the serving code calculate "orders in the last 30 days" in different ways, so the model sees different numbers in production.
- **Data leakage:** training rows accidentally use information from after the prediction time, which inflates offline accuracy.
- **Duplicated work:** every team rebuilds the same customer and product features.
- **Slow serving:** computing aggregates from raw tables on every request is too slow for real-time predictions.

## The main parts

**Feature definitions.** Each feature is defined once, with its entity (such as customer or product), source, transformation and freshness requirement. Definitions are versioned like code.

**Offline store.** Historical feature values kept in a warehouse or lakehouse, used to build training datasets and for batch scoring.

**Online store.** The latest feature values per entity in a low-latency key-value store, such as Redis or DynamoDB, used for live predictions in milliseconds.

**Materialisation.** Batch or streaming jobs compute features and write them to both stores, so both are fed by the same logic.

**Registry.** A catalogue of features with owners, descriptions and lineage, so teams can find and reuse them.

## Point-in-time correctness

This is the feature that prevents leakage. To build a training set, you give the feature store a list of entities and timestamps, such as the moment each past loan application was made. It returns each feature's value as it was at that moment, never a later value.

```python
training_df = store.get_historical_features(
    entity_df=applications[["customer_id", "applied_at", "defaulted"]],
    features=[
        "customer_stats:orders_30d",
        "customer_stats:avg_order_value_90d",
        "customer_stats:days_since_last_payment",
    ],
).to_df()
```

At prediction time, the same feature names are read from the online store for the current customer, so training and serving use the same definitions.

## Batch, streaming and on-demand features

- **Batch features** are computed on a schedule, such as daily lifetime value.
- **Streaming features** are updated from event streams within seconds, such as transactions in the last ten minutes for fraud detection.
- **On-demand features** are computed at request time from request data, such as the distance between delivery and billing addresses.

Most real systems combine all three.

## Do you need one?

A feature store adds infrastructure and process. It is worth it when:

- You serve **real-time predictions** that need fresh aggregates in milliseconds.
- **Several models or teams** share the same features.
- You have been bitten by **skew or leakage** before.

It is probably overkill when you have one or two batch models, features computed in a single SQL pipeline, and predictions written back to a table. In that case, well-organised feature tables in your warehouse, with careful point-in-time joins, give most of the benefit.

Open source options such as Feast, and managed feature stores from cloud and data platforms, let you start small and grow.

## Takeaway

A feature store defines features once and serves them consistently: historical values with point-in-time correctness for training, and the latest values from a fast online store for live predictions. Adopt one when you have real-time models, shared features or skew problems; otherwise, start with clean feature tables and correct point-in-time joins.
