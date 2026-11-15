## Hook

A 95% reliable agent fails half its 14-step tasks.

0.95^14 = 0.49.

Simulated, 20 steps: two retries per step take 35.5% to 99.8% if errors are transient.

Half persistent: 60.4%.

What does your agent do with an error it has seen twice?

## Thread

A 95% reliable agent fails half its 14-step tasks.

0.95^14 = 0.49. I simulated what buys the reliability back (retries, checkpoints, idempotency keys) and which ones only look like they help ↓
---
Retries, 20 steps at 95% per step:

→ no retries: 35.5% finish
→ retry twice, transient errors: 99.8%
→ retry twice, half persistent: 60.4%

A wrong parameter or a missing permission just returns the same error again.
---
Checkpoint every 5 steps and resume, same 3n call cap as restarting from step 1:

→ 20 steps: 100.0% vs 88.8% finish
→ 40 steps: 100.0% vs 57.8%
→ calls per success at 20 steps: 23.4 vs 37.4

A failure only costs the segment since the last save.
---
Retrying a step with a side effect can run it twice.

Assuming half of failures are timeouts where the action landed:
→ 95%, 20 steps: 41.1% of runs did something twice
→ 90%, 40 steps: 88.0%

With idempotency keys: 0 duplicates, same number of calls.
---
The strongest objection: steps aren't independent coin flips.

Models notice a failing test and change course, so real curves are flatter than p^n.

My simulation also detects every failure instantly and uses no real LLM. Trust the shape, not the percentages.
---
Want the simulation script and raw output? Reply COIN and I'll DM it.
---
Rule of thumb: work out p^n with the per-step success you honestly believe. Under 90%, skip the prompt rewrite. Checkpoint, key every side-effect tool, and retry only errors you can show are transient.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/95-percent-per-step-is-a-coin-flip-by-step-14

## Singles

At 90% per step over 40 steps, in simulation:

No retries: 1.5% of runs finish.
Retry twice, transient errors: 95.8%.
Retry twice, half the errors persistent: 12.6%.

Whether the error goes away matters more than how many retries you allow.
---
Most agent loops retry on timeout. I simulated it where half of failures are timeouts and the action already landed:

→ 95% per step, 20 steps: 41.1% of runs did something twice
→ 90% per step, 40 steps: 88.0%, 2.16 duplicates per run

With idempotency keys: 0.
---
The bill for a 40-step run at 90% per step, in simulated model calls per finished task:

No retries: 672.6
Restart from step 1: 894.7
Retry twice, transient errors: 45.4
Checkpoint every 5 steps: 55.5

Most of the spend in the first two is runs that never finish.
---
Retries took a 20-step run at 95% per step from 35.5% to 99.8%. Until half the errors were persistent: 60.4%.

Same retry count, same agent. A retry only helps if the error can change.
---
Before you lengthen an agent loop, compute ln 0.5 / ln p.

95% per step: a coin flip at step 13.5.
90%: step 6.6.
99%: step 69.

If the answer is shorter than your loop, add checkpoints before you touch the prompt.

## CTA

COIN | the agent reliability simulation (script and raw output) | https://github.com/0xadityaa/Portfolio/tree/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14

## Reply prompts

Someone says their agent is flaky and the fix is a better prompt: In a simulation, a 95% agent finished 20 steps 35.5% of the time. Two retries per step took it to 99.8% when errors were transient, 60.4% when half were persistent. Which kind are yours?

Someone adds retries to a tool-calling loop: Simulated 20-step run at 95% per step: retries took it from 35.5% to 99.8% on transient errors, but only 60.4% with half persistent. Do you know which kind your tool errors are?

Someone has an agent that sends emails or charges cards: In my simulation, retrying steps with side effects did something twice in 41.1% of 20-step runs at 95% per step. Idempotency keys took it to zero. Does your tool take a key?

## Substack Note

A 95%-per-step agent finishes a 14-step job only 49% of the time. That's 0.95 to the power of 14, from a model you'd happily call reliable.

So I wrote a seeded simulation of a many-step task to see what buys the other half back. Two retries per step lift a 20-step run from 35.5% to 99.8%, but only when failures are transient. With half of them persistent, it's 60.4%. Checkpointing every 5 steps finished 100.0% of runs, against 88.8% for restarting from step 1 under the same call cap. And retrying a step with a side effect did it twice in 41.1% of runs, until I added idempotency keys.

It's a model, not a real LLM, and real agents recover from mistakes better than independent coin flips would. The post covers where it breaks:

https://www.0xadityaa.dev/blog/95-percent-per-step-is-a-coin-flip-by-step-14
