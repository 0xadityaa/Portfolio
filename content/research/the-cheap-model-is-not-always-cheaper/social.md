## Thread

The cheap model is 40x cheaper per request. I priced one request (3,000 tokens in, 500 out): Claude Haiku 5.5 costs $0.00055, Opus 5.5 costs $0.022. Pricing pages checked 2026-11-14.

But you don't buy requests. You buy useful answers.

---

Cost per useful answer = (what you spent + wrong answers x what each one costs) / answers that were right.

I assumed Haiku is right 80% of the time and Opus 95%. Made-up numbers, so I swept them.

---

With those assumptions the break-even is $0.114. If one wrong answer costs you more than 11 cents, Opus is cheaper per useful answer. At $5 a wrong answer, Haiku costs $1.25 per useful answer and Opus $0.286.

---

A cascade fixes most of it: cheap model answers, a check decides whether to escalate. With a check that passes 10% of wrong answers, it was cheapest of the three from $0.025 up to $5.

---

A leaky check erases the win. At $1 per wrong answer, a check that lets through more than 28% of wrong answers loses to Opus alone. I'd guessed 50%.

Build the check first, then measure its false-positive rate.

---

When failures are free and the user just asks again, cheap wins and you can stop reading. Script, raw output and the sweep are in the post: https://www.0xadityaa.dev/blog/the-cheap-model-is-not-always-cheaper

## Singles

One request, 3,000 tokens in and 500 out. Claude Haiku 5.5: $0.00055. Claude Opus 5.5: $0.022. That is 40x. But if Haiku is right 80% of the time and Opus 95%, the break-even is a wrong answer that costs $0.114. Above that, Opus is cheaper per useful answer.

---

Price per token tells you what a request costs. Cost per useful answer is (spend + wrong answers x cost of each) / right answers. In my sweep, at $5 per wrong answer, an 80%-right cheap model cost $1.25 per useful answer and a 95%-right expensive one cost $0.286.

---

The gap between models decides the break-even more than the price does. Cheap model at 60% right, break-even is $0.036. At 90%, $0.386. At 94%, $2.02. At 95%, same as the expensive one, so it never loses. Measure your own gap before you pick.

---

I simulated a cheap-first cascade with a verifier. When the verifier let through 10% of wrong answers, the cascade delivered 3.1% wrong answers against 20% for the cheap model alone and 5% for the expensive one, at $0.0058 a task instead of $0.022.

---

I guessed a leaky verifier would only hurt the cascade once it passed about half of wrong answers. At $1 per wrong answer it stopped beating the expensive model alone at 28%. At $5 it stopped at 22%. The pricier the failure, the less leak you can afford.

## Substack Note

The cheap model is 40 times cheaper per request. I priced one request on Claude Haiku 5.5 and Opus 5.5 (3,000 tokens in, 500 out): $0.00055 against $0.022.

That isn't the number that matters. You're buying useful answers, so the unit is (spend + wrong answers times what each costs) divided by the answers that were right.

I wrote a small seeded script to sweep it. With Haiku at an assumed 80% right and Opus at 95%, the break-even is $0.114. Above that cost per wrong answer, Opus is cheaper per useful answer. A cheap-first cascade with a decent check beat both from $0.025 up to $5. A check that lets through more than 28% of wrong answers lost to Opus alone at $1 a failure.

The success rates are my assumptions, not measurements, and when a wrong answer is free and visible, the cheap model just wins. The post has the tables, the limits and the code.

https://www.0xadityaa.dev/blog/the-cheap-model-is-not-always-cheaper
