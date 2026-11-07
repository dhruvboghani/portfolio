---
title: Reranking models for better search results
description: How reranking models improve search and RAG: bi-encoders vs cross-encoders, retrieve-then-rerank pipelines, choosing a reranker and latency.
date: 2026-11-07
tags: search, rag, machine-learning
---
First-stage search is built for speed: it finds a few dozen plausible results out of millions in milliseconds. It is not built for precision, so the best answer is often at position seven instead of position one.

A reranker fixes this. It takes the top candidates and reorders them with a slower, more accurate model. For RAG systems, where only the top few passages reach the language model, that reordering often matters more than anything else.

## Why first-stage retrieval is imprecise

Vector search uses a **bi-encoder**: the query and each document are embedded separately, and similarity is measured between the two vectors. Documents are embedded once, ahead of time, which makes search fast. But the model never sees the query and document together, so it misses fine details such as negation, exact constraints or which entity a sentence is about.

Keyword search such as BM25 has the opposite weakness: it matches words, not meaning.

## How a reranker works

A **cross-encoder** reranker reads the query and one candidate passage together, as a single input, and outputs a relevance score. Because it sees both at once, it can judge whether the passage actually answers the question.

The cost is speed: it must run once per query-passage pair, at query time. That is why it is used only on a short list.

## The retrieve-then-rerank pipeline

1. **Retrieve** 50 to 100 candidates with fast search, ideally hybrid keyword and vector search.
2. **Rerank** those candidates with the cross-encoder.
3. **Keep the top** 3 to 10 for display or for the language model's context.

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

candidates = hybrid_search(query, k=50)
pairs = [(query, c.text) for c in candidates]
scores = reranker.predict(pairs)
top = [c for _, c in sorted(zip(scores, candidates), key=lambda x: -x[0])][:5]
```

## Choosing a reranker

- **Open-source cross-encoders** in small, base and large sizes. Small models are fast enough for many applications on CPU; larger ones are more accurate and usually need a GPU.
- **Multilingual rerankers** if your users or documents use more than one language.
- **Hosted reranking APIs** from search and model providers, which avoid running your own model at the cost of a network call and per-request pricing.
- **Language models as rerankers,** asked to score or order passages. Flexible and strong, but slower and more expensive, so best for small candidate sets or offline use.

Test candidates on your own data; general benchmark rankings do not always carry over to a specific domain.

## Managing latency

- **Limit the candidate count.** Reranking 30 passages instead of 100 cuts cost roughly in proportion.
- **Truncate passages** to the model's useful length; chunking well helps here.
- **Batch the pairs** and run on a GPU for larger models.
- **Cache scores** for frequent queries.
- **Skip reranking** for simple lookups where the first stage is already precise, such as exact ID searches.

## Measuring the gain

Use a labelled set of real queries with known relevant passages. Compare before and after reranking on precision at k, mean reciprocal rank (MRR) or NDCG, and for RAG, on final answer quality. Look at specific queries that improved or got worse to understand what the reranker is doing.

## Takeaway

Fast retrieval finds candidates; a reranker puts the best ones first. Retrieve 50 to 100 results with hybrid search, rerank them with a cross-encoder that reads query and passage together, and keep the top few. Pick a reranker on your own evaluation data, control latency by limiting candidates, and measure the improvement in ranking and answer quality.
