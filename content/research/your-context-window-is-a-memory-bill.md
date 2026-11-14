# Your Context Window Is a Memory Bill

- Topic issue: none (assigned in chat as part of the AI-engineering series; syllabus topic only, no lesson content used)
- Format: essay
- Thesis: when you serve a long-context model yourself, the limit is mostly KV cache memory, not model weights. A handful of concurrent users at 128k tokens outweigh the model, and grouped-query attention is why modern models can serve long context at all.
- Reader: an engineer who calls LLM APIs and has heard "128k context", but has not sized a GPU for one. Has read the earlier post on tokens.

## What this adds

Prior art on the same subject:

- The PagedAttention paper, https://arxiv.org/abs/2309.06180 (section 2 gives the 800 KB/token OPT-13B figure and the 65% / 30% memory split).
- The GQA paper, https://arxiv.org/abs/2305.13245 (framed around decode speed and memory bandwidth).
- vLLM's own docs on fp8 KV cache and prefix caching, https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache/ and https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/.

What this post adds: the formula applied to six real, pinned `config.json` files, so the reader sees the cache against the weights at 4k, 32k and 128k, how many users fit on one 80 GB card, and what the same models would cost with one KV head per query head. Reproducible with the standard library in a second.

## Artifact

`content/research/your-context-window-is-a-memory-bill/`: `fetch.py`, `kv_cache.py`, pinned `configs/`, three raw outputs, README with commands.

Expectation, written before running: Llama 3.1 8B has 32 layers, 8 kv heads, head_dim 128, so 2 x 32 x 8 x 128 x 2 = 131,072 bytes (128 KiB) per token. At 128k tokens that is 16 GiB, about the size of the fp16 weights (~15 GiB). Without GQA it would be 4x, 64 GiB. For the 70B (80 layers, 8 kv heads) I expected 320 KiB per token. I expected the thesis to hold at 128k for 7B and 8B models, and be weaker at 4k.

Commands (from the artifact folder, Python 3.12.8, macOS, standard library only; no virtualenv needed):

```bash
python3 fetch.py
python3 kv_cache.py > output-1gpu.txt
python3 kv_cache.py --gpus 4 > output-4gpu.txt
python3 kv_cache.py --bytes 1 > output-fp8-kv-1gpu.txt
```

Environment: no GPU involved. The script reads configs and does arithmetic. Configs and parameter counts fetched 2026-11-14 at pinned commits (see the artifact README).

Raw output: `output-1gpu.txt`, `output-4gpu.txt`, `output-fp8-kv-1gpu.txt` in the artifact folder. The main run, abridged to the lines the post uses:

```text
Llama-3.1-8B  (8.03B params, weights 15.0 GiB)
  layers=32 attention_heads=32 kv_heads=8 head_dim=128
  KV per token: 128.0 KiB with 8 kv heads; 512.0 KiB if kv_heads = 32 (4x)
     4,096 |  0.50 GiB |   3% |  119 | 2.00 GiB  | 29
    32,768 |  4.00 GiB |  27% |   14 | 16.00 GiB | 3
   131,072 | 16.00 GiB | 107% |    3 | 64.00 GiB | 0
Qwen2.5-7B: 56.0 KiB/token, 128k = 7.00 GiB (49% of weights), 8 users fit; no GQA 392 KiB, 49.00 GiB, 1 user
Mistral-7B-v0.3: 128.0 KiB/token, 128k = 16.00 GiB (119%), 3 users fit; no GQA 0
Llama-2-7B (MHA): 512.0 KiB/token, 4k = 2.00 GiB, 30 users fit at 4k
Qwen2.5-72B / Llama-3.1-70B: 320.0 KiB/token (2560.0 without GQA); weights 135.4 / 131.4 GiB, no room on one 80 GB card
4 GPUs pooled: both 70B-class models fit 133/130 at 4k, 16 at 32k, 4 at 128k; without GQA 16, 2, 0
fp8 KV (1 byte), Llama-3.1-8B: 128k = 8.00 GiB per user, 7 fit
```

