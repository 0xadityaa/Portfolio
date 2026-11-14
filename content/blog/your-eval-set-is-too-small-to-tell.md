---
title: Your Eval Set Is Too Small to Tell
publishedAt: '2026-11-14'
summary: >-
  On 100 examples, a real 3-point gain shows up as significant 7% of the time. I simulated it, then measured how much pairing the comparison fixes.
tags:
  - ai
  - evals
  - statistics
draft: true
---

Say you tweak a prompt and your score goes from 80 to 83 on 100 examples. You ship it. It feels like progress, because three is bigger than zero.

That's a thought experiment, not a story from my work. But I wanted to know how often it would be true, so I simulated it. Two systems (seeded [NumPy](https://numpy.org/doc/stable/reference/random/generator.html) draws), one genuinely better by 3 points (83% against 80%), compared on eval sets from 25 to 1,000 examples, five thousand times each. The simulation, its seed, and its raw output are [in the repo](https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-eval-set-is-too-small-to-tell).

The claim I'll defend: **a 50 to 100 example eval can't tell a 3-point improvement from noise, and running both systems on the same examples and comparing them pair by pair is the cheapest fix.** It won't make 100 examples enough. It makes them go about twice as far.

## The short version

- At 100 examples and a true 83 against 80, the better system scored higher 68% of the time, tied 6%, and scored lower 26% of the time.
- The 95% confidence interval on the difference was 21 points wide. Only 7% of those evals could say "better" with the interval above zero.
- Scoring both systems on the same examples and analysing them as pairs cut the interval by about 30% in my simulation, and made the same eval about 1.6 times as likely to show the win (11% against 7%).
- To detect a 3-point gap at 80% power I needed about 2,700 examples per system unpaired, or about 1,350 paired. At a 10-point gap, 200 against 100.

## How often does the better system win on 100 examples?

Not as often as it feels like it should. Here's the setup. System B is right 80% of the time. System A is right 83% of the time. I score each on `n` examples, record which one looks better, and repeat 5,000 times. I'll call the outcomes of the two systems independent for now, so they get their own examples.

| Examples | A scores higher | Tie | A scores lower | 95% CI width of A minus B |
| --- | --- | --- | --- | --- |
| 25 | 53.7% | 13.9% | 32.5% | 41.4 points |
| 50 | 59.7% | 9.3% | 31.0% | 29.7 points |
| 100 | 67.9% | 6.1% | 25.9% | 21.2 points |
| 200 | 75.6% | 3.5% | 20.9% | 15.1 points |
| 500 | 88.0% | 1.4% | 10.6% | 9.6 points |
| 1,000 | 95.5% | 0.5% | 3.9% | 6.8 points |

Read the 100 row twice. The truly better system looked worse or tied in about one eval out of three. And that was with a clean, random, honest eval. No bugs, no leakage.

