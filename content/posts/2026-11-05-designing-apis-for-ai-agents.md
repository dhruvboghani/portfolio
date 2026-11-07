---
title: Designing APIs for AI agents
description: How to design APIs AI agents can use reliably: clear tool descriptions, simple inputs, helpful errors, idempotency, permissions and compact responses.
date: 2026-11-05
tags: ai-agents, api-design, llm
---
More and more API calls are made by language models acting as agents, through tool calling or protocols such as the Model Context Protocol (MCP). Agents read your descriptions, choose a tool, fill in arguments and interpret the response, all from text.

APIs designed only for human developers often trip agents up. A few design choices make the difference between an agent that completes tasks and one that loops on errors.

## Describe tools for a reader with no context

An agent sees only the tool name, description and parameter schema. Write them as if for a capable new colleague who has never seen your system.

- **Say what the tool does and when to use it,** and when not to. "Search orders by customer, status or date. Use get_order when you already have an order ID."
- **Describe every parameter,** including format, units and examples: "amount in rupees, e.g. 1499.00", "date as YYYY-MM-DD".
- **Use specific names.** `search_invoices` beats `query`, and `customer_id` beats `id`.

## Keep inputs simple and constrained

- **Prefer enums to free text** for fields with known values, such as status.
- **Avoid deeply nested objects** and long lists of optional flags. Several focused tools are easier to use correctly than one tool with twenty options.
- **Accept natural formats** where reasonable, such as an email address instead of an internal user ID, and resolve them on the server.
- **Validate strictly** and reject invalid input with a clear message instead of guessing.

```json
{
  "name": "search_orders",
  "description": "Find orders for one customer. Returns at most 20 orders, newest first. Use get_order for full details of a single order.",
  "parameters": {
    "type": "object",
    "properties": {
      "customer_email": {"type": "string", "description": "Customer's email address"},
      "status": {"type": "string", "enum": ["pending", "paid", "shipped", "refunded"]},
      "placed_after": {"type": "string", "description": "Only orders on or after this date, YYYY-MM-DD"}
    },
    "required": ["customer_email"]
  }
}
```

## Return responses agents can use

- **Return only what is needed,** in a compact structure. Huge payloads waste context and bury the useful fields.
- **Paginate with clear cues,** such as `"has_more": true` and a `next_cursor`, and say so in the description.
- **Use readable values** alongside IDs: a status of "shipped" with a date is more useful than a numeric code.
- **Summarise large results** when possible, for example totals and counts with the top items.

## Write errors that explain the fix

Agents recover well when errors tell them what to do next.

- Bad: `400 Bad Request`.
- Good: `"placed_after must be a date in YYYY-MM-DD format, got '5 Nov'"`.
- Good: `"No customer found with email a@b.com. Try search_customers with a name."`

Distinguish errors the agent can fix, such as invalid input, from ones it cannot, such as permission denied or the service being down, so it does not retry pointlessly.

## Make actions safe

- **Idempotency keys** on create and payment endpoints, so a retried call does not create duplicates.
- **Separate read and write tools,** and mark which ones change data.
- **Preview or dry-run modes** for high-impact actions, returning what would happen without doing it.
- **Confirmation steps** for irreversible actions, handled by the application, not left to the model.

## Scope permissions to the user

Agents should act with the permissions of the person they work for, not a powerful service account. Use delegated, scoped tokens, check permissions on every call, and log which agent called which tool for which user. Never trust the agent to apply access rules itself.

## Plan for limits and observability

Return rate-limit information and `Retry-After` headers, set timeouts, and log every tool call with its inputs and outcome. These logs are the best source of examples for improving descriptions and catching misuse.

## Takeaway

Agent-friendly APIs have clear, specific descriptions, simple validated inputs, compact responses, errors that explain the fix, idempotent and previewable actions, and permissions scoped to the user. Design for a reader that sees only your schema, and agents will use your API correctly far more often.
