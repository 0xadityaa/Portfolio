---
title: 'Is Your Eval Too Small?'
publishedAt: '2026-11-26T23:24:56.270Z'
updated: '2026-11-27'
summary: >-
  On 100 examples, a real 3-point gain only looks statistically significant 7%
  of the time. Running both systems on the same examples gets you twice as far.
tags:
  - ai
  - evals
  - statistics
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/147'
---

Picture this: you spend an afternoon tweaking a prompt, run your 100-example eval suite, and watch accuracy jump from 80% to 83%. Three whole points. You merge the PR.

The question I wanted to answer: **did you improve anything, or did you get lucky?**

To find out, I ran a [simulation](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-eval-set-is-too-small-to-tell/simulate.py) where System B is 3 points better than System A (true accuracy 83% vs 80%, using seeded [NumPy](https://numpy.org/doc/stable/reference/random/generator.html) draws across 5,000 runs per sample size, from 25 to 1,000 examples). On a 100-example eval, the truly better system tied or looked *worse* **one run in three**. The raw numbers are in [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-eval-set-is-too-small-to-tell/output.txt) and [`results.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-eval-set-is-too-small-to-tell/results.json), and the write-up is the [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-eval-set-is-too-small-to-tell/README.md).

**A 50 to 100 example eval cannot tell a real 3-point gain from noise, and running both systems on the same examples is the cheapest fix available.** It doesn't make 100 examples enough, but it stretches each example further.

## The short version

- At 100 examples, a system that is 3 points better scored higher 68% of the time, tied 6%, and scored *lower* 26% of the time.
- Only 7% of those 100-example runs cleared a 95% confidence interval above zero. Even at 1,000 examples, unpaired evals only caught the win 40% of the time.
- Switching to a paired comparison on the exact same examples shrank the uncertainty band by about 30% (at 0.5 correlation) and raised detection from 2.2% to 11.1% on the same data.
- To reliably catch a 3-point gap (80% power), you need about 2,700 examples per system unpaired, or about 1,350 shared examples paired.

## Wait, doesn't the better system at least win most of the time?

Two times out of three, yes. The other third of the time, a bug-free eval with no data leakage shrugs or points the wrong way.

The confidence interval is worse. Using a standard [bootstrap](https://en.wikipedia.org/wiki/Bootstrapping_(statistics)) (resample your examples with replacement a thousand times and take the middle 95%), the uncertainty band at 100 examples is **21 points wide**. Your "+3% win" is a dot inside a band running from minus 8% to plus 13%.

Scale up to 500 examples and the band is still 9.6 points wide. At 1,000 examples it's 6.8 points, and you still only call a clear win 40% of the time. Even a 5-point true gain only shows up clearly 13.8% of the time at `n = 100`. You need a 10-point leap before a small eval is comfortable (49% at 100 examples, 99% at 500).

![A bell curve of the observed score gap on 100 examples, centered on a true gain of 3 points, with a 95 percent interval from minus 8 to plus 13 and about a quarter of runs below zero](/images/blog/eval-ci-band-n100.svg "Curve drawn as a normal approximation to the 21.2-point interval width in [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-eval-set-is-too-small-to-tell/output.txt); the 26% is the simulated share of runs where the better system scored lower.")

In the figure, the true center sits at `+3%`, but the curve is so wide at `n = 100` that over a quarter of its area falls below zero, into the "looks worse" zone.

Statisticians have been yelling about this for a while. Evan Miller's Anthropic paper [Adding error bars to evals](https://arxiv.org/abs/2411.00640) (November 2024) makes the same point: an eval set is a small sample from a huge universe of possible user inputs, yet results keep getting reported as bare single numbers. His worked example lands near a thousand questions to catch a 3-point gap ([checked 2026-11-14](https://arxiv.org/html/2411.00640)). Our difficulty assumptions differ slightly, so the exact figures shift, but the order of magnitude lines up.

## Pair your examples

Before you spend a week hand-labeling 2,000 more test cases, there is a cheap trick that cuts your uncertainty band by roughly 30%: **pair your comparison.**

Instead of comparing two separate totals, run both systems on the exact same examples and compare them question by question.

Think of timing two runners to see who is slightly faster. If Runner A runs on a hilly trail and Runner B runs on a flat track, the hills drown out a small speed difference. Put both on the *same course* and the hills cancel out. In an eval, most questions are easy for both prompts or hard for both. That shared difficulty is the hill. Once you pair them, the only questions that matter are the ones where the two systems *disagree*.

That is all [McNemar's test](https://en.wikipedia.org/wiki/McNemar%27s_test) does. Count the cases where A is right and B is wrong (`b`), and where B is right and A is wrong (`c`), then compute `(b - c)^2 / (b + c)`. Quinn McNemar published this in 1947 in a [short note on correlated proportions](https://doi.org/10.1007/BF02295996). The trick is nearly eighty years old. At a correlation of 0.5 it halves the examples you need, as the table below shows.

On the exact same 100-example dataset, analyzing two separate totals called a clear win just 2.2% of the time. Analyzing the exact same data as pairs jumped that to 11.1%. (Paired bootstrap and McNemar agreed within a point or two, so use whichever is simpler in your stack.)

![Chance of calling a real 3-point win against number of eval examples, paired against unpaired analysis of the same data: 11.1 percent against 2.2 percent at 100 examples, 67.8 against 36.3 at 1,000](/images/blog/eval-size-power-paired-vs-unpaired.svg "Same simulated data, true 83% vs 80%, correlation 0.5, 5,000 runs per size, bootstrap interval above zero. From [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-eval-set-is-too-small-to-tell/output.txt).")

One catch: to simulate pairing, I had to pick how correlated the two systems are, and I chose `0.5` (the same assumption Miller used). You can compute the real correlation from your own results table, and it matters. At 100 examples, a correlation of `0.3` shrank the interval by 17%, `0.5` by 30%, and `0.7` by 46%. Two tweaks of the same prompt on the same base model usually agree on most questions, so your correlation is probably high and pairing helps more. The raw tables are in the [simulation README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-eval-set-is-too-small-to-tell/README.md).

## So how many examples do I actually need?

Probably more than you want to hear. The cheat sheet I keep next to my own evals, from [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/your-eval-set-is-too-small-to-tell/output.txt): the smallest `n` needed to hit 80% [statistical power](https://en.wikipedia.org/wiki/Power_of_a_test) (catching a real win 80% of the time at a two-sided 5% significance level, starting from 80% baseline accuracy). "Unpaired" is `n` per system; "Paired" is `n` shared examples.

| True gap | Unpaired, per system | Paired, correlation 0.3 | Paired, 0.5 | Paired, 0.7 |
| --- | --- | --- | --- | --- |
| 2 points | 6,252 | 4,313 | 3,117 | 1,871 |
| 3 points | 2,712 | 1,871 | 1,352 | 775 |
| 5 points | 933 | 644 | 465 | 266 |
| 10 points | 202 | 139 | 101 | not possible* |

*Two binary systems at 90% and 80% mathematically cannot correlate at 0.7, so the simulation refuses.

The scaling law in that table: **cut the gap you want to detect in half, and you roughly quadruple the examples you need.** Catching a 10-point leap takes around 100 paired examples. Catching a 3-point polish takes more than ten times as many. Pairing saves 31% of the examples at correlation 0.3, 50% at 0.5 and 71% at 0.7. I checked the simulation against Miller's normal-approximation formula (section 5), and they matched within 5%.

## Where I'd stop trusting this post

**Don't do significance tests on day one.** Hamel Husain's [field guide](https://hamel.dev/blog/posts/field-guide/) makes the right call here: early on, reading real failure traces is the highest-return thing you can do. If you have 40 outputs you haven't read yet, running a bootstrap is procrastination. His stopping rule is to keep reading outputs until you stop seeing new failure modes ([checked 2026-11-14](https://hamel.dev/blog/posts/evals/)), not to chase a sample size. My table applies *later*, when you have two solid candidates and need a number to pick a winner.

**Binary pass/fail only.** If you're grading on a 1 to 5 rubric, cosine similarity, or latency, the variance behaves differently and my table doesn't cover it (Miller's paper has formulas for those).

**LLM judges add their own wobble.** If your judge model flips its own verdict when you rerun the same answer, that extra variance makes these sample sizes optimistic floors.

**Clustered questions shrink your real sample size.** My simulation treated every example as an independent coin flip. Ten questions pulled from the same PDF aren't independent, and Miller found naive standard errors can be 3x too small on clustered datasets like DROP.

I didn't test real model logs, measured correlations, or non-binary metrics here; treat this as a clean simulation with explicit assumptions.

## The takeaway

When your eval score ticks up by two or three points, check the table above before celebrating. If your test set is much smaller than the row for that gap, don't call it a win. Read the failures instead.

And whenever you *do* compare two prompts or models, always run them on the exact same examples and analyze the pairs. At a 0.5 correlation, that habit halved the examples I needed without writing a single extra test case.
