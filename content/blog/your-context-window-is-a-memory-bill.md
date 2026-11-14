---
title: Your Context Window Is a Memory Bill
publishedAt: '2026-11-14'
summary: >-
  At 128k tokens, one user's KV cache outweighs the weights of an 8B model. I
  computed it from real configs, and grouped-query attention is why it isn't worse.
tags:
  - ai
  - llm
  - inference
draft: true
---

16 GiB. That's what one user's 128k-token paste costs in memory on Llama 3.1 8B, and the model's own weights are 15.0 GiB.

Picture this, and yes, it's made up, I haven't run it: one 80 GB GPU serving Llama 3.1 8B. The weights take about 16 GB, so 64 GB is free. Plenty, right? Then users start pasting codebases. Three fit. The fourth doesn't. Not the compute, the memory.

This is a sequel to [LLMs Don't Read Your Prompt. They Count It.](/blog/how-llms-process-text), which was about what a token is. This one is about what a token costs to keep around. I wrote a script that reads real `config.json` files and does the arithmetic.

**When you serve a long-context model yourself, the limit is mostly KV cache memory, not model weights. A handful of concurrent users at 128k outweigh the model, and grouped-query attention is the reason modern models can do long context at all.**

## The short version

- Llama 3.1 8B caches 128 KiB per token: 16 GiB for one user at 128k, against 15.0 GiB of weights.
- One 80 GB card holds 119 full-length users at 4k tokens and 3 at 128k.
- Grouped-query attention shrinks the cache 4x on the 8B and 8x on the 70B. Without it, one 128k user needs 64 GiB.
- Every number comes from a script in the repo, so you can rerun it.

## What is the KV cache, and why is it a bill?

When a model generates a token, every layer looks back at all the earlier tokens. Recomputing their keys and values each time would be absurdly slow, so the server computes them once and keeps them. That's the [KV cache](https://arxiv.org/abs/2309.06180). The formula is short:

```text
bytes per token = 2 x layers x kv_heads x head_dim x bytes per value
```

The 2 is one key and one value, and fp16 is 2 bytes a value. Everything else comes straight from `config.json`.

I checked it against a number I didn't produce. The PagedAttention paper says a 13B OPT model needs [800 KB per token](https://arxiv.org/abs/2309.06180): 2 x 5,120 x 40 x 2 bytes is 819,200. It matches.

Here's the part that gets expensive. The weights are paid once, however many people use the server. The cache is paid per user, and it scales with how much each person pasted.

## Does every model do this?

I ran six models with public configs: Llama 3.1 8B and 70B, Mistral 7B v0.3, two Qwen2.5 sizes, and Llama 2 7B as the old multi-head baseline. Each config is pinned to a commit, and the full table is in the [artifact README](https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-context-window-is-a-memory-bill). Weights are the parameter count from the Hugging Face API times 2 bytes.

The 7B and 8B models land in the same place. At 128k, one user costs 16 GiB on [Llama 3.1 8B](https://huggingface.co/unsloth/Meta-Llama-3.1-8B/blob/e9a141a2091ea561b96483212645a2a05e6f99fc/config.json) and [Mistral 7B v0.3](https://huggingface.co/mistralai/Mistral-7B-v0.3/blob/caa1feb0e54d415e2df31207e5f4e273e33509b1/config.json), which is 107% and 119% of their weights. [Qwen2.5 7B](https://huggingface.co/Qwen/Qwen2.5-7B/blob/d149729398750b98c0af14eb82c78cfe92750796/config.json) is the thrifty one at 7 GiB, 49%. Llama 2 7B, with no sharing, would need 64 GiB. That's 510%.

Add a second and a third user and the weights are the smaller line item.

![Horizontal bars for Llama 3.1 8B in GiB: weights stay at 15.0, while the KV cache for four users grows from 2.0 at 4,096 tokens to 16.0 at 32,768 and 64.0 at 131,072 tokens, highlighted as more than four times the weights](/images/blog/kv-cache-vs-weights.svg)

## How many users fit on one 80 GB card?

This decides your bill. I took [80 GB, the memory NVIDIA lists](https://www.nvidia.com/en-us/data-center/h100/) for the H100 SXM, subtracted the fp16 weights, and divided what's left by one full-length sequence:

| Model | 4k | 32k | 128k | 128k with kv_heads = attention heads |
| --- | --- | --- | --- | --- |
| Mistral 7B v0.3 | 122 | 15 | 3 | 0 |
| Qwen2.5 7B | 275 | 34 | 8 | 1 |
| Llama 3.1 8B | 119 | 14 | 3 | 0 |
| Llama 2 7B (no GQA to begin with) | 30 | 3 | 0 | 0 |

Llama 2 was trained for 4,096 tokens and Mistral's config says 32,768, so their longer rows are what-ifs.

From 4k to 128k, concurrency drops 34 to 41 times on the models with GQA. Same card, same model, same code. The only thing that changed is how much each person pasted.

The 70B models don't fit on one card at all: Llama 3.1 70B is 131.4 GiB of weights and Qwen2.5 72B is 135.4 GiB. On four cards (320 GB, treated as one pool, which real tensor parallelism only approximates) the script says 4 full 128k users and 16 at 32k. Without GQA it would be 0 and 2.

## Why does grouped-query attention matter so much?

Because it attacks the one term in the formula the model designers control: `kv_heads`.

In classic multi-head attention, every attention head has its own key and value head. Llama 2 7B has 32 of each. [Grouped-query attention](https://arxiv.org/abs/2305.13245) lets several query heads share one. Llama 3.1 8B has 32 query heads sharing 8 kv heads, so its cache is a quarter of the size. Qwen2.5 7B has 28 sharing 4, which is 7x smaller.

Without it, Llama 3.1 8B would need 64 GiB for one 128k user. The 70B would need 320 GiB. You couldn't serve that on one card, and barely on four.

The paper's own motivation is speed. Decoding is slow because the model [loads all the keys and values at every step](https://arxiv.org/abs/2305.13245), and fewer kv heads means less to load. My arithmetic: reading 16 GiB at the H100's [3.35 TB/s](https://www.nvidia.com/en-us/data-center/h100/) takes about 5 ms per generated token, before the weights.

So the 128k windows on model cards aren't free. They exist partly because somebody shrank the cache four to eight times first.

## Where I'd stop trusting this post

**The serving stack can buy a lot of this back, and I ran no inference.** This is configuration arithmetic, not a benchmark. [PagedAttention](https://arxiv.org/abs/2309.06180) found existing systems used only 20.4% to 38.2% of their KV memory for real token states, so my table is the ideal case paging gets you close to. An [fp8 KV cache](https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache/) halves the cache (I reran the script: 8 GiB per user and 7 users at 128k instead of 3), and [prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/) lets users share one copy of a common prompt. Use all of them and "per user" gets much cheaper. But they're discounts on the bill, not a different bill, and I didn't measure what fp8 does to answer quality.

**I didn't subtract the overhead.** The 80 GB goes to weights and cache only. Activations, the CUDA context, and the framework take their own share, so real concurrency is lower than my table. I don't know by how much.

**MLA breaks the formula.** DeepSeek's [multi-head latent attention](https://arxiv.org/abs/2405.04434) caches a compressed latent instead, and the paper reports a 93.3% smaller cache than its previous dense model. On a model like that, my `kv_heads` term doesn't apply.

**Hosted APIs hide this, but not entirely.** On [Google's Gemini pricing page](https://ai.google.dev/gemini-api/docs/pricing), checked 14 November 2026, Gemini 3.1 Pro Preview charges $2.00 per million input tokens up to 200k and $4.00 above it. [Anthropic's page](https://platform.claude.com/docs/en/about-claude/pricing), checked the same day, includes the full 1M window at standard rates on most models. So the memory bill can be passed on or absorbed. I can't see inside either provider, so I'm not claiming the tiers come from KV cache.

## The takeaway

If you self-host, size for the cache first. Take `config.json`, work out bytes per token, multiply by the longest context you allow and the users you expect, then add the weights. That's your memory floor. If the cache is the bigger term, you're running a cache with a model attached.

My rule of thumb, mine and not a law: if you can't say how many people will hit your longest context at once, cap the context before you buy the card.

What would change my mind is a measurement. I'd like to run this on a real GPU with vLLM and see where its numbers disagree with my table.
