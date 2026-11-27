---
title: Dynamic batching for high-throughput LLM serving
description: How continuous and dynamic batching boost GPU utilization in LLM inference via iteration-level scheduling and prefill-decode tuning.
date: 2026-11-25
tags: llm-serving, inference, performance
---
Serving large language models efficiently is rarely limited by raw FLOPs alone. In production, most GPUs sit memory-bandwidth bound during auto-regressive token generation, reading gigabytes of model weights for every single generated token. Batching multiple requests together amortizes those weight reads across many tokens at once—but traditional static batching breaks down when prompt and response lengths vary wildly.

Dynamic (and continuous) batching solves this by scheduling requests at the token iteration level rather than waiting for an entire batch to finish.

## Why static batching wastes GPU capacity

In standard deep learning inference (such as image classification), every input produces a fixed-size output in a single forward pass. Grouping 32 requests into one batch finishes all 32 simultaneously.

Auto-regressive LLM generation is fundamentally different:

- **Variable output lengths:** One user asks for a yes/no classification (5 tokens), while another requests a 600-token code review. With static batching, the 5-token request holds its slot and GPU KV cache idle until the 600-token request finishes.
- **Padding overhead:** Short prompts must be padded to match the longest prompt in the batch, wasting compute and memory bandwidth on dummy tokens.
- **Head-of-line blocking:** New requests arriving 10 milliseconds after a batch starts must sit in the queue for seconds until the entire running batch completes.

## Iteration-level scheduling (continuous batching)

Modern inference engines such as vLLM, TensorRT-LLM, and SGLang replace static batching with **iteration-level scheduling**, first popularized by Orca:

1. **Step-by-step execution:** Instead of treating an entire generation as one atomic job, the scheduler runs one forward pass at a time—producing one token per active sequence.
2. **Immediate slot reclamation:** The moment any sequence emits an end-of-sequence (`EOS`) token or reaches `max_tokens`, its KV-cache blocks are freed immediately.
3. **In-flight admission:** On the very next iteration, a waiting request from the queue is slotted into the active batch without waiting for other running sequences to finish.

```python
# Conceptual iteration-level scheduler loop
while active_sequences or waiting_queue:
    # 1. Admit new requests if KV-cache budget and max_batch_size allow
    while waiting_queue and has_kv_budget(waiting_queue[0]):
        seq = waiting_queue.popleft()
        active_sequences.append(seq)

    # 2. Run one batched forward pass (prefill new, decode active)
    next_tokens = model.step(active_sequences)

    # 3. Retire finished sequences immediately
    for seq, tok in zip(list(active_sequences), next_tokens):
        seq.append(tok)
        if tok == EOS_TOKEN or len(seq.output) >= seq.max_tokens:
            free_kv_blocks(seq)
            active_sequences.remove(seq)
```

## Managing prefill vs decode interference

Even with continuous batching, a subtle bottleneck appears when a long prompt (say, 16,000 tokens for a RAG context) enters the batch:

- **Prefill is compute-bound:** Processing 16,000 prompt tokens in one pass saturates tensor cores and can stall ongoing decode steps by hundreds of milliseconds, causing visible stuttering in streaming responses.
- **Chunked prefill:** Engines split long prefills into smaller chunks (for example, 512 or 1,024 tokens per iteration) and interleave them with active decode steps, keeping Time Per Output Token (TPOT) smooth.
- **Prefill-decode disaggregation:** At higher scale, teams route prefill requests to dedicated compute-heavy GPUs and stream the resulting KV cache over RDMA/NVLink to separate decode-optimized nodes.

## Tuning batch parameters for your SLA

Dynamic batching exposes a direct trade-off between **throughput** (tokens/sec) and **latency** (TPOT):

- **`max_num_batched_tokens`:** Caps total tokens processed in a single forward pass. Lower values protect interactive streaming latency; higher values maximize offline batch throughput.
- **`max_num_seqs`:** Limits concurrent active sequences. Ensure your GPU memory can hold the worst-case KV cache for this count without triggering frequent pre-emption/swapping.
- **Queue timeout & backpressure:** Pair dynamic batching with strict request timeouts and `429` backpressure when queue depth exceeds your Time-to-First-Token (TTFT) budget.

## Takeaway

Dynamic and continuous batching turn underutilized GPUs into high-throughput inference engines by eliminating padding waste and head-of-line blocking. Combined with chunked prefill and careful token-budget tuning, teams can serve 3x to 5x more concurrent users on the same hardware without sacrificing streaming responsiveness.
