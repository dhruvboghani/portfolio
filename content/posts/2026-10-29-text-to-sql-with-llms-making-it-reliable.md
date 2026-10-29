---
title: Text-to-SQL with LLMs: making it reliable
description: How to make text-to-SQL with LLMs reliable: giving the model the right schema, safe read-only execution, validation, few-shot examples and evaluation.
date: 2026-10-29
tags: llm, sql, analytics
---
Letting people ask questions about data in plain language is one of the most requested AI features. A model that turns "revenue by region last quarter" into SQL looks impressive in a demo, but in production it can return confident, wrong numbers.

Reliable text-to-SQL is less about the model and more about the system around it. This post covers the parts that matter.

## Give the model the right context

The model can only write correct SQL if it understands your data.

- **Relevant schema only.** Include the tables and columns needed for the question, not your whole database. For large schemas, retrieve relevant tables first using their names and descriptions.
- **Descriptions, not just names.** `amt` and `st` mean nothing; "order total in INR including tax" and "order status: pending, paid, refunded" mean a lot.
- **Business definitions.** Spell out what "active customer", "revenue" or "churn" mean in your company, including which filters apply.
- **Sample values** for important columns such as statuses, regions or plan names.
- **Join paths** between tables, with the keys to use.

## Use examples from your own data

A few question and SQL pairs from your real schema teach the model your conventions better than instructions alone. Store a library of verified examples and retrieve the most similar ones for each new question.

```sql
-- Q: Revenue by region for last quarter
SELECT c.region, SUM(o.total_inr) AS revenue
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.status = 'paid'
  AND o.paid_at >= date_trunc('quarter', current_date) - interval '3 months'
  AND o.paid_at <  date_trunc('quarter', current_date)
GROUP BY c.region
ORDER BY revenue DESC;
```

## Execute safely

Generated SQL must never be able to damage data or leak it.

- **Read-only database user** with access only to the tables the feature needs.
- **Row-level security or views** so users only see the data they are allowed to see. Do not rely on the prompt to apply permission filters.
- **Allow only `SELECT`** and reject anything else before execution.
- **Limits and timeouts:** add a row limit, set a statement timeout, and run against a replica or analytics store rather than the primary database.

## Validate before and after running

- **Parse the SQL** with a SQL parser to check syntax and confirm it only touches allowed tables and columns.
- **Dry run or `EXPLAIN`** to catch errors and very expensive queries before running them.
- **Repair loop:** if the database returns an error, send the error and the query back to the model once to fix it. Stop after one or two attempts.
- **Sanity checks on results:** empty results, negative revenue or numbers far outside normal ranges deserve a warning.

## Show your work to the user

Trust comes from transparency.

- **Show the SQL** or a plain-language explanation of what was queried, including filters and date ranges.
- **State assumptions,** such as "revenue means paid orders, including tax".
- **Ask a clarifying question** when the request is ambiguous, for example which date field to use.
- **Let users rate answers,** and save corrected queries as new verified examples.

## Consider a semantic layer

For important metrics, letting the model write raw SQL every time is risky. A semantic layer defines metrics and dimensions once, such as revenue, region and month, and the model only chooses which metrics and filters to request. The layer generates consistent SQL, so the same question always means the same thing.

## Measure accuracy

Build an evaluation set of real questions with verified SQL or verified results. Compare the results of generated queries with the expected results, not just the SQL text, since different queries can be equally correct. Run the set whenever you change prompts, models or schema descriptions.

## Takeaway

Reliable text-to-SQL depends on good context and strong guardrails: give the model relevant schema with clear descriptions, business definitions and verified examples, run queries read-only with permissions enforced by the database, validate and repair queries before trusting them, show users what was queried, and measure accuracy on real questions.
