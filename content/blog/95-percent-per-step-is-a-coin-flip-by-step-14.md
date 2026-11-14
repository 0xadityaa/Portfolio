---
title: 95% Per Step Is a Coin Flip by Step 14
publishedAt: '2026-11-14'
summary: >-
  Per-step reliability compounds, so long agent runs fail often. A simulation
  shows what buys it back: transient retries, checkpoints, and idempotency keys.
tags:
  - ai
  - agents
  - reliability
  - distributed-systems
draft: true
---

An agent that gets every step right 95% of the time sounds like an A student. Give it fourteen steps in a row and it finishes without a single mistake 49% of the time.

Picture this, and yes, it's made up: 0.95 to the power of 14 is 0.49. A coin flip, from a model you'd happily call reliable.

In [Do You Really Need AI Agents?](/blog/do-you-really-need-agents) I said a fair comparison would run one task both ways and report tokens, seconds, and error rate. This is a partial sequel, and only about the error rate. I wrote a seeded simulation of a many-step task and tried five ways of handling failure. It's a model, not a measurement of any real LLM.

My claim: **per-step reliability compounds, so long runs fail often even with a good model. Retries only help when failures are transient and steps are safe to repeat. When they are, checkpoints and shorter loops buy back more reliability than a better prompt.**

## The short version

- At 95% per step, a run is at 50% by step 14. At 90% it takes 7 steps, and at 99% it takes 69.
- With transient failures, two retries took a 20-step run from 35.5% to 99.8%. With half the failures persistent: 60.4%.
- Resuming from a checkpoint finished 100.0% of runs at 95% per step. A 99% agent with no checkpoints finished 81.7%.
- Retrying a step with a side effect can do it twice. Idempotency keys took the duplicates to zero.

## Why does 95% per step fall apart so fast?

Because it's multiplication. Every step has to work, so the chances multiply. Same shape as the [5% a day decay](/blog/five-percent-a-day-sounds-gentle) from October, with steps standing in for days.

The steps until a run drops to 50% are `ln 0.5 / ln p`: 6.6 at 90%, 13.5 at 95%, 69 at 99%. Even the 99% agent is down to two in three by step 40.

![Chart: chance an agent finishes every step against number of steps. At 95% per step it falls to 49% at step 14; at 90% it crosses 50% by step 7 and at 99% by step 69](/images/blog/success-vs-steps-compounding.svg)

