---
title: 'What Does Context Really Cost?'
publishedAt: '2026-11-26T23:24:51.429Z'
updated: '2026-11-27'
summary: >-
  One 128k-token paste eats 16 GiB of GPU memory on Llama 3.1 8B, more than the
  15.0 GiB model itself. Real configs show how many users fit, and why.
tags:
  - ai
  - llm
  - inference
---

Here is a number I did not expect: if one user pastes a 128k-token prompt into Llama 3.1 8B, that single request eats **16 GiB of GPU memory**. The entire Llama 3.1 8B model only weighs **15.0 GiB**.

One person pasting a codebase takes more VRAM than the network itself.

Try a thought experiment (I haven't run it on a real GPU, it's config arithmetic). Suppose you rent an 80 GB H100 to self-host Llama 3.1 8B. That card has 74.5 GiB, because 80 GB is decimal. You load the weights, see 15.0 GiB used and about 59.5 GiB free, and think you have headroom. Then users start pasting 128k-token repos at 16 GiB each. Users 1, 2 and 3 fit, using 48 GiB and leaving about 11.5. User 4 needs 16, and you get an out-of-memory error. You didn't run out of compute. You ran out of memory.

In [How Do LLMs Read Text?](/blog/how-llms-process-text), I broke down what a token is. This is the sequel about what a token costs to *keep alive* in GPU memory. I wrote [a script](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/kv_cache.py) that reads real Hugging Face `config.json` files and does the VRAM arithmetic.

**When you self-host a long-context model, KV cache memory, not model weights, caps your concurrency. A handful of 128k users outweighs the whole model, and grouped-query attention is the main reason long context is affordable at all.**

## The short version

- Llama 3.1 8B burns 128 KiB of KV cache per token. At 128k tokens, that's 16 GiB for a single user, compared to 15.0 GiB for the model weights.
- On one 80 GB card, that math fits 119 concurrent users at 4k tokens, and only 3 users at 128k.
- Grouped-query attention (GQA) shrinks the cache 4x on Llama 3.1 8B and 8x on the 70B. Without GQA, a single 128k user would need 64 GiB.
- Every figure below comes from [`kv_cache.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/kv_cache.py), and the raw output is in [`output-1gpu.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/output-1gpu.txt).

## What is the KV cache, and why does it eat my GPU?