The interval width is the part that stays with me. The 95% interval is a [bootstrap](https://en.wikipedia.org/wiki/Bootstrapping_(statistics)) one: resample the examples with replacement, recompute the difference a thousand times, take the middle 95%. At 100 examples it spans 21 points. A score "going up 3" is a dot inside a band that runs from about minus 8 to plus 13.

So how often could you actually *say* A is better, with the interval wholly above zero? At 100 examples, 6.9% of the time. At 500, 21%. At 1,000, 40%. For a 5-point gap, 100 examples gets you 13.8%. Only the 10-point gap is comfortable: 49% at 100, 99% at 500.

![Line chart of simulated evals for a true 83% against 80%: the share whose 95% interval excludes zero rises from 4% at 25 examples to 40% at 1,000 with separate samples, and from 5% to 68% with paired analysis. At 100 examples it is 7% unpaired and 11% paired. Neither reaches the 80% line.](/images/blog/eval-size-power-paired-vs-unpaired.svg)

This isn't a new result. Evan Miller's [Adding error bars to evals](https://arxiv.org/abs/2411.00640) (Anthropic, November 2024) makes the same argument: evals are experiments, questions are a sample from a bigger population, and the field has mostly reported single numbers without error bars. His worked power example lands near a thousand questions to detect a 3-point difference, and he suggests new evals have at least about that many ([checked 2026-11-14](https://arxiv.org/html/2411.00640)). His model of question difficulty differs from mine, so the numbers don't match exactly. The order of magnitude does.

## What does pairing change?

Pairing means both systems answer the same examples, and you compare them example by example instead of comparing two totals.

Why it helps: most examples are easy for both systems or hard for both. If a question is too hard for A, it's probably too hard for B. That shared difficulty is noise in an unpaired comparison, and it cancels in a paired one. All that's left is the examples where the systems disagree.

[McNemar's test](https://en.wikipedia.org/wiki/McNemar%27s_test) is the classic way to use only those. Count the examples where A is right and B is wrong (call it `b`), and the ones where B is right and A is wrong (`c`). The statistic is `(b - c)^2 / (b + c)`. Examples both got right, or both got wrong, drop out. McNemar published it in 1947 as a [note on the sampling error of the difference between correlated proportions](https://doi.org/10.1007/BF02295996). The idea is older than most of the models you're comparing.

For my simulation I needed to say how correlated the systems are. I used a correlation of 0.5 between the two right-or-wrong outcomes. That's an assumption. Miller's worked example also uses 0.5, but his example is made up too. I haven't measured it on a real eval, and you can: it falls out of the same table you already have.

Here's the same 83 against 80, same examples for both systems, analysed two ways:

| Examples | CI width, unpaired | CI width, paired | Narrower by | CI above zero, unpaired | CI above zero, paired | McNemar |
| --- | --- | --- | --- | --- | --- | --- |
| 50 | 29.7 | 20.7 | 30% | 1.1% | 7.2% | 6.9% |
| 100 | 21.1 | 14.9 | 30% | 2.2% | 11.1% | 11.7% |
| 200 | 15.1 | 10.6 | 30% | 4.1% | 17.4% | 19.1% |
| 500 | 9.6 | 6.8 | 29% | 13.7% | 38.8% | 40.1% |
| 1,000 | 6.8 | 4.8 | 29% | 36.3% | 67.8% | 68.5% |

Two things in there. First, the interval is about 30% narrower at every size. Second, the unpaired analysis of correlated data is worse than the independent case: 2.2% at 100 examples. When the outcomes are correlated and you ignore it, your interval is too wide, so you're too timid. You throw away power you already paid for.

Also notice that the paired bootstrap and McNemar agree to within a point or two. Use whichever your tooling makes easy.

The size of the gain depends on that correlation. At 100 examples, a correlation of 0.3 narrowed the interval by 17%, 0.5 by 30%, and 0.7 by 46%. If your two systems are two versions of the same prompt on the same model, expect them to disagree on few examples, which means a high correlation, which means pairing helps more.

## How many examples do I need?

Here's the table to keep next to your eval. It gives the smallest `n` that reaches 80% [power](https://en.wikipedia.org/wiki/Power_of_a_test) (the test catches the real gap 80% of the time) at a two-sided 5% level. Base accuracy is 80%. "Unpaired" is `n` per system. "Paired" is `n` shared examples, and it depends on the correlation.

| True gap | Unpaired, per system | Paired, correlation 0.3 | Paired, 0.5 | Paired, 0.7 |
| --- | --- | --- | --- | --- |
| 2 points | 6,252 | 4,313 | 3,117 | 1,871 |
| 3 points | 2,712 | 1,871 | 1,352 | 775 |
| 5 points | 933 | 644 | 465 | 266 |
| 10 points | 202 | 139 | 101 | not possible* |

*A correlation of 0.7 isn't reachable for two systems at 90% and 80%. The simulation refuses to run it, and that's honest: the maximum correlation is capped by how different the two accuracies are.

I also checked the simulation against the plain normal-approximation formula, which is the same one in Miller's section 5. They agree to within 5%. For 3 points unpaired the formula says 2,626 and the simulation says 2,712.

The pattern: halving the gap you want to detect roughly quadruples the examples you need. A 10-point gap needs about 100 shared examples. A 3-point gap needs more than ten times that. That's why "does this 50-example set tell me anything about a 3-point change" has a boring answer.

## Where I'd stop trusting this post

**The strongest objection is that you shouldn't be doing this early on.** Hamel Husain's [advice](https://hamel.dev/blog/posts/field-guide/) is that error analysis, reading real outputs and sorting the failures into categories, is the highest-return activity, and that generic metrics can create false confidence. Early in a product he's right, and I'd go further: if you have 40 outputs and haven't read them, a significance test is procrastination. His own number for how much to read is "until you stop learning anything new" ([checked 2026-11-14](https://hamel.dev/blog/posts/evals/)), not a sample size. Nothing here argues against that.

My advice applies at a narrower moment: when you've already got two candidates and you're choosing between them on a number. Reading 50 outputs tells you what's broken. It can't tell you whether candidate B is 3 points better than candidate A. For that question, noise is what you're up against.

**It's binary scores only.** Right or wrong. A 1 to 5 rubric, a similarity score, or a latency has its own variance, and my table doesn't cover it. Miller's formulas do handle non-binary scores. Hamel also argues for binary pass or fail judgments with written critiques, partly because granular scores are harder to reason about.

**An LLM judge adds noise on top.** If a judge model flips its verdict on the same answer, that's extra variance my simulation doesn't have. Real evals are noisier than these tables. Treat the sample sizes as floors.

**Examples aren't independent in real life.** I drew them as independent coin flips. If your examples cluster (ten questions about the same document, say), Miller shows the naive standard error can be several times too small. On the DROP benchmark the clustered one was about three times the naive one.

**The examples must look like real traffic.** A very precise measurement on the wrong examples is a precise answer to the wrong question. A thousand synthetic prompts won't tell you about your users.

**What I haven't tested:** real model outputs, a real measured correlation, or any non-binary metric. Everything here is a simulation with stated assumptions.

## The takeaway

Here's my rule. Before comparing two candidates on a number, look up the gap you care about in the table. If your eval has fewer examples than that, don't read the difference as a win. Read the outputs instead.

If you can run both candidates on the same examples, do that, and analyse the pairs with McNemar's test or a paired bootstrap. It's free, and in my simulation it halved the examples needed at a correlation of 0.5.

What would change my mind: a measured correlation on a real eval far from 0.5, or a real eval where the paired and unpaired intervals came out the same. If you've got one, I'd like to see it.
