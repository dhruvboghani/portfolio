---
title: Vector index types: HNSW vs IVF
description: A practical comparison of HNSW and IVF vector indexes: query latency, memory footprint, build times, recall tradeoffs, and when to use each.
date: 2026-11-10
tags: vector-search, rag, databases
---
Exact nearest neighbor search checks a query vector against every single stored vector in the database. While this guarantees 100% recall, search latency scales linearly with dataset size, quickly making real-time queries over millions of vectors impossible.

Approximate Nearest Neighbor (ANN) indexes sacrifice a tiny fraction of accuracy for orders-of-magnitude speedups. The two dominant indexing algorithms in production vector databases are HNSW and IVF.

## How HNSW works

Hierarchical Navigable Small World (HNSW) is a graph-based indexing algorithm inspired by the "six degrees of separation" concept:

- Vectors are organized as nodes across multi-layered graphs.
- Top layers contain sparse graphs with long-distance links for rapid skipping across vector space.
- Bottom layers contain dense graphs with short-distance links for fine-grained local navigation.
- During search, the algorithm begins at the top layer, greedily traverses toward the nearest node, drops down to the next denser layer, and repeats until reaching the bottom layer.

HNSW delivers lightning-fast query latency (often under 2 milliseconds) and exceptional recall (regularly exceeding 98%). However, storing graph edges requires substantial RAM overhead, and constructing the graph is computationally intensive.

## How IVF works

Inverted File (IVF) is a clustering-based indexing algorithm:

- During indexing, vector space is divided into `nlist` Voronoi cells using k-means clustering. Each cell has a representative centroid vector.
- Every vector in the dataset is assigned to its closest centroid in an inverted list.
- During query execution, the search vector is compared against only the centroids. The algorithm selects the closest `nprobe` centroids and only scans vectors located within those specific clusters.

IVF builds much faster than HNSW and uses significantly less memory because it only stores inverted lists rather than an intricate multi-layer graph. However, IVF queries can miss relevant vectors located near cluster boundaries if `nprobe` is set too low.

## Side-by-side comparison

The practical engineering tradeoffs between HNSW and IVF center on memory, latency, and index maintenance:

- **Query latency:** HNSW consistently outperforms IVF under high concurrency, making it ideal for user-facing interactive search and real-time RAG agents.
- **Memory footprint:** HNSW indexes can require 1.5x to 2x more memory than raw vectors alone due to graph edge pointers. IVF with scalar quantization (SQ8) or product quantization (PQ) can compress vector memory by 70% or more.
- **Index build and update time:** IVF indexes build rapidly via k-means clustering. HNSW index construction is slower because every inserted vector must establish and prune graph connections.
- **Dynamic updates:** HNSW natively supports incremental insertions and deletes without re-indexing. Standard IVF struggles with incremental updates because new vectors drift from initial centroid positions, eventually requiring a full rebuild.

```sql
-- In pgvector: creating an HNSW index
CREATE INDEX ON document_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- In pgvector: creating an IVF Flat index
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);
```

## How to choose for your workload

Choose **HNSW** when:

- You have strict SLA requirements for low-latency queries (sub-5ms) at high QPS.
- High recall (95%+) is critical and missing the best document severely harms results.
- Your dataset fits comfortably in memory (RAM is readily available).
- Data changes continuously with frequent inserts and deletes.

Choose **IVF (or IVF-PQ)** when:

- Your dataset exceeds hundreds of millions of vectors and RAM budgets are tight.
- You ingest large batches of static documents overnight rather than streaming single-record updates.
- Slightly lower recall (90% to 95%) or an extra few milliseconds of search time is acceptable.

## Takeaway

HNSW provides the fastest query latency and highest recall at the expense of heavy memory consumption and slow build times. IVF provides a compact memory footprint and rapid index generation, but requires tuning cluster probes and periodic rebuilding. Default to HNSW for real-time RAG applications unless dataset scale forces memory-saving IVF quantization.
