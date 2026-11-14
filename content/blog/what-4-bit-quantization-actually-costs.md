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

On 14 November 2026 I took a small open model, Qwen2.5-0.5B, and rounded every weight in its transformer blocks to four bits the dumbest way possible. No calibration, no tricks, just round to the nearest step. Then I measured what broke. With one scale for each whole matrix, the weights were off by 69% in relative terms and the model's perplexity on WikiText-2 went from 17 to ten million. With one scale for every 128 weights, the same four bits cost 19%.

That gap is the post. This is a sequel to [Your Context Window Is a Memory Bill](/blog/your-context-window-is-a-memory-bill), which sized the KV cache. This one sizes the weights.

My claim: **4-bit weights are close to a free lunch on memory, but the quality bill isn't zero and it isn't spread evenly. A few input channels take much of the damage, which is why naive rounding hurts and why GPTQ and AWQ exist. Size the model to the card first, then check quality on your own task.**

## The short version

- Int4 with groups of 128 shrinks an 8B to 70B model's weights by 64% to 72% against fp16. It's not 75% because every group carries a scale and zero point, and the embeddings usually stay in fp16.
- At 4 bits, a 70B model fits a 48 GB card, but only with room for about 18k tokens of KV cache for one user.
- On my CPU experiment, the top 1% of weights by size carry only 1% to 2% of the rounding error. But 1% of input channels carry about 38% of the error that matters at the output.
- Perplexity on a 0.5B model: +0.1% at int8, +19% at int4 with groups of 128. Published numbers for bigger models are smaller, not zero.

## How much memory does 4-bit actually save?

Less than the headline. Four bits is a quarter of sixteen, so you'd expect 75%. Two things eat into it.

