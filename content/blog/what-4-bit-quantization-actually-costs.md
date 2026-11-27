---
title: 4-Bit Saves Up to 72% Memory. 1% of the Model Pays for It
publishedAt: '2026-11-14'
summary: >-
  Plain 4-bit rounding took a small model from perplexity 17 to 10.8 million. One setting brought it back to 20.5, and 1% of channels carry 38% of the error.
tags:
  - ai
  - llm
  - inference
  - quantization
draft: true
---

I rounded a small model to 4 bits and its perplexity went from 17 to 10,816,108. I changed one setting and the same four bits cost 19%. Which setting?

On 14 November 2026, I rounded every weight in Qwen2.5-0.5B's transformer blocks to the nearest 4-bit step, with no calibration and no tricks. Perplexity is how surprised a model is by real text, and lower is better. With one scale for each whole matrix, it went from 17 to ten million. With one scale for every 128 weights, it landed at 20.5. The setting is how many weights share a scale.

**4-bit weights are close to free on memory, but the quality bill isn't zero and it isn't spread evenly: a few input channels take much of the damage. Size the model to the card first, then check quality on your own task.**

If you're squeezing a model onto a 24 GB or 48 GB card, this decides whether you get a model or noise. It's a sequel to [One Long Prompt Can Eat More GPU Than the Whole Model](/blog/your-context-window-is-a-memory-bill), which sized the KV cache. This one sizes the weights.

## The short version

- Int4 with groups of 128 shrinks an 8B to 70B model's weights by 64% to 72%, not 75%.
- A 70B at int4 fits a 48 GB card, with room for about 18k tokens of KV cache for one user.
- On the 0.5B model, int8 cost 0.1% perplexity and int4 with groups of 128 cost 19%.
- 1% of input channels carry about 38% of the error that reaches the output.

## How much memory does 4-bit save?

