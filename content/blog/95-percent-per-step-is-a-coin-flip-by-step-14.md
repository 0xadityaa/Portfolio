---
title: Why Long Agent Loops Fail
publishedAt: '2026-11-26T23:24:46.550Z'
updated: '2026-11-27'
summary: >-
  A 95%-per-step agent finishes 14 steps only 49% of the time. I simulated five
  recovery strategies, and checkpoints beat prompt tweaking fast.
tags:
  - ai
  - agents
  - reliability
  - distributed-systems
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/147'
devto_url: >-
  https://dev.to/0xadityaa/your-95-reliable-agent-fails-half-its-14-step-tasks-3d3i
---

Suppose you built an AI agent and tested every individual tool call. It gets the step right 95% of the time. You'd ship it, right?

Now ask that exact same agent to run a 14-step workflow without tripping once. Your 95% agent finishes cleanly **49% of the time**. That is a coin flip.

The math is one line: $$0.95^{14}$$. If your agent chains ten or more tool calls, compounding probability is already eating your reliability.

Back in [Do You Really Need Agents?](/blog/do-you-really-need-agents), I admitted I hadn't put hard numbers on error rates. This is the partial sequel, on reliability only. I wrote a [seeded simulation](https://github.com/0xadityaa/Portfolio/blob/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14/simulate.py) of a multi-step task and tested five ways to survive failures. It is a simulation, not a live benchmark of a real LLM.

**Per-step reliability compounds, so long agent loops fail far more often than your gut predicts. Retries only rescue you when failures are temporary and safe to repeat. Once they are, checkpoints and shorter loops buy back far more reliability than rewriting your system prompt.**

## The short version

- At 95% per step, your run drops to a 50% coin flip by step 14. At 90% per step it happens by step 7, and even at 99% it happens by step 69.
- When failures are transient, adding two retries lifted a 20-step run from 35.5% to 99.8%. Make half the failures persistent and it falls back to 60.4%.
- Saving checkpoints every 5 steps finished 100.0% of transient 20-step runs at 95% per step. A 99% agent with no retries finished 81.7%. That isn't strictly apples to apples, but it shows where the cheap wins are.
- Retrying a step that triggers a real-world side effect will eventually fire it twice. Adding idempotency keys dropped duplicates to zero.

## Why does 95% fall apart so fast?

Because every single step has to succeed, so the probabilities multiply instead of averaging out. It's the same compounding curve behind my [5% a day decay bug](/blog/five-percent-a-day-sounds-gentle) back in October, except here steps replace days.

Want a quick mental formula? Any agent hits the 50% coin-flip mark after $$\frac{\ln 0.5}{\ln p}$$ steps. Plug in the numbers: 6.6 steps at 90%, 13.5 steps at 95%, and 69 steps at 99%. Even a 99% agent is down to two-in-three odds by step 40.

![Chance every step succeeds against number of steps for 90, 95 and 99 percent per step; the 95 percent curve is 49 percent at step 14](/images/blog/success-vs-steps-compounding.svg "Closed form, 0.95 to the power n, no retries. Values from [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14/output.txt).")

Without checkpoints, your odds shrink with every step.

