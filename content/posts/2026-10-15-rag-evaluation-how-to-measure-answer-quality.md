---
title: RAG evaluation: how to measure answer quality
description: How to evaluate a RAG system: build a test set, measure retrieval and answer quality separately, use LLM judges carefully and track it in CI.
date: 2026-10-15
tags: rag, llm, evaluation
---
A RAG system can look impressive in a demo and still give wrong answers to a third of real questions. Without evaluation, every change to chunking, prompts or models is a guess, and regressions reach users before you notice them.

Evaluation turns "it seems better" into a number you can track. This post covers what to measure, how to build a test set and how to keep evaluation running as the system changes.

## Evaluate retrieval and generation separately

A RAG answer can fail in two different places, and the fix is different for each.

- **Retrieval failure:** the right passage never reached the model. Better prompts will not fix this. You need better chunking, metadata, filters, hybrid search or reranking.
- **Generation failure:** the right passage was retrieved, but the model ignored it, misread it or added things that are not in it. Here the fix is in the prompt, the model or the context format.

Measure both stages on their own. A single end-to-end score hides which stage broke.

## Build a test set first

Everything else depends on a good evaluation set. It does not need to be large to be useful.

- **Start with real questions.** Pull them from support tickets, search logs, sales calls or user interviews. Invented questions tend to be cleaner and easier than real ones.
- **Record the expected source.** For each question, note the document and passage that should answer it. This lets you score retrieval without a model.
- **Write a reference answer** for questions with a clear answer, and mark which ones should get "I don't know" because the knowledge base does not cover them.
- **Cover the hard cases:** multi-part questions, questions that need two documents, ambiguous wording, outdated documents, numbers and dates.
- **Keep it versioned.** Store the set in the repository next to the code so changes are reviewed like any other change.

A few dozen carefully chosen questions will catch more problems than hundreds of synthetic ones. Grow the set every time a real failure is reported.

## Retrieval metrics

Retrieval can be scored without an LLM because you know which passages are correct.

- **Recall@k:** how often at least one correct passage appears in the top k results. If this is low, the generator never had a chance.
- **Precision@k:** how much of the top k is relevant. Low precision fills the context window with noise and can distract the model.
- **MRR (mean reciprocal rank):** rewards putting the correct passage near the top, which matters when you pass only a few chunks to the model.

```python
def recall_at_k(results, expected, k=5):
    hits = sum(1 for q in results if set(results[q][:k]) & expected[q])
    return hits / len(results)
```

Track these whenever you change chunk size, embedding model, filters or reranker. They are cheap to compute and fast to run.

## Answer quality metrics

Generated answers need judgement, so they are harder to score. Break quality into specific properties instead of one vague score.

- **Faithfulness:** every claim in the answer is supported by the retrieved context. This is the main defence against hallucination.
- **Answer relevance:** the answer addresses the question that was asked, not a nearby one.
- **Correctness:** the answer matches the reference answer where one exists.
- **Citation accuracy:** cited sources actually contain the cited claim.
- **Appropriate refusal:** the system says it does not know when the context does not contain the answer, instead of guessing.

## Using an LLM as a judge

An LLM can grade these properties at scale, but only if you treat the judge as a component that also needs checking.

- **Give it one narrow question at a time,** such as "Is each sentence supported by this context? Answer per sentence." Narrow rubrics are more reliable than "rate this answer from 1 to 10".
- **Ask for structured output,** for example JSON with a verdict and the unsupported sentences, so results are easy to aggregate and inspect.
- **Calibrate against humans.** Label a sample by hand and check that the judge agrees with you before trusting its scores.
- **Keep the judge fixed** while comparing versions of your system. Changing the judge and the system at the same time makes the results meaningless.
- **Read the failures.** Scores tell you where to look; the failing examples tell you what to fix.

## Make it part of the workflow

Evaluation pays off when it runs automatically, not once before launch.

- **Run retrieval metrics on every change** to chunking, embeddings or search settings.
- **Run the full suite before releases,** including judged answer quality and refusal behaviour.
- **Set thresholds** for the metrics that matter most, so a drop in faithfulness or recall fails the build.
- **Log production traffic** with the retrieved chunks and the answer. Sample it regularly, label failures and add them to the test set.
- **Watch cost and latency too.** A change that improves quality slightly but doubles response time may not be worth shipping.

## Takeaway

Measure retrieval and generation separately, starting from a small, honest test set built from real questions. Use recall and rank metrics for retrieval, specific properties like faithfulness and refusal for answers, and an LLM judge only after checking it against human labels. Run it on every change, and the quality of your RAG system becomes something you manage instead of something you hope for.
