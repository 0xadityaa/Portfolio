---
title: What 4-Bit Quantization Actually Costs You
publishedAt: '2026-11-14'
summary: >-
  4-bit weights cut memory by 64% to 72% on 8B to 70B models. I rounded a small model to 4 bits and found the damage lands on 1% of its input channels.
tags:
  - ai
  - llm
  - inference
  - quantization
draft: true
---

Perplexity 17 to 10,816,108. That's what four bits did to a small model when I rounded its weights the lazy way.

On 14 November 2026 I took Qwen2.5-0.5B and rounded every weight in its transformer blocks to the nearest 4-bit step. No calibration, no tricks. With one scale for each whole matrix, the weights were off by 69% and the model was wrecked. With one scale for every 128 weights, the same four bits cost 19%.

That gap is the post. It's a sequel to [Your Context Window Is a Memory Bill](/blog/your-context-window-is-a-memory-bill), which sized the KV cache. This one sizes the weights.

**4-bit weights are close to a free lunch on memory, but the quality bill isn't zero and it isn't spread evenly: a few input channels take much of the damage. Size the model to the card first, then check quality on your own task.**

## The short version

- Int4 with groups of 128 shrinks an 8B to 70B model's weights by 64% to 72%, not 75%.
- A 70B at int4 fits a 48 GB card, with room for about 18k tokens of KV cache for one user.
- On my 0.5B model, int8 cost 0.1% perplexity and int4 with groups of 128 cost 19%.
- 1% of input channels carry about 38% of the error that reaches the output.

## How much memory does 4-bit save?

Less than the headline. Four bits is a quarter of sixteen, so you'd expect 75%. Two things eat into it.