Did the expectation hold? Per-token numbers and the 4x/8x GQA ratios matched exactly. The thesis held at 128k for every 7B and 8B model (one user is 49% to 119% of the weights) and fails at 4k (0.22 to 0.50 GiB per user; 119 to 275 users fit). "A handful" at 128k: three Qwen2.5-7B users already exceed the weights, and four 72B users do. The formula also reproduces the PagedAttention paper's 800 KB/token for OPT-13B by hand (2 x 5120 x 40 x 2 = 819,200 bytes), which I did not add as a script row.

Limits of the artifact: sizes only, no inference run, no activation or framework overhead subtracted, multi-GPU numbers pool memory.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| KV bytes per token = 2 x layers x kv_heads x head_dim x bytes | derived; matches OPT-13B 800 KB/token in https://arxiv.org/abs/2309.06180 | 1 | 2026-11-14 |
| 13B model on A100 40GB: ~65% weights, ~30% KV | https://arxiv.org/abs/2309.06180 (Fig. 1, intro) | 1 | 2026-11-14 |
| Existing systems used only 20.4% to 38.2% of KV memory for token states | https://arxiv.org/abs/2309.06180 | 1 | 2026-11-14 |
| GQA shares one KV head across a group of query heads; motivated by decode memory bandwidth | https://arxiv.org/abs/2305.13245 | 1 | 2026-11-14 |
| Layers, kv heads, head_dim, hidden_size per model | pinned config.json URLs in the artifact README | 1 | 2026-11-14 |
| Parameter counts (7.25B Mistral ... 72.7B Qwen) | Hugging Face API `safetensors.total` at the same commits, stored in `configs/params.json` | 1 | 2026-11-14 |
| H100 SXM: 80 GB memory, 3.35 TB/s bandwidth | https://www.nvidia.com/en-us/data-center/h100/ | 1 | 2026-11-14 |
| 16 GiB read at 3.35 TB/s is about 5 ms | my arithmetic (17.18e9 B / 3.35e12 B/s = 5.1 ms), a floor, one sequence | derived | 2026-11-14 |
| Counter: vLLM supports fp8 KV cache | https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache/ | 1 | 2026-11-14 |
| Counter: vLLM automatic prefix caching shares prefixes | https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/ | 1 | 2026-11-14 |
| Counter: MLA cuts KV cache 93.3% vs DeepSeek 67B | https://arxiv.org/abs/2405.04434 (abstract) | 1 | 2026-11-14 |
| Gemini 3.1 Pro Preview input $2.00 per 1M tokens up to 200k prompt, $4.00 above | https://ai.google.dev/gemini-api/docs/pricing (read from page text, Standard tab; the model name comes from the section heading) | 1 | 2026-11-14 |
| Anthropic: most models include the full 1M window at standard rates; one model priced higher above 100k | https://platform.claude.com/docs/en/about-claude/pricing | 1 | 2026-11-14 |
| OpenAI pricing page | https://openai.com/api/pricing/ returned 403 to my fetch; not used | n/a | 2026-11-14 |
| The Llama mirrors (unsloth, NousResearch) carry Meta's architecture fields | my reading of the config files; Meta repos are gated | 3 | 2026-11-14 |

Twelve of the fifteen rows cite a primary source (tier 1); one is derived from the artifact, one is a source I could not open, and one is tier 3 (the mirror note).

## Counter-argument

Steelman: this is a solved or shrinking problem. PagedAttention removes fragmentation (existing systems wasted 60% to 80% of KV memory), fp8 KV halves the cache, prefix caching shares a common prompt across users, offloading spills cold cache to CPU, and MLA models cache a compressed latent. Hosted APIs hide the whole thing, and at least one provider flattened its long-context pricing.

