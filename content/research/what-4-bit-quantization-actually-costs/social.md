## Hook

Same 4 bits. One way wrecks the model, the other barely dents it.

Qwen2.5-0.5B, plain rounding. One scale per matrix: perplexity 10,816,108. One scale per 128 weights: 20.5. Baseline: 17.2.

What group size are your 4-bit models running at?

## Thread

4-bit saves up to 72% of a model's memory. A tiny slice of the model pays for it.

I rounded a small model to 4 bits on my laptop and tracked where the damage lands:
---
Why does one scale per matrix fail? The biggest weights stretch the range, so every other weight gets a coarse grid.

Keep the top 1% of weights exact and pick the range from the rest: per-tensor int4 weight error falls from 69.4% to 10.8%. Nothing else changed.
---
I expected the biggest 1% of weights to carry 5% to 15% of the rounding error. They carry 1% to 2%.

Rounding error is about the same size for every weight. Big weights hurt by setting the step size, not by being rounded badly.
---
What does concentrate the damage is activations. At int4 with groups of 128, the 1% of input channels with the largest activations carry about 38% of the error that reaches the output.

Spread evenly, it would be 1%.
---
Memory is the good news, with a footnote. Int4 with groups of 128 cuts weights by 64% to 72% on 8B to 70B models, not 75%. Scales and fp16 embeddings eat it.

Llama 3.1 70B goes from 131.4 GiB to 37.0 GiB and fits a 48 GB card, with about 18k tokens of KV cache for one user.
---
The strongest objection: 4-bit is basically free. On big models with a calibrated method, close to it.

In the GPTQ paper, same method, OPT-175B goes from 8.34 perplexity to 8.37 at 4 bits. OPT-125M goes from 27.65 to 31.12. I only ran plain rounding on a 0.5B model.
---
Rule of thumb: if it fits at int8, run int8 (+0.1% perplexity on mine). If it only fits at 4 bits, use groups of 128, never one scale per matrix, and compare fp16 and 4-bit answers on your own prompts first.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/what-4-bit-quantization-actually-costs

## Singles

I expected the biggest 1% of weights to carry 5% to 15% of 4-bit rounding error. Measured on Qwen2.5-0.5B: 1.07% per-tensor, 2.19% with groups of 128. Rounding error is about the same size for every weight. Big weights only hurt by stretching the range.
---
Half the bits, 17x the error. On Qwen2.5-0.5B with groups of 128, int8 weight error is 0.64% and int4 is 10.79%. Perplexity: +0.1% at int8, +19.4% at int4. Same model, same rounding, same grouping.
---
Llama 3.1 70B at int4 with groups of 128 is 37.0 GiB. On a 48 GB card with a 2 GiB reserve, that leaves 5.7 GiB: about 18k tokens of fp16 KV cache for one user. The weights fit. One long conversation barely does.
---
Weight size is the wrong ruler for 4-bit damage. On Qwen2.5-0.5B, the 1% of input channels with the biggest activations carry about 38% of the activation-weighted rounding error at int4. Protect what the activations multiply.
---
If a model fits at int8, run int8: +0.1% perplexity on my test, against +19.4% for int4 with the same grouping. If it only fits at 4 bits, use groups of 128 and check fp16 against 4-bit on your own prompts before you ship.

## Reply prompts

Granularity beats bit width at the low end. I rounded Qwen2.5-0.5B to int4, plain rounding: one scale per matrix gave perplexity 10,816,108, one per 128 weights gave 20.5. Which granularity does your 4-bit setup use?

"Will a 70B fit on a 48 GB card?" Weights, yes: int4 with groups of 128 is 37.0 GiB. What's left after a 2 GiB reserve is 5.7 GiB, about 18k tokens of fp16 KV cache for one user.

On why AWQ and GPTQ exist: I measured plain int4 rounding on a small Qwen, and 1% of input channels, picked by activation size, carried about 38% of the activation-weighted error. Evenly spread would be 1%.

## Substack Note

10,816,108. That's the perplexity of Qwen2.5-0.5B after I rounded every weight in its transformer blocks to 4 bits, with one scale for each whole matrix. Give every 128 weights their own scale instead, same four bits, same plain rounding, and it's 20.5. The unquantized model scores 17.2.

I'd guessed the biggest 1% of weights would carry 5% to 15% of the error. They carry 1% to 2%. What does concentrate it is activations: 1% of input channels carry about 38% of the error that reaches the output. That's the gap GPTQ and AWQ exist to close, though I only ran plain rounding.

The memory side is kinder. Llama 3.1 70B drops from 131.4 GiB to 37.0 GiB at int4 with groups of 128 and fits a 48 GB card, with room for about 18k tokens of KV cache for one user.

https://www.0xadityaa.dev/blog/what-4-bit-quantization-actually-costs
