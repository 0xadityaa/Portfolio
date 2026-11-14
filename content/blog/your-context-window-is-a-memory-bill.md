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

Here's a thought experiment, and I'm calling it that because I haven't run this on a real server. You have one 80 GB GPU and you want to serve Llama 3.1 8B. The weights are about 16 GB. That leaves 64 GB. Plenty, right?

Then a user pastes in a 128k-token codebase. Their conversation needs 16 GiB of memory on top of the weights. Three of them at once and the card is full. Not the compute. The memory.

I wanted to see how general that is, so I wrote a small script that reads each model's real `config.json` and does the arithmetic. This is a sequel to [LLMs Don't Read Your Prompt. They Count It.](/blog/how-llms-process-text), which was about what a token is. This one is about what a token costs to keep around.

My claim: **when you serve a long-context model yourself, the limit is mostly KV cache memory, not model weights. A handful of concurrent users at 128k outweigh the model, and grouped-query attention is the reason modern models can do long context at all.**

## The short version

- The KV cache is the saved key and value tensors for every token the model has already read. It grows with every token, for every user.
- Llama 3.1 8B needs 128 KiB of cache per token. At 128k tokens that is 16 GiB for one user, which is more than the model's 15.0 GiB of weights.
- Grouped-query attention cuts that by 4x for Llama 3.1 8B and 8x for the 70B and 72B models. Without it, one 128k user on the 8B would need 64 GiB.
- Past a few users, you're buying GPU memory for cache, not for the model. Every number below comes from the script in the repo, so you can rerun it.

## What is the KV cache, and why is it a bill?

When a model generates a token, every layer looks back at all the earlier tokens. Recomputing their keys and values each time would be absurdly slow, so the server computes them once and keeps them. That's the [KV cache](https://arxiv.org/abs/2309.06180).

It's an actual cost per token, and the formula is short:

```text
bytes per token = 2 x layers x kv_heads x head_dim x bytes per value
```

The 2 is one key and one value. With fp16, a value is 2 bytes. Every term except the last comes straight from the model's `config.json`.

I checked the formula against a number I didn't produce. The PagedAttention paper says a 13B OPT model needs [800 KB per token](https://arxiv.org/abs/2309.06180): 2 x 5,120 x 40 x 2 bytes. That's 819,200 bytes, and my arithmetic agrees.

The weights are a fixed cost. You pay them once, however many people use the server. The cache is a per-user cost that scales with how much each person pasted. That's why the same paper's picture of a 13B model on a 40 GB A100 shows about 65% of memory in weights and close to 30% in cache. The cache is the part that moves.

## What did the script find?

I picked six models whose configs are public and don't need a gated login: two Qwen2.5 sizes, Mistral 7B v0.3, Llama 3.1 8B and 70B, and Llama 2 7B as the old multi-head baseline. I pinned each config to a commit and saved the lot in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-context-window-is-a-memory-bill). Parameter counts come from the Hugging Face API for the same commits, and weights are parameters times 2 bytes.

Here is the cache for one full-length user, in GiB, with the 80 GB card's room left after weights:

