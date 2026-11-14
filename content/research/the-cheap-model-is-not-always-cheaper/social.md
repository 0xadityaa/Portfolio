## Thread

Haiku 5.5 is 40x cheaper than Opus 5.5 per request: $0.00055 against $0.022. It can still cost more per useful answer. The thread shows where the crossover sits, and what a cheap-first cascade does to it. The success rates are my assumptions, not measurements.

---

You don't buy requests, you buy right answers. Cost per useful answer = (spend + wrong answers x what each costs) / answers that were right.

I gave Haiku 80% right and Opus 95%. Made up, so I swept the cost of a wrong answer instead.

---

Break-even: $0.114. Above 11 cents per wrong answer, Opus is cheaper per useful answer.

At $5 a failure, Haiku costs $1.25 per useful answer. Opus costs $0.286.

---

A cascade changes it. Haiku answers, a check decides whether to escalate to Opus. With a check that passes 10% of wrong answers, it was cheapest of the three from $0.025 up to $5 per failure.

---

A leaky check erases that. At $1 per wrong answer, a check that lets through more than 28% of wrong answers loses to Opus alone. I'd guessed 50%.

So build the check first. Then measure its false-positive rate on real traffic.

---

When a wrong answer is free and the user just asks again, cheap wins and you can stop reading. Script, raw output and the full sweep are in the post: https://www.0xadityaa.dev/blog/the-cheap-model-is-not-always-cheaper

## Singles

Haiku 5.5 is 40x cheaper than Opus 5.5 per request. If it's right 80% of the time and Opus 95%, a wrong answer that costs more than $0.114 makes Opus cheaper per useful answer. Price the failure before you price the token.

---

Is the cheap model cheaper? Depends what a wrong answer costs. At $0, Haiku is 33x cheaper per useful answer. At $5, it's 4.4x more expensive. The price list can't answer it alone.

---

Cheap model right 60% of the time: break-even is $0.036 per wrong answer. At 90%: $0.386. At 94%: $2.02. At 95%, same as the expensive model, it never loses. The quality gap matters more than the price gap.

---

Cheap-first cascade with a check that passes 10% of wrong answers: 3.1% wrong answers delivered, against 20% for Haiku alone and 5% for Opus. $0.0058 a task instead of $0.022. The check is doing the work.

---

I guessed a leaky check only hurts a cascade once about half of wrong answers slip through. At $1 a failure it was 28%. At $5, 22%. The pricier the failure, the less leak you can afford.

## Substack Note

Haiku 5.5 is 40 times cheaper than Opus 5.5 per request: $0.00055 against $0.022 for 3,000 tokens in and 500 out. I still don't think it's always the cheaper choice.

You aren't buying requests, you're buying useful answers. So the real unit is what you spent plus what the wrong answers cost you, divided by the answers that were right.

I swept it with a small seeded script. If Haiku is right 80% of the time and Opus 95% (my assumptions, not measurements), a wrong answer that costs more than 11 cents makes Opus the cheaper one. A cheap-first cascade with a decent check beat both. But a check that lets through more than 28% of wrong answers lost to Opus alone at $1 a failure. I'd guessed 50%.

If a wrong answer is free and the user just asks again, buy the cheap model and move on. The tables, the limits and the code are in the post.

https://www.0xadityaa.dev/blog/the-cheap-model-is-not-always-cheaper