First, each group of 128 weights stores a 16-bit scale and a zero point at the weight width, the layout [GPTQ](https://arxiv.org/abs/2210.17323) describes. That's 4 + 20/128 = 4.16 bits per weight for int4, and 8.19 for int8. Second, I assumed the token embeddings and output head stay in fp16. For Llama 3.1 8B that's 1.05B of 8.03B parameters, 13% of the model.

I counted the linear-layer parameters from four real `config.json` files and added the rest at fp16. Sizes are GiB. The script is [in the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/what-4-bit-quantization-actually-costs).

| Model | fp16 | int8 g128 | int4 g128 | Saved at int4 |
| --- | --- | --- | --- | --- |
| [Llama 3.1 8B](https://huggingface.co/unsloth/Meta-Llama-3.1-8B/blob/e9a141a2091ea561b96483212645a2a05e6f99fc/config.json) | 15.0 | 8.6 | 5.3 | 64% |
| [Qwen2.5 14B](https://huggingface.co/Qwen/Qwen2.5-14B/blob/97e1e76335b7017d8f67c08a19d103c0504298c9/config.json) | 27.5 | 15.5 | 9.3 | 66% |
| [Qwen2.5 32B](https://huggingface.co/Qwen/Qwen2.5-32B/blob/1818d35814b8319459f4bd55ed1ac8709630f003/config.json) | 61.0 | 32.6 | 18.0 | 71% |
| [Llama 3.1 70B](https://huggingface.co/unsloth/Llama-3.1-70B/blob/99f146c778e0de3b687d83191faf41e49198f2ca/config.json) | 131.4 | 69.2 | 37.0 | 72% |

Savings grow with size because the fp16 embeddings shrink as a share.

![Horizontal bars of weight memory in GiB at fp16, int8 and int4 for four models, with dashed lines for 24, 48 and 80 GB cards; Llama 3.1 70B at int4 is 37.0 GiB, highlighted, and fits a 48 GB card](/images/blog/weight-memory-vs-cards.svg)

## Which of these fit on a card?

I reserved 2 GiB for activations and overhead (my assumption, not a measurement) and gave the rest to an fp16 KV cache. Cards are the sizes NVIDIA lists, checked 14 November 2026: [24 GB on the RTX 4090](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/), [48 GB on the L40S](https://www.nvidia.com/en-us/data-center/l40s/), [80 GB on the H100](https://www.nvidia.com/en-us/data-center/h100/).

The table shows GiB left for KV cache, with full 32k-token users in brackets. "No" means the weights don't fit.

| Model, precision | 24 GB card | 48 GB card | 80 GB card |
| --- | --- | --- | --- |
| 8B int4 | 15.0 (3) | 37.4 (9) | 67.2 (16) |
| 14B fp16 | no | 15.2 (2) | 45.0 (7) |
| 14B int4 | 11.1 (1) | 33.4 (5) | 63.2 (10) |
| 32B int4 | 2.4 (0) | 24.7 (3) | 54.5 (6) |
| 70B int8 | no | no | 3.3 (0) |
| 70B int4 | no | 5.7 (0) | 35.5 (3) |

Read the zeros. A 32B model at int4 fits a 24 GB card, but the 2.4 GiB left holds about 10k tokens of cache for one user. A 70B at int4 fits a 48 GB card the same way, with about 18k tokens of cache for one user. "It loads" is not "it serves". Per-token cache sizes come from the last post's formula, and weight-only quantization doesn't change them.

Note the modelling choice: users are counted at a full 32k tokens. Shorter contexts make every row look better.

## Where does the rounding error go?

Now the experiment. I used [Qwen2.5-0.5B](https://huggingface.co/Qwen/Qwen2.5-0.5B/tree/060db6499f32faf8b98477b0a26969ef7d8b9987), pinned to one commit, because it's ungated and runs on a laptop CPU. I quantized the 168 linear matrices in its 24 blocks (358M of its 494M parameters) with plain round-to-nearest, asymmetric, min/max range. That's the baseline GPTQ and AWQ beat. I ran neither.

I tried three granularities: per-tensor (one scale per matrix), per-channel (one per output row) and group-128 (one per 128 weights in a row). Weights are rounded and turned straight back into fp32, so this measures the grid, not a real int4 kernel.

I wrote down what I expected in `EXPECTATION.txt` before running it, and some of it was wrong. Weight error is the size of the rounding error divided by the size of the weights:

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

"Output error" is how far each matrix's output moves on 2,048 tokens of WikiText-2 training text, fed clean fp32 inputs, summed over all 168 matrices. Perplexity uses eight 1,024-token windows of the test split.

Three things stand out.

**Going from 8 to 4 bits costs 17x the error, not 2x.** Int8 g128 is 0.64% and int4 g128 is 10.79%, about the ratio of 255 steps to 15.

**Granularity matters far more at 4 bits.** At int8 the three choices are within 3.4% of each other. At int4 they run from 20 to ten million.

**The big weights aren't where the error lands.** I expected the top 1% of weights by magnitude to carry 5% to 15% of the squared error. They carry 1.07% per-tensor and 2.19% at g128. Rounding error is about the same size for every weight, whatever its value. So why does per-tensor fail? Because the big weights set the step size. The largest weights in these matrices are 6.5 to 24 times the root-mean-square, depending on the matrix type, and the top 1% hold 11% to 16% of all the squared weight. They stretch the range, and every other weight gets a coarse grid. The last table row shows it: keep the top 1% exact, pick the range from the rest, and per-tensor int4 drops from 69.4% error to 10.8%, level with g128. The storage for those values and their indices isn't counted.

## Which weights matter then?

Weight size isn't the right ruler. What a weight does depends on what multiplies it, and some input channels carry far bigger activations. [LLM.int8()](https://arxiv.org/abs/2208.07339) found this: from about 6.7B parameters, a tiny set of feature dimensions (about 0.1% of them) get huge values, and the authors keep those in 16-bit.

[AWQ](https://arxiv.org/abs/2306.00978) turns it into a test. Its Table 1 keeps 1% of weights in fp16 on OPT-6.7B at 3 bits, group 128. Perplexity starts at 10.86 in fp16 and 23.54 with round-to-nearest. Keeping the 1% chosen by activation brings it to 11.39. Choosing by weight magnitude gives 22.37, and choosing at random gives 24.23. Same count, different result.

I ran my version on Qwen. For each matrix I took the 1% of input channels with the largest mean squared activation and asked how much of the activation-weighted rounding error sits in them. It ignores cross terms between channels, so it's an estimate.

| Scheme | Share of weighted error in the top 1% of channels |
| --- | --- |
| int4 per-tensor | 30.4% |
| int4 per-channel | 38.6% |
| int4 g128 | 38.4% |

One percent of the channels, about 38% of the error, against 1% if it were spread evenly. AWQ protects those channels, and GPTQ compensates for rounding error with second-order information, instead of rounding everyone the same.

My keep-1% test was less clean than AWQ's. At int4 g128, keeping the top 1% of channels by activation took output error from 8.21% to 6.42%. Keeping 1% of weights by magnitude gave 6.82%, and random channels gave 8.16%. The random control matches AWQ's story. The weight-magnitude arm lands close, probably because removing the largest weight from a group also shrinks its range. Supported, not settled.

## What does it cost in perplexity at real sizes?

My 0.5B model lost 19% of its perplexity at int4 g128, round-to-nearest. The GPTQ paper's Table 3 gives the same comparison across OPT sizes, with per-row round-to-nearest as the baseline:

| OPT model | fp16 | 4-bit RTN | 4-bit GPTQ |
| --- | --- | --- | --- |
| 125M | 27.65 | 37.28 | 31.12 |
| 1.3B | 14.63 | 48.17 | 15.47 |
| 66B | 9.34 | 110 | 9.55 |
| 175B | 8.34 | 10.54 | 8.37 |

Two lessons. Better rounding works: GPTQ lands within 0.03 of fp16 at 175B, though the 125M model still loses 3.5 points. And naive rounding is erratic: RTN is 110 at 66B, worse than fp16 at 125M. The paper notes that RTN at 175B (10.54) is worse than the fp16 13B model (10.13), so a naive 4-bit big model can lose to a smaller full-precision one.

For something recent, an [empirical study of Llama 3 quantization](https://arxiv.org/abs/2404.14047) reports WikiText-2 perplexity at 4 bits with group 128. The paper rounds to one decimal.

| Llama 3 | fp16 | RTN | GPTQ | AWQ |
| --- | --- | --- | --- | --- |
| 8B | 6.1 | 8.5 | 6.5 | 6.6 |
| 70B | 2.9 | 3.6 | 3.3 | 3.3 |

Calibrated methods cut the gap by half or more. They don't close it: about +7% on the 8B and +14% on the 70B, and with one-decimal rounding the 70B figure could be anywhere from 10% to 18%.

## Where I'd stop trusting this post

**The strongest objection: 4-bit is basically free, so "it isn't free" is overcautious.** Fair. GPTQ's 175B result is within 0.03 perplexity of fp16. On the biggest models with a calibrated method, the drop can be close to nothing.

It breaks in four places I can name.

- **Small models.** Mine lost 19% with round-to-nearest, and in GPTQ's table the 125M model loses 3.5 points where the 175B loses 0.03.
- **Long-context or reasoning work.** I didn't test either, and perplexity on 1,024-token windows says little about step-by-step reasoning.
- **Your own distribution.** WikiText-2 isn't your data. Methods that calibrate on sample text can behave differently on yours.
- **Memory you didn't shrink.** Weight-only quantization leaves the KV cache and activations alone, and I covered that table above.

**What I didn't do.** I didn't run GPTQ or AWQ, so claims about them come from the papers. Perplexity is one run on 8,184 scored tokens, with no error bars. Scales stayed in fp32 where checkpoints use fp16. Layers were measured independently, so compounding across 24 blocks shows up only in perplexity. The card table is arithmetic, not a serving test. QLoRA's [NF4 data type](https://arxiv.org/abs/2305.14314), built for normally distributed weights, is a different grid, and I didn't try it.

## The takeaway

My rule, which is mine and not a law: pick the largest model that fits your card at int4 g128 with real KV room, then check it. If a model fits at int8, take int8, because I measured +0.1% perplexity there. Don't trust a per-tensor 4-bit setting, and don't take a naive-rounding 4-bit big model over a smaller fp16 one without a test.

Run your own prompts through the fp16 and the 4-bit model and compare the answers pair by pair, as in [Your Eval Set Is Too Small to Tell](/blog/your-eval-set-is-too-small-to-tell). What would change my mind is an own-task regression that GPTQ or AWQ fails to fix. Next I'll run both on this same model, so the table has all three methods side by side.
