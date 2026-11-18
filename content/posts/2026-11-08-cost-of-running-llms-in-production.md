---
title: Cost of running LLMs in production
description: A practical breakdown of LLM production costs: token pricing, self-hosting GPUs, semantic caching, prompt compression, and routing strategies.
date: 2026-11-08
tags: llm, cost-optimization, production
---
Building a prototype on top of an LLM API takes an afternoon and costs pennies. Moving that system into production where thousands of active users generate millions of tokens a day is where costs quickly spiral out of control.

Understanding the economics of running language models in production requires evaluating commercial API pricing models against self-hosted infrastructure, and putting proactive architectural safeguards in place.

## Anatomy of LLM production costs

Production inference costs are dominated by three primary dimensions:

- **Input tokens vs output tokens:** Output tokens are typically three to four times more expensive to generate than input tokens because auto-regressive generation requires a separate forward pass per token.
- **Context window overhead:** In RAG and agent architectures, conversational history and retrieved passages inflate input prompt sizes with every turn, multiplying token burn.
- **Concurrency and peak load:** When self-hosting open-weight models, infrastructure must be sized for peak throughput or risk unacceptable queuing latency.

## Hosted APIs vs self-hosting GPUs

Hosted APIs (such as OpenAI, Anthropic, or Google) charge strictly per token with zero idle infrastructure cost. This is the optimal path when demand is spiky, development velocity is paramount, or state-of-the-art frontier model reasoning is required.

Self-hosting open-weight models (such as LLaMA, Mistral, or Qwen) with frameworks like vLLM or TensorRT-LLM shifts the economics to fixed compute instances:

```
Monthly API Cost = Total Tokens * Price Per Token
Monthly Self-Hosted Cost = Number of GPU Instances * Hourly Cloud Rate * 730
```

When utilization exceeds roughly 60% of GPU capacity around the clock, self-hosting becomes drastically cheaper on a per-token basis. However, self-hosting introduces hidden engineering costs: operational overhead, driver maintenance, multi-GPU orchestration, and cold-start latency for autoscaling.

## Semantic caching

A substantial portion of user queries in customer support and search applications are identical or semantically identical. Traditional exact-match caching fails because "How do I cancel my plan?" and "Cancel subscription steps" have different strings.

Semantic caching embeds the incoming query and performs vector similarity search against previously answered queries. If the cosine similarity exceeds a threshold (typically 0.92 to 0.96), the cached completion is returned instantly:

```python
def answer_query(query: str) -> str:
    query_vector = embed_model.encode(query)
    match, score = cache_index.nearest(query_vector)

    if score >= 0.95:
        return match.cached_response

    response = llm_client.complete(query)
    cache_index.insert(query_vector, response)
    return response
```

This cuts both API token consumption and round-trip latency to under 20 milliseconds for cached hits.

## Prompt compression and trimming

System prompts and few-shot examples frequently bloat incoming requests. Practical ways to reduce prompt volume include:

- **Selective few-shot retrieval:** Retrieve one or two relevant few-shot examples via vector search rather than hardcoding ten examples in the system prompt.
- **Context pruning:** Strip redundant HTML boilerplate, markdown formatting, and stop words from scraped or retrieved RAG passages before passing them to the model.
- **Summarizing chat history:** Maintain a rolling summary of older conversation turns while keeping only the last two or three raw user-assistant message pairs intact.

## Intelligent model routing

Not every task requires a multi-billion parameter frontier model. An intelligent router inspects incoming requests and directs them to the smallest model capable of solving them:

- **Classification and entity extraction:** Small fine-tuned models (8B parameters) or fast tier APIs.
- **General summarization and RAG synthesis:** Mid-tier models.
- **Complex multi-step reasoning and tool orchestration:** Frontier models.

Deploying a lightweight classifier to route queries can reduce overall LLM spend by 50% to 70% with no noticeable regression in user experience.

## Takeaway

Controlling LLM expenses requires treating token usage as a first-class engineering budget. Combine hosted APIs for complex reasoning with smaller self-hosted models for high-throughput tasks, implement semantic caching, prune unnecessary prompt context, and route queries based on required model capability.
