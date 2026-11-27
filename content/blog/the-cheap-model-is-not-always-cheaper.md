---
title: 'Is the Cheap Model Cheaper?'
publishedAt: '2026-11-14'
summary: >-
  Haiku 5.5 is 40x cheaper than Opus 5.5 per request, yet at $5 a wrong answer it costs 4.4x more per useful answer. The success rates are assumed.
tags:
  - ai
  - llm
  - cost
  - architecture
draft: true
---

Haiku 5.5 costs 40 times less than Opus 5.5 per request. When I priced a wrong answer at $5, it cost 4.4 times more per useful answer.

So where does a 40x discount stop paying? If you pick models off the price list and have never written down what one wrong answer costs you, that gap is hiding in your bill.

The prices are real. The 4.4 rests on success rates that I assumed: Haiku right 80% of the time, Opus 95%. I measured neither, so the script sweeps them.

**Price per token is the wrong unit. What matters is cost per useful answer, counting the wrong ones. On these assumed rates, Opus wins once a wrong answer costs more than 11 cents, and a cascade beats both, but only if its check is reliable.**

One request, 3,000 tokens in and 500 out, priced from the [Anthropic pricing page](https://platform.claude.com/docs/en/about-claude/pricing) as it read on 14 November 2026: $0.00055 on Haiku, $0.022 on Opus. So obviously you use Haiku. Unless you're not buying requests. You're buying useful answers. The calculator is [`cost_model.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/cost_model.py), the raw output is [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/output.txt), and the prices I copied are in [`prices.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/prices.json). It runs in about a second with no network calls.

## The short version

- A 40x price gap only decides it when wrong answers are free.
- Assuming Haiku is right 80% of the time and Opus 95%, the break-even is $0.114 per wrong answer.
- A cascade (cheap model first, a check decides whether to escalate) was cheapest from $0.025 to $5 per wrong answer, with a check that passes 10% of wrong answers.
- A leakier check kills that. At $1 per wrong answer, passing more than 28% of wrong answers loses to Opus alone.

## What is "cost per useful answer"?

Everything spent, failures included, divided by the answers that worked:

$$
\text{cost per useful answer} = \frac{c + (1 - s) \times F}{s}
$$

Here $$c$$ is one request's cost, $$s$$ is the share that come back right, and $$F$$ is what each wrong one costs downstream: a human fixing it, a refund, a user who leaves. In this setup every wrong answer gets delivered and nothing catches it, which is the harshest case for the cheap model.

## At what failure cost does the cheap model stop winning?

At 11 cents. Below that Haiku wins, above it Opus does. Here is cost per useful answer as a wrong answer gets pricier, Haiku at 80% and Opus at 95%:

| Cost of a wrong answer | Haiku, 80% right | Opus, 95% right |
| --- | --- | --- |
| $0 | $0.00069 | $0.023 |
| $0.05 | $0.013 | $0.026 |
| $0.10 | $0.026 | $0.028 |
| $0.25 | $0.063 | $0.036 |
| $1 | $0.251 | $0.076 |
| $5 | $1.25 | $0.286 |

At $0, Haiku is 33 times cheaper per useful answer. At $5, it's 4.4 times more expensive. The lines cross at $0.114.

![Line chart of cost per useful answer as the cost of a wrong answer rises from 0 to 50 cents. The cheap model alone crosses the expensive model alone at 0.114 dollars. A cascade with a check that passes 10 percent of wrong answers stays lowest; one that passes 50 percent climbs above the expensive model alone.](/images/blog/cost-per-useful-answer.svg "Haiku 5.5 and Opus 5.5, 3,000 tokens in and 500 out, prices as of 14 November 2026. Success rates (80% and 95%) and the failure cost are assumptions. From [`cost_model.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/cost_model.py) and [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/output.txt).")

The success-rate gap matters more than the price gap. Shrink it to one point (Haiku at 94%) and it takes a $2.02 failure to flip the choice. The same sums on gpt-5.4-mini and gpt-5.4 ([OpenAI pricing](https://developers.openai.com/api/docs/pricing), only 3.3 times apart) cross at $0.051. The [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/README.md) has the break-even table for both pairs.

Retries don't rescue Haiku here. As [Your 95% Reliable Agent Fails Half Its 14-Step Tasks](/blog/95-percent-per-step-is-a-coin-flip-by-step-14) covers, they only help when a failure is visible, and these are silent: the answer that looks fine and isn't.

That's the plain story. The cascade is the interesting one.

## What does a cascade change?

It beat both single models from $0.025 to $5 per wrong answer. It's an old idea, measured on benchmarks, not on your traffic. [Anthropic's agent guide](https://www.anthropic.com/engineering/building-effective-agents) lists routing easy questions to a smaller model as a standard workflow. [FrugalGPT](https://arxiv.org/abs/2305.05176) (Chen, Zaharia and Zou, 2023) tries a cheap model first and escalates when it doesn't trust the answer, reporting a match for GPT-4 at up to 98% lower cost. [RouteLLM](https://arxiv.org/abs/2406.18665) trains a router on preference data and reports cost cuts of over 2 times in certain cases.

My model targets the thing they lean on: the check. Haiku answers, 80% right. A verifier (one more Haiku call, $0.0004) passes 95% of right answers and some share of wrong ones, the leak. Rejected answers go to Opus, 95% right.

With a 10% leak, the cascade delivers 3.1% wrong answers, against 20% for Haiku alone and 5% for Opus. It spends $0.0058 per task, against $0.022 for Opus. At $1 a wrong answer that's $0.038 per useful answer, against $0.076 for Opus and $0.251 for Haiku. Below $0.025 a failure, Haiku alone wins.

At $0.25 a wrong answer, spend plus failure cost looks like this (damage included, so not an invoice):

| Useful answers | Haiku alone | Opus alone | Cascade |
| --- | --- | --- | --- |
| 10,000 | $632 | $363 | $140 |
| 1,000,000 | $63,188 | $36,316 | $13,973 |
| 100,000,000 | $6.3M | $3.6M | $1.4M |

A closed-form formula and a seeded [Monte Carlo](https://en.wikipedia.org/wiki/Monte_Carlo_method) run agreed (both are in [`cost_model.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/cost_model.py)).

## What does a leaky check do?

It erases the win, and sooner than you'd guess. My guess was that about half of wrong answers could slip through at a dollar a failure. The real limit is 28%.

| Cost of a wrong answer | Leak at which the cascade stops winning |
| --- | --- |
| $0.05 | never (it wins even at 100% leak) |
| $0.25 | 53% |
| $1 | 28% |
| $5 | 22% |

![Bars of the highest share of wrong answers the check can pass before the cascade stops beating Opus alone: it never stops at 5 cents a wrong answer, 53 percent at 25 cents, 28 percent at 1 dollar and 22 percent at 5 dollars.](/images/blog/cascade-leak-limit.svg "Anthropic pair, check passes 95% of right answers, success rates assumed. From section 6 of [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/output.txt).")

The pricier the failure, the less leak you can afford. At $5 the check must catch about four wrong answers in five. A check that waves wrong answers through is a smoke alarm with a dead battery: the cascade looks insured and isn't.

There's a second way it breaks. Opus gets its average 95% on escalated tasks, but the ones Haiku fumbled are probably the hard ones. At $1 a failure and a 10% leak, the cascade costs $0.038 per useful answer if Opus holds 95% on them. At 80% it's $0.075, level with Opus alone at $0.076. At 70% it loses.

So a cascade is an investment in a check. Without its false-positive rate on your own traffic, you can't tell which side of this table you're on.

## Where I'd stop trusting this post

**A wrong answer is often cheap.** In many apps it's visible: a chat user reads it, frowns, and asks again. If that's your product, buy the cheap model and stop reading.

**Every success rate here is assumed.** I didn't run any model on any task. The shape survives changes to them; the dollar figures don't transfer. I also gave the cascade a check and made its errors independent of the task, and both favour it. I didn't run Opus plus the same check, and real verifiers tend to fail on the same hard cases the cheap model does.

**Routers cost more than the verifier's dollars.** You pay a verifier call on every request and a second round trip on escalation, felt as latency. I only modelled the verifier's dollar cost. [Chip Huyen's guide to GenAI platforms](https://huyenchip.com/2024/07/25/genai-platform.html) says small intent classifiers add little of either, but that describes a router, not a verifier judging an answer afterwards.

**Plenty is not covered.** A cache or batch discount ([Anthropic lists 50 percent off for batch](https://platform.claude.com/docs/en/about-claude/pricing#batch-processing)), an expensive-model verifier, more than two tiers, and failure costs with a long tail.

## The takeaway

Write down what one wrong answer costs before picking a model on price. Under a couple of cents with a user who can retry: take the cheap model and build nothing clever. Over ten cents with silent failures: compare cost per useful answer, and expect the bigger model to win unless the cheap one is within a few points of it.

If the bill still hurts, build a cascade, but build the check first. A leak above roughly a quarter of wrong answers puts you back on Opus's side of the table. If you have a real task where measured rates show a leak far below my assumed one, show me, because it would overturn that.
