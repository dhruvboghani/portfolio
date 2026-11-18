---
title: WebRTC for real-time voice AI agents
description: Why WebRTC is replacing WebSockets for interactive voice AI agents: sub-500ms latency, UDP audio streaming, jitter buffers, and interruption.
date: 2026-11-15
tags: voice-ai, webrtc, real-time
---
Building voice AI agents that feel natural and human requires total round-trip latency to stay under 500 milliseconds. When response delays exceed 800 milliseconds, users perceive the interaction as awkward and start talking over the bot.

While early voice bots relied on audio streaming over TCP-based WebSockets, production-grade conversational agents are standardizing on WebRTC to achieve ultra-low latency, robust packet-loss resilience, and instant interruption handling.

## The WebSocket bottleneck: TCP Head-of-Line blocking

WebSockets run over TCP, which guarantees in-order, lossless packet delivery. When a single audio packet drops over a mobile network:

- TCP pauses all subsequent audio packets until the missing packet is retransmitted and acknowledged.
- This creates **Head-of-Line (HoL) blocking**, causing sudden audio stuttering followed by unnatural bursts of speed.
- In voice conversations, a dropped 20-millisecond audio frame is completely irrelevant a second later; retransmitting stale audio hurts conversational fluidity.

WebRTC uses UDP (via SRTP) where dropped frames are discarded gracefully rather than stalling the live audio stream.

## Why WebRTC fits voice AI

WebRTC was engineered specifically for real-time voice and video communication across browsers and mobile clients:

- **Built-in Adaptive Jitter Buffers:** WebRTC dynamically smooths out packet arrival timing variations without adding fixed artificial delays.
- **Acoustic Echo Cancellation (AEC) and Noise Suppression:** WebRTC provides native hardware and browser audio processing, stripping speaker playback echoes before the user's microphone stream reaches your speech-to-text model.
- **Bi-directional data channels:** WebRTC allows multiplexing binary Opus audio alongside an out-of-band JSON data channel for telemetry, transcript updates, and function-call events.

## Architecture of a WebRTC voice pipeline

An enterprise WebRTC voice agent pipeline coordinates four specialized components:

```
[User Browser / Phone]
        │  WebRTC (SRTP / UDP Audio)
        ▼
[Media Server / Gateway] (LiveKit / Pion)
        │  Raw PCM Audio Frames
        ▼
[Speech-to-Text] (Whisper / Deepgram Streaming STT)
        │  Streaming Token Transcripts
        ▼
[LLM Orchestrator] (FastAPI / vLLM / Claude / GPT)
        │  Streaming Sentence Chunks
        ▼
[Text-to-Speech] (Cartesia / ElevenLabs / Kokoro)
        │  Synthesized Audio Packets
        ▼
[Media Server] ──► WebRTC Return Stream ──► [User Speaker]
```

## Handling instant user interruptions (Barge-in)

The most critical test of a conversational voice agent is how it responds when a user interrupts midway through the assistant's response:

- When the user speaks, local Voice Activity Detection (VAD) triggers within 100 milliseconds.
- An immediate cancellation signal is sent over the WebRTC data channel to the backend orchestrator.
- The backend aborts in-flight LLM generation, flushes pending TTS audio queues, and signals the media server to clear the playback buffer.

Because WebRTC decouples media control from audio transport, playback stops instantaneously, mirroring human conversation.

## Scaling WebRTC infrastructure

Unlike stateless HTTP servers, WebRTC connections maintain persistent peer-to-peer or client-to-server media sessions. Production deployments require:

- **Selective Forwarding Units (SFUs):** Open-source media engines like LiveKit or Pion written in Go/Rust that handle thousands of concurrent audio tracks efficiently.
- **STUN/TURN infrastructure:** Relays to navigate corporate firewalls and symmetric NATs, ensuring connections establish reliably across cellular and enterprise networks.
- **Edge deployment:** Co-locating media gateways close to users to shave 40 to 80 milliseconds of geographic round-trip flight time.

## Takeaway

Sub-500ms conversational latency requires ditching TCP-based audio streaming. Adopt WebRTC for UDP transport, built-in echo cancellation, and responsive barge-in handling, while deploying specialized media gateways to bridge real-time audio with streaming STT, LLM, and TTS pipelines.
