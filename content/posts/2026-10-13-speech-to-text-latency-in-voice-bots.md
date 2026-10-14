---
title: Speech-to-text latency in voice bots: where time goes
description: Why voice bots feel slow and how to cut speech-to-text latency with streaming ASR, better endpointing, partial results and a tighter voice pipeline.
date: 2026-10-13
tags: voice-ai, speech-to-text, latency
---
In a voice conversation, a pause that would go unnoticed in a chat window feels awkward. When a voice bot takes too long to reply, callers start talking again, repeat themselves or hang up.

Speech-to-text is only one part of the response time, but it is often the part teams understand least. This post breaks down where the delay comes from and the practical ways to reduce it.

## Where the time goes in a voice turn

A single turn in a voice bot is a chain of steps, and the caller waits for all of them.

- **Audio transport:** audio travels from the phone network or browser to your server, usually in small frames.
- **Endpointing:** the system decides the caller has finished speaking.
- **Speech-to-text (ASR):** the audio becomes text. With streaming ASR, most of this happens while the caller is still talking.
- **LLM response:** the model reads the transcript and starts generating a reply.
- **Text-to-speech (TTS):** the reply becomes audio, ideally starting with the first sentence.
- **Playback:** audio travels back and starts playing.

The number that matters is the gap between the caller stopping and the bot starting to speak. Measure that gap end to end before optimizing any single step, because the slowest step is often not the one you expect.

## Use streaming recognition

Batch transcription waits for the whole utterance, uploads it and then transcribes it. That adds the full length of the utterance to your delay.

Streaming ASR transcribes as the audio arrives and returns **partial results** that keep updating, followed by a **final result** for each segment. When the caller stops, most of the work is already done.

- Send audio in small frames, typically tens of milliseconds each, over a persistent connection such as a WebSocket.
- Use the provider's streaming API rather than polling a batch endpoint.
- Keep the connection open for the whole call. Opening a new connection for every turn adds handshake time.
- Match the audio format the phone line produces, for example 8 kHz mu-law from a telephony provider, to avoid resampling steps where possible.

## Endpointing is usually the biggest lever

Endpointing decides when the caller is done. Many systems wait for a fixed period of silence before treating a turn as finished. That silence timeout is added directly to every reply.

- **Too long:** the bot feels slow and unresponsive.
- **Too short:** the bot interrupts people who pause to think, which is worse.

Better approaches combine signals instead of relying on silence alone.

- **Voice activity detection (VAD)** to tell speech from background noise.
- **Semantic endpointing:** look at the partial transcript. "My order number is" is clearly unfinished; "Yes, that works" is clearly complete.
- **Context-aware timeouts:** allow a longer pause when you asked for a phone number or address, and a shorter one after a yes or no question.

Tune these values on real recordings from your callers, not on clean test audio.

## Start the reply before the transcript is final

You do not have to wait for every step to finish before starting the next one.

- **Speculative processing:** when a stable partial transcript arrives, start the LLM call. If the final transcript differs meaningfully, cancel and restart.
- **Stream the LLM output:** send the first sentence to TTS as soon as it is complete, instead of waiting for the whole reply.
- **Stream TTS audio:** start playback with the first audio chunk.
- **Keep the opening short:** a brief acknowledgement followed by the detail sounds natural and gets audio playing sooner.

```python
async for event in asr.stream(audio_frames):
    if event.is_partial and looks_complete(event.text):
        reply_task = start_llm(event.text)          # speculative start
    if event.is_final:
        if reply_task and differs(event.text, reply_task.prompt):
            reply_task.cancel()
            reply_task = start_llm(event.text)
        async for sentence in reply_task.sentences():
            await tts.speak(sentence)               # stream audio out
```

## Accuracy affects latency too

A wrong transcript costs more time than a slow one, because the bot answers the wrong question and the caller has to repeat themselves.

- **Add domain vocabulary:** product names, brand terms and local place names, using the keyword boosting or custom vocabulary your provider offers.
- **Pick the right language and model:** a model tuned for phone audio usually does better on calls than a general one.
- **Handle numbers carefully:** confirm phone numbers, order ids and amounts back to the caller.

## Handle barge-in

Callers interrupt. If the bot keeps talking over them, the conversation breaks down.

- Keep listening while the bot speaks.
- When speech is detected, stop TTS playback immediately and cancel any reply still being generated.
- Treat the interruption as the start of a new turn.

## Measure every stage

You cannot improve what you do not measure. Log timestamps per turn: speech end detected, final transcript, first LLM token, first TTS audio and playback start. Look at percentiles across many calls, not averages, because the slow turns are the ones callers remember.

## Takeaway

Voice bots feel fast when the work overlaps. Use streaming ASR, tune endpointing on real audio, start the reply from stable partial transcripts, stream LLM and TTS output, support barge-in, and measure each stage so you fix the delay that actually matters.
