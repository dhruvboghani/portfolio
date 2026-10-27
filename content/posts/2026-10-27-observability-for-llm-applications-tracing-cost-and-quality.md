---
title: Observability for LLM applications: tracing, cost and quality
description: How to monitor LLM applications in production: tracing each request, tracking tokens and cost, measuring latency, and evaluating answer quality over time.
date: 2026-10-27
tags: llm, observability, mlops
---
An LLM feature can look healthy on every standard dashboard while quietly giving worse answers, costing twice as much or taking ten seconds per reply. Traditional monitoring sees requests and errors, not whether the model did a good job.

LLM observability adds the missing pieces: what went into each call, what came out, what it cost and whether it was any good.

## Trace every request end to end

A single user request often involves several steps: retrieval, one or more model calls, tool calls and post-processing. Capture them as one trace with nested spans.

For each model call, record:

- **Prompt template name and version,** plus the filled-in prompt (with personal data masked).
- **Model name and parameters,** such as temperature and max tokens.
- **Input and output token counts.**
- **Latency,** including time to first token for streaming responses.
- **Tool calls** with arguments and results.
- **Retrieved documents** with their IDs and scores.

```python
with tracer.start_as_current_span("answer_question") as span:
    docs = retrieve(question)
    span.set_attribute("retrieval.count", len(docs))
    with tracer.start_as_current_span("llm.call") as call:
        resp = llm.generate(prompt_v3.format(q=question, docs=docs))
        call.set_attribute("llm.model", resp.model)
        call.set_attribute("llm.tokens.input", resp.usage.input_tokens)
        call.set_attribute("llm.tokens.output", resp.usage.output_tokens)
```

OpenTelemetry works well for this, and there are established conventions and tools for LLM-specific attributes.

## Track cost as a first-class metric

Token usage turns directly into money, and it can change quickly when a prompt grows or an agent loops.

- **Cost per request,** per feature and per customer or tenant.
- **Tokens per step** to spot prompts that have grown with extra context.
- **Calls per request** for agents, with alerts on unusually long loops.
- **Cache hit rates** if you use exact or semantic caching.

Budgets and alerts per feature catch runaway spending early.

## Watch latency the way users feel it

Average latency hides the slow experiences. Track percentiles, especially p95 and p99, and break them down by step: retrieval, model call, tools. For chat interfaces, time to first token matters more than total time, because streaming text makes waiting feel shorter.

## Measure quality, not just uptime

This is the part standard monitoring misses.

- **User signals:** thumbs up or down, edits to drafts, retries, abandoned conversations and handoffs to humans.
- **Automatic checks:** schema validation failures, guardrail triggers, refusals and empty answers.
- **Evaluations on samples:** score a sample of production responses for correctness, grounding in the retrieved sources and relevance. LLM-based judges can help here, but check them against human reviews before trusting them.
- **Offline evaluation sets:** run a fixed set of questions before every prompt, model or retrieval change, and compare scores with the previous version.

## Connect changes to outcomes

Most quality regressions follow a change. Version everything that affects behaviour: prompts, models, retrieval settings, chunking and tool definitions. Attach these versions to every trace, so when a metric moves you can see exactly which change caused it.

## Handle data responsibly

Prompts and responses often contain customer data. Mask personal information before storing traces, set retention limits, restrict access to the logs and respect the data agreements you have with customers and model providers.

## Takeaway

Observability for LLM applications means tracing each request across retrieval, model and tool steps, tracking tokens and cost per feature, watching latency percentiles and time to first token, and measuring answer quality with user signals, automatic checks and regular evaluations. Version every prompt and model change, so when something gets worse, you can find out why.
