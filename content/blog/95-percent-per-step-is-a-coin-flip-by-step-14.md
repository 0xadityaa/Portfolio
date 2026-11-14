---
title: 95% Per Step Is a Coin Flip by Step 14
publishedAt: '2026-11-14'
summary: >-
  Per-step reliability compounds, so long agent runs fail often. A simulation of
  retries, checkpoints, and idempotency shows what actually buys the success back.
tags:
  - ai
  - agents
  - reliability
  - distributed-systems
draft: true
---

Here's a thought experiment, not a story from my work. An agent gets each step of a job right 95% of the time. That sounds like an A. Give it fourteen steps in a row and the chance it finishes with no mistake is 0.95 to the power of 14, which is 0.49. A coin flip.

In [Do You Really Need AI Agents?](/blog/do-you-really-need-agents) I said a fair version would run one task both ways and report tokens, seconds, and error rate. This is a partial sequel, and only about the error rate: I wrote a seeded simulation of a many-step task and tried five ways of handling failure. It is a model, not a measurement of any real LLM, and I'll say where it lies to you.

My claim: **per-step reliability compounds, so a long run fails often even with a good model. Retries only help when failures are transient and steps are safe to repeat. Checkpoints and shorter loops buy back more reliability than a better prompt does.**

## The short version

- If every step succeeds with probability `p`, a run of `n` steps succeeds with `p^n`. At 95% per step the run is at 50% by step 14. At 90% it takes 7 steps.
- Retries fixed everything in my simulation when failures were transient (95% per step, 20 steps: 35.5% to 99.8%). When half of failures were persistent, the same retries got to 60.4%.
- Resuming from a checkpoint instead of step 1 took the 95% agent to 100.0% on 20 steps, while moving to 99% per step with no checkpoints reached 81.7%.
- Retrying a step with a side effect can do it twice. Idempotency keys make the duplicates zero.

## Why does 95% per step fall apart so fast?

Because it's multiplication, not addition. Every step has to work, so the chances multiply. It's the same shape as the [5% a day decay](/blog/five-percent-a-day-sounds-gentle) I wrote about in October, with steps standing in for days.

| Per-step success | 5 steps | 10 steps | 20 steps | 40 steps | Steps until it falls to 50% |
| --- | --- | --- | --- | --- | --- |
| 0.90 | 0.590 | 0.349 | 0.122 | 0.015 | 6.6 |
| 0.95 | 0.774 | 0.599 | 0.358 | 0.129 | 13.5 |
| 0.99 | 0.951 | 0.904 | 0.818 | 0.669 | 69.0 |

The last column is `ln 0.5 / ln p`. Even 99% per step is only a coin flip around step 69, and it has dropped to two in three by step 40.

![Chart: chance an agent finishes every step against number of steps. At 95% per step it falls to 49% at step 14; at 90% it crosses 50% by step 7 and at 99% by step 69](/images/blog/success-vs-steps-compounding.svg)