Each group of 128 weights stores a 16-bit scale and a zero point at the weight width, the layout [GPTQ](https://arxiv.org/abs/2210.17323) describes. That makes 4.16 bits per weight for int4. And I assumed the token embeddings and output head stay in fp16, which is 13% of Llama 3.1 8B.

I counted the linear-layer parameters from four real `config.json` files and added the rest at fp16. Sizes are GiB, and the script is [in the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/what-4-bit-quantization-actually-costs).

| Model | fp16 | int8 g128 | int4 g128 | Saved at int4 |
| --- | --- | --- | --- | --- |
| [Llama 3.1 8B](https://huggingface.co/unsloth/Meta-Llama-3.1-8B/blob/e9a141a2091ea561b96483212645a2a05e6f99fc/config.json) | 15.0 | 8.6 | 5.3 | 64% |
| [Qwen2.5 14B](https://huggingface.co/Qwen/Qwen2.5-14B/blob/97e1e76335b7017d8f67c08a19d103c0504298c9/config.json) | 27.5 | 15.5 | 9.3 | 66% |
| [Qwen2.5 32B](https://huggingface.co/Qwen/Qwen2.5-32B/blob/1818d35814b8319459f4bd55ed1ac8709630f003/config.json) | 61.0 | 32.6 | 18.0 | 71% |
| [Llama 3.1 70B](https://huggingface.co/unsloth/Llama-3.1-70B/blob/99f146c778e0de3b687d83191faf41e49198f2ca/config.json) | 131.4 | 69.2 | 37.0 | 72% |

Savings grow with size because the fp16 embeddings shrink as a share.

![Horizontal bars of weight memory in GiB at fp16, int8 and int4 for four models, with dashed lines for 24, 48 and 80 GB cards; Llama 3.1 70B at int4 is 37.0 GiB, highlighted, and fits a 48 GB card](/images/blog/weight-memory-vs-cards.svg)

## Does it fit on a card?

It loads. Whether it serves is another question.

I reserved 2 GiB for activations and overhead (my assumption, not a measurement) and gave the rest to an fp16 KV cache. The cards are the sizes NVIDIA lists, checked 14 November 2026: [24 GB on the RTX 4090](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/), [48 GB on the L40S](https://www.nvidia.com/en-us/data-center/l40s/), [80 GB on the H100](https://www.nvidia.com/en-us/data-center/h100/).

A 32B model at int4 fits the 24 GB card, but the 2.4 GiB left holds about 10k tokens of cache for one user. A 70B at int4 fits the 48 GB card the same way: 5.7 GiB left, about 18k tokens, one user. At int8 the 70B only fits the 80 GB card, with 3.3 GiB to spare.

Those counts assume a user at full 32k tokens, so shorter contexts look better. The full card-by-card table is in the artifact README. Weight-only quantization doesn't touch the KV cache, so the per-token sizes are the last post's.

## What did rounding break?

I wrote down what I expected in `EXPECTATION.txt` before running anything, and some of it was wrong. This is plain round-to-nearest on all 168 matrices in the 24 blocks, on CPU, with the scale chosen per matrix, per output row, or per 128 weights. Weight error is the size of the rounding error divided by the size of the weights. Output error is how far each matrix's output moves on 2,048 tokens of WikiText-2 training text. Perplexity uses eight 1,024-token windows of the test split.

| Scheme | Weight error | Output error | Perplexity |
| --- | --- | --- | --- |
| fp32 baseline | 0 | 0 | 17.17 |
| int8 per-tensor | 4.73% | 3.51% | 17.75 (+3.4%) |
| int8 per-channel | 0.91% | 0.64% | 17.19 (+0.1%) |
| int8 g128 | 0.64% | 0.49% | 17.18 (+0.1%) |
| int4 per-tensor | 69.40% | 50.68% | 10,816,108 |
| int4 per-channel | 15.35% | 10.79% | 31.76 (+85.0%) |
| int4 g128 | 10.79% | 8.21% | 20.49 (+19.4%) |
| int4 per-tensor, top 1% weights kept exact | 10.84% | 8.21% | 20.89 (+21.7%) |

Three things stand out.

**Going from 8 to 4 bits costs 17x the error, not 2x.** Int8 g128 is 0.64% and int4 g128 is 10.79%, about the ratio of 255 steps to 15.

**Granularity barely matters at 8 bits and decides everything at 4.** At int8 the three choices sit within 3.4% of each other. At int4 they run from 20 to ten million.

**I was wrong about the big weights.** I expected the top 1% by magnitude to carry 5% to 15% of the squared error. They carry 1.07% per-tensor and 2.19% at g128. Rounding error is about the same size for every weight.

So why does per-tensor fail? Because the big weights set the step size. The largest weights are 6.5 to 24 times the root-mean-square, and they stretch the range, so every other weight gets a coarse grid. The last table row shows it: keep the top 1% exact, pick the range from the rest, and per-tensor int4 falls from 69.4% error to 10.8%. (The storage for those values and their indices isn't counted.)

## Which weights matter, then?

Weight size is the wrong ruler. What a weight does depends on what multiplies it, and some input channels carry far bigger activations. [LLM.int8()](https://arxiv.org/abs/2208.07339) found that from about 6.7B parameters, a tiny set of feature dimensions (about 0.1%) get huge values, and the authors keep those in 16-bit.

[AWQ](https://arxiv.org/abs/2306.00978) turns that into a test. Its Table 1 keeps 1% of weights in fp16 on OPT-6.7B at 3 bits. Perplexity is 10.86 in fp16 and 23.54 with round-to-nearest. Keep the 1% chosen by activation and it's 11.39. Choose by weight magnitude and it's 22.37. Choose at random and it's 24.23. Same count, different result.

My version on Qwen: take the 1% of input channels with the largest mean squared activation in each matrix, and ask how much of the activation-weighted rounding error sits there. At int4 it's 30.4% per-tensor, 38.6% per-channel and 38.4% at g128. It ignores cross terms between channels, so it's an estimate. One percent of the channels, about 38% of the error. That's the gap AWQ and GPTQ go after, and GPTQ does it by compensating for rounding error with second-order information.

My keep-1% test was less clean than AWQ's. At int4 g128, keeping the top 1% of channels by activation took output error from 8.21% to 6.42%. Weight magnitude gave 6.82% and random channels gave 8.16%. The random control matches AWQ's story. The magnitude arm lands close, probably because removing the largest weight from a group also shrinks its range. Supported, not settled.

## What does it cost on bigger models?

Less, and more erratically. The GPTQ paper's Table 3 has the same comparison across OPT sizes, with per-row round-to-nearest as the baseline. At 125M, fp16 is 27.65, RTN 37.28 and GPTQ 31.12. At 66B, fp16 is 9.34 and RTN is 110, while GPTQ is 9.55. At 175B, fp16 is 8.34, RTN 10.54 and GPTQ 8.37. The paper notes that RTN at 175B is worse than the fp16 13B model (10.13), so a naively rounded big model can lose to a smaller full-precision one.

An [empirical study of Llama 3 quantization](https://arxiv.org/abs/2404.14047) reports WikiText-2 perplexity at 4 bits with group 128, rounded to one decimal. On the 8B, fp16 is 6.1, RTN 8.5, GPTQ 6.5 and AWQ 6.6. On the 70B, it's 2.9, 3.6, 3.3 and 3.3. GPTQ and AWQ land well below RTN and still above fp16.

## Where I'd stop trusting this post

**The strongest objection: 4-bit is basically free, so "it isn't free" is overcautious.** Fair. GPTQ's 175B result is within 0.03 perplexity of fp16. On the biggest models with a calibrated method, the drop can be close to nothing.

**Where it breaks.** Small models: mine lost 19% with round-to-nearest, and in GPTQ's table the 125M model loses 3.5 points where the 175B loses 0.03. Long-context or reasoning work: I didn't test either, and perplexity on 1,024-token windows says little about them. And your own data: WikiText-2 isn't it, and methods that calibrate on sample text can behave differently on yours.

**What I didn't do.** I didn't run GPTQ or AWQ, so claims about them come from the papers. Perplexity is one run on 8,184 scored tokens, with no error bars. Layers were measured independently, so compounding across 24 blocks shows up only in perplexity. The card table is arithmetic, not a serving test. QLoRA's [NF4 data type](https://arxiv.org/abs/2305.14314), built for normally distributed weights, is a different grid, and I didn't try it.

## The takeaway

My rule, which is mine and not a law: pick the largest model that fits your card at int4 g128 with real KV room, then check it. If a model fits at int8, take int8, because I measured +0.1% perplexity there. Don't trust a per-tensor 4-bit setting, and don't take a naive-rounding 4-bit big model over a smaller fp16 one without a test.

The test is cheap. Run your own prompts through the fp16 and the 4-bit model and compare the answers pair by pair, as in [Your Eval Set Is Too Small to Tell](/blog/your-eval-set-is-too-small-to-tell). What would change my mind is an own-task regression that GPTQ or AWQ fails to fix. I'd like to run both on this same model next, so all three methods sit side by side.
