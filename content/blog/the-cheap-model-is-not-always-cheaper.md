---
title: The Cheap Model Isn't Always Cheaper
publishedAt: '2026-11-14'
summary: >-
  Price per token is the wrong unit. In my sweep, Opus 5.5 beat Haiku 5.5 per useful answer once a wrong answer cost more than 11 cents.
tags:
  - ai
  - llm
  - cost
  - architecture
draft: true
---

Haiku 5.5 is 40 times cheaper than Opus 5.5, and I'm still not sure it's the cheaper choice.

Here's the arithmetic. One request, 3,000 tokens in and 500 out, priced from the [Anthropic pricing page](https://platform.claude.com/docs/en/about-claude/pricing) as it read on 14 November 2026: $0.00055 on Haiku, $0.022 on Opus. So obviously you use Haiku. Unless you aren't buying requests. You're buying useful answers.

**Price per token is the wrong unit. What matters is cost per useful answer, counting the wrong ones and what they cost you later. With the success rates I assumed, Opus wins once a wrong answer costs more than 11 cents, and a cascade beats both, but only if its check is reliable.**

The prices are real. The success rates and failure costs are my assumptions, and I swept them instead of pretending to know them. The [script, raw output, and chart code](https://github.com/0xadityaa/Portfolio/tree/main/content/research/the-cheap-model-is-not-always-cheaper) are in the repo.

## The short version

- A 40x price gap only decides it when wrong answers are free.
- Assuming Haiku is right 80% of the time and Opus 95%, the break-even is $0.114 per wrong answer.
- A cascade (cheap model first, a check decides whether to escalate) was cheapest from $0.025 to $5 per wrong answer, with a check that passes 10% of wrong answers.
- A leakier check kills that. At $1 per wrong answer, passing more than 28% of wrong answers loses to Opus alone.

## What is "cost per useful answer"?

Everything you spent, failures included, divided by the answers that worked:

```text
cost per useful answer = (c + (1 - s) × F) / s
```

Here `c` is the cost of one request, `s` is the share that come back right, and `F` is what each wrong one costs downstream: a human fixing it, a refund, a user who leaves.

I assume every wrong answer gets delivered and nothing catches it. That's the harshest setup for the cheap model, and it's my choice.

## At what failure cost does the cheap model stop winning?

I gave Haiku 80% and Opus 95%. Those are made up, just a gap to sweep. Here's what each costs per useful answer as a wrong answer gets pricier:

| Cost of a wrong answer | Haiku, 80% right | Opus, 95% right |
| --- | --- | --- |
| $0 | $0.00069 | $0.023 |
| $0.05 | $0.013 | $0.026 |
| $0.10 | $0.026 | $0.028 |
| $0.25 | $0.063 | $0.036 |
| $1 | $0.251 | $0.076 |
| $5 | $1.25 | $0.286 |

At $0, Haiku is 33 times cheaper per useful answer. At $5, it's 4.4 times more expensive. The lines cross at $0.114.

![Chart: cost per useful answer against the cost of a wrong answer. The cheap model alone crosses the expensive model alone at $0.114; a cascade with a good check stays lowest, while a cascade with a leaky check climbs above the expensive model](/images/blog/cost-per-useful-answer.svg)

The success-rate gap matters more than the price gap. Shrink it to one point (Haiku at 94%) and you'd need a $2.02 failure to flip it. The same sums on gpt-5.4-mini and gpt-5.4, from the [OpenAI pricing page](https://developers.openai.com/api/docs/pricing), cross at $0.051, because that pair is only 3.3x apart. The [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/the-cheap-model-is-not-always-cheaper/README.md) has the full break-even table.

Retries don't rescue the cheap model here. As I covered in [95% Per Step Is a Coin Flip by Step 14](/blog/95-percent-per-step-is-a-coin-flip-by-step-14), they only help when a failure is visible, and I mean the silent kind: the answer that looks fine and isn't.

## What does a cascade change?

It's an old idea. [Anthropic's agent guide](https://www.anthropic.com/engineering/building-effective-agents) lists routing easy questions to a smaller model as a standard workflow. [FrugalGPT](https://arxiv.org/abs/2305.05176) (Chen, Zaharia and Zou, 2023) tries a cheap model first and moves up only when it doesn't trust the answer, and reports matching GPT-4 at up to 98% lower cost in their experiments. [RouteLLM](https://arxiv.org/abs/2406.18665) trains a router on human preference data and reports cost cuts of over 2 times in certain cases. Both are measured on benchmarks, not on your traffic.

I modelled the thing they both lean on: how good the check is. Haiku answers, 80% right. A verifier (one more Haiku call, $0.0004) passes 95% of right answers and some share of wrong ones, the leak. Rejected answers go to Opus, which is right 95% of the time and isn't checked again.

With a leak of 10%, the cascade delivers 3.1% wrong answers, against 20% for Haiku alone and 5% for Opus. It spends $0.0058 per task, against $0.022 for Opus. At $1 per wrong answer that's $0.038 per useful answer, against $0.076 for Opus and $0.251 for Haiku.

It was cheapest everywhere from $0.025 to $5. Below $0.025, Haiku alone wins.

At 100 million useful answers with a $0.25 failure cost, the totals are $1.4M for the cascade, $3.6M for Opus and $6.3M for Haiku. Those include the damage, so they're not an invoice. A closed-form formula and a seeded [Monte Carlo](https://en.wikipedia.org/wiki/Monte_Carlo_method) run of 200,000 tasks per row agreed.

One flag. The cascade gets a second opinion the single models don't, which favours my thesis. The fair rival is Opus plus the same check, and I didn't run it.

## What does a leaky check do?

It erases the win, and faster than I guessed. I expected the cascade to stop beating Opus at about half of wrong answers slipping through, at a dollar a failure. It stopped at 28%.

| Cost of a wrong answer | Leak at which the cascade stops winning |
| --- | --- |
| $0.05 | never (it wins even at 100% leak) |
| $0.25 | 53% |
| $1 | 28% |
| $5 | 22% |

The pricier the failure, the less leak you can afford. At $5 the check has to catch about four wrong answers in five.

There's a second way it breaks. I gave Opus its average 95% on escalated tasks, but the ones Haiku fumbled are probably the hard ones. At $1 per failure and a 10% leak, the cascade costs $0.038 per useful answer if Opus holds 95% on them. At 80% it's $0.075, level with Opus alone at $0.076. At 70% it loses.

So a cascade is an investment in a check. If you can't measure the check's false-positive rate on your own traffic, you don't know which side of this table you're on.

## Where I'd stop trusting this post

**In a lot of apps a wrong answer is cheap and visible.** A chat user reads it, frowns, and asks again. That's the strongest objection, and my own numbers back it: below about $0.025 per failure, Haiku alone was cheapest. If that's your product, buy the cheap model and stop reading.

**Every success rate here is a guess.** The 80%, the 95%s and the check's rates are mine, and I measured no model on any task. The shape survives changes to them but the dollar figures don't transfer. I also made the check's errors independent of everything else, which flatters the cascade. Real verifiers tend to fail on the same hard cases the cheap model does.

**Routers cost something.** A cascade adds a verifier call to every request and a second round trip on escalation, which users feel as latency. [Chip Huyen's guide to GenAI platforms](https://huyenchip.com/2024/07/25/genai-platform.html) says small intent classifiers add little latency or cost. That's a router, not a verifier that judges an answer afterwards. I modelled the second, and only its dollar cost.

**Not tested:** a cache or batch discount ([Anthropic lists 50 percent off for batch](https://platform.claude.com/docs/en/about-claude/pricing#batch-processing), which scales both sides), an expensive-model verifier, and more than two tiers. My failure cost is a flat number, and real ones have a long tail.

## The takeaway

Before picking a model on price, write down what one wrong answer costs you. Under a couple of cents with a user who can just retry: take the cheap model and build nothing clever. Over ten cents with silent failures: compare cost per useful answer, and expect the bigger model to win unless the cheap one is within a few points of it.

If the bill still hurts, build a cascade, but build the check first. A leak above roughly a quarter of wrong answers puts you back on Opus's side of the table.

What would change my mind is a real task where the cheap model's and the verifier's actual rates show a leak far below what I assumed. I'd like to measure that next.
