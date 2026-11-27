## Thread

At temperature 0, batching changed the text for 75 of 200 prompts.

Same model, same prompts, greedy decoding. The only difference was whether a prompt ran alone or inside a batch of 8. In bf16. In fp32 it was 0 of 200. ↓

[image: /images/blog/greedy-flips-fp32-vs-bf16.svg]
---
Why bf16 flips: it has 8 significant bits, so logits between 16 and 32 move in steps of 0.125.

Of the 75 flips, 43 began at an exact tie between the top two tokens, 30 one step apart, 2 two steps apart. A rounding nudge decides the winner.
---
On the 50 questions I ran, temperature barely moved accuracy.

greedy 74.0%
T=0.7 70.7% (difference from greedy: -3.3, interval -8.3 to +1.6)
T=1.0 64.7%
T=1.5 38.3%

I predicted T=0.7 would lose 5 to 10 points. It didn't.
---
Greedy was wrong on 13 of the 50, and wrong every single time. Sampling at T=0.7 got 16.7% of those right.

Australia: Sydney 100 out of 100 at temperature 0. Canberra 54 out of 100 at T=0.7.

Small model, short factual answers.
---
Temperature 0 is low variance, not a contract. Don't assert exact string equality on LLM output, and suspect batching before the model when a temperature-0 eval moves.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-temperature-zero-deterministic

## Singles

Greedy decoding, 200 prompts, alone versus a batch of 8.

fp32: 0 changed.
bf16: 75 changed.

The model, the prompts and the temperature were identical. The batch wasn't.

---

I predicted the same prompt at batch size 1 and batch size 32 would differ by about 1e-5 in fp32 and 1e-1 in bf16.

Measured max difference in the logits: exactly 0, in both. Identical rows don't disturb each other on this CPU. Padded batches of different prompts did, in bf16.

---

Greedy said the capital of Australia is Sydney, 100 times out of 100. Temperature 0.7 said Canberra 54 times.

Consistent isn't the same as correct.

---

Across 50 questions on a 0.5B model, T=0.2 scored +0.7 points against greedy. T=0.7 scored -3.3, with an interval that includes zero. T=1.0 was -9.3, and T=1.5 lost 35.7 points.

Temperature stays quiet until it doesn't.

---

I summed the same 1,000,000 float32 numbers in eight different orders and got six different totals.

A matmul picks its order from the shape of the work. Change the batch shape and the order can change. At temperature 0, a near tie can then pick a different token.

## Link post

Temperature 0 made 75 of 200 outputs change in bf16, just from batching. It made none change in fp32.

I measured both, plus accuracy on 50 questions, and what a bf16 tie looks like in the logits:

<BLOG_URL>

[image: /images/blog/greedy-flip-logit-gap.svg]

## Question

If you run evals or tests at temperature 0, do you assert exact output equality, or do you compare with a tolerance or a judge? What made you pick it?

## Substack Note

Out of 200 prompts, 75 produced different text when I ran them inside a batch instead of alone. Greedy decoding, temperature 0, same model, bf16. In fp32 it was 0 of 200.

I ran Qwen2.5-0.5B on my Mac's CPU to check whether temperature zero is deterministic. On one machine, with the batch held fixed, it repeated itself 20 of 20 times. Once the batch changed, bf16 flipped 37.5% of outputs. In 43 of the 75 flips the top two tokens were exactly tied, and bf16's step at those logit sizes is 0.125.

Accuracy told a quieter story. Across 50 questions, T=0.7 scored 3.3 points under greedy, with an interval that includes zero. Greedy was wrong on 13 and stayed wrong every time.

The full write-up has the code, the raw output and the three figures:

<BLOG_URL>
