## Thread

I rounded every weight in Qwen2.5-0.5B to 4 bits the dumbest way possible and measured what broke. One scale per matrix: 69% weight error, perplexity from 17.2 to 10.8 million. One scale per 128 weights: perplexity 19% worse. Same four bits.
---
The big weights aren't where the error lands. The top 1% by size carry 1% to 2% of the rounding error. They matter because they set the step size: keep just those exact and per-tensor int4 drops from 69.4% error to 10.8%.
---
What does concentrate the damage is activations. The 1% of input channels with the biggest activations carry about 38% of the error that reaches the output. That's the gap AWQ and GPTQ go after.
---
Memory: int4 with groups of 128 saves 64% to 72% on 8B to 70B models, not 75%, because of scales and fp16 embeddings. A 70B drops to 37.0 GiB and fits a 48 GB card, with room for about 18k tokens of KV cache.
---
Caveats: round-to-nearest only, I never ran GPTQ or AWQ, and perplexity is one run on 8,184 scored tokens. Code, raw outputs and the write-up: https://www.0xadityaa.dev/blog/what-4-bit-quantization-actually-costs

## Singles

Qwen2.5-0.5B, every transformer weight rounded to int4 with plain round-to-nearest. One scale per matrix: perplexity 10.8 million. One scale per output row: 31.8. One scale per 128 weights: 20.5. The baseline is 17.2.
---
Int8 with groups of 128 cost 0.1% perplexity on Qwen2.5-0.5B (17.17 to 17.18). Int4 with the same groups cost 19.4%. Going from 255 steps to 15 multiplied the weight error by about 17.
---
I expected the top 1% of weights by size to carry 5% to 15% of the rounding error. They carry 1% to 2%. Rounding error is about the same size for every weight. The big ones hurt by stretching the range for everyone else.
---
On Qwen2.5-0.5B, 1% of input channels, picked by activation size, carry about 38% of the weighted rounding error at int4. If it were spread evenly that number would be 1%.
---
Llama 3.1 70B in fp16 is 131.4 GiB of weights. At int4 with groups of 128 it's 37.0 GiB, a 72% cut. On a 48 GB card, after a 2 GiB reserve, that leaves 5.7 GiB: about 18k tokens of KV cache for one user.

## Substack Note

I rounded every weight in a small open model, Qwen2.5-0.5B, to four bits the dumbest way I could: no calibration, just round to the nearest step. Then I measured what broke.

With one scale for a whole matrix, the weights were off by 69% and perplexity went from 17 to 10.8 million. With one scale per 128 weights, perplexity was 19% worse. Same four bits, very different bill.

The surprise was where the error goes. The biggest 1% of weights carry only 1% to 2% of it. They hurt by stretching the range. What does concentrate the damage is activations: 1% of input channels carry about 38% of the error that reaches the output. That's the gap GPTQ and AWQ exist to close.

On memory, int4 with groups of 128 saves 64% to 72% on 8B to 70B models. A 70B fits a 48 GB card at 37.0 GiB, with room for about 18k tokens of KV cache.

I only ran round-to-nearest, never GPTQ or AWQ. The post has the tables, the limits and the code.

https://www.0xadityaa.dev/blog/what-4-bit-quantization-actually-costs
