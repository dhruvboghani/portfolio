---
title: Fine-tuning vs RAG: when to use each
description: Fine-tuning vs RAG explained: what each one changes, when to use retrieval, when fine-tuning pays off, costs and maintenance, and how to combine them.
date: 2026-11-01
tags: llm, rag, fine-tuning
---
When a general model does not know enough about your business, two options come up: retrieval-augmented generation (RAG) and fine-tuning. They are often presented as alternatives, but they solve different problems.

Choosing the wrong one wastes weeks. This post explains what each one actually changes and how to decide.

## What each approach changes

**RAG changes what the model sees.** At question time, you search your documents or database for relevant passages and put them in the prompt. The model stays the same; the context changes with every request.

**Fine-tuning changes how the model behaves.** You train the model further on examples of inputs and desired outputs. The model's weights change, so the new behaviour applies to every request without extra context.

A useful shorthand: RAG gives the model **knowledge**, fine-tuning teaches it **habits**.

## When RAG is the right choice

- **Facts change often:** prices, policies, inventory, documentation, tickets. Update the index and answers change immediately, with no retraining.
- **Answers must be traceable:** RAG can cite the exact source passage, which users and auditors can check.
- **Access control matters:** retrieval can filter documents by user permissions. Knowledge baked into weights cannot be hidden from some users.
- **You have lots of content and few labelled examples.** RAG works with the documents you already have.

Most "the model doesn't know our data" problems are RAG problems.

## When fine-tuning pays off

- **Consistent format or style** that prompts alone do not hold reliably, such as a strict output structure or your brand's tone.
- **Narrow, repeated tasks** like classification, extraction or routing, where a smaller fine-tuned model can match a larger general model at lower cost and latency.
- **Shorter prompts:** behaviour that needed long instructions and many examples in every prompt can move into the model.
- **Domain language** the base model handles poorly, such as specialised abbreviations, when you have enough good examples.

Fine-tuning is a poor way to add facts. Models learn facts from training unreliably, cannot cite them, and need retraining whenever they change.

## Cost and maintenance

**RAG costs** are mostly engineering and runtime: parsing, chunking, an index, a retrieval step on every request and longer prompts. Updating knowledge is cheap.

**Fine-tuning costs** are mostly data: collecting and cleaning hundreds to thousands of high-quality examples, training runs, evaluation, and repeating the process when requirements or the base model change. Runtime can be cheaper if you move to a smaller model.

Either way, you need an evaluation set to show the change actually helped.

## A practical order of steps

1. **Start with prompting.** Clear instructions and a few examples solve more than people expect.
2. **Add RAG** when the model needs your knowledge.
3. **Improve retrieval** before blaming the model: parsing, chunking, hybrid search and reranking.
4. **Fine-tune** when you have a stable, repeated task, clear examples and evidence that prompting and RAG are not enough for format, cost or latency.

## Using both together

They combine well. A common pattern is a fine-tuned model that reliably follows your answer format and tone, fed by RAG that supplies current facts and sources. Another is fine-tuning a small model to rewrite queries or rerank results inside a RAG pipeline.

## Takeaway

Use RAG when the model needs knowledge that changes, must be cited or depends on permissions. Use fine-tuning when you need consistent behaviour, format or a cheaper model for a narrow, repeated task. Start with prompting and RAG, measure carefully, and fine-tune only when the data and the evidence justify it.
