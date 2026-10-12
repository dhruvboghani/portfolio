---
title: LLM function calling explained: how tool use works
description: How LLM function calling works: tool schemas, the request loop, argument validation, errors and security, with a practical example in Python.
date: 2026-10-12
tags: llm, function-calling, ai-agents
---
A language model on its own can only produce text. Function calling, also called tool use, is how you let it look up an order, check inventory or book a meeting by asking your code to do the work.

The model never runs anything itself. It decides which function to call and with which arguments, your application executes it, and the result goes back to the model so it can answer. Understanding that split is the key to building tool-using features that are reliable and safe.

## How function calling works

Every function calling flow follows the same loop, whatever the provider.

- **Describe the tools.** You send the model a list of functions, each with a name, a description and a JSON Schema for its parameters.
- **The model chooses.** Given the user's message, the model either replies with text or returns a structured tool call: a function name plus arguments as JSON.
- **Your code executes.** You validate the arguments, run the real function and capture the result.
- **Send the result back.** You add the tool result to the conversation and call the model again.
- **Repeat or answer.** The model may call another tool, or produce the final answer using the results.

The model is a planner that speaks JSON. Your application stays in control of what actually happens.

## Defining good tools

The model only knows what your schema and description tell it, so tool definitions deserve the same care as an API you publish.

- **Name tools by action:** `get_invoice`, `search_products`, `create_appointment`. Avoid vague names like `run` or `helper`.
- **Write descriptions for the model:** say when to use the tool and when not to, for example "Use only for existing orders. Do not use to create orders."
- **Constrain parameters:** use types, required fields and enums. A `status` field with `pending | paid | overdue` prevents the model from inventing values.
- **Keep the list short:** offer only the tools relevant to the current task or user role. Many overlapping tools make the wrong choice more likely.
- **Return compact results:** send back the fields the model needs, not a full database row with fifty columns.

```python
tools = [{
    "name": "get_invoices",
    "description": "Fetch invoices for the signed-in company. Use for questions about invoice status, amounts or due dates.",
    "parameters": {
        "type": "object",
        "properties": {
            "status": {"type": "string", "enum": ["pending", "paid", "overdue"]},
            "limit": {"type": "integer", "minimum": 1, "maximum": 50}
        },
        "required": ["status"]
    }
}]
```

## The request loop in code

The loop is short, but each step matters. The shape below is provider-neutral; the field names differ slightly between APIs.

```python
messages = [{"role": "user", "content": "Which invoices are overdue?"}]
for _ in range(5):                      # hard cap on tool rounds
    reply = llm.chat(messages=messages, tools=tools)
    if not reply.tool_calls:
        print(reply.text); break
    messages.append(reply.message)
    for call in reply.tool_calls:
        try:
            args = validate(call.name, call.arguments)   # schema check
            result = TOOLS[call.name](user=current_user, **args)
        except Exception as e:
            result = {"error": str(e)}
        messages.append({"role": "tool", "tool_call_id": call.id,
                         "content": json.dumps(result)})
```

A few details from this loop are easy to miss:

- **Cap the iterations.** Without a limit, a confused model can call tools in a loop.
- **Handle several calls per turn.** Many models can request more than one tool at once, for example two lookups that do not depend on each other.
- **Return errors to the model.** A clear message such as "invoice not found" lets the model recover or ask the user, instead of the whole request failing.
- **Match results to calls.** Each result must reference the id of the call it answers.

## Validation and security

Treat tool arguments as untrusted input, exactly like data from a web form. The model can produce wrong values, and a user can try to steer it with crafted messages.

- **Validate every argument** against the schema and your business rules before executing anything.
- **Enforce permissions in code.** Pass the authenticated user into the function and filter by tenant and role there. Never rely on the prompt to restrict access.
- **Separate read and write tools.** Reads are low risk. For actions that change data, send money or message customers, require explicit user confirmation before executing.
- **Make writes idempotent** where possible, so a repeated call does not create a duplicate booking or payment.
- **Log every call** with its arguments, result and user. This is how you debug wrong answers and audit what the system did.

## When to use function calling

Function calling fits whenever the answer depends on live or private data, or when the user wants something done rather than explained.

- Answering questions from your database or APIs without stuffing everything into the prompt.
- Turning natural language into actions: bookings, CRM updates, report filters.
- Extracting structured data, where a single "tool" acts as the output schema.
- Building agents that plan several steps, where each step is a tool call.

It is not a fit when the answer is static knowledge the model already has, or when a simple form would be clearer and safer than a conversation.

## Takeaway

Function calling lets an LLM decide what to do while your code decides what is allowed. Write clear tool schemas, run a capped and validated request loop, enforce permissions outside the model and confirm any action that changes data. Done this way, tool use turns a chatbot into an assistant that can safely work with real systems.