The post says: all true, and none of them changes the formula. They discount the bill. My table is the ideal-paging case, so it is optimistic on fragmentation and pessimistic on sharing. The advice stops applying where the serving stack shares prefixes heavily, where the model uses MLA, where memory other than weights and cache (activations, CUDA context, framework overhead) matters, and when you call a hosted API. I measured none of the quantization quality impact, and I ran no inference.

Pricing: Gemini 3.1 Pro Preview shows a tier at 200k; Anthropic shows mostly flat pricing with one model tiered at 100k. I make no causal claim from either price list to KV memory.

## From Aditya

Nothing. The post uses no first-person past-tense experience. It says "I calculated" and "I ran" only for the artifact, and labels the opening as a thought experiment.

## Outline

1. Opening: labelled thought experiment (one 80 GB GPU, Llama 3.1 8B, a 128k paste). Thesis. Link to the earlier tokens post.
2. The short version.
3. What is the KV cache, and why is it a bill? Formula, OPT-13B cross-check, weights fixed vs cache per user.
4. What did the script find? Table of six models. Diagram: `public/images/blog/kv-cache-vs-weights.svg`, Llama 3.1 8B weights vs cache for four users at three lengths, the 128k bar in accent (carries the thesis).
5. How many users fit on one 80 GB card? Second table, and 70B/72B on four pooled cards.
6. Why does GQA matter so much? kv_heads term, no-GQA column, the paper's speed framing, the 5 ms arithmetic.
7. Where I'd stop trusting this post: PagedAttention, fp8, prefix sharing, offloading, overhead, MLA, hosted pricing with dates.
8. The takeaway: size cache first, rule of thumb (cap context before buying the card), what I would measure next (vLLM on real hardware).

Self-check against `docs/blog/style.md`, where each of the six things is in the post:

1. Thesis in first 150 words: the bold sentence ("when you serve a long-context model yourself, the limit is mostly KV cache memory...") in the opening, after the thought experiment.
2. Artifact: `kv_cache.py` with pinned configs, linked in "What did the script find?", with two tables and the SVG.
3. Numbers with sources and dates: tables come from the artifact output; the paper figures link arXiv 2309.06180; the H100 figures link NVIDIA's page; pricing is dated 14 November 2026 in the limits section. A cost post would show three volumes; here the three context lengths (4k, 32k, 128k) play that role.
4. Links as evidence trail: more than ten external links in about 1,900 words (arXiv papers, configs, NVIDIA, vLLM docs, pricing pages).
5. Limits: "Where I'd stop trusting this post" states the strongest objection (it's solved by paging, fp8, prefix sharing), links vLLM and DeepSeek, says where the advice stops, and says what I did not test (inference, quantization quality, overhead).
6. Ending that adds: the decision rule (size cache first, cap the context before buying the card) and what would change my mind (a real vLLM measurement).

## Open questions

- Has Aditya served a model himself (vLLM or similar) at long context? If so, a real "what I saw" line and a measured memory number against my table would strengthen the post. I invented none, so the opening is a labelled thought experiment.
- Does he want the sequel (measure on a real GPU) promised in the last paragraph? It is a commitment in his name.
- The Gemini model name is taken from the page section heading near the pricing numbers; recheck the rendered page before publishing, as prices and previews change.
- Is the title acceptable? "Your Context Window Is a Memory Bill" is 36 characters.
- The scheduled publish date: the frontmatter has `publishedAt: '2026-11-14'` as a placeholder, to be set at `/publish`.

## Left out

- Paged-block overhead and block-size effects on real capacity.
- Sliding-window attention (Mistral 7B v0.1 style) and hybrid local/global layers, which also shrink the cache.
- Tensor-parallel replication of KV heads when `tp > kv_heads`.
- Speculative decoding and chunked prefill interactions with memory.
- Cost per user: GPU hourly price divided by concurrent users, at three volumes. A good follow-up once there is a live price to cite.
