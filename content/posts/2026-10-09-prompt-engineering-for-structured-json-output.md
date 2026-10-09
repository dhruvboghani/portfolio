---
title: Prompt engineering for structured JSON output
description: How to make an LLM return valid JSON using a schema, a response format, validation, and a retry when the shape is wrong.
date: 2026-10-09
tags: llm, prompt-engineering, json
---
Applications do not want an essay from a model. They want fields a program can read: an amount, a status, a list of line items. If that payload is not valid JSON, the next line of code throws and the feature looks broken even when the model's reasoning was fine.

Prompting for JSON is the practice of making that payload the contract, then checking it before anything downstream trusts it.

## Say what the object is

A line that says "reply in JSON" is not a schema. The model will still invent keys, wrap the object in markdown, or add a sentence before the brace. Name the fields, the types, and the values you will accept.

- Give every field a stable name your code already uses. Do not ask the model to pick friendly labels.
- Mark which fields are required and which may be null. An omitted key and a null are different bugs.
- Use enums for status, category, and currency. Free text in those slots is how you get `Approved`, `approved`, and `yes`.
- Put a short description on any field a person could misread, such as whether `total` includes tax.

A compact schema in the prompt is easier to follow than a paragraph of rules. Keep it next to the instruction, not buried in a long system message.

```json
{
  "invoice_no": "string",
  "currency": "INR | USD | EUR",
  "total": "number",
  "line_items": [{ "description": "string", "amount": "number" }],
  "flags": ["tax_mismatch | missing_hsn | none"]
}
```

One example of a valid object helps more than three examples of prose. If you include an example, make it obviously fake so the model does not copy the sample numbers into a real document.

## Prefer a response format over a plea

Most hosted model APIs can constrain the reply. Use that before you spend time on prompt wording.

- **JSON mode** asks for a JSON value but does not check your keys. You can still get `{ "answer": "..." }` when you wanted line items.
- **Structured output** or a JSON Schema response format binds the decoder to your schema. Extra keys and wrong types fail at generation time instead of in your parser.
- **Tool or function calling** is the same idea with a name. The model returns arguments for a function you defined. That is a good fit when the JSON is an action, such as `create_lead` or `flag_invoice`, not a free-form summary.

If the provider you are on has no schema mode, say the reply must be a single JSON object, with no markdown fence and no text before or after it. Then parse only the slice from the first `{` to the last `}`. That fallback is brittle. Treat it as a compatibility path, not the design.

## Validate, then retry once

Even a schema-constrained call can be semantically wrong. The JSON parses, the types match, and the total does not equal the sum of the lines. Validation is a second gate that the schema cannot express.

Check three things in code, not in the prompt:

- The document parses and matches the schema.
- Numbers and dates are in range. A negative quantity or a year of `1899` is a reject.
- Cross-field rules hold. Totals, required pairs, and "if status is rejected, reason is required."

On failure, send one retry that includes the validator's message and the previous output. "Field `currency` must be one of INR, USD, EUR. You returned `rupees`." Models correct a specific error more reliably than they correct "try again." Cap the retry at one or two attempts, then fail the request and log the raw output. An infinite repair loop hides a bad prompt.

```text
response = model.generate(schema, document)
errors = validate(response)
if errors:
    response = model.generate(schema, document, previous=response, errors=errors)
    errors = validate(response)
if errors:
    raise InvalidModelOutput(errors)
```

Do not pass the repaired object to a database until the second validation passes. A retry that still fails is a product error, not a partial success.

## Keep the schema small enough to obey

A schema that mirrors an entire database table will not be followed. Models drop nested arrays, truncate long lists, and invent keys that sound plausible when the contract is huge.

- Split extraction when the document has unrelated parts. Header fields in one call, line items in another, then a check that joins them.
- Ask for identifiers and amounts, not a rewritten copy of the source, unless you truly need the prose.
- Cap list length in the prompt and in the validator. Unbounded arrays are where output gets cut off mid-string.
- Version the schema. When you add a field, old prompts and new code disagree, and the failure looks like a model bug.

Keep temperature low for extraction. You are copying facts into slots, not brainstorming. A higher temperature makes creative key names more likely.

## What still breaks

Structured output does not fix a bad source. An unreadable invoice can still produce valid JSON full of empty strings or zeros. Decide which empties are acceptable and which should go to a person.

Watch the logs for markdown fences around otherwise valid JSON, a second object after the first, numbers stored as strings such as `"1,250.00"`, and enum synonyms like `rupees` instead of `INR`. Map synonyms in one validator. A document that says "ignore the schema" should still have to match it, which is what constrained decoding is for.

Log the schema version, the raw model text, and the validator errors. Without that, you cannot tell a prompt regression from a bad document.

## Takeaway

Treat JSON as an interface. Put the field names, types, and enums in a schema the API can enforce, and keep a validator for rules the schema cannot see. Ask for a repair only when you can show the exact error, and stop after one retry. Small schemas, low temperature, and logs that include the raw payload are what make structured output something the rest of the system can trust.
