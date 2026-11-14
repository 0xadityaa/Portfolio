---
title: The Cheap Model Isn't Always Cheaper
publishedAt: '2026-11-14'
summary: >-
  Price per token is the wrong unit. In a sweep I ran, an Opus-class model beat a Haiku-class one per useful answer once a wrong answer cost over 11 cents.
tags:
  - ai
  - llm
  - cost
  - architecture
draft: true
---

Here's a small experiment. I took one request, 3,000 tokens in and 500 out, and priced it on two models from the same company, using the [Anthropic pricing page](https://platform.claude.com/docs/en/about-claude/pricing) as it read today. Claude Haiku 5.5 costs $0.00055. Claude Opus 5.5 costs $0.022. That's 40 times more for the same request.

So obviously you use Haiku. Unless the thing you're buying isn't a request. It's a useful answer, and those aren't the same unit.

This is the claim I'll defend: **price per token is the wrong unit. What matters is cost per useful answer, once you count the wrong ones and what they cost downstream. Under plausible failure costs the cheap model is the expensive choice, and a cascade beats both, but only if its check is reliable.**

The prices below are real, copied today. The success rates and failure costs are my assumptions, and I sweep them instead of pretending to know them. The [script, raw output, and chart code](https://github.com/0xadityaa/Portfolio/tree/main/content/research/the-cheap-model-is-not-always-cheaper) are in the repo.

## The short version

- Cost per useful answer is (spend on attempts + cost of wrong answers) divided by the number of right ones. A 40x price gap only decides it when wrong answers are free.
- With Haiku 5.5 at an assumed 80% right and Opus 5.5 at an assumed 95%, the break-even is $0.114. If a wrong answer costs more than that, Opus is cheaper per useful answer.
- A cascade (cheap answers, a check decides whether to escalate) was cheapest across the whole $0.025 to $5 sweep, when the check passed 10% of wrong answers.
- A leaky check erases that. At $1 per wrong answer, a check that passes more than 28% of wrong answers loses to the expensive model alone.

## What is "cost per useful answer"?

Say you send N tasks to a model. A fraction `s` come back right. The rest are wrong, and each wrong one costs you `F` downstream: a human fixing it, a refund, a user who leaves. With `c` as the cost of one request:

```text
cost per useful answer = (c + (1 - s) × F) / s
```

Divide everything you spent, failures included, by the answers that worked. I'm assuming every answer is delivered and nothing catches the wrong ones. That's a modelling choice, and it's the harshest one for the cheap model.

When `F` is zero, cost per useful answer is just `c / s`, so the price gap dominates. As `F` grows, the `(1 - s)` term takes over, and the cheap model's lower success rate starts to cost real money.

I ran it for a pair from each of two providers. The OpenAI prices are from the [OpenAI pricing page](https://developers.openai.com/api/docs/pricing), also checked today. I picked a mini and its same-generation parent. The page lists newer names too, so "flagship" here just means the larger sibling.

| Model | Input $/MTok | Output $/MTok | One request (3,000 in, 500 out) |
| --- | --- | --- | --- |
| Claude Haiku 5.5 | 0.10 | 0.50 | $0.00055 |
| Claude Opus 5.5 | 4.00 | 20.00 | $0.022 |
| gpt-5.4-mini | 0.75 | 4.50 | $0.0045 |
| gpt-5.4 | 2.50 | 15.00 | $0.015 |

The Claude pair is 40x apart. The OpenAI pair is 3.3x. That difference matters a lot in a minute.

## At what failure cost does the cheap model stop winning?

For the Claude pair I assumed the cheap model is right 80% of the time and the expensive one 95%. Those are numbers I made up to have a gap to sweep, not measurements of either model. Here's what each costs per useful answer as the cost of a wrong answer rises.

| Cost of a wrong answer | Haiku-class, 80% right | Opus-class, 95% right |
| --- | --- | --- |
| $0 | $0.00069 | $0.023 |
| $0.05 | $0.013 | $0.026 |
| $0.10 | $0.026 | $0.028 |
| $0.25 | $0.063 | $0.036 |
| $1 | $0.251 | $0.076 |
| $5 | $1.25 | $0.286 |

At $0 the cheap model is 33 times cheaper per useful answer. At $5 it's 4.4 times more expensive. Set the two costs equal and solve for the crossing:

```text
F* = (c_exp / s_exp - c_cheap / s_cheap) / (1 / s_cheap − 1 / s_exp)
```

For Haiku at 80% and Opus at 95%, `F*` is $0.114. For gpt-5.4-mini at 80% and gpt-5.4 at 95% it's $0.051, lower because the price gap is smaller.

![Chart: cost per useful answer against the cost of a wrong answer. The cheap model alone crosses the expensive model alone at $0.114; a cascade with a good check stays lowest, while a cascade with a leaky check climbs above the expensive model](/images/blog/cost-per-useful-answer.svg)

Everything hangs on the success-rate gap. Here is `F*` as the cheap model gets better, with the expensive one held at 95%:

| Cheap model right | Break-even, Claude pair | Break-even, OpenAI pair |
| --- | --- | --- |
| 60% | $0.036 | $0.013 |
| 80% | $0.114 | $0.051 |
| 90% | $0.386 | $0.184 |
| 94% | $2.02 | $0.982 |
| 95% | never | never |

With a 15 point gap, about ten cents of failure cost flips it. With a one point gap, you'd need two dollars. With no gap the cheap model always wins, which is correct and also a reminder that I'm the one choosing the gap.

Retries change this arithmetic in the way I covered in [95% Per Step Is a Coin Flip by Step 14](/blog/95-percent-per-step-is-a-coin-flip-by-step-14). They only help when a failure is visible. Here I mean the silent kind: the answer that looks fine and isn't.

## What does a cascade change?

The idea isn't new, and [Anthropic's agent guide](https://www.anthropic.com/engineering/building-effective-agents) lists routing easy questions to a smaller model as a standard workflow. [FrugalGPT](https://arxiv.org/abs/2305.05176) (Chen, Zaharia and Zou, 2023) proposed an LLM cascade: try a cheap model first, and move up to a stronger one only when you don't trust the answer. Their abstract reports matching GPT-4 at up to 98% lower cost in their experiments. [RouteLLM](https://arxiv.org/abs/2406.18665) trains a router on human preference data to pick the strong or weak model per query, and reports cost reductions of over 2 times in certain cases. Both are measured on benchmarks, not on your traffic.

What I did is model the thing they both depend on: how good the check is. In my cascade:

1. The cheap model answers, 80% right.
2. A verifier looks at the answer. It passes 95% of right answers (the [true-positive rate](https://en.wikipedia.org/wiki/Sensitivity_and_specificity)). It passes some share `f` of wrong ones (false positives, the leak).
3. A rejected answer goes to the expensive model, 95% right, and that answer is delivered unchecked.

The verifier is one more Haiku-class call, 3,500 tokens in and 100 out: $0.0004. I ran it in closed form and in a seeded [Monte Carlo](https://en.wikipedia.org/wiki/Monte_Carlo_method) simulation of 200,000 tasks per row. The two agreed to within sampling noise, for example 3.10% wrong answers delivered in the formula against 3.16% simulated at a leak of 0.10.

With a leak of 0.10, the cascade delivers 3.1% wrong answers, against 20% for the cheap model alone and 5% for the expensive one. It spends $0.0058 per task, against $0.022 for Opus. Per useful answer:

| Cost of a wrong answer | Cheap alone | Expensive alone | Cascade, leak 0.10 |
| --- | --- | --- | --- |
| $0.05 | $0.013 | $0.026 | $0.0076 |
| $0.25 | $0.063 | $0.036 | $0.014 |
| $1 | $0.251 | $0.076 | $0.038 |
| $5 | $1.25 | $0.286 | $0.166 |

Scanning the whole range, the cheap model alone is the cheapest only up to $0.025. Above that, the cascade wins, all the way to $5.

At volume, with a wrong answer costing $0.25. These totals include the failure cost, so they're spend plus damage, not an invoice:

| Useful answers | Cheap alone | Expensive alone | Cascade |
| --- | --- | --- | --- |
| 10,000 | $632 | $363 | $140 |
| 1,000,000 | $63,188 | $36,316 | $13,973 |
| 100,000,000 | $6.3M | $3.6M | $1.4M |

One flag, right where it happens. The cascade beats the expensive model partly because the verifier is a second opinion the single models don't get. That favours my thesis. A fair rival is "expensive model plus the same check", which I did not run.

## What does a leaky check do?

It erases the win, faster than I expected. I guessed the cascade would stop beating the expensive model at about half of wrong answers slipping through, at a dollar a failure. It stopped at 28%.

Here is the leak at which the cascade is no cheaper than the expensive model alone, for the Claude pair:

| Cost of a wrong answer | Break-even leak |
| --- | --- |
| $0.05 | none (cascade wins even at 100% leak) |
| $0.25 | 53% |
| $1 | 28% |
| $5 | 22% |

The more a wrong answer costs, the less leak you can afford. At $0.05 the check barely matters. At $5 it must catch about four wrong answers in five.

There's a second way it breaks, and it's a modelling choice again. I gave the expensive model 95% on escalated tasks, its average. But the tasks the cheap model fumbled are probably the harder ones. At a $1 failure cost and a leak of 0.10, the cascade costs $0.038 per useful answer if the expensive model holds 95% on escalated work. At 80% it's $0.075, level with Opus alone at $0.076. At 70% it loses.

So a cascade is an investment in a check. If you can't measure the check's false-positive rate on your own traffic, you don't know which side of these tables you're on.

## Where I'd stop trusting this post

**In a lot of apps a wrong answer is cheap and visible.** A chat user reads it, frowns, and asks again. That's the steelman, and my own numbers back it. With failures free and retries free, cost per useful answer is `c / s`, and Haiku wins unless it's right less than 2.4% of the time. At a failure cost under about $0.025, a cascade doesn't beat it either: in my sweep Haiku alone was cheapest there. If that's your product, buy the cheap model and stop reading.

The OpenAI pair shows the other side of that. With a 3.3x price gap, the cheap model needs to be right more than 28.5% of the time to win at $0 failure cost, and the break-even drops to five cents. A small price gap leaves little room for a quality gap.

**Routers cost something.** A cascade adds a verifier call to every request, and an escalation adds a second round trip. That's latency your users feel. [Chip Huyen's guide to GenAI platforms](https://huyenchip.com/2024/07/25/genai-platform.html) describes a router as an intent classifier in front of the models, and says small classifiers add little latency or cost. A classifier that routes by intent isn't a verifier that judges an answer afterwards. I modelled the second, and only its dollar cost.

**Every success rate here is a guess.** The 80%, the 95%s and the check's rates are mine. I measured no model on any task. The shape survives changes to them, but the dollar figures don't transfer. The check's errors are independent of everything else in my model, which flatters the cascade. Real verifiers tend to fail on the same hard cases the cheap model does.

**Not tested:** a cache or batch discount ([Anthropic lists a 50 percent batch discount](https://platform.claude.com/docs/en/about-claude/pricing#batch-processing), which scales both sides), an expensive-model verifier, and more than two tiers. My failure cost is a flat number. Real ones have a long tail.

## The takeaway

Here's the rule I'd use, from this simulation and not from a production system. Before picking a model on price, write down what one wrong answer costs you. If it's under a couple of cents and the user can just retry, take the cheap model and don't build anything clever. If it's more than ten cents and the wrong answers are silent, price per useful answer, not per token, and expect the bigger model to win unless the cheap one is within a few points of it.

Then, if the bill still hurts, build a cascade, but build the check first and measure its false-positive rate on real traffic. Without that number you're guessing, and a leak above roughly a quarter of wrong answers puts you back on the expensive model's side of the table.

What would change my mind: a measurement, on a real task, of the cheap model's and the verifier's actual rates, showing the leak is far below what I assumed. I'd like to run that next.
