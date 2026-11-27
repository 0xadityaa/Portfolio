---
title: Your 100-Example Eval Is Lying About That 3-Point Win
publishedAt: '2026-11-26T23:24:56.270Z'
summary: >-
  On 100 examples, a real 3-point gain shows up as significant 7% of the time.
  Scoring both systems on the same examples gets you about twice as far.
updated: '2026-11-26'
tags:
  - ai
  - evals
  - statistics
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/147'
---

A system that's truly 3 points better than another looks worse or tied one run in three on a 100-example eval.

So when your score goes from 80 to 83, what did you actually learn?

If you choose prompts or models on 50 to 100 examples, this costs you: some of the wins you ship are noise you can't tell from signal. A simulation sizes it: two systems, one truly better, 83% against 80% (seeded [NumPy](https://numpy.org/doc/stable/reference/random/generator.html) draws), on eval sets from 25 to 1,000 examples, five thousand runs each. The code and raw output are [in the repo](https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-eval-set-is-too-small-to-tell).

**A 50 to 100 example eval can't tell a 3-point improvement from noise, and running both systems on the same examples is the cheapest fix.** It won't make 100 examples enough. It makes them go about twice as far.

## The short version

- At 100 examples the truly better system scored higher 68% of the time, tied 6%, and scored lower 26%.
- Only 7% of those evals could say "better" with the 95% interval above zero. At 1,000 examples it was 40%.
- Pairing the comparison cut the interval by about 30%. On the same data, the share of evals that could call the win went from 2.2% to 11.1%.
- A 3-point gap needs about 2,700 examples per system unpaired, or about 1,350 paired.

## Does the better system at least win?

Two times in three. The other third is a clean, honest eval with no bugs and no leakage, and it still points the wrong way or shrugs.

The interval is what really stings. It's a [bootstrap](https://en.wikipedia.org/wiki/Bootstrapping_(statistics)) one: resample the examples with replacement, recompute the difference a thousand times, take the middle 95%. At 100 examples it spans 21 points. Your "up 3" is a dot inside a band from about minus 8 to plus 13.

At 500 examples the band is 9.6 points wide. At 1,000, 6.8, and you still only see a clear win 40% of the time. A 5-point gap at 100 examples gets you 13.8%. Only a 10-point gap is comfortable: 49% at 100, 99% at 500.

![Line chart of simulated evals for a true 83% against 80%: the share whose 95% interval excludes zero rises from 4% at 25 examples to 40% at 1,000 with separate samples, and from 5% to 68% with paired analysis. At 100 examples it is 7% unpaired and 11% paired. Neither reaches the 80% line.](/images/blog/eval-size-power-paired-vs-unpaired.svg)

None of this is new. Evan Miller's [Adding error bars to evals](https://arxiv.org/abs/2411.00640) (Anthropic, November 2024) makes the case that questions are a sample from a bigger population, and that the field mostly reports single numbers. His worked example lands near a thousand questions to detect a 3-point difference ([checked 2026-11-14](https://arxiv.org/html/2411.00640)). His difficulty model differs from the simulation's, so the numbers don't match exactly. The order of magnitude does.

The fix is cheap. It doesn't even need more examples.

## What does pairing change?

It shrinks the interval by about 30%, for free. Pairing means both systems answer the same examples, and you compare them example by example instead of comparing two totals.

Think of timing two runners. On different courses, the hills add noise to the comparison. On the same course, the hills cancel. Most examples are easy for both systems or hard for both, and that shared difficulty is the hill. What's left is the examples where the systems disagree.

[McNemar's test](https://en.wikipedia.org/wiki/McNemar%27s_test) uses only those. Count where A is right and B is wrong (`b`), and where B is right and A is wrong (`c`). The statistic is `(b - c)^2 / (b + c)`. McNemar published it in 1947 as a [note on correlated proportions](https://doi.org/10.1007/BF02295996). The idea is older than most of the models you're comparing.

At 100 examples, on the same data, a clear win showed up 2.2% of the time analysing it as two separate totals and 11.1% analysing it as pairs. A paired bootstrap and McNemar agreed within a point or two, so use whichever your tooling makes easy.

The simulation has to assume how correlated the two systems are, and it uses 0.5, as Miller's example does. You can measure yours from the table you already have, and it matters: at 100 examples, a correlation of 0.3 narrowed the interval 17%, 0.5 by 30%, and 0.7 by 46%. Two versions of one prompt on the same model probably disagree rarely, so expect a higher correlation and a bigger gain.

The full tables are in the [simulation README](https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-eval-set-is-too-small-to-tell).

## How many examples do you need?

More than you have. For a 3-point gap, about 2,700 per system, or about 1,350 if you pair. Here's the table to keep next to your eval. It gives the smallest `n` that reaches 80% [power](https://en.wikipedia.org/wiki/Power_of_a_test) (you catch the real gap 80% of the time) at a two-sided 5% level, from a base accuracy of 80%. "Unpaired" is `n` per system. "Paired" is `n` shared examples.

| True gap | Unpaired, per system | Paired, correlation 0.3 | Paired, 0.5 | Paired, 0.7 |
| --- | --- | --- | --- | --- |
| 2 points | 6,252 | 4,313 | 3,117 | 1,871 |
| 3 points | 2,712 | 1,871 | 1,352 | 775 |
| 5 points | 933 | 644 | 465 | 266 |
| 10 points | 202 | 139 | 101 | not possible* |

*Two systems at 90% and 80% can't correlate at 0.7. The accuracy gap caps it, so the simulation refuses.

Halving the gap you want to detect roughly quadruples the examples you need. A 10-point gap needs about 100 shared examples. A 3-point gap needs more than ten times that. The simulation agrees with the normal-approximation formula from Miller's section 5 within 5%.

## Where this stops holding

- **Early on, skip the statistics.** Hamel Husain's [advice](https://hamel.dev/blog/posts/field-guide/) is that reading real outputs and sorting the failures is the highest-return thing you can do, and that generic metrics breed false confidence. With 40 outputs nobody has read, a significance test is procrastination. His own stopping rule is to read until you stop learning anything new ([checked 2026-11-14](https://hamel.dev/blog/posts/evals/)), not a sample size. The advice here starts later, when you have two candidates and a number to choose with.
- **Binary scores only.** A 1 to 5 rubric, a similarity score, or a latency has its own variance, and the table doesn't cover it. Miller's formulas do.
- **An LLM judge adds noise.** A judge that flips its verdict on the same answer adds variance the simulation doesn't have. Treat these sample sizes as floors.
- **Real examples cluster.** The simulation draws independent coin flips. Ten questions about one document aren't independent, and Miller shows the naive standard error can come out several times too small. On DROP it was about three times.
- **Not covered:** real model outputs, a measured correlation, any non-binary metric.

## The takeaway

Tomorrow, before you compare two candidates on a number, look up the gap you care about in the table. If your eval has fewer examples than that, don't call it a win. Read the outputs. If you can run both systems on the same examples, do it and analyse the pairs: at a correlation of 0.5 it halved the examples needed.

What would change the conclusion: a real eval where the measured correlation is far from 0.5, or where the paired and unpaired intervals come out the same. Then pairing buys less than this post says.
