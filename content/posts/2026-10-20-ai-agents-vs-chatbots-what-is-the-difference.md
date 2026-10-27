---
title: AI agents vs chatbots: what is the difference
description: AI agents vs chatbots explained: how they differ in goals, tools, memory and control, and how to decide which one your product actually needs.
date: 2026-10-20
tags: ai-agents, llm, chatbots
---
"Agent" has become the word for almost any product with a language model inside. Some of these are agents, many are chatbots, and the difference matters because it changes how you design, test and run the system.

This post explains what separates the two, where each one fits, and how to choose without overbuilding.

## What a chatbot does

A chatbot answers. A user sends a message, the system builds a prompt from the message and some context, the model replies, and the turn ends.

- **One request, one response.** The model does not decide to take further steps on its own.
- **Context is supplied for it.** Retrieval, conversation history and instructions are assembled by your code before the call.
- **Side effects are rare.** At most, the reply is shown to a user or stored.

A good chatbot can still be sophisticated. A support assistant with retrieval over your help centre, good prompts and conversation memory is a chatbot, and for many products it is exactly the right design.

## What an agent does

An agent works toward a goal over several steps. It decides what to do next, uses tools to act, observes the results and continues until it finishes or gives up.

- **A loop, not a single call.** The model plans, calls a tool, reads the result and decides the next step.
- **Tools with real effects.** Searching a database, calling an API, creating a ticket, updating a CRM record.
- **State across steps.** The agent keeps track of what it has tried and what it has learned.
- **Stopping conditions.** It must know when the goal is met, when to ask a human and when to stop trying.

```python
while not done and steps < MAX_STEPS:
    action = llm.decide(goal, history, tools)
    if action.type == "final_answer":
        done = True
    else:
        result = run_tool(action.tool, action.args)
        history.append((action, result))
    steps += 1
```

## The differences that matter in practice

**Control.** In a chatbot, your code decides the flow. In an agent, the model decides part of the flow. That flexibility is the point, and also the risk.

**Failure modes.** A chatbot can give a wrong answer. An agent can take a wrong action, repeat an action, loop, or spend a lot of tokens getting nowhere.

**Testing.** Chatbots can be evaluated on question and answer pairs. Agents need scenario tests: given this starting state and goal, did it reach the right end state using acceptable steps?

**Cost and latency.** Every step in the loop is another model call. A task that takes six steps costs roughly six times as much as a single reply, and takes longer.

**Security.** Tools turn text into actions. An agent that reads untrusted content, such as emails or web pages, can be manipulated by instructions hidden in that content. Tool permissions need the same care as any other API access.

## There is a middle ground

Many good systems sit between the two.

- **Tool-using chatbots:** a single model call that may call one tool, such as looking up an order, then answers.
- **Workflows with model steps:** your code defines the sequence, and the model fills in steps like classification, extraction or drafting.
- **Agents with narrow scope:** a small set of tools, a step limit and a clear goal, such as "find the invoice and summarise the mismatch".

These designs give you most of the benefit with far less unpredictability.

## How to choose

Ask a few plain questions.

- **Is the path known in advance?** If you can draw the steps as a flowchart, write a workflow and use the model inside the steps.
- **Does the task need actions, or just answers?** Answers point to a chatbot. Actions point to tools, and possibly an agent.
- **How bad is a wrong action?** The higher the cost, the more you need confirmations, permissions and human review.
- **Can you test it?** If you cannot describe what a correct outcome looks like, you are not ready to let a model pursue it on its own.

## Takeaway

A chatbot responds; an agent pursues a goal by deciding, acting and observing in a loop. Start with the simplest design that solves the problem, add tools where they are needed, and move to an agent only when the steps genuinely cannot be fixed in advance, with step limits, scoped permissions and scenario tests in place.