| Model (config) | KV per token | 4k | 32k | 128k | One user at 128k vs weights |
| --- | --- | --- | --- | --- | --- |
| [Llama 2 7B](https://huggingface.co/NousResearch/Llama-2-7b-hf/blob/8efe6c9b93655b934e27bd9981e3ec13e55aee9d/config.json) (32 kv heads) | 512 KiB | 2.00 | 16.00 | 64.00 | 510% |
| [Mistral 7B v0.3](https://huggingface.co/mistralai/Mistral-7B-v0.3/blob/caa1feb0e54d415e2df31207e5f4e273e33509b1/config.json) (8) | 128 KiB | 0.50 | 4.00 | 16.00 | 119% |
| [Qwen2.5 7B](https://huggingface.co/Qwen/Qwen2.5-7B/blob/d149729398750b98c0af14eb82c78cfe92750796/config.json) (4) | 56 KiB | 0.22 | 1.75 | 7.00 | 49% |
| [Llama 3.1 8B](https://huggingface.co/unsloth/Meta-Llama-3.1-8B/blob/e9a141a2091ea561b96483212645a2a05e6f99fc/config.json) (8) | 128 KiB | 0.50 | 4.00 | 16.00 | 107% |
| [Llama 3.1 70B](https://huggingface.co/unsloth/Llama-3.1-70B/blob/99f146c778e0de3b687d83191faf41e49198f2ca/config.json) (8) | 320 KiB | 1.25 | 10.00 | 40.00 | 30% |
| [Qwen2.5 72B](https://huggingface.co/Qwen/Qwen2.5-72B/blob/efba10c8e54e91e0d9570ab5f7b51a958474d4cb/config.json) (8) | 320 KiB | 1.25 | 10.00 | 40.00 | 30% |

Two honest footnotes. Llama 2 7B was trained for 4,096 tokens, so its 32k and 128k rows are "what if", not something you could run. And Mistral 7B v0.3's config says 32,768, so its 128k row is the same kind of "what if".

The 7B and 8B rows are the surprise. At 128k, one user costs about as much memory as the model, or about half of it for Qwen2.5. Add a second and a third and the weights are the smaller line item.

Here's the same thing as a picture, for Llama 3.1 8B with four users:

![Horizontal bars for Llama 3.1 8B in GiB: weights stay at 15.0, while the KV cache for four users grows from 2.0 at 4,096 tokens to 16.0 at 32,768 and 64.0 at 131,072 tokens, highlighted as more than four times the weights](/images/blog/kv-cache-vs-weights.svg)

## How many users fit on one 80 GB card?

This is the question that decides your bill. I took [80 GB, the memory NVIDIA lists](https://www.nvidia.com/en-us/data-center/h100/) for the H100 SXM, subtracted the fp16 weights, and divided what's left by one full-length sequence:

| Model | 4k | 32k | 128k | 128k with kv_heads = attention heads |
| --- | --- | --- | --- | --- |
| Mistral 7B v0.3 | 122 | 15 | 3 | 0 |
| Qwen2.5 7B | 275 | 34 | 8 | 1 |
| Llama 3.1 8B | 119 | 14 | 3 | 0 |
| Llama 2 7B (no GQA to begin with) | 30 | 3 | 0 | 0 |

From 4k to 128k, concurrency drops by a factor of 34 to 41. Same card, same model, same code. The only thing that changed is how much each person pasted.

The 70B and 72B models don't fit at all: Llama 3.1 70B is 131.4 GiB of weights and Qwen2.5 72B is 135.4 GiB. On four cards (320 GB, and I'm treating it as one pool, which real tensor parallelism only approximates) the script says 4 full 128k users and 16 at 32k for both. Without GQA it would be 0 and 2.

## Why does grouped-query attention matter so much?

Because it attacks the one term in the formula the model designers control: `kv_heads`.

In classic multi-head attention, every attention head has its own key and value head. Llama 2 7B has 32 of each. [Grouped-query attention](https://arxiv.org/abs/2305.13245) lets several query heads share one key and value head. Llama 3.1 8B has 32 query heads sharing 8 kv heads, so the cache is a quarter of the size. Qwen2.5 7B has 28 query heads sharing 4, which is 7x smaller.

The last column of the table above is what the same models would need with `kv_heads` set to the attention head count. Llama 3.1 8B would need 512 KiB per token and 64 GiB for one 128k user. On the 70B it's 2,560 KiB per token and 320 GiB for one user. You couldn't serve that on a single card, and barely on four.

One caveat on the paper. Its motivation is speed: decoding is slow because the model [loads all the keys and values at every step](https://arxiv.org/abs/2305.13245), and fewer kv heads means less to load. Smaller memory is the same fact seen from the capacity side. My arithmetic for the speed side: reading 16 GiB of cache at the H100's [3.35 TB/s](https://www.nvidia.com/en-us/data-center/h100/) takes about 5 ms, for every token that user generates. That's a floor, before the weights.

So the 128k context windows on the model cards aren't free. They exist partly because somebody shrank the cache four to eight times first.

## Where I'd stop trusting this post

**The serving stack changes the picture, and I only measured arithmetic.** I ran no inference. This is configuration arithmetic, not a benchmark. Four things move the numbers, and each deserves its due:

- **PagedAttention** (the idea behind [vLLM](https://arxiv.org/abs/2309.06180)) fixes waste, not size. The paper found that existing systems used only 20.4% to 38.2% of their KV memory for real token states. My table is the ideal case that paging gets you close to. If you're on a system with contiguous pre-allocation, the real numbers are worse than mine.
- **KV cache quantization** halves it. I reran the script with one byte per value: Llama 3.1 8B at 128k drops to 8 GiB per user, and 7 users fit instead of 3. vLLM supports an [fp8 KV cache](https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache/). I didn't measure what that does to answer quality, and you should.
- **Prefix sharing** means users with the same long prompt can share one copy. vLLM's [automatic prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/) does this. If your 128k is a shared codebase, my "per user" cost is far too high. If every 128k is a different document, it isn't.
- **Offloading** can push cold cache to CPU memory. That trades GPU memory for latency.

The strongest objection is that this is all solved: use all four and the picture changes. Partly true. Fp8 plus prefix sharing could plausibly buy back most of what the long context costs. But they're discounts on the bill, not a different bill, and fp8 trades accuracy for it.

**I didn't subtract everything.** The 80 GB is spent on weights and cache only. Activations, the CUDA context, and the serving framework take their own share, so real concurrency is lower than my table says. I didn't measure how much.

**MLA breaks the formula.** DeepSeek's [multi-head latent attention](https://arxiv.org/abs/2405.04434) caches a compressed latent instead of keys and values per head, and that paper reports a 93.3% smaller cache against its previous dense model. If you serve a model like that, my `kv_heads` term doesn't apply, and the memory bill is much smaller.

**Hosted APIs hide this, but not entirely.** If you call an API, you never see a GPU. The cost shows up in the price list. On [Google's Gemini pricing page](https://ai.google.dev/gemini-api/docs/pricing), checked 14 November 2026, Gemini 3.1 Pro Preview charges $2.00 per million input tokens for prompts up to 200k and $4.00 above it. Anthropic's [pricing page](https://platform.claude.com/docs/en/about-claude/pricing), checked the same day, shows the opposite choice: most models include the full 1M window at standard rates, with one model priced higher above 100,000 tokens. So the memory bill can be passed on, flattened, or absorbed. It's a pricing decision. I'm not claiming a provider's tiers are caused by its KV cache. I can't see inside it.

## The takeaway

If you self-host, size for the cache first and the weights second. Take the model's `config.json`, work out bytes per token, multiply by the context you actually allow and the users you actually expect, and add that to the weights. That's your memory floor. If the cache term is bigger than the weights, you're running a cache with a model attached.

My rule of thumb, which is mine and not a law: if you can't say how many people will hit your longest context at once, cap the context before you buy the card. And what would change my mind is a measurement. I'd like to put this on a real GPU with vLLM and compare what it reports against my table, and I'll write it up if the numbers disagree.
