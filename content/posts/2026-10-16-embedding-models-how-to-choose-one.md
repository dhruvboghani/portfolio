---
title: Embedding models: how to choose one for search and RAG
description: How to choose an embedding model for semantic search and RAG: quality on your data, dimensions, context length, language, cost, latency and hosting.
date: 2026-10-16
tags: embeddings, rag, vector-search
---
The embedding model decides what "similar" means in your search or RAG system. Pick the wrong one and no amount of prompt tuning will fix answers that start from the wrong passages.

There is no single best model. The right choice depends on your content, your languages, your latency and cost budget, and where you are allowed to run it. This post walks through the factors that matter and a simple way to decide.

## What an embedding model does

An embedding model turns text into a vector, a list of numbers, so that texts with similar meaning end up close together. Search then becomes a nearest-neighbour lookup: embed the question, find the closest stored vectors, return their text.

Two consequences follow:

- **The same model must embed documents and queries.** Vectors from different models are not comparable.
- **Changing the model means re-embedding everything.** Choose with care, and keep the raw text so you can re-index later.

## Quality on your data is what counts

Public leaderboards are a useful starting point, not a decision. They average many tasks and domains, and your documents may look nothing like their test sets.

- **Shortlist two to four models** that rank well for retrieval in your languages.
- **Test them on your own questions.** Use a small evaluation set of real queries with the passages that should answer them, and compare recall@k and MRR for each model.
- **Look at the failures.** Some models handle product codes, numbers or abbreviations better than others. That often matters more than a point on a leaderboard.

A day spent on this comparison saves weeks of tuning later.

## Practical factors

**Dimensions.** Vectors with more dimensions can hold more nuance but cost more to store and search. Some models support shorter vectors with a small quality loss, which can cut storage and speed up search a lot. Check what your vector database handles efficiently.

**Context length.** Every model has a maximum input size, and text beyond it is usually cut off without an error. Make sure your chunk size fits comfortably inside the limit.

**Language support.** If users ask in one language and documents are in another, or content mixes languages, choose a multilingual model and test cross-language retrieval explicitly.

**Domain fit.** Code, legal text, medical notes and chat logs behave differently. A general model may be fine, but test it against your domain before assuming so.

**Cost and latency.** Embedding happens at ingestion and on every query. Consider the price per token for hosted APIs, the throughput of self-hosted models, and the extra milliseconds added to each search.

**Hosting and privacy.** Hosted APIs are simple and strong. Open models you run yourself keep data inside your infrastructure and avoid per-call costs, at the price of operating GPUs or CPU inference servers.

## Hosted API or open model

- **Choose a hosted API** when you want strong quality quickly, have moderate volume and can send the data to the provider.
- **Choose an open model** when data must stay in your environment, volume is high enough that per-token costs add up, or you want to fine-tune for your domain.
- **Either way, abstract the call** behind one function in your code, so switching models is a configuration change plus a re-index, not a rewrite.

```python
def embed(texts: list[str]) -> list[list[float]]:
    # single place to swap providers or models
    return client.embed(model=EMBED_MODEL, input=texts)

# store the model name with each vector
record = {"id": doc_id, "vector": embed([chunk])[0], "model": EMBED_MODEL}
```

## Things that matter more than the model

The model is only one part of retrieval quality. Before switching models, check these:

- **Chunking:** passages that each answer one question retrieve better than arbitrary slices.
- **Metadata and filters:** filtering by tenant, product or date often improves precision more than a better model.
- **Hybrid search:** combining vector search with keyword search helps with names, codes and exact phrases.
- **Reranking:** a reranker applied to the top results can lift answer quality noticeably.
- **Query and document instructions:** some models expect a prefix such as a query or passage marker. Follow the model's documentation exactly.

## A simple decision process

1. Write down constraints: languages, data residency, budget, latency target.
2. Shortlist a few models that meet them.
3. Embed a representative sample of your documents with each.
4. Measure retrieval on your evaluation set and read the failures.
5. Pick the simplest option that meets your quality bar, and record the model version with every vector.

## Takeaway

Choose an embedding model by testing it on your own questions, not by leaderboard rank alone. Check dimensions, context length, language support, cost and hosting against your constraints, keep the embedding call behind one function, and remember that chunking, filters, hybrid search and reranking often matter as much as the model itself.
