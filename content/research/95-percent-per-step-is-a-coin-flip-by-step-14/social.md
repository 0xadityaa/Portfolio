## Hook

A 95%-per-step agent finishes a 20-step job 35.5% of the time.

Retry each step twice and it's 99.8%. But only if the errors go away on a retry. Make half of them stick and the same retries get you 60.4%.

What does your agent do with an error it's already seen twice?

## Thread

A 95%-per-step agent finishes 20 steps clean 35.5% of the time. I simulated what buys the reliability back (retries, checkpoints, idempotency keys) and what only looks like it helps:
---
First the wall. 0.95^14 = 0.49. A run falls to 50% after ln 0.5 / ln p steps: 6.6 steps at 90% per step, 13.5 at 95%, 69 at 99%. Even the 99% agent is at two in three by step 40.
---
Retry twice on transient errors: 99.8% finish, up from 35.5%. Make half the failures persistent and it's 60.4%. Retrying a wrong parameter or a missing permission just buys you the same error again.
---
Checkpoint every 5 steps and resume: 100.0% finish at 23.4 calls per success. Restart from step 1 under the same call cap: 88.8% at 37.4 calls. At 40 steps it's 100.0% against 57.8%. A failure only costs the segment since the last save.
---
Retrying a step with a side effect can run it twice. At 95% and 20 steps, 41.1% of runs had a duplicate. At 90% and 40 steps, 88.0%. Idempotency keys took every one of them to zero, with no extra calls.
---
The strongest objection: steps aren't independent coin flips. Models notice a failing test and change course, so real curves are flatter than p^n. METR finds task horizons doubling every ~7 months. It's a model, not an LLM, and failures here are always detected.
---
Rule of thumb: compute p^n with the per-step success you honestly believe. Under 90%, skip the prompt rewrite. Checkpoint, key every side-effect tool, retry only errors you can show are transient.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/95-percent-per-step-is-a-coin-flip-by-step-14

## Singles

40 steps at 90% per step, no retries: 1.5% of runs finish. Retry twice on transient errors: 95.8%. Retry twice when half the failures are persistent: 12.6%. Whether the error goes away matters more than how many retries you allow.
---
Same code, same retry count. Transient failures: 99.8% of 20-step runs finish. Half persistent: 60.4%. The retry policy didn't change. What the error did when you tried again did.
---
The bill for a 40-step run at 90% per step, in model calls per finished task. No retries: 672.6. Restart from step 1: 894.7. Retry twice, transient: 45.4. Checkpoint every 5 steps: 55.5. Most of that spend is runs that never finish.
---
If you're about to lengthen an agent loop, run ln 0.5 / ln p first. At 95% per step the run is a coin flip at step 13.5. At 90%, step 6.6. At 99%, step 69. If the answer is under your loop length, add checkpoints before you touch the prompt.
---
Common advice: retry on timeout. What I measured: with half of failures being timeouts where the action already landed, 88.0% of 40-step runs at 90% per step did something twice. 2.16 duplicates per run. Idempotency keys took it to 0.

## Reply prompts

Someone says their agent is flaky and the fix is a better prompt: "In a simulation, a 95% agent finished 20 steps 35.5% of the time. Two retries per step took it to 99.8%, but only when errors were transient. With half of them persistent: 60.4%. Which kind is yours?"

Someone adds retries to a tool-calling loop: "Retries took a 20-step run from 35.5% to 99.8% when failures were transient. With half persistent it was 60.4%. Do you know which kind your tool errors are?"

Someone has an agent that sends emails or charges cards: "I simulated retries on steps with side effects: 41.1% of 20-step runs at 95% per step did something twice. Idempotency keys took it to zero. Does your tool take a key?"

## Substack Note

A 95%-per-step agent finishes a 20-step job without a mistake 35.5% of the time. That's 0.95^20, the same compounding that bit me in a ranking bug in October, with steps instead of days.

So I wrote a seeded simulation to see what buys reliability back. Retry twice and it's 99.8%, but only if failures are transient: when half are persistent, it's 60.4%. Checkpointing every 5 steps got 100.0%, against 88.8% for restarting from step 1 under the same call cap. And retrying a step with a side effect ran it twice in 41.1% of runs, until I added idempotency keys.

It's a model, not a real LLM, and real agents recover from mistakes better than independent coin flips would. The post says where it breaks:

https://www.0xadityaa.dev/blog/95-percent-per-step-is-a-coin-flip-by-step-14