Less than the 75% the arithmetic promises. Each group of 128 weights also stores a 16-bit scale and a zero point, the layout [GPTQ](https://arxiv.org/abs/2210.17323) describes, so int4 costs 4.16 bits per weight. I assumed the embeddings and output head stay in fp16, which is 13% of Llama 3.1 8B.

The parameter counts come from four real `config.json` files (pinned in [`configs/`](https://github.com/0xadityaa/Portfolio/tree/main/content/research/what-4-bit-quantization-actually-costs/configs)), and the sizes below are in GiB. [`memory.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/memory.py) does the arithmetic and [`output-memory.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/output-memory.txt) has the full grid.

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

My budget reserves 2 GiB for activations and overhead (an assumption) and gives the rest to an fp16 KV cache. Card sizes are from NVIDIA, checked 14 November 2026: [24 GB on the RTX 4090](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/), [48 GB on the L40S](https://www.nvidia.com/en-us/data-center/l40s/), [80 GB on the H100](https://www.nvidia.com/en-us/data-center/h100/).

A 32B at int4 fits the 24 GB card, but the 2.4 GiB left holds about 10k tokens of cache for one user. A 70B at int4 fits the 48 GB card with 5.7 GiB left: about 18k tokens, one user. At int8 the 70B needs the 80 GB card. The [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/README.md) has the rest of the card-by-model grid.

Memory is the cheap part. Quality is where 4 bits bites.

## What did rounding break?

Everything, if you pick the wrong scale. I wrote my guesses into [`EXPECTATION.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/EXPECTATION.txt) before the run, and some turned out wrong.

The test in [`quant_experiment.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/quant_experiment.py) is plain round-to-nearest on all 168 matrices, with the scale per matrix, per output row, or per 128 weights. Weight error is rounding error over weight size. Output error is how far each matrix's output moves on 2,048 WikiText-2 tokens. Perplexity uses eight 1,024-token test windows. The raw numbers are in [`output-weights.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/output-weights.txt), [`output-activations.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/output-activations.txt) and [`output-ppl.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/output-ppl.txt).

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

**Going from 8 to 4 bits costs 17x the error, not 2x.** Int8 g128 is 0.64% and int4 g128 is 10.79%, about 255 steps against 15.

**Granularity barely matters at 8 bits and decides everything at 4.** At int8 the three choices sit within 3.4%. At int4 they run from 20 to ten million.

**The big weights aren't the culprit.** I expected the top 1% by magnitude to carry 5% to 15% of the squared error. They carry 1.07% per-tensor and 2.19% at g128. Rounding error is about the same size for every weight.

So why does per-tensor fail? Picture one ruler whose tick spacing is set by the tallest person in a school: everyone else gets measured to the nearest foot. The largest weights are 6.5 to 24 times the root-mean-square, so they stretch the range and every other weight gets a coarse grid. The last table row shows it: keep the top 1% exact, pick the range from the rest, and per-tensor int4 falls from 69.4% error to 10.8%. (I didn't count the storage for those values.)

Big weights aren't where the damage lives. So where is it?

## Which weights matter, then?

The ones that get multiplied by big activations. [LLM.int8()](https://arxiv.org/abs/2208.07339) found that from about 6.7B parameters, about 0.1% of feature dimensions get huge values, and the authors keep those in 16-bit.

[AWQ](https://arxiv.org/abs/2306.00978) turns that into a test. Its Table 1 keeps 1% of weights in fp16 on OPT-6.7B at 3 bits. Perplexity is 10.86 in fp16 and 23.54 with round-to-nearest. Keep the 1% chosen by activation: 11.39. By weight magnitude: 22.37. At random: 24.23.

I ran the same idea on Qwen. I took the 1% of input channels with the largest mean squared activation and asked how much of the activation-weighted rounding error sits there. At int4 it's 30.4% per-tensor, 38.6% per-channel and 38.4% at g128 ([`output-activations.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/output-activations.txt) lists them, with the raw numbers in [`results-activations.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/what-4-bit-quantization-actually-costs/results-activations.json)). I ignore cross terms, so it's an estimate: 1% of the channels, about 38% of the error. That's the gap AWQ and GPTQ go after.

I also ran AWQ's keep-1% test on Qwen at int4 g128. Output error fell from 8.21% to 6.42% keeping channels by activation, 6.82% by weight magnitude, and 8.16% at random. Random fails, as AWQ says. Magnitude lands close, probably because dropping the largest weight in a group shrinks its range.

## Does a bigger model cost less?

Less, and more erratically. In the GPTQ paper's Table 3, with per-row RTN as the baseline: at 125M, fp16 is 27.65, RTN 37.28 and GPTQ 31.12. At 66B, 9.34, 110 and 9.55. At 175B, 8.34, 10.54 and 8.37. RTN at 175B is worse than the fp16 13B model (10.13), so a naively rounded big model can lose to a smaller full-precision one.

An [empirical study of Llama 3 quantization](https://arxiv.org/abs/2404.14047) agrees at 4 bits, group 128. On the 8B, fp16 is 6.1, RTN 8.5 and GPTQ 6.5. On the 70B, it's 2.9, 3.6 and 3.3. Calibrated methods land well below RTN and still above fp16.

## Where I'd stop trusting this post

**4-bit is basically free on big models, and the data agrees.** GPTQ's 175B result sits within 0.03 perplexity of fp16. It breaks on small models (my 0.5B lost 19%, and GPTQ's 125M loses 3.5 points where the 175B loses 0.03), on long-context and reasoning work, which perplexity on 1,024-token windows says little about, and on your own data, since calibration text isn't yours.

**I never ran GPTQ or AWQ.** Their numbers come from the papers. QLoRA's [NF4 data type](https://arxiv.org/abs/2305.14314) uses a different grid and went untried too.

**Perplexity is one run on 8,184 tokens with no error bars.** I measured layers independently, so compounding shows up only in perplexity.

**The card table is arithmetic, not a serving test.** I haven't put any of these models on a real GPU.

## The takeaway

Pick the largest model that fits your card at int4 g128 with real KV room. If a model fits at int8, take int8: it cost +0.1% perplexity here. Never accept per-tensor 4-bit, and don't pick a naively rounded 4-bit big model over a smaller fp16 one without a test.

The test is cheap: run your own prompts through both and compare the answers pair by pair, as in [Your 100-Example Eval Is Lying About That 3-Point Win](/blog/your-eval-set-is-too-small-to-tell). If you find an own-task regression that GPTQ or AWQ fails to fix, I'll happily take back all of this.