The research world has noticed the same thing from the other side. [τ-bench](https://arxiv.org/abs/2406.12045) scores customer-service agents on whether the database ends in the right state, and it adds a metric called pass^k: the chance that the agent solves the same task in all k trials. The paper reports gpt-4o at about 61% on its retail tasks for one trial, dropping to under 25% for eight. A run you have to trust every time is a harder bar than a run that works once.

## What did I simulate?

A task is `n` steps in a row. One model call attempts one step, and it reports success with probability `p`. I ran 20,000 tasks for every combination of 5, 10, 20, and 40 steps with `p` of 0.90, 0.95, and 0.99, with a fixed seed. The script, the raw output, and the commands are [in the repo](https://github.com/0xadityaa/Portfolio/tree/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14). Five strategies:

- **No retries.** One failure ends the run.
- **Retry twice, transient failures.** Every attempt is a fresh coin flip.
- **Retry twice, half the failures persistent.** Half the time a failing step is broken for good, and retrying it just spends calls.
- **Checkpoint and resume.** A checkpoint is saved every five steps. A failure rolls back to the last one. I compare it to restarting from step 1, with both capped at 3n calls, the most the retry strategy could spend.
- **Non-idempotent steps.** Half of failures are timeouts where the action had already happened, and the retry does it again.

The simulation matches the closed form where there is one. At 95% and 20 steps, the no-retry run finished 35.5% of the time against a predicted 35.8%.

## Do retries fix it?

Only when the failure is the kind that goes away. Here is one cell, 95% per step over 20 steps:

| Strategy | Success | Model calls per completed task |
| --- | --- | --- |
| No retries | 0.355 | 36.1 |
| Retry twice, transient | 0.998 | 21.1 |
| Retry twice, half persistent | 0.604 | 28.3 |
| Restart from step 1 (capped) | 0.888 | 37.4 |
| Checkpoint every 5 (capped) | 1.000 | 23.4 |

Read the calls column as cost per finished task, so failed runs count against the strategy. No retries looks cheap per run and is expensive per success, because two thirds of the runs spend their calls and produce nothing.

The transient row is the dream. Once I made half the failures persistent, it collapses to 60.4%, almost what the closed form says for per-step success of `p + (1-p) × 0.5 × (1 - (1-p)^2)`. That's the real-world version of a tool returning the same error three times in a row: a wrong parameter, a missing permission, a page that changed. A retry of a deterministic error is a more expensive way to see the same error.

At 90% and 40 steps the picture is starker. No retries finish 1.5% of runs. Transient retries finish 95.8%. Persistent ones: 12.6%.

## What do checkpoints buy?

Most of it. The checkpoint row finishes 20 steps at 100.0% for 23.4 calls per success, and restarting from step 1 under the same budget finishes 88.8% for 37.4. At 40 steps and 95% the gap is wider: 100.0% against 57.8%.

The reason is that a failure only costs you the segment since the last save, not the whole run. Failure at step 18 with a checkpoint at 15 means three steps repeated, not eighteen.

So how does that compare with a better prompt? Suppose your prompt work moves per-step success from 95% to 99%, which is a fivefold cut in failures and hard to get. On 20 steps with no other changes the run goes from 35.5% to 81.7%. The checkpoint at 95% reached 100.0%. I'm not saying prompts don't matter. I'm saying the structure around the model had more to give in this model, and it also protects you the day a prompt change quietly makes things worse.

This is where [Anthropic's own advice on building agents](https://www.anthropic.com/engineering/building-effective-agents) points. It says autonomy brings the potential for compounding errors, recommends testing in sandboxes, and suggests stopping conditions and pausing for a human at checkpoints. In frameworks like [LangGraph](https://langchain-ai.github.io/langgraph/) the equivalent is persisting state between steps so a run can [resume](https://en.wikipedia.org/wiki/Application_checkpointing) instead of restart.

## What happens when a retry isn't safe?

You get the same side effect twice. In my fifth strategy, a step that times out after the action landed gets retried, and the retry does it again. Think of a charge, an email, a created ticket.

At 95% and 20 steps, with half of failures being such timeouts, that was 0.537 duplicate side effects per run, and 41.1% of runs had at least one. At 90% and 40 steps: 2.156 per run, with 88.0% of runs having at least one. Half the failures being timeouts is my assumption, so treat the shape as the point and not the percentage.

The old fix is [idempotency](https://en.wikipedia.org/wiki/Idempotence). [Stripe's version](https://docs.stripe.com/api/idempotent_requests) is the one to copy: the client sends an `Idempotency-Key` header, the server saves the status and body of the first request made with that key, and a retry with the same key returns the saved response instead of repeating the work. Their keys can be pruned after 24 hours, and a reused key with different parameters is an error. In my simulation the same runs with keys had zero duplicates, at no change in calls.

If an agent can call a tool that moves money or sends a message, the tool needs a key. The agent can't be trusted to remember that it already did it.

## Where I'd stop trusting this post

**Steps aren't independent coin flips.** This is the strongest objection, and it is a good one. A strong model often notices a bad result and tries something else, so real success curves are flatter than `p^n`. [METR's study of task length](https://arxiv.org/abs/2503.14499) found that models got better at adapting to mistakes and not repeating failed actions, and that the length of task a model can finish at 50% reliability has doubled roughly every seven months since 2019. That paper is from March 2025, so its absolute numbers are old. The trend is what I'd lean on.

Two things keep me from dropping the model. METR also found that 80% horizons are 4 to 6 times shorter than 50% ones, so the reliability you need in production sits well below the headline number. And self-correction needs something to correct against: [Huang et al.](https://arxiv.org/abs/2310.01798) found that models can't reliably fix their own reasoning without external feedback, and sometimes make it worse. Recovery works when a test fails or a tool returns an error. It does less when the mistake is silent.

The τ-bench numbers show the same flattening. If every task were an identical 61% coin, eight trials would all succeed 1.9% of the time (0.61^8). The paper reports under 25%, because some tasks are easy and some are hard. Real agents have per-step probabilities that vary a lot, and the average of `p^n` over a spread is higher than `p^n` at the average.

**I assumed failures are detected.** My simulation knows right away when a step fails. A real agent can take a wrong step and keep going confidently. Silent failures aren't fixed by retries or checkpoints at all, only by verification: tests, schema checks, a second pair of eyes.

**The numbers are mine to set.** Persistent share, timeout share, a checkpoint every five steps, the 3n cap: all choices I made. The shape holds across them. The specific percentages don't transfer.

**I didn't run a real model.** No tokens, no seconds, no LLM in the loop. The tool and cost side from the earlier post is still unmeasured.

## The takeaway

My rule of thumb, from this simulation and not from a production system. Before you make an agent run longer, work out `p^n` with the per-step success you honestly believe. If the answer is under 90%, don't write a better prompt first. Cut the run into segments that save state and can be verified, make every tool call with a side effect take an idempotency key, and only add retries for errors you can show are transient.

What would change my mind: a measurement from a real agent on a real task showing the curve is much flatter than `p^n`, with failures that are detected. I'd like to run that one next.
