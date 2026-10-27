---
title: Guardrails for LLM applications: a practical guide
description: How to add guardrails to LLM applications: input checks, output validation, tool permissions, grounding and monitoring that keep AI features safe and reliable.
date: 2026-10-21
tags: llm, guardrails, ai-safety
---
A language model will eventually produce something you did not want: a made-up fact, a leaked instruction, an answer outside your product's scope or a tool call with the wrong arguments. Guardrails are the checks around the model that catch these cases before they reach users or systems.

No single guardrail is enough. Reliable applications use several layers, each cheap and focused.

## Layer 1: check the input

Filter problems before they reach the model.

- **Scope checks:** classify whether the request is something your application handles. A billing assistant does not need to write poems.
- **Size and format limits:** cap message length and reject malformed payloads.
- **Sensitive data handling:** detect and mask personal data such as phone numbers or account IDs when the model does not need them.
- **Prompt injection signals:** look for instructions in user text or retrieved documents that try to override your system prompt. Detection is imperfect, so treat it as one signal, not a wall.

Keep untrusted content clearly separated in the prompt, for example inside labelled blocks, and tell the model that content inside them is data, not instructions.

## Layer 2: constrain the model

Reduce what can go wrong in the first place.

- **Clear system instructions** that state the role, scope and what to do when unsure, such as "say you do not know".
- **Grounding:** give the model the facts it needs through retrieval, and ask it to answer only from them.
- **Structured output:** request JSON that matches a schema when the result feeds code.
- **Lower randomness** for tasks that need consistency, such as extraction and classification.

## Layer 3: validate the output

Never trust the output just because the prompt was good.

- **Schema validation:** parse JSON and check types, required fields and allowed values. Retry once with the error message, then fail safely.
- **Business rules:** amounts must be positive, dates in range, IDs must exist.
- **Grounding checks:** for answers built from retrieved documents, check that key claims appear in the sources, or require citations.
- **Content checks:** filter for unsafe or off-brand content before display.

```python
from pydantic import BaseModel, ValidationError

class Refund(BaseModel):
    order_id: str
    amount: float
    reason: str

try:
    refund = Refund.model_validate_json(llm_output)
    if refund.amount <= 0 or refund.amount > order_total(refund.order_id):
        raise ValueError("amount out of range")
except (ValidationError, ValueError):
    refund = None  # retry once, then hand off to a human
```

## Layer 4: limit what tools can do

When a model can call tools, guardrails become access control.

- **Least privilege:** give each tool the narrowest permissions it needs, ideally scoped to the current user.
- **Validate arguments in the tool,** not in the prompt. The tool should refuse invalid or unauthorised requests on its own.
- **Confirm high-impact actions** like payments, deletions or emails to customers with the user or a reviewer.
- **Rate and step limits** stop loops and runaway costs.

## Layer 5: monitor in production

Guardrails need feedback to stay useful.

- **Log inputs, outputs, tool calls and guardrail decisions,** with personal data masked.
- **Track rates:** refusals, validation failures, retries and human handoffs. A sudden change usually means a prompt, model or data change.
- **Review samples regularly,** especially flagged cases, and turn real failures into test cases.
- **Run an evaluation set** before every prompt or model change.

## Keep the experience good

Guardrails should not make the product frustrating. When something is blocked, say so plainly and offer a next step, such as rephrasing or contacting support. Prefer graceful fallbacks, like a simpler answer or a human handoff, over silent failures.

## Takeaway

Guardrails are layers, not a single filter: check inputs, constrain the model with grounding and structure, validate every output, scope tool permissions tightly and monitor what happens in production. Each layer is simple, and together they turn an impressive demo into an application you can trust.
