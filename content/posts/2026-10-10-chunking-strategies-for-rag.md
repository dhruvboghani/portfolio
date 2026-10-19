---
title: Chunking strategies for RAG: how to split your documents
description: How to chunk documents for RAG: fixed-size, recursive, structure-aware and semantic splitting, chunk size, overlap and metadata that matter.
date: 2026-10-10
tags: rag, llm, vector-search
---
Most RAG systems that give vague or wrong answers are not failing at the model. They are failing at retrieval, and retrieval can only return what chunking created.

Chunking decides what a single searchable unit looks like. Get it right and the model sees the exact paragraph it needs. Get it wrong and it sees half a table, a heading with no body, or three unrelated topics glued together.

## Why chunking matters

An embedding turns a chunk into one vector. That vector is an average of everything inside the chunk, so the chunk boundary directly controls what the vector means.

- **Too large:** one chunk covers several ideas, the vector becomes blurry, and a precise question matches it weakly. You also spend context window on text the model does not need.
- **Too small:** a chunk loses the context that made it meaningful. "It must be renewed every 12 months" is useless if the chunk does not say what "it" is.
- **Badly placed:** a boundary in the middle of a list, a code block or a table splits one answer across two chunks, and retrieval often returns only one of them.

The goal is a chunk that answers one question well on its own.

## The main strategies

**Fixed-size chunking** splits text every N tokens. It is fast, predictable and a reasonable baseline, but it ignores meaning and cuts sentences in half.

**Recursive chunking** tries a list of separators in order: sections, then paragraphs, then sentences, then words. It only falls back to a smaller separator when a piece is still too large. This keeps natural boundaries most of the time and is a strong default for plain text.

**Structure-aware chunking** uses the document's own shape. Markdown headings, HTML sections, PDF layout blocks, code functions and table rows all make better boundaries than a token count. For manuals, policies and documentation, this is usually the biggest single improvement.

**Semantic chunking** embeds sentences and starts a new chunk where the meaning shifts, measured by a drop in similarity between neighbouring sentences. It can produce cleaner topical chunks, but it costs an embedding pass at ingestion time and needs tuning of the threshold.

**Parent-child chunking** indexes small chunks for precise matching, then returns the larger parent section to the model. You get sharp retrieval and enough context to answer.

```python
def recursive_split(text, max_tokens, seps=("\n## ", "\n\n", ". ", " ")):
    if count_tokens(text) <= max_tokens or not seps:
        return [text]
    parts, out = text.split(seps[0]), []
    for part in parts:
        out.extend(recursive_split(part, max_tokens, seps[1:]))
    return merge_small(out, max_tokens)
```

## Size and overlap

There is no universal chunk size. It depends on your content and your questions.

- Short factual questions (a price, a date, a setting) favour smaller chunks.
- Questions that need explanation or reasoning favour larger chunks or parent-child retrieval.
- Stay well below your embedding model's input limit. Text beyond the limit is usually truncated without an error.

Overlap repeats a little text from the end of one chunk at the start of the next, so a sentence near a boundary is not lost. Use it with fixed-size and recursive splitting. With structure-aware splitting, a clean section boundary often makes overlap unnecessary, and too much overlap fills results with near-duplicates.

## Metadata is part of the chunk

A chunk without context is hard to retrieve and hard to trust. Store metadata alongside every chunk and use it.

- **Source and location:** document id, page, section heading path. This enables citations.
- **Prepended context:** add the document title and heading path to the chunk text before embedding, for example `Leave policy > Carry forward > ...`. This fixes many "what is it" problems.
- **Filters:** tenant, language, product, date or access level. Filtering before vector search improves precision and keeps multi-tenant data separate.
- **Version:** when documents change, re-chunk and replace by document id rather than appending duplicates.

## Special content

- **Tables:** keep a row with its header. A row of numbers without column names cannot be retrieved by meaning.
- **Code:** split by function or class, never in the middle of a block.
- **Scanned PDFs:** fix extraction first. Headers, footers and page numbers repeated on every page pollute every chunk.
- **FAQs:** one question and its answer per chunk is almost always right.

## How to choose

Do not pick a strategy by intuition alone. Build a small evaluation set of real questions with the passages that should answer them, then measure whether the right chunk appears in the top results for each strategy and size. Change one variable at a time, and inspect failures by hand. Most of the time the fix is visible the moment you read the chunk that was returned.

## Takeaway

Start with structure-aware or recursive chunking, add headings and source metadata to every chunk, and use parent-child retrieval when answers need more context. Then let a small retrieval test set, not guesswork, decide your chunk size and overlap.