Researchers hit the same wall from the other side. [τ-bench](https://arxiv.org/abs/2406.12045) scores customer-service agents on whether the database ends in the right state, and adds pass^k: the chance the agent solves the same task in all k trials. The paper reports gpt-4o at about 61% on its retail tasks for one trial, and under 25% for eight.

## What did I simulate?

A task is `n` steps in a row, and each model call attempts one step with success probability `p`. I ran 20,000 tasks for 5, 10, 20, and 40 steps at `p` of 0.90, 0.95, and 0.99, with a fixed seed. At 95% and 20 steps, the no-retry run finished 35.5% against a predicted 35.8%. The script, raw output, and the full table are [in the repo](https://github.com/0xadityaa/Portfolio/tree/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14).

Five strategies: no retries, retry twice on transient failures, retry twice with half the failures persistent, checkpoint every five steps and resume, and retries on steps that aren't idempotent. The checkpoint and restart runs are both capped at 3n calls.

## Do retries fix it?

Only when the failure goes away on its own. One cell, 95% per step over 20 steps:

| Strategy | Success | Model calls per completed task |
| --- | --- | --- |
| No retries | 0.355 | 36.1 |
| Retry twice, transient | 0.998 | 21.1 |
| Retry twice, half persistent | 0.604 | 28.3 |
| Restart from step 1 (capped) | 0.888 | 37.4 |
| Checkpoint every 5 (capped) | 1.000 | 23.4 |

Read the last column as cost per finished task. No retries looks cheap per run and is expensive per success, because two thirds of the runs spend their calls and produce nothing.

The transient row is the dream. Make half the failures persistent and it collapses to 60.4%. That's a tool returning the same error three times: a wrong parameter, a missing permission, a page that changed. Retrying a deterministic error is a pricier way to see the same error.

At 90% and 40 steps it's starker. No retries finish 1.5% of runs, transient retries 95.8%, persistent ones 12.6%.

## What do checkpoints buy?

Most of it. 20 steps at 95%: 100.0% for 23.4 calls per success, against 88.8% for 37.4 when restarting from step 1. At 40 steps the gap is 100.0% against 57.8%. A failure only costs you the segment since the last save. Failure at step 18 with a checkpoint at 15 means three steps repeated, not eighteen.

The catch: a checkpoint in front of a persistent failure just replays the same error. Checkpoints make retries cheap. They don't make a broken step work.

So what about a better prompt? Say prompt work moves you from 95% to 99% per step, a fivefold cut in failures and hard to get. On 20 steps the run goes from 35.5% to 81.7%. The checkpoint at 95% reached 100.0%. That flatters the checkpoint, since the 99% agent got no retries, so read it as: once failures are transient, structure is cheaper than prompt work. It also protects you the day a prompt change quietly makes things worse.

[Anthropic's advice on building agents](https://www.anthropic.com/engineering/building-effective-agents) points the same way. It warns that autonomy brings compounding errors, recommends testing in sandboxes, and suggests stopping conditions and pausing for a human at checkpoints. In frameworks like [LangGraph](https://langchain-ai.github.io/langgraph/) that means persisting state between steps so a run can [resume](https://en.wikipedia.org/wiki/Application_checkpointing) instead of restart.

## What happens when a retry isn't safe?

You get the same side effect twice. A step times out after the action landed, the retry does it again, and now there are two charges, two emails, or two tickets.

At 95% and 20 steps, with half of failures being such timeouts, that was 0.537 duplicates per run, and 41.1% of runs had at least one. At 90% and 40 steps: 2.156 per run, 88.0% with at least one. Half being timeouts is my assumption, so trust the shape, not the percentage.

The old fix is [idempotency](https://en.wikipedia.org/wiki/Idempotence). [Stripe's version](https://docs.stripe.com/api/idempotent_requests) is the one to copy: the client sends an `Idempotency-Key` header, the server saves the first response for that key, and a retry gets the saved response instead of repeating the work. Keys can be pruned after 24 hours, and a reused key with different parameters is an error. With keys, my simulated runs had zero duplicates at no change in calls.

If an agent can call a tool that moves money or sends a message, the tool needs a key. The agent can't be trusted to remember it already did it.

## Where I'd stop trusting this post

**Steps aren't independent coin flips.** The strongest objection. A strong model often notices a bad result and tries something else, so real curves are flatter than `p^n`. [METR's study of task length](https://arxiv.org/abs/2503.14499) found models got better at adapting to mistakes, and that the task length they finish at 50% reliability has doubled roughly every seven months since 2019. That paper is from March 2025, so lean on the trend, not the numbers. Two things keep me from dropping the model: METR's 80% horizons are 4 to 6 times shorter than its 50% ones, and [Huang et al.](https://arxiv.org/abs/2310.01798) found models can't reliably fix their own reasoning without external feedback. Recovery works when a test fails. It does less when the mistake is silent.

τ-bench shows the flattening too. Identical 61% coins would pass all eight trials 1.9% of the time (0.61^8), but the paper reports under 25%, because tasks vary. The average of `p^n` over a spread is higher than `p^n` at the average.

**I assumed failures are detected.** My simulation knows instantly when a step fails. A real agent can take a wrong step and carry on confidently. Retries and checkpoints don't fix that. Verification does: tests, schema checks, a second pair of eyes.

**The numbers are mine to set.** Persistent share, timeout share, a checkpoint every five steps, the 3n cap. The shape holds across them. The percentages don't transfer.

**I didn't run a real model.** No tokens, no seconds, no LLM in the loop.

## The takeaway

My rule of thumb, from a simulation and not a production system. Before making an agent run longer, work out `p^n` with the per-step success you honestly believe. If it's under 90%, skip the prompt rewrite. Cut the run into segments that save state and can be verified, give every side-effect tool an idempotency key, and add retries only for errors you can show are transient.

What would change my mind: a real agent on a real task with detected failures and a much flatter curve than `p^n`. I'd like to run that next.
