## Thread

A 95%-reliable agent fails half its 14-step tasks.

0.95^14 = 0.49. Per-step reliability compounds, so a model you'd happily call reliable finishes a long job about as often as a coin lands heads.

[image: /images/blog/success-vs-steps-compounding.svg]
---
Retries, 20 steps at 95% per step:

→ no retries: 35.5% finish
→ retry twice, transient errors: 99.8%
→ retry twice, half persistent: 60.4%

A wrong parameter or a missing permission returns the same error every time.
---
Checkpoint every 5 steps and resume, under the same 3n call cap as restarting from step 1:

→ 20 steps: 100.0% vs 88.8% finish
→ 40 steps: 100.0% vs 57.8%
→ calls per success at 20 steps: 23.4 vs 37.4
---
Retrying a step with a side effect can run it twice. With half of failures as timeouts where the action landed, 41.1% of 20-step runs at 95% did something twice. At 90% and 40 steps: 88.0%. Idempotency keys took duplicates to 0.
---
Work out p^n with the per-step success you honestly believe. Under 90%, skip the prompt rewrite: checkpoint, key every side-effect tool, retry only errors you can show are transient.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/95-percent-per-step-is-a-coin-flip-by-step-14

## Singles

A 95%-per-step agent hits a coin flip at step 13.5.

At 90% it's step 6.6. At 99% it's step 69.

Past that point, a longer loop mostly adds ways to fail.
---
Two retries took a 20-step run at 95% per step from 35.5% to 99.8%.

Make half the errors persistent and the same retries reach only 60.4%.

Whether an error can change matters more than how many retries you allow.
---
A 99% agent with no retries finishes 20 steps 81.7% of the time.

A 95% agent that resumes from a checkpoint: 100.0%, when failures are transient.

Structure beat prompt work, and by a wide margin.
---
Retrying on timeout looks safe until the action already landed.

In simulation, 41.1% of 20-step runs at 95% per step did something twice. At 90% and 40 steps: 88.0%, or 2.16 duplicates per run.

With idempotency keys: 0.
---
40 steps at 90% per step, model calls per finished task:

No retries: 672.6
Restart from step 1: 894.7
Checkpoint every 5: 55.5

Most of the spend in the first two goes to runs that never finish.

## Link post

A 95%-per-step agent finishes a 14-step task 49% of the time. When failures are transient, checkpoints and idempotency keys buy back more than a better prompt.

<BLOG_URL>

[image: /images/blog/success-vs-steps-compounding.svg]

## Question

How many steps does your longest agent run take, and what's the per-step success rate when you actually measure it?

## Substack Note

A 95%-per-step agent finishes a 14-step job only 49% of the time. That's 0.95 to the power of 14, from a model you'd happily call reliable.

A seeded simulation shows what buys the other half back. Two retries per step lift a 20-step run from 35.5% to 99.8%, but only when failures are transient. With half of them persistent, it's 60.4%. Checkpointing every 5 steps finished 100.0% of runs, against 88.8% for restarting from step 1 under the same call cap. Retrying a step with a side effect did it twice in 41.1% of runs, until idempotency keys went in.

No real LLM ran, and real agents recover from mistakes better than independent coin flips would. The post covers where that breaks:

<BLOG_URL>
