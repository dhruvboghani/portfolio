---
title: Rate limiting and retries for LLM APIs
description: How to handle LLM API rate limits: request and token limits, exponential backoff with jitter, client-side throttling, queues, fallbacks and timeouts.
date: 2026-10-28
tags: llm, reliability, api
---
Every LLM provider limits how much you can send, and every production application eventually hits those limits. A burst of users, a batch job or an agent stuck in a loop is enough to start getting `429 Too Many Requests` errors.

Handled badly, rate limits turn into failed requests and angry users. Handled well, they become short, invisible delays. This post covers how.

## Know what is being limited

LLM APIs usually enforce several limits at once.

- **Requests per minute:** how many calls you can make.
- **Tokens per minute:** input plus output tokens across all calls. Long prompts hit this first.
- **Concurrent requests:** how many calls can be in flight at the same time.
- **Daily or monthly quotas** on some plans.

Limits are often set per API key, per project or per model, so a background job can eat the budget your live chat needs. Check your provider's documentation and the response headers, which often report remaining requests, remaining tokens and when the limit resets.

## Retry the right errors

Not every error deserves a retry.

- **Retry:** `429` rate limit, `500`, `502`, `503`, `504`, and network timeouts or connection resets.
- **Do not retry:** `400` bad request, `401` and `403` authentication errors, and validation errors. Repeating them only wastes time.
- **Respect `Retry-After`.** If the response says how long to wait, wait at least that long.

## Use exponential backoff with jitter

Retrying immediately makes things worse, because every client retries at the same moment. Wait longer after each failure, and add randomness so clients spread out.

```python
import random, time

RETRYABLE = {429, 500, 502, 503, 504}

def call_with_retry(send, max_attempts=5, base=1.0, cap=30.0):
    for attempt in range(1, max_attempts + 1):
        resp = send()
        if resp.status_code not in RETRYABLE:
            return resp
        if attempt == max_attempts:
            break
        wait = resp.headers.get("retry-after")
        delay = float(wait) if wait else min(cap, base * 2 ** (attempt - 1))
        time.sleep(delay * random.uniform(0.5, 1.0))
    raise RuntimeError("LLM call failed after retries")
```

Many official SDKs already retry with backoff. Check what yours does before adding another layer, or you may multiply retries without meaning to.

## Throttle on your side

Retries handle occasional limits. If you hit them constantly, slow down before sending.

- **Token bucket per key or model:** only send when there is budget for the estimated tokens of the request.
- **Concurrency limits:** cap in-flight requests with a semaphore or a worker pool.
- **Estimate tokens before sending** with the provider's tokenizer, so a huge prompt does not blow through the budget.

In a system with several servers, keep the shared budget in a central store such as Redis, so all instances see the same limits.

## Separate traffic by priority

Not all requests are equally urgent.

- **Interactive requests** from users waiting on a reply get priority.
- **Background jobs** like batch summaries, embeddings and evaluations go through a queue with their own lower limits.
- **Use batch APIs** where your provider offers them for large offline jobs. They are usually cheaper and do not compete with live traffic.

## Plan for when retries are not enough

- **Set timeouts** on every call, including a total time budget across retries, so users are not left waiting forever.
- **Fallback models:** route to a smaller model or another provider when the primary one is limited or down.
- **Graceful degradation:** return a cached answer, a shorter response, or a clear message asking the user to try again shortly.
- **Circuit breaker:** if a provider fails repeatedly, stop sending for a short period instead of piling on more requests.

## Watch it in production

Track 429 rates, retries per request, time spent waiting, tokens per minute against your limits, and which features use the most budget. A steady rise in retries is an early warning to raise limits, cache more or trim prompts.

## Takeaway

Know which limits apply, retry only retryable errors with exponential backoff, jitter and `Retry-After`, throttle requests on your side with token and concurrency budgets, give interactive traffic priority over background jobs, and keep timeouts and fallbacks ready for when retries are not enough.
