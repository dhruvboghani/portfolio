---
title: Evaluating voice AI agents: what to measure
description: How to evaluate voice AI agents: speech recognition accuracy, latency and turn-taking, task success, simulated calls and production monitoring.
date: 2026-11-06
tags: voice-ai, evaluation, llm
---
A voice agent can sound impressive in a demo and still fail real callers. It mishears a phone number, pauses too long, talks over the customer or confidently books the wrong slot. Unlike a chat interface, users cannot scroll back or edit what they said, so small errors hurt more.

Evaluating a voice agent means looking at every layer: hearing, thinking, speaking and the conversation as a whole.

## Layer 1: did it hear correctly?

Speech recognition errors flow into everything downstream.

- **Word error rate (WER)** on recorded calls from your real users, with their accents, background noise and phone line quality.
- **Entity accuracy:** for the details that matter, such as names, phone numbers, dates, amounts and product codes, measure exact-match accuracy. A low overall WER can still hide a wrong digit.
- **Language and code-mixing:** test calls where people switch languages mid-sentence, which is common in India.

## Layer 2: was it fast and natural?

Timing defines how a voice agent feels.

- **Response latency:** the time from the end of the caller's speech to the start of the agent's audio. Track percentiles, not just averages.
- **Endpointing quality:** how often the agent cuts in before the caller finished, or waits awkwardly after they stopped.
- **Interruption handling (barge-in):** when the caller speaks over the agent, does it stop and listen?
- **Speech quality:** pronunciation of names and numbers, pacing, and whether the voice suits the brand.

## Layer 3: did it do the job?

- **Task success rate:** did the call reach the intended outcome, such as a booked appointment, a qualified lead or a resolved query?
- **Slot accuracy:** were the captured details correct when checked against the recording or the source system?
- **Correct tool use:** did it call the right CRM or calendar actions with the right arguments?
- **Escalation quality:** did it hand off to a human when it should, with a useful summary?

## Layer 4: was the conversation good?

- **Turns to completion** compared with a reasonable path.
- **Repetition and loops:** asking the same question twice or getting stuck.
- **Policy adherence:** required disclosures, no promises it cannot make, staying in scope.
- **Tone and sentiment:** caller frustration signals such as raised voice, repeated "no" or asking for a human.

## How to test before launch

**Scenario libraries.** Write test cases from real call types: a caller who changes their mind, one who gives the date in an unusual format, one with a noisy background, one who asks something out of scope.

**Simulated callers.** Use a second model as the caller, following a persona and goal, and run conversations through the full pipeline, including speech synthesis and recognition, so audio errors are part of the test.

```yaml
scenario: reschedule_with_interruption
caller_persona: busy clinic patient, speaks quickly, interrupts once
goal: move appointment from Friday 4pm to Monday morning
expect:
  - appointment.rescheduled_to: "Monday 10:00-12:00"
  - confirms_new_time_aloud: true
  - max_turns: 8
```

**Graded transcripts.** Score results automatically where outcomes are checkable, and use human or model-based review for conversation quality. Check model-based judges against human reviews regularly.

## Monitoring in production

- Sample and review real calls every week, especially failed or escalated ones.
- Track latency percentiles, task success, escalation rate and caller hang-ups by call type.
- Turn every real failure into a new test scenario.
- Re-run the full scenario suite before changing the speech model, the language model, prompts or voice.

Always handle recordings with consent and mask personal details in stored transcripts.

## Takeaway

Evaluate voice agents layer by layer: recognition accuracy on real audio and key entities, latency and turn-taking, task success and correct actions, and overall conversation quality. Test with realistic scenarios and simulated callers before launch, monitor real calls after it, and feed every failure back into your test suite.
