## Hook

The 40x cheaper model might be costing you more.

Haiku 5.5: $0.00055 a request. Opus 5.5: $0.022.

At $5 a wrong answer, Haiku costs 4.4x more per useful answer.

Success rates assumed: 80% vs 95%.

What does one wrong answer cost you?

[image: public/images/blog/cost-per-useful-answer.svg]

## Thread

The 40x cheaper model might be costing you more.

Haiku 5.5 and Opus 5.5, priced per useful answer, not per request. Success rates are assumed, not measured. Here's where the price list stops deciding it ↓
---
You're not buying requests. You're buying right answers:

(spend + wrong answers x cost of each) / right answers

Assumed 80% vs 95% right:
→ wrong answer free: Haiku is 33x cheaper per useful answer
→ wrong answer $5: Haiku is 4.4x pricier
→ break-even: $0.114
---
The quality gap moves that line more than the price gap. Opus held at an assumed 95%:

→ Haiku at 60%: break-even $0.036
→ Haiku at 90%: $0.386
→ Haiku at 94%: $2.02
---
Then a cascade: Haiku answers, a Haiku-priced check decides whether to escalate to Opus.

With an assumed 10% leak, it was cheapest from $0.025 to $5 a failure.

Caveat: only the cascade gets a check, so that isn't like-for-like. Opus plus the same check wasn't run.
---
A leaky check erases the win.

At $1 a wrong answer, a check that passes more than 28% of wrong answers loses to Opus alone. At $5 the limit is 22%.

The usual guess is about 50%.
---
Strongest objection: a wrong answer is often free and visible. The user frowns and asks again. Below about $0.025 a failure, Haiku alone was cheapest.

Want the cost-per-useful-answer script and the cascade simulation? Reply COST and I'll DM it.
---
Rule of thumb: price one wrong answer before the token. Cheap and retryable, buy the cheap model. Over ten cents and silent, compare cost per useful answer.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/the-cheap-model-is-not-always-cheaper

## Singles

A 40x price gap, and the cheap model still loses.

Same request, assumed 80% vs 95% right:
→ wrong answer free: Haiku 5.5 is 33x cheaper per useful answer
→ wrong answer $5: Haiku is 4.4x pricier

The price list never changed. Your failure cost did.

---

Most model choices start at the price list. Start at cost per useful answer.

Break-even cost of a wrong answer, Opus 5.5 held at an assumed 95%:
→ Haiku 5.5 at 60%: $0.036
→ at 90%: $0.386
→ at 94%: $2.02

The quality gap decides it, not the 40x.

---

100M useful answers, $0.25 per wrong answer, assumed 80% vs 95% right.

All-in cost, damage included, not an invoice:
→ Haiku 5.5 alone: $6.3M
→ Opus 5.5 alone: $3.6M
→ cheap-first cascade, 10%-leak check: $1.4M

Only the cascade gets a check. Price the check before crediting it.

---

Haiku 5.5 is 40x cheaper per request than Opus 5.5. Until a wrong answer costs more than 11 cents.

Past that, on an assumed 80% vs 95% right, Opus is cheaper per useful answer.

Know your failure cost before you read the price list.

---

If the user can just ask again, ignore all of this.

On assumed 80% vs 95% rates, Haiku 5.5 alone was cheapest below about $0.025 a wrong answer. The cascade only pays once failures are silent and cost more.

## CTA

COST | the cost-per-useful-answer script and cascade simulation | https://github.com/0xadityaa/Portfolio/tree/main/content/research/the-cheap-model-is-not-always-cheaper

## Reply prompts

On "use the cheapest model that works": in this model, with Haiku 5.5 at an assumed 80% right and Opus 5.5 at 95%, Opus is cheaper per useful answer once a wrong answer costs more than $0.114. What does a wrong answer cost where you run it?

If you route cheap-first with a verifier: in this model, at $1 a wrong answer, a verifier that passes more than 28% of wrong answers loses to the big model alone (rates assumed). Has anyone measured their verifier's false-positive rate on real traffic?

On price per token: same 3,000-in, 500-out request, assumed 80% vs 95% right. Free wrong answers make Haiku 5.5 33x cheaper per useful answer than Opus 5.5. At $5 a wrong answer it's 4.4x pricier.

## Substack Note

At $5 a wrong answer, Haiku 5.5 costs 4.4 times more per useful answer than Opus 5.5, even though it's 40 times cheaper per request ($0.00055 against $0.022 for 3,000 tokens in and 500 out).

You aren't buying requests, you're buying useful answers. The real unit is what you spent plus what the wrong answers cost you, divided by the answers that were right.

A seeded script sweeps it. The success rates are assumptions, not measurements: Haiku right 80% of the time, Opus 95%. On those, a wrong answer costing more than 11 cents makes Opus cheaper. A cheap-first cascade with a decent check beat both, but a check passing more than 28% of wrong answers lost to Opus alone at $1 a failure. The usual guess is 50%.

If a wrong answer is free and the user just asks again, buy the cheap model and move on. Tables, limits and code are in the post.

https://www.0xadityaa.dev/blog/the-cheap-model-is-not-always-cheaper
