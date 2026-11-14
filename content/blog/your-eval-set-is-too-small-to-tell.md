---
title: Your Eval Set Is Too Small to Tell
publishedAt: '2026-11-14'
summary: >-
  On 100 examples, a real 3-point gain shows up as significant 7% of the time. Scoring both systems on the same examples gets you about twice as far.
tags:
  - ai
  - evals
  - statistics
draft: true
---

Your score goes from 80 to 83 on 100 examples. The better system lost or tied one run in three.

Picture this, and yes, it's made up: you tweak a prompt, rerun your eval, and ship the three points. I wanted to know how often that's a real win, so I simulated it. Two systems (seeded [NumPy](https://numpy.org/doc/stable/reference/random/generator.html) draws), one truly better by 3 points, 83% against 80%. Eval sets from 25 to 1,000 examples, five thousand runs each. The code and raw output are [in the repo](https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-eval-set-is-too-small-to-tell).

**A 50 to 100 example eval can't tell a 3-point improvement from noise, and running both systems on the same examples is the cheapest fix.** It won't make 100 examples enough. It makes them go about twice as far.

## The short version

- At 100 examples the truly better system scored higher 68% of the time, tied 6%, and scored lower 26%.
- Only 7% of those evals could say "better" with the 95% interval above zero. At 1,000 examples it was 40%.
- Pairing the comparison cut the interval by about 30% and made the same eval 1.6 times as likely to show the win (11% against 7%).
- A 3-point gap needs about 2,700 examples per system unpaired, or about 1,350 paired.

## How often does the better system win?

Not as often as it feels like it should.

At 100 examples, one eval in three showed the truly better system losing or tied. That's a clean, random, honest eval. No bugs, no leakage.

The interval is what gets me. It's a [bootstrap](https://en.wikipedia.org/wiki/Bootstrapping_(statistics)) one: resample the examples with replacement, recompute the difference a thousand times, take the middle 95%. At 100 examples it spans 21 points. A score "going up 3" is a dot inside a band from about minus 8 to plus 13.

At 500 examples the band is 9.6 points wide. At 1,000, 6.8. Even then you only see a clear win 40% of the time. For a 5-point gap, 100 examples gets you 13.8%. Only a 10-point gap is comfortable: 49% at 100, 99% at 500.

![Line chart of simulated evals for a true 83% against 80%: the share whose 95% interval excludes zero rises from 4% at 25 examples to 40% at 1,000 with separate samples, and from 5% to 68% with paired analysis. At 100 examples it is 7% unpaired and 11% paired. Neither reaches the 80% line.](/images/blog/eval-size-power-paired-vs-unpaired.svg)

None of this is new. Evan Miller's [Adding error bars to evals](https://arxiv.org/abs/2411.00640) (Anthropic, November 2024) makes the same case: questions are a sample from a bigger population, and the field has mostly reported single numbers. His worked example lands near a thousand questions to detect a 3-point difference ([checked 2026-11-14](https://arxiv.org/html/2411.00640)). His difficulty model differs from mine, so the numbers don't match exactly. The order of magnitude does.

## What does pairing change?

Pairing means both systems answer the same examples, and you compare them example by example instead of comparing two totals.

Most examples are easy for both systems or hard for both. That shared difficulty is noise in an unpaired comparison, and it cancels in a paired one. What's left is the examples where the systems disagree.

[McNemar's test](https://en.wikipedia.org/wiki/McNemar%27s_test) uses only those. Count where A is right and B is wrong (`b`), and where B is right and A is wrong (`c`). The statistic is `(b - c)^2 / (b + c)`. McNemar published it in 1947 as a [note on correlated proportions](https://doi.org/10.1007/BF02295996). The idea is older than most of the models you're comparing.

In my simulation the interval came out about 30% narrower at every size. At 100 examples, a clear win showed up 2.2% of the time analysing the data unpaired and 11.1% analysing it as pairs. A paired bootstrap and McNemar agreed within a point or two, so use whichever your tooling makes easy.

I had to pick how correlated the two systems are, and I used 0.5. That's an assumption. Miller's example uses 0.5 too, and it's made up as well. You can measure yours from the table you already have. It matters: at 100 examples, a correlation of 0.3 narrowed the interval 17%, 0.5 by 30%, and 0.7 by 46%. Two versions of the same prompt on the same model disagree rarely, so pairing helps you more.

The full tables are in the [simulation README](https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-eval-set-is-too-small-to-tell).

## How many examples do I need?

This is the table to keep next to your eval. It gives the smallest `n` that reaches 80% [power](https://en.wikipedia.org/wiki/Power_of_a_test) (you catch the real gap 80% of the time) at a two-sided 5% level, from a base accuracy of 80%. "Unpaired" is `n` per system. "Paired" is `n` shared examples.

| True gap | Unpaired, per system | Paired, correlation 0.3 | Paired, 0.5 | Paired, 0.7 |
| --- | --- | --- | --- | --- |
| 2 points | 6,252 | 4,313 | 3,117 | 1,871 |
| 3 points | 2,712 | 1,871 | 1,352 | 775 |
| 5 points | 933 | 644 | 465 | 266 |
| 10 points | 202 | 139 | 101 | not possible* |

*Two systems at 90% and 80% can't correlate at 0.7. The accuracy gap caps it, so the simulation refuses.

Halving the gap you want to detect roughly quadruples the examples you need. A 10-point gap needs about 100 shared examples. A 3-point gap needs more than ten times that. I checked the simulation against the normal-approximation formula from Miller's section 5, and they agree within 5%.

## Where I'd stop trusting this post

**You shouldn't be doing this early on.** Hamel Husain's [advice](https://hamel.dev/blog/posts/field-guide/) is that reading real outputs and sorting the failures is the highest-return thing you can do, and that generic metrics breed false confidence. He's right. With 40 outputs you haven't read, a significance test is procrastination. His own stopping rule is to read until you stop learning anything new ([checked 2026-11-14](https://hamel.dev/blog/posts/evals/)), not a sample size. My advice starts later, when you have two candidates and a number to choose with.

**Binary scores only.** A 1 to 5 rubric, a similarity score, or a latency has its own variance, and my table doesn't cover it. Miller's formulas do.

**An LLM judge adds noise.** If a judge flips its verdict on the same answer, that's variance my simulation doesn't have. Treat these sample sizes as floors.

**Real examples cluster.** I drew them as independent coin flips. Ten questions about one document aren't independent, and Miller shows the naive standard error can come out several times too small. On DROP it was about three times.

I haven't tested real model outputs, a measured correlation, or any non-binary metric. It's a simulation with stated assumptions.

## The takeaway

Before you compare two candidates on a number, look up the gap you care about in the table. If your eval has fewer examples than that, don't read the difference as a win. Read the outputs.

If you can run both on the same examples, do it and analyse the pairs. It's free, and at a correlation of 0.5 it halved the examples I needed.

I'd like to measure the correlation on a real eval. If it's far from 0.5, or the paired and unpaired intervals come out the same, this post is wrong about how much pairing buys you.
