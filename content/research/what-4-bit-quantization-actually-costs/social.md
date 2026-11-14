## Thread

Perplexity 17.2 to 10.8 million. That's Qwen2.5-0.5B after I rounded every weight to 4 bits the lazy way. Change one thing and it's only 19% worse. Same four bits.
---
The one thing: how many weights share a scale. One scale per matrix gave 69% weight error. One scale per 128 weights gave perplexity 20.5. One per output row gave 31.8.
---
I expected the biggest 1% of weights to carry 5% to 15% of the rounding error. They carry 1% to 2%. I was wrong. They hurt by stretching the range, so everyone else gets a coarse grid.
---
What does concentrate the damage is activations. The 1% of input channels with the biggest ones carry about 38% of the error that reaches the output. That's the gap AWQ and GPTQ go after.
---
Memory is the good news. Int4 with groups of 128 saves 64% to 72% on 8B to 70B models, not 75%, because of scales and fp16 embeddings. A 70B drops to 37.0 GiB and fits a 48 GB card, with about 18k tokens of KV cache for one user.
---
Caveats: round-to-nearest only, I never ran GPTQ or AWQ, and perplexity is one run on 8,184 scored tokens. Code, raw outputs and the write-up: https://www.0xadityaa.dev/blog/what-4-bit-quantization-actually-costs

## Singles

Int4 on Qwen2.5-0.5B, plain rounding: perplexity 10.8 million with one scale per matrix, 31.8 per row, 20.5 per 128 weights. The baseline is 17.2. How many weights share a scale matters more than the four bits.
---
Int8 with groups of 128 cost 0.1% perplexity on Qwen2.5-0.5B. Int4 with the same groups cost 19.4%. Going from 255 steps to 15 multiplied the weight error by about 17. Int8 is the safe default when it fits.
---
I guessed the top 1% of weights by size would carry 5% to 15% of the rounding error. They carry 1% to 2%. Rounding error is about the same size for every weight. Big weights hurt by stretching the range for the rest.
---
1% of input channels carry about 38% of the weighted rounding error at int4 on Qwen2.5-0.5B. Evenly spread, it would be 1%. Protect the channels the activations care about, not the weights that look big.
---
Llama 3.1 70B in fp16 is 131.4 GiB of weights. At int4 with groups of 128 it's 37.0 GiB, a 72% cut. On a 48 GB card with a 2 GiB reserve, 5.7 GiB is left: about 18k tokens of KV cache for one user. It loads, but it barely serves.

## Substack Note

37.0 GiB. That's Llama 3.1 70B at 4 bits with groups of 128, down from 131.4 GiB in fp16. It fits a 48 GB card, with room for about 18k tokens of KV cache for one user. It loads, but it barely serves.

The quality bill is the part I wanted to see. I rounded every weight in Qwen2.5-0.5B to 4 bits with no calibration. One scale per matrix: perplexity went from 17 to 10.8 million. One scale per 128 weights: 19% worse. Same four bits.

I'd guessed the biggest 1% of weights would carry 5% to 15% of the error. They carry 1% to 2%, so I was wrong. What does concentrate it is activations: 1% of input channels carry about 38% of the error that reaches the output. That's the gap GPTQ and AWQ exist to close.

I only ran round-to-nearest. The post has the tables, the limits and the code.

https://www.0xadityaa.dev/blog/what-4-bit-quantization-actually-costs
