---
title: Streaming LLM responses to the browser
description: How to stream LLM responses to the browser: server-sent events vs WebSockets, a FastAPI example, reading the stream in JavaScript, proxies and errors.
date: 2026-10-31
tags: llm, streaming, web-development
---
A language model can take several seconds to write a full answer. If your interface waits for the whole response, users stare at a spinner; if it streams, words appear almost immediately and the same answer feels much faster.

Streaming is simple in principle but has a few traps around transport, buffering and errors. This post walks through a setup that works in production.

## How streaming works end to end

1. The browser sends the question to your backend.
2. The backend calls the model API with streaming turned on.
3. The model returns the answer as a series of small chunks, often a few tokens each.
4. The backend forwards each chunk to the browser as soon as it arrives.
5. The browser appends each chunk to the message on screen.

Keep the model API key on the server. The browser should only ever talk to your backend.

## Server-sent events or WebSockets

**Server-sent events (SSE)** send a one-way stream of text events over a normal HTTP response.

- Simple to implement on both sides.
- Works through most proxies and load balancers.
- A natural fit for one question followed by one streamed answer.

**WebSockets** keep a two-way connection open.

- Useful when the client needs to send data during the answer, such as live audio or interruptions in a voice agent.
- More work: connection management, reconnection and scaling sticky connections.

For chat-style text answers, SSE is usually the right choice.

## The backend: forwarding chunks with FastAPI

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json

app = FastAPI()

@app.post("/api/chat")
async def chat(req: dict):
    async def events():
        try:
            async for chunk in llm.stream(req["message"]):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': 'generation_failed'})}\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

Each event is a line starting with `data:` followed by a blank line. Encoding each chunk as JSON keeps newlines and special characters safe.

## The frontend: reading the stream

The built-in `EventSource` only supports GET requests, so for a POST with a request body, read the response stream with `fetch`.

```javascript
const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message }),
  signal: controller.signal,
});
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const events = buffer.split("\n\n");
  buffer = events.pop();
  for (const e of events) {
    const data = e.replace(/^data: /, "");
    if (data === "[DONE]") return;
    const msg = JSON.parse(data);
    if (msg.error) return showError();
    appendToMessage(msg.text);
  }
}
```

Keep the partial last event in `buffer`, because a network read can end in the middle of an event.

## Watch out for buffering

The most common problem is a stream that arrives all at once at the end. Something between the model and the browser is buffering.

- **Reverse proxies** such as Nginx buffer responses by default. Disable buffering for the streaming route, for example with the `X-Accel-Buffering: no` header.
- **Compression** can hold back small chunks. Turn it off for event streams.
- **Hosting platforms** may need streaming enabled or a specific runtime. Check your platform's documentation.
- **Timeouts:** long answers can hit idle timeouts. Send occasional keep-alive comments if needed.

## Handle the user experience

- **Show something within a second,** even just a typing indicator, until the first chunk arrives.
- **Let users stop generation** with an `AbortController`, and stop the model call on the server when the client disconnects to avoid paying for unused tokens.
- **Render Markdown carefully** while text is incomplete, for example by re-rendering the whole message on each update and sanitising the HTML.
- **Keep scroll behaviour polite:** follow new text only when the user is already at the bottom.
- **Show clear errors** if the stream fails halfway, and offer a retry.

## Takeaway

Stream LLM answers through your own backend using server-sent events for chat-style responses, forward each chunk as it arrives, read the stream in the browser with `fetch` and a buffer, and disable proxy buffering and compression on that route. Add a stop button, cancel generation on disconnect and handle mid-stream errors, and answers will feel fast and reliable.