Think of the [KV cache](https://arxiv.org/abs/2309.06180) as the model's scratchpad of everything it has already read in the current conversation. Every time a transformer generates the next token, every layer has to attend back to all the previous tokens. Recomputing the attention keys and values for the entire prompt on every single output token would be slow, so inference servers compute them once and keep them in VRAM.

The memory formula for one token is short:

```text
bytes per token = 2 x layers x kv_heads x head_dim x bytes per value
```

The `2` is for one key and one value vector, and fp16 uses `2` bytes per number. Every other variable sits right inside the model's `config.json`.

To check the formula, I compared it with a published number. The PagedAttention paper reports that a 13B OPT model uses [800 KB per token](https://arxiv.org/abs/2309.06180). Plug OPT-13B into the line above (`2 x 40 layers x 5,120 hidden x 2 bytes`) and you get `819,200` bytes, which is 800 KiB. Exact match.

The catch: **you pay for the model weights once, no matter how many users show up. You pay for the KV cache per user, multiplied by how much text each person pasted.**

## How bad is it across real models?

I pulled pinned `config.json` files for six popular open models: Llama 3.1 8B and 70B, Mistral 7B v0.3, two Qwen2.5 sizes, and Llama 2 7B as an older pre-GQA baseline. The pinned configs are in [`configs/`](https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-context-window-is-a-memory-bill/configs), fetched by [`fetch.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/fetch.py), and the full breakdown is in the [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/README.md).

At 128k tokens, one single user takes 16 GiB on both [Llama 3.1 8B](https://huggingface.co/unsloth/Meta-Llama-3.1-8B/blob/e9a141a2091ea561b96483212645a2a05e6f99fc/config.json) (107% of its weights) and [Mistral 7B v0.3](https://huggingface.co/mistralai/Mistral-7B-v0.3/blob/caa1feb0e54d415e2df31207e5f4e273e33509b1/config.json) (119% of its weights). [Qwen2.5 7B](https://huggingface.co/Qwen/Qwen2.5-7B/blob/d149729398750b98c0af14eb82c78cfe92750796/config.json) needs 7 GiB (49%). Llama 2 7B, which has no KV head sharing, would need 64 GiB for one 128k user: 510% of the model.

The same numbers as a GPU memory floorplan:

![One bar of GPU memory on an 80 GB card, 74.5 GiB: 15.0 GiB of Llama 3.1 8B weights, then four 128k-token users at 16 GiB each, with user 4 running past the limit](/images/blog/kv-cache-vs-weights.svg "80 GB is 74.5 GiB. Llama 3.1 8B in fp16, 128k tokens per user, from [`output-1gpu.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/output-1gpu.txt).")

The model is the small block on the left. Four long-context users overflow the 80 GB card.

## How many concurrent users actually fit on an 80 GB H100?

I took [80 GB from NVIDIA's H100 SXM spec](https://www.nvidia.com/en-us/data-center/h100/), subtracted the fp16 weights, and divided what was left by the KV cache of one full-length sequence. This is the table from [`output-1gpu.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/output-1gpu.txt):

| Model | 4k | 32k | 128k | 128k with kv_heads = attention heads |
| --- | --- | --- | --- | --- |
| Mistral 7B v0.3 | 122 | 15 | 3 | 0 |
| Qwen2.5 7B | 275 | 34 | 8 | 1 |
| Llama 3.1 8B | 119 | 14 | 3 | 0 |
| Llama 2 7B (no GQA to begin with) | 30 | 3 | 0 | 0 |

(Quick note: Llama 2 was trained for 4k context and Mistral's config lists 32k, so their longer columns are hypothetical what-ifs.)

Going from 4k to 128k tokens cuts concurrency by 34x to 41x on the same GPU, model and server code. The only variable is how much text each person pastes.

Scale up to 70B models and one card won't even hold the weights (Llama 3.1 70B is 131.4 GiB; Qwen2.5 72B is 135.4 GiB). Spread across four 80 GB cards (320 GB pooled, ignoring tensor-parallelism overhead, see [`output-4gpu.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/output-4gpu.txt)), the math gives you 4 full 128k users and 16 at 32k. Without GQA, that drops to 0 and 2.

## Grouped-query attention (GQA)

So how do modern models offer 128k windows without a GPU per user? Look back at the formula: `kv_heads` is the lever model designers pulled.

In classic multi-head attention, every query head has its own key and value head (Llama 2 7B has 32 of each). [Grouped-query attention](https://arxiv.org/abs/2305.13245) lets a group of query heads share one KV head. Llama 3.1 8B funnels 32 query heads into 8 shared KV heads, cutting its KV cache to one quarter. Qwen2.5 7B funnels 28 query heads into just 4 KV heads, making its cache 7x smaller.

Without GQA, a single 128k user on Llama 3.1 8B would need 64 GiB, and on the 70B model would need 320 GiB. You couldn't serve one user on one card.

![Two bars for one 128k-token user on Llama 3.1 8B: 64 GiB with 32 key-value heads, 16 GiB with the shipped 8, 4 times smaller](/images/blog/gqa-kv-per-user.svg "KV cache for one 128k-token user, fp16, from [`output-1gpu.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/output-1gpu.txt).")

It's about speed too. Decoding is memory-bandwidth bound because the GPU has to [read the entire KV cache on every generated token](https://arxiv.org/abs/2305.13245). On an H100 pushing [3.35 TB/s](https://www.nvidia.com/en-us/data-center/h100/), just streaming 16 GiB of KV cache takes roughly 5 milliseconds per token before you even touch the weights. Fewer KV heads mean less data to haul across memory every step.

## Where I'd stop trusting this post

**Modern serving engines win a lot of this back, and I didn't run live inference.** This is clean `config.json` arithmetic, not a vLLM benchmark. In the [PagedAttention paper](https://arxiv.org/abs/2309.06180), older serving stacks used only 20.4% to 38.2% of their KV memory for actual token states, so my table is the best case that paging gets you near. On top of that, quantizing to an [fp8 KV cache](https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache/) halves the cache (I reran my script, [`output-fp8-kv-1gpu.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-context-window-is-a-memory-bill/output-fp8-kv-1gpu.txt): 8 GiB per user and 7 concurrent 128k users instead of 3), and [prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/) lets users share one copy of a common system prompt. Those tricks shrink the bill. I didn't test what fp8 does to output quality.

**I ignored framework overhead.** My 80 GB math assumes every byte goes to weights and KV cache. Real GPUs also hold activations, CUDA context, and framework buffers, so true concurrency will be slightly lower than my table.

**Newer architectures break this formula.** DeepSeek's [multi-head latent attention (MLA)](https://arxiv.org/abs/2405.04434) compresses keys and values into a tiny latent vector, reporting a 93.3% smaller KV cache than its prior dense model. On an MLA model, my `kv_heads` formula doesn't apply.

**Hosted APIs hide the GPU, though pricing hints at it.** Checking [Google's Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) on 14 November 2026, Gemini 3.1 Pro Preview doubles input pricing from $2.00 to $4.00 per million tokens past 200k context. Meanwhile [Anthropic's pricing page](https://platform.claude.com/docs/en/about-claude/pricing) (checked the same day) keeps the full 1M window at standard rates on most models. Providers either price the extra memory in or absorb it, and since I can't peek inside their infrastructure, I'm not claiming pricing tiers map 1-to-1 to KV cache.

## The takeaway

If you ever size GPUs to self-host an LLM, flip your intuition upside down: **size for the KV cache first, and add the model weights second.** Open `config.json`, compute bytes per token, multiply by your max allowed context and peak concurrent users, and then tack on the weights. If the cache dwarfs the weights, you're hosting a giant cache with a model bolted on.

And if you don't know how many users will paste giant documents at the same time, cap your max context length before you rent the GPU. If someone runs vLLM on a real H100 and gets numbers miles away from my table, I'd like to see it. Until then, treat this as back-of-the-envelope math.
