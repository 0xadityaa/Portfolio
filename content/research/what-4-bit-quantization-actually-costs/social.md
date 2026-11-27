## Thread

4-bit saves up to 72% of weight memory. 1% of input channels carry 38% of the error.

Plain rounding on Qwen2.5-0.5B: perplexity 10,816,108 with one scale per matrix, 20.5 with one per 128 weights. Where the damage lands ↓

[image: /images/blog/weight-memory-vs-cards.svg]
---
Same 4 bits, same model, plain rounding. Only one thing changes: how many weights share a scale.

→ one scale per 128 weights: perplexity 20.5
→ one scale per matrix: 10,816,108
→ unquantized: 17.2
---
The usual guess is that the top 1% of weights carry 5% to 15% of the error. They carry 1% to 2%.

They hurt by stretching the range. Keep them exact, pick the range from the rest: per-tensor int4 weight error falls from 69.4% to 10.8%.
---
What concentrates the damage is activations. At int4 with groups of 128, the 1% of input channels with the largest activations carry about 38% of the error that reaches the output. Spread evenly, it would be 1%.

That's the gap GPTQ and AWQ go after.
---
If it fits at int8, run int8 (+0.1% perplexity on the 0.5B model). If it only fits at 4 bits, use groups of 128, never one scale per matrix, and compare answers on your own prompts.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/what-4-bit-quantization-actually-costs

## Singles

Half the bits, 17x the error.

Groups of 128, Qwen2.5-0.5B: int8 weight error 0.64%, int4 10.79%. Perplexity +0.1% against +19.4%.

Going from 8 to 4 bits is not a 2x step.
---
Most people say 4-bit makes a model 4x smaller. Counted from real configs, int4 with groups of 128 saves 64% on Llama 3.1 8B and 72% on Llama 3.1 70B.

Scales and fp16 embeddings eat the rest.
---
Llama 3.1 70B at int4 is 37.0 GiB, down from 131.4. It fits a 48 GB card.

With a 2 GiB reserve that leaves 5.7 GiB: about 18k tokens of fp16 KV cache for one user. The weights fit. One long conversation barely does.
---
One scale per matrix: perplexity 10,816,108. One scale per 128 weights: 20.5.

Same model, same 4 bits. At int8 the same three granularity choices sit within 3.4%.

Granularity decides everything at 4 bits.
---
Myth: 4-bit breaks the biggest weights.

On Qwen2.5-0.5B the top 1% of weights carry 1.07% of the error per-tensor, 2.19% at g128. The 1% of input channels with the largest activations carry about 38%.

Protect what the activations multiply.

## Link post

4-bit weights save up to 72% of memory, and 1% of input channels carry about 38% of the error.

Group size decides whether 4-bit gives a model or noise: perplexity 20.5 against 10,816,108 on the same model.

<BLOG_URL>

[image: /images/blog/weight-memory-vs-cards.svg]

## Question

What group size is your 4-bit setup running, and did you ever compare it against int8 on your own prompts?

## Substack Note

10,816,108. That's the perplexity of Qwen2.5-0.5B after every weight in its transformer blocks was rounded to 4 bits, with one scale for each whole matrix. Give every 128 weights their own scale instead, same four bits, and it's 20.5. The unquantized model scores 17.2.

The usual guess is that the biggest 1% of weights carry 5% to 15% of the error. They carry 1% to 2%. What does concentrate it is activations: 1% of input channels carry about 38% of the error that reaches the output. That's the gap GPTQ and AWQ exist to close.

The memory side is kinder. Llama 3.1 70B drops from 131.4 GiB to 37.0 GiB at int4 with groups of 128 and fits a 48 GB card, with room for about 18k tokens of KV cache for one user.

<BLOG_URL>
