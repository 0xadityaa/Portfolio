## Hook

Haiku 5.5 is 40x cheaper than Opus 5.5 per request. Price a wrong answer at $5 and, on my assumed 80% vs 95% success rates, Haiku costs 4.4x more per useful answer. Modelled, not measured.

What does one wrong answer cost in your product?

[image: public/images/blog/cost-per-useful-answer.svg]

## Thread

Haiku 5.5 is 40x cheaper than Opus 5.5 per request: $0.00055 against $0.022. At $5 a wrong answer it costs 4.4x more per useful answer. The success rates are my assumptions (Haiku 80%, Opus 95%), not measurements. Here's what moved the number:

---

You buy right answers, not requests: cost per useful answer = (spend + wrong answers x what each costs) / right answers.

On the assumed rates, the break-even is $0.114 per wrong answer. Free failures: Haiku is 33x cheaper per useful answer. $5 failures: 4.4x more expensive.

---

The quality gap moves it more than the price gap. Hold Opus at an assumed 95%.

Haiku at 60%: break-even $0.036.
Haiku at 90%: $0.386.
Haiku at 94%: $2.02.

---

A cascade: Haiku answers, a Haiku-priced check decides whether to escalate to Opus. With an assumed check that passes 10% of wrong answers, it was cheapest of the three from $0.025 to $5 a failure. Fair warning: the single models get no check, so that isn't like-for-like.

---

A leaky check erases it. At $1 a wrong answer, a check that passes more than 28% of wrong answers loses to Opus alone. Before running it I'd written down about 50%. At $5 the limit is 22%.

---

Strongest objection: when a wrong answer is free and the user just asks again, Haiku wins. Below about $0.025 a failure it beat the cascade too. And every rate here is assumed, with the check's errors independent of the task, which flatters the cascade.

---

Rule: price one wrong answer before the token. Under a couple of cents and retryable, take the cheap model. Over ten cents and silent, compare cost per useful answer. Build a cascade after measuring the check's leak.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/the-cheap-model-is-not-always-cheaper

## Singles

At 100M useful answers, $0.25 a wrong answer, assumed 80% (Haiku 5.5) vs 95% (Opus 5.5): Haiku alone costs $6.3M all-in, Opus alone $3.6M, a cheap-first cascade with a 10%-leak check $1.4M. Damage included, not an invoice. The cascade also gets a check the others don't.

---

Same two models, same request, assumed 80% vs 95% right.

A wrong answer is free: Haiku 5.5 is 33x cheaper per useful answer than Opus 5.5.
A wrong answer costs $5: Haiku is 4.4x more expensive.

The price list never changed. The cost of failure did.

---

Common advice: use the cheapest model that works. Modelled: with Haiku at an assumed 94% and Opus at 95%, a wrong answer has to cost $2.02 before Opus wins. At 60%, it's $0.036. The quality gap matters more than the 40x price gap.

---

I wrote down a guess before running the sim: at $1 a wrong answer, a cascade's check could pass about half of wrong answers before Opus alone won. The model said 28%. At $5 it's 22%. The pricier the failure, the less leak you can afford. Rates assumed.

---

If a wrong answer costs under about 2.5 cents and the user just retries, buy the cheap model and build nothing clever: on my assumed 80% vs 95%, Haiku alone beat the cascade there. Over 10 cents with silent failures, compare cost per useful answer instead.

## Reply prompts

On "use the cheapest model that works": in my model, with Haiku 5.5 at an assumed 80% right and Opus 5.5 at 95%, Opus is cheaper per useful answer once a wrong answer costs more than $0.114. What does a wrong answer cost where you run it?

If you're routing cheap-first with a verifier: in my model, at $1 a wrong answer, a verifier that passes more than 28% of wrong answers loses to the big model alone (rates assumed). Has anyone measured their verifier's false-positive rate on real traffic?

On price per token: same 3,000-in, 500-out request, assumed 80% vs 95% right. Free wrong answers make Haiku 5.5 33x cheaper per useful answer than Opus 5.5. At $5 a wrong answer it's 4.4x pricier.

## Substack Note

At $5 a wrong answer, Haiku 5.5 costs 4.4 times more per useful answer than Opus 5.5, even though it's 40 times cheaper per request ($0.00055 against $0.022 for 3,000 tokens in and 500 out).

You aren't buying requests, you're buying useful answers. The real unit is what you spent plus what the wrong answers cost you, divided by the answers that were right.

I swept it with a small seeded script. The success rates are my assumptions, not measurements: Haiku right 80% of the time, Opus 95%. On those, a wrong answer costing more than 11 cents makes Opus cheaper. A cheap-first cascade with a decent check beat both, but a check passing more than 28% of wrong answers lost to Opus alone at $1 a failure. I'd guessed 50%.

If a wrong answer is free and the user just asks again, buy the cheap model and move on. Tables, limits and code are in the post.

https://www.0xadityaa.dev/blog/the-cheap-model-is-not-always-cheaper
