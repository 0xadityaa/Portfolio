## Thread

A 95%-per-step agent finishes a 14-step job about half the time. 0.95^14 = 0.49. I simulated what buys the reliability back: retries, checkpoints, idempotency keys. Some of it works. Some of it doesn't.
---
Baseline: 95% per step, 20 steps, no retries. 35.5% of runs finish. The closed form says 35.8%, so the simulation checks out. Even a 99% agent is a coin flip by step 69.
---
Retry twice: 99.8% finish. But only if failures are transient. Make half of them persistent and it's 60.4%. Retrying a deterministic error just buys you the same error again.
---
Checkpoint every 5 steps and resume: 100.0% finish, at 23.4 calls per success. Restart from step 1 under the same call cap: 88.8% at 37.4 calls. A 99% agent with no checkpoints: 81.7%.
---
Retrying a step with a side effect can do it twice. 41.1% of runs had a duplicate. Idempotency keys took it to zero. It's a model, not a real LLM, so the limits matter: https://www.0xadityaa.dev/blog/95-percent-per-step-is-a-coin-flip-by-step-14

## Singles

Even a 99% agent is a coin flip at step 69. 95% gets there at step 13.5. 90% at 6.6. The formula is ln 0.5 / ln p. Run it before you make an agent loop longer.
---
40 steps at 90% per step. No retries: 1.5% finish. Retry twice, transient failures: 95.8%. Half the failures persistent: 12.6%. Whether the failure goes away matters more than how many retries you allow.
---
Restart from step 1 on failure: 57.8% finish. Resume from a checkpoint every 5 steps: 100.0%. Same model, same 95% per step, 40 steps. Only where the run restarts changed. Save state.
---
At 90% per step over 40 steps, a non-idempotent tool caused 2.16 duplicate side effects per run. With idempotency keys: zero. A double charge is a design bug, not a model bug.
---
gpt-4o scores about 61% on one tau-bench retail trial, under 25% if it must pass all 8. Identical 61% coins would pass all 8 only 1.9% of the time. Tasks vary, so real curves are flatter than p^n.

## Substack Note

An agent that gets each step right 95% of the time finishes a 14-step job without a mistake only 49% of the time. That's 0.95^14, the same compounding that bit me in a ranking bug in October, with steps instead of days.

So I wrote a seeded simulation to see what buys reliability back. At 95% per step over 20 steps, no retries finish 35.5% of runs. Retry twice and it's 99.8%, but only if failures are transient: when half are persistent, it's 60.4%. Checkpointing every 5 steps got 100.0%, against 88.8% for restarting from step 1 under the same call cap. And retrying a step with a side effect duplicated it in 41.1% of runs until I added idempotency keys.

It's a model, not a real LLM, and real agents recover from mistakes better than independent coin flips would. The post says where it breaks:

https://www.0xadityaa.dev/blog/95-percent-per-step-is-a-coin-flip-by-step-14
