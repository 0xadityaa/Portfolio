## Hook

4-bit saves up to 72% memory. 1% of channels pay.

Plain rounding, 0.5B model, no tricks:
One scale per 128 weights: perplexity 20.5 (baseline 17.2)
One scale per matrix: 10,816,108

What group size is your 4-bit running?

## Thread

4-bit saves up to 72% memory. 1% of channels pay.

A 0.5B model rounded to 4 bits on a laptop. Plain rounding, no calibration. Here is where the damage lands ↓
---
Same 4 bits, same model (Qwen2.5-0.5B), plain rounding. Only one thing changes: how many weights share a scale.

→ one scale per 128 weights: perplexity 20.5
→ one scale per matrix: 10,816,108
→ unquantized: 17.2
---
The expectation: the top 1% of weights carry 5% to 15% of the error. They carry 1% to 2%.

They hurt by stretching the range, so the rest get a coarse grid. Keep them exact, pick the range from the rest: per-tensor int4 weight error falls from 69.4% to 10.8%.
---
What does concentrate the damage is activations. At int4 with groups of 128, the 1% of input channels with the largest activations carry about 38% of the error that reaches the output.

Spread evenly, it would be 1%. (An estimate: it ignores cross terms.)
---
The strongest objection: 4-bit is basically free. On big models with a calibrated method, close to it.

GPTQ paper, same method: OPT-175B goes from 8.34 perplexity to 8.37. OPT-125M goes from 27.65 to 31.12. The 0.5B numbers here are plain rounding, not GPTQ.
---
Want the memory calculator and the rounding experiment? Reply QUANT and I'll DM it.
---
Rule of thumb: if it fits at int8, run int8 (+0.1% perplexity on the 0.5B model). If it only fits at 4 bits, use groups of 128, never one scale per matrix, and compare fp16 and 4-bit answers on your own prompts.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/what-4-bit-quantization-actually-costs

## Singles

The usual guess: the top 1% of weights carry 5% to 15% of 4-bit rounding error.

Measured, plain rounding, Qwen2.5-0.5B:
→ 1.07% with one scale per matrix
→ 2.19% with groups of 128

Rounding error is about the same size for every weight. Big weights hurt by stretching the range.
---
Half the bits, 17x the error.

Plain rounding, groups of 128, Qwen2.5-0.5B:
int8 weight error: 0.64%, perplexity +0.1%
int4 weight error: 10.79%, perplexity +19.4%

Going from 8 to 4 bits is not a 2x step.
---
Most people say 4-bit makes a model 4x smaller. Counted from real configs, int4 with groups of 128:

→ Llama 3.1 8B: 64% smaller
→ Qwen2.5 32B: 71%
→ Llama 3.1 70B: 72%

Scales and fp16 embeddings eat the rest.
---
Llama 3.1 70B at int4 with groups of 128 is 37.0 GiB, down from 131.4 GiB.

On a 48 GB card with a 2 GiB reserve (an assumption), that leaves 5.7 GiB: about 18k tokens of fp16 KV cache for one user. The weights fit. One long conversation barely does.
---
Myth: 4-bit breaks the biggest weights.

Measured on Qwen2.5-0.5B with plain int4 rounding: the 1% of input channels with the largest activations carry about 38% of the activation-weighted error. Evenly spread would be 1%.

Protect what the activations multiply.

## CTA

QUANT | the memory calculator and the 4-bit rounding experiment | https://github.com/0xadityaa/Portfolio/tree/main/content/research/what-4-bit-quantization-actually-costs

## Reply prompts

Granularity beats bit width at the low end. Qwen2.5-0.5B rounded to int4, plain rounding, no calibration: one scale per matrix gave perplexity 10,816,108, one per 128 weights gave 20.5. Which granularity does your 4-bit setup use?

"Will a 70B fit on a 48 GB card?" Weights, yes: int4 with groups of 128 is 37.0 GiB. After a 2 GiB reserve (an assumption), 5.7 GiB is left, about 18k tokens of fp16 KV cache for one user.

On why AWQ and GPTQ exist: in plain int4 rounding on a 0.5B Qwen, 1% of input channels, picked by activation size, carry about 38% of the activation-weighted error. Evenly spread would be 1%.

## Substack Note

10,816,108. That's the perplexity of Qwen2.5-0.5B after every weight in its transformer blocks was rounded to 4 bits, with one scale for each whole matrix. Give every 128 weights their own scale instead, same four bits, and it's 20.5. The unquantized model scores 17.2. That's plain round-to-nearest on a 0.5B model, no calibration, with no GPTQ or AWQ run.

The usual guess is that the biggest 1% of weights carry 5% to 15% of the error. They carry 1% to 2%. What does concentrate it is activations: 1% of input channels carry about 38% of the error that reaches the output. That's the gap GPTQ and AWQ exist to close.

The memory side is kinder. Llama 3.1 70B drops from 131.4 GiB to 37.0 GiB at int4 with groups of 128 and fits a 48 GB card, with room for about 18k tokens of KV cache for one user.

https://www.0xadityaa.dev/blog/what-4-bit-quantization-actually-costs
