---
title: Semantic caching to cut LLM costs and latency
description: How semantic caching cuts LLM costs and latency: embedding-based lookups, similarity thresholds, cache keys, invalidation and when caching is unsafe.
date: 2026-10-22
tags: llm, caching, cost-optimization
---
Many LLM applications answer the same questions again and again, worded slightly differently each time. Every repeat costs tokens and seconds that a cache could save.

A normal cache only helps when the input is identical. A semantic cache matches requests by meaning, so "how do I reset my password" and "forgot my password, what now" can share an answer.

## How semantic caching works

The idea is simple.

1. Turn the incoming request into an embedding.
2. Search a vector index of previous requests for the nearest match.
3. If the similarity is above a threshold, return the stored response.
4. Otherwise call the model, then store the request embedding and the response.

```python
def answer(question: str, ctx: dict) -> str:
    vec = embed(question)
    hit = cache.nearest(vec, filters={"tenant": ctx["tenant"], "lang": ctx["lang"]})
    if hit and hit.score >= 0.92:
        return hit.response
    response = llm(question, ctx)
    cache.add(vec, response, meta={"tenant": ctx["tenant"], "lang": ctx["lang"]})
    return response
```

The embedding call and vector lookup are much cheaper and faster than a full model call, so every hit saves both money and time.

## Choosing the threshold

The similarity threshold is the most important setting.

- **Too low** and different questions get the same answer. "Cancel my order" and "cancel my subscription" are close in wording but need different responses.
- **Too high** and the cache rarely hits.

Pick the threshold from your own data. Collect pairs of real questions, label whether they should share an answer, and see which threshold separates them best. Revisit it when you change embedding models, because scores are not comparable across models.

## What goes into the cache key

Meaning is not the only thing that decides the right answer. Store and filter on everything that changes the response.

- **Tenant or customer,** so one customer never sees another's data.
- **User permissions or role** when answers depend on access.
- **Language and locale.**
- **Prompt and model version,** so a prompt change does not serve answers produced by the old prompt.
- **Data version** for answers built from documents that change.

If an answer depends on the individual user's data, such as their order status, do not cache it in a shared cache at all.

## Keeping answers fresh

Cached answers go stale when the facts behind them change.

- **Time to live:** expire entries after a period that matches how often the content changes.
- **Event-based invalidation:** when a document, price or policy changes, remove entries built from it. Store source document IDs with each entry to make this possible.
- **Version bumps:** changing the prompt or model version in the key effectively starts a fresh cache.

## Where semantic caching fits best

- **FAQ-style assistants** over stable documentation.
- **Classification and extraction** of repeated inputs, such as product descriptions or common email types.
- **Expensive generation** that is shared across users, like summaries of the same document.

It fits poorly where answers are personal, time-sensitive or creative, or where a wrong match has real consequences.

## Measuring the benefit

Track the hit rate, the cost and latency saved, and, most importantly, the quality of cached answers. Sample cache hits and check whether the stored answer was correct for the new question. A high hit rate with wrong answers is worse than no cache.

A layered approach works well: an exact-match cache first for identical requests, then the semantic cache, then the model.

## Takeaway

Semantic caching matches requests by meaning and can cut LLM costs and latency for repetitive workloads. Tune the similarity threshold on your own labelled pairs, include tenant, permissions, language and versions in the key, invalidate when sources change, and keep personal or high-risk answers out of shared caches.
