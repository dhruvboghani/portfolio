---
title: Distributed model inference with vLLM and Ray
description: Scaling LLM serving with vLLM and Ray: tensor parallelism, PagedAttention memory optimization, continuous batching, and distributed worker management.
date: 2026-11-24
tags: vllm, distributed-systems, inference
---
Serving 70B+ parameter language models or handling thousands of concurrent user queries pushes single-GPU infrastructure past its physical memory and throughput limits. Splitting weights across multiple GPUs and distributing requests across clusters is mandatory for production LLM systems.

Combining vLLM's memory-efficient inference engine with Ray's distributed actor orchestration provides a robust, high-throughput platform for enterprise LLM serving.

## The core bottlenecks in high-throughput LLM serving

Serving language models at scale presents distinct engineering challenges compared to traditional stateless microservices:

- **VRAM capacity limits:** A 70B parameter model in FP16 precision requires approximately 140GB of memory just to hold weights, necessitating multi-GPU tensor parallelism across devices like NVIDIA A100s or H100s.
- **KV cache memory fragmentation:** During generation, keys and values for preceding tokens must be cached in GPU memory. Standard sequential memory allocation causes severe fragmentation, wasting up to 60% of available VRAM.
- **Dynamic request lengths:** Users submit unpredictable prompt lengths and expect varying output sizes. Static batching forces fast requests to wait for the slowest generation to complete, wasting GPU compute cycles.

vLLM addresses memory fragmentation and batching bottlenecks, while Ray manages inter-node cluster orchestration and worker lifecycles.

## PagedAttention and continuous batching in vLLM

vLLM introduced two foundational innovations that increased LLM serving throughput by 2x to 4x over earlier frameworks:

- **PagedAttention:** Inspired by virtual memory paging in operating systems, PagedAttention stores KV-cache values in non-contiguous physical memory blocks. This eliminates external fragmentation, allowing the engine to pack significantly more concurrent requests into available VRAM.
- **Continuous (iteration-level) batching:** Instead of waiting for an entire batch of requests to finish, vLLM dynamically inserts newly arrived queries into the current generation iteration as soon as any existing request finishes generating.

```python
from vllm import LLM, SamplingParams

sampling_params = SamplingParams(temperature=0.7, top_p=0.95, max_tokens=256)

# Tensor parallelism across 4 local GPUs with continuous batching
llm = LLM(
    model="meta-llama/Llama-3.3-70B-Instruct",
    tensor_parallel_size=4,
    gpu_memory_utilization=0.90,
    max_num_seqs=256
)

prompts = ["Explain distributed consensus algorithms in streaming pipelines."]
outputs = llm.generate(prompts, sampling_params)
```

## Scaling across nodes with Ray

While tensor parallelism splits layers across GPUs within a single node over NVLink, scaling throughput across multiple servers requires distributed worker orchestration.

Ray acts as the distributed computing backbone for vLLM:

- **Multi-node tensor and pipeline parallelism:** Ray coordinates GPU workers across separate physical host machines, managing inter-process communication and synchronized weight distribution.
- **Dynamic replica autoscaling:** Ray Serve allows you to deploy multiple vLLM engine replicas, automatically distributing incoming HTTP requests and scaling worker pools up or down based on queue depth and latency thresholds.
- **Fault detection and recovery:** If a GPU worker fails or encounters a CUDA out-of-memory error, Ray detects the unhealthy actor, restarts the worker process, and reschedules pending requests without bringing down the entire cluster.

```python
import ray
from ray import serve
from vllm.engine.async_llm_engine import AsyncLLMEngine
from vllm.engine.arg_utils import AsyncEngineArgs

@serve.deployment(num_replicas=2, ray_actor_options={"num_gpus": 4})
class DistributedLLMDeployment:
    def __init__(self):
        engine_args = AsyncEngineArgs(
            model="meta-llama/Llama-3.3-70B-Instruct",
            tensor_parallel_size=4
        )
        self.engine = AsyncLLMEngine.from_engine_args(engine_args)

    async def __call__(self, request):
        json_data = await request.json()
        prompt = json_data["prompt"]
        # Stream or return generated tokens asynchronously
        return await self.engine.generate(prompt, json_data.get("params"))
```

## Production monitoring and optimization

Operating distributed inference clusters requires tracking GPU and engine metrics:

- **Time to First Token (TTFT) vs Time Per Output Token (TPOT):** TTFT measures prefill phase latency, while TPOT measures auto-regressive generation speed. High TTFT indicates queuing or heavy prompt lengths; high TPOT indicates GPU compute or memory bandwidth saturation.
- **KV cache usage percentage:** Monitor the percentage of allocated PagedAttention memory blocks. If usage approaches 100%, incoming requests will be queued or pre-empted.
- **Speculative decoding:** Pair large target models with small draft models (such as an 8B draft for a 70B model) to generate multiple candidate tokens per step, cutting generation latency by up to 40% on standard workloads.

## Takeaway

High-throughput enterprise LLM inference requires eliminating memory waste and orchestrating distributed compute. By combining vLLM's PagedAttention and continuous batching with Ray's scalable multi-GPU actor cluster management, engineering teams can serve massive models reliably under heavy production workloads.
