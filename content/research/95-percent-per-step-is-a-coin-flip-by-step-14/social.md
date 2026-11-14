## Thread

A 95%-per-step agent finishes a 14-step job about half the time. 0.95^14 = 0.49. On a 40-step job it's 0.129. Per-step reliability multiplies, and it's easy to forget that when each step looks fine.
---
I wrote a seeded simulation to see what actually buys reliability back. 20,000 runs per cell, code and raw output in the repo. Baseline: 95% per step, 20 steps, no retries. 35.5% of runs finish. The closed form says 35.8%.
---
Retries fix it only when failures are transient. Same cell, retry twice: 99.8% finish. Make half the failures persistent and it's 60.4%. Retrying a deterministic error just buys you the same error again.
---
Checkpoint every 5 steps and resume instead of restarting: 100.0% finish at 23.4 model calls per success. Restart from step 1 under the same call cap: 88.8% at 37.4 calls. A 99%-per-step agent with no checkpoints: 81.7%.
---
Retrying a step with a side effect can do it twice: 0.54 duplicates per run in my sim, 41.1% of runs with at least one. Idempotency keys took it to zero. It's a model, so read the limits: https://www.0xadityaa.dev/blog/95-percent-per-step-is-a-coin-flip-by-step-14

## Singles

Even 99% per step is only a coin flip at step 69. 95% gets there at step 13.5. 90% at 6.6. The arithmetic is ln 0.5 / ln p, and it's the cheapest sanity check you can run before making an agent loop longer.
---
Simulated a 40-step task at 90% per step. No retries: 1.5% finish. Retry twice, transient failures: 95.8%. Retry twice, half the failures persistent: 12.6%. The retry count matters less than whether the failure goes away.
---
At 95% per step over 40 steps, restarting from step 1 on failure finished 57.8% of runs under a 3n call cap. Resuming from a checkpoint every 5 steps finished 100.0%. Same model, same per-step odds. Only where the run restarts changed.
---
Simulated a non-idempotent tool with retries: at 90% per step over 40 steps, 2.16 duplicate side effects per run, and 88.0% of runs had at least one. Add idempotency keys and the same runs had zero. A double charge is a design bug, not a model bug.
---
tau-bench reports gpt-4o at about 61% on one retail trial and under 25% when it has to pass all 8. If tasks were identical 61% coins, all 8 would pass 1.9% of the time (0.61^8). Tasks vary, so real curves are flatter than the simple model.

## Substack Note

If an agent gets each step right 95% of the time, a 14-step run finishes without a mistake 49% of the time. That's 0.95^14. It's the same compounding that bit me in a ranking bug in October, just with steps instead of days.

I wrote a seeded simulation to see what buys reliability back. At 95% per step over 20 steps, no retries finish 35.5% of runs. Retry twice and it's 99.8%, but only if failures are transient: when half are persistent, it's 60.4%. Checkpointing every 5 steps and resuming got 100.0%, against 88.8% for restarting from step 1 under the same call cap. And retrying a step with a side effect duplicated it in 41.1% of runs until I added idempotency keys.

It's a model, not a measurement of a real LLM, and real agents recover from mistakes better than independent coin flips would. The post says where it breaks:

https://www.0xadityaa.dev/blog/95-percent-per-step-is-a-coin-flip-by-step-14
