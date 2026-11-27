## Thread

Haiku 5.5 is 40x cheaper than Opus 5.5 per request. At $5 a wrong answer, it costs 4.4x more per useful answer.

Assumed success rates: 80% against 95%. Where the price list stops deciding ↓

[image: /images/blog/cost-per-useful-answer.svg]
---
The unit is cost per useful answer: spend plus the cost of wrong answers, divided by right answers.

→ wrong answer free: Haiku is 33x cheaper
→ wrong answer $5: Haiku is 4.4x pricier
→ break-even: $0.114
---
The quality gap moves that line more than the price gap. Opus held at an assumed 95%:

→ Haiku at 60%: break-even $0.036
→ Haiku at 90%: $0.386
→ Haiku at 94%: $2.02
---
A cascade (Haiku answers, a Haiku-priced check decides whether to escalate to Opus) was cheapest from $0.025 to $5 a failure, with a check that passes 10% of wrong answers.

At a 28% leak and $1 a failure, it loses to Opus alone.
---
Price one wrong answer before you price the token. Cheap and retryable: buy the cheap model. Over ten cents and silent: compare cost per useful answer.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/the-cheap-model-is-not-always-cheaper

## Singles

A 40x cheaper model, and it loses.

Same request, assumed 80% against 95% right: Haiku 5.5 is 33x cheaper per useful answer when a wrong answer is free, and 4.4x pricier at $5.

The price list never changed. The failure cost did.
---
The usual guess is that a cascade's check can wave through about half of wrong answers and still win.

At $1 a wrong answer, the limit is 28%. At $5, 22%.

A leaky check is a smoke alarm with a dead battery.
---
Haiku 5.5 needs to be right 94% of the time for a $2.02 failure to flip the choice against Opus. At 60% right, a $0.036 failure does it.

The quality gap sets the break-even, not the 40x.
---
A cascade saves money only if escalated tasks stay easy for Opus.

At $1 a failure and a 10% leak: $0.038 per useful answer if Opus holds 95% on them, $0.075 at 80%, a loss at 70%.

Tasks Haiku fumbles skew hard.
---
If the user can just ask again, ignore all of this.

Below about $0.025 a wrong answer, Haiku 5.5 alone was the cheapest option on assumed 80% against 95% rates.

## Link post

At $5 a wrong answer, the 40x cheaper model costs 4.4x more per useful answer.

Cost per useful answer is the number that decides model choice, and a cascade beats both models only if its check is reliable.

<BLOG_URL>

[image: /images/blog/cost-per-useful-answer.svg]

## Question

What does one wrong answer cost where you run your LLM, and did that decide which model you picked?

## Substack Note

At $5 a wrong answer, Haiku 5.5 costs 4.4 times more per useful answer than Opus 5.5, even though it's 40 times cheaper per request ($0.00055 against $0.022 for 3,000 tokens in and 500 out).

You're buying useful answers, not requests. The real unit is spend plus the cost of the wrong answers, divided by the answers that were right.

A seeded script sweeps it on assumed success rates: Haiku right 80% of the time, Opus 95%. On those, a wrong answer costing more than 11 cents makes Opus cheaper. A cheap-first cascade with a decent check beat both, but a check passing more than 28% of wrong answers lost to Opus alone at $1 a failure. The usual guess is 50%.

If a wrong answer is free and the user just asks again, buy the cheap model and move on.

<BLOG_URL>