Researchers hit the same wall on real benchmarks. [τ-bench](https://arxiv.org/abs/2406.12045) grades customer-service agents on whether the database ends in the right state and measures $$\text{pass}^k$$, the odds an agent solves the same task $$k$$ times in a row. In the paper, gpt-4o scored around 61% on retail tasks for a single run, and fell below 25% when asked to solve the same task eight times in a row.

## How I set up the simulation

I modeled a task as $$n$$ sequential steps, where each model call succeeds with probability $$p$$. I ran 20,000 simulated tasks for 5, 10, 20, and 40 steps at $$p = 0.90$$, `0.95`, and `0.99`, using a fixed random seed. As a sanity check, at 95% over 20 steps with no retries, my simulation finished 35.5% of runs, right on top of the theoretical $$0.95^{20} = 35.8\%$$. The script is [`simulate.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14/simulate.py), the raw output and full grid are in [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14/output.txt), and the write-up is the [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14/README.md).

I tested five recovery strategies: no retries, retry twice on transient errors, retry twice when half the errors are persistent, checkpoint every 5 steps and resume, and retrying non-idempotent steps. Checkpoint and restart strategies were capped at `3n` total model calls so they couldn't loop forever.

## Do simple retries fix the problem?

Only if the failure is the kind that disappears when you try again (a flaky network call, a brief rate limit, a random formatting hiccup). One slice of [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14/output.txt), at 95% per step across 20 steps:

| Strategy | Success | Model calls per completed task |
| --- | --- | --- |
| No retries | 0.355 | 36.1 |
| Retry twice, transient | 0.998 | 21.1 |
| Retry twice, half persistent | 0.604 | 28.3 |
| Restart from step 1 (capped) | 0.888 | 37.4 |
| Checkpoint every 5 (capped) | 1.000 | 23.4 |

Read the last column: *model calls per completed task*. "No retries" looks lean until you notice that 64.5% of runs burn tokens and die partway through, so you pay 36.1 calls for every task that finishes.

The transient retry row looks like magic at 99.8%. Once half the failures are *persistent*, success drops to 60.4%. A persistent failure is a tool returning the same error three times in a row: a bad argument, a missing permission, a changed page layout. Retrying it pays to watch the same crash three times.

At 90% per step over 40 steps the split is wide: 1.5% with no retries, 95.8% with transient retries, and just 12.6% when half the errors persist.

## Why checkpoints beat prompt engineering

Saving state every 5 steps, a 20-step run at 95% per step finished 100.0% of transient runs with 23.4 calls per success. Restarting from step 1 finished 88.8% and burned 37.4 calls. At 40 steps, checkpoints still held 100.0% against 57.8% for full restarts. If you trip on step 18 and saved at step 15, you redo three steps instead of eighteen.

![Twenty steps with no checkpoints finish 35.5 percent of the time; with a checkpoint every 5 steps, four short hops, 100.0 percent](/images/blog/checkpoint-hops.svg "With checkpoints, one 20-step tightrope becomes four short hops. Simulated at 95% per step, transient failures, from [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14/output.txt).")

Of course, that 100.0% assumes transient errors. Put a checkpoint in front of a broken tool and it replays the same failure. Checkpoints make recovery cheap. They don't repair a persistent bug.

Compare that to prompt engineering. Going from 95% to 99% per step cuts your error rate 5x, which is hard to pull off, and over 20 steps with no retries it only moves you from 35.5% to 81.7%. Checkpointing the 95% agent hit 100.0%. The 99% agent got no retries here, but the lesson holds: once failures are transient, architecture buys more reliability than squeezing another 4 points out of a system prompt. It also doesn't regress the next time someone edits a prompt.

[Anthropic's guide to building effective agents](https://www.anthropic.com/engineering/building-effective-agents) makes the same point, warning about compounding errors in autonomous loops and recommending pausing at checkpoints. In tools like [LangGraph](https://langchain-ai.github.io/langgraph/), persisting graph state between nodes lets you [resume from the last good step](https://en.wikipedia.org/wiki/Application_checkpointing) instead of starting over.

## Blind retries fire side effects twice

Retries cause duplicate actions. Say a tool call charges a credit card or sends a customer email, then times out right before returning `200 OK`. Your agent thinks it failed, retries, and you've double-charged someone or sent two emails.

In my 20-step simulation at 95% per step, assuming half the failures were post-action timeouts, retries triggered 0.537 duplicates per run, and 41.1% of runs had at least one duplicate. At 90% and 40 steps, 88.0% of runs fired at least one duplicate. (Half being timeouts is my assumption, so treat the exact count as illustrative.)

Distributed systems solved this decades ago with [idempotency](https://en.wikipedia.org/wiki/Idempotence), and [Stripe's pattern](https://docs.stripe.com/api/idempotent_requests) is the one to copy. Attach an `Idempotency-Key` header to every side-effect request, cache the first result on the server for 24 hours, and return the cached reply on any retry instead of running the action twice. In my simulation, adding keys dropped duplicates to zero with zero extra model calls.

Don't trust an agent to remember it already sent an email. Put the guard in the tool.

## Where I'd stop trusting this post

**Real agent steps aren't independent coin flips.** This is the strongest objection. Models often notice a bad tool output and self-correct on the next turn, which flattens the curve compared to pure $$p^n$$. [METR's task-horizon research](https://arxiv.org/abs/2503.14499) (March 2025) showed models getting steadily better at recovering mid-run, with 50% reliability task lengths doubling roughly every seven months since 2019. Even so, METR's 80% reliability horizons are still 4 to 6 times shorter than its 50% ones, and [Huang et al.](https://arxiv.org/abs/2310.01798) showed LLMs struggle to self-correct reasoning without external feedback. Recovery works when a unit test fails loudly and helps much less when a mistake is silent. You can see the same flattening in τ-bench too: independent 61% coins would pass eight trials only 1.9% of the time ($$0.61^{8}$$), whereas gpt-4o landed under 25% because some tasks are simply harder than others.

**My simulation detects every failure instantly.** Real agents don't always throw an exception. Sometimes they invent a plausible parameter and carry on. Retries and checkpoints can't catch silent failures. Only verification (tests, strict schemas, a human check) does.

**I chose the simulation knobs.** Persistent error ratio, timeout share, 5-step checkpoints, and the `3n` cap were all my picks. Trust the shape of the trade-offs, not the exact percentages.

**No real LLM was used.** Zero live tokens, zero latency measurements.

## The takeaway

Before you extend an agent loop to fifteen or twenty steps, pull out a calculator and punch in $$p^n$$ using the per-step accuracy you *honestly* see in production. If it comes out under 90%, stop editing the prompt.

Break the run into short, verifiable segments that checkpoint their state, put an idempotency key on every tool that mutates the world, and keep retries for errors you know are transient. Show me a production agent with detected failures that beats $$p^n$$ by a wide margin without checkpoints, and I'll update. Until then, I'm betting on architecture over prompts.
