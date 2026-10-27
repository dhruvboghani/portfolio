---
title: Hybrid search for RAG: combining keyword and vector search
description: Why hybrid search improves RAG: combining BM25 keyword search with vector search, merging results with reciprocal rank fusion, and adding a reranker.
date: 2026-10-25
tags: rag, search, vector-search
---
Vector search is great at meaning and bad at exact details. Keyword search is the opposite. Retrieval-augmented generation depends on finding the right passages, so using only one of them leaves easy wins on the table.

Hybrid search runs both and combines the results. This post explains why it works, how to merge results and how to tell whether it helped.

## Where each method fails

**Vector search** finds passages with similar meaning even when the words differ. It struggles with:

- Product codes, error codes and IDs like `ERR_4012` or `HSN 8471`.
- Rare names and new terms the embedding model has not seen much.
- Queries where one exact word changes everything, such as "not supported".

**Keyword search** (usually BM25) matches the actual terms. It struggles with:

- Synonyms and paraphrases, like "cancel subscription" versus "end my plan".
- Natural questions that share few words with the answer.
- Typos and different word forms, unless you add stemming and fuzzy matching.

Real queries mix both kinds, which is why combining them is so effective.

## How hybrid search works

1. Run the query through keyword search and vector search in parallel.
2. Take the top results from each, for example 30 to 50.
3. Merge them into one ranked list.
4. Optionally rerank the merged list with a cross-encoder.
5. Send the top few passages to the model.

## Merging results with reciprocal rank fusion

Scores from BM25 and cosine similarity are on different scales, so adding them directly does not work well. Reciprocal rank fusion (RRF) avoids the problem by using ranks instead of scores.

```python
def rrf(result_lists, k=60):
    scores = {}
    for results in result_lists:
        for rank, doc_id in enumerate(results, start=1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    return sorted(scores, key=scores.get, reverse=True)

merged = rrf([bm25_ids, vector_ids])
```

A document that ranks well in both lists rises to the top. A document found by only one method still appears, so exact matches are not lost. The constant `k` softens the advantage of the very top ranks, and 60 is a common default.

Weighted score fusion is an alternative: normalise each score and combine them with weights. It can work well but needs more tuning.

## Add a reranker for precision

A cross-encoder reranker reads the query and each candidate passage together and scores relevance more accurately than either search method. It is slower, so run it only on the merged top results, perhaps 20 to 50, and keep the best handful.

## Practical tips

- **Index the same chunks for both methods** so results can be merged by chunk ID.
- **Use metadata filters in both searches,** such as tenant, language or document type.
- **Keep useful fields searchable by keyword,** like titles, codes and headings, not just body text.
- **Check your database first.** Several systems support both full-text and vector search, so you may not need two separate services. PostgreSQL with full-text search and pgvector is one example.

## Measure the improvement

Build a small evaluation set of real questions with the passages that should be found. Compare keyword only, vector only and hybrid on recall at k (did the right passage appear in the top k?) and on final answer quality. Pay special attention to queries with codes, names and exact phrases, which is where hybrid usually helps most.

## Takeaway

Keyword search catches exact terms and vector search catches meaning, and RAG needs both. Run them in parallel, merge with reciprocal rank fusion, rerank the top candidates, and measure recall on real questions to confirm the gain.
