# 95% Per Step Is a Coin Flip by Step 14

- Topic issue: none yet (drafted from a series brief, AI-engineering syllabus; the topic list is the only thing taken from llmdojo.dev/curriculum)
- Format: essay
- Thesis: Per-step reliability compounds, so a long agent run fails often even with a good model. Retries help only when failures are transient and steps are idempotent. Checkpoints and shorter loops buy more reliability than a better prompt.
- Reader: an engineer who has built or is about to build a tool-calling agent, knows what a retry is, and has not worked out `p^n` for their own loop.

## What this adds

Prior art, all checked 2026-11-14:

- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) (Anthropic): names compounding errors, sandbox testing, stopping conditions, checkpoints. Gives no numbers.
- [τ-bench](https://arxiv.org/abs/2406.12045): measures reliability across repeated trials with pass^k, on real model runs. Does not separate retry, checkpoint, and idempotency.
- [Measuring AI Ability to Complete Long Software Tasks](https://arxiv.org/abs/2503.14499) (METR): task length at 50% and 80% success. Does not say what to do about the gap.
- His own [Do You Really Need AI Agents?](../blog/do-you-really-need-agents.md), whose limits section asked for a run that reports error rate. This post is the error-rate half, simulated.

What it adds: one table that puts the failure-handling strategies (retries, persistent failures, checkpoints, non-idempotent steps) side by side on the same seeded task, with calls per completed task as the cost, so the reader can see which lever moves the number.

## Artifact

`content/research/95-percent-per-step-is-a-coin-flip-by-step-14/`: `simulate.py`, `output.txt`, `make_chart.py`, `README.md`, `social.md`.

**Expectation, written before running.** Closed form: `p^n`, with 0.95^14 = 0.49 and 50% at 6.6, 13.5, and 69.0 steps for p = 0.90, 0.95, 0.99. Transient retries would lift success to the high 90s at every cell except 90% with 40 steps. Half-persistent failures would leave retries far behind. Checkpointing every five steps would beat restart-from-step-1 at equal call budget, with the gap growing with `n`. Idempotency keys would remove all duplicates. I expected checkpointing to be good, but not to reach 100.0% at 90% per step over 40 steps.

**Command.**

```bash
cd content/research/95-percent-per-step-is-a-coin-flip-by-step-14
python3 simulate.py > output.txt
python3 make_chart.py ../../../public/images/blog/success-vs-steps-compounding.svg
```

**Environment.** Python 3.12.8, macOS 26.5.1 arm64, standard library only (no virtualenv needed; a throwaway one under `/private/tmp/claude-501/venv-pdf` was used only to extract text from two source PDFs). Seed 20261114, 20,000 trials per cell, per-strategy RNG seeded from `seed-p-n-strategy`.

**Raw output.** Full text in `output.txt`. The closed form:

```text
| p \ steps | 5 | 10 | 20 | 40 | steps until success falls to 50% |
| 0.90 | 0.590 | 0.349 | 0.122 | 0.015 | 6.6 |
| 0.95 | 0.774 | 0.599 | 0.358 | 0.129 | 13.5 |
| 0.99 | 0.951 | 0.904 | 0.818 | 0.669 | 69.0 |
0.95^14 = 0.4877
```

The cell the post leans on, p = 0.95, 20 steps (closed form a=0.358, b=0.998, c=0.602):

```text
| strategy | success | calls/done | dupes/task | dupe% |
| a  no retries | 0.355 | 36.1 | 0.000 | 0.0% |
| b  retry x2, all failures transient | 0.998 | 21.1 | 0.000 | 0.0% |
| c  retry x2, half of failures persistent | 0.604 | 28.3 | 0.000 | 0.0% |
| d0 restart from step 1 (cap 3n calls) | 0.888 | 37.4 | 0.000 | 0.0% |
| d  checkpoint every 5 steps, resume (cap 3n calls) | 1.000 | 23.4 | 0.000 | 0.0% |
| e  retry x2, non-idempotent, half of failures are timeouts | 0.997 | 21.1 | 0.537 | 41.1% |
| e2 same as e, with idempotency keys | 0.997 | 21.1 | 0.000 | 0.0% |
```

Other cells quoted: p = 0.90, 40 steps: a 0.015, b 0.958, c 0.126, d0 0.128, d 1.000 (55.5 calls), e 2.156 dupes/task and 88.0% of runs. p = 0.95, 40 steps: d0 0.578 against d 1.000. p = 0.99, 20 steps: a 0.817.

**Did the expectation hold?** Yes for ordering, the closed-form match (simulated a, b, c within 0.005 of the formulas in every cell), and idempotency. Where it did not: checkpointing reached 1.000 at 90% per step over 40 steps, more than I expected. That is a result of the model's assumptions (independent attempts, failures detected at once, perfect resume), not evidence that checkpoints are that good. The post says so.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| pass^k is the chance that all k i.i.d. trials of a task succeed, averaged across tasks | https://arxiv.org/abs/2406.12045 (section on the pass^k metric, read from the PDF) | 1 | 2026-11-14 |
| gpt-4o function calling: about 61% on tau-retail for one trial, under 25% for pass^8 | same paper, abstract and section 5 | 1 | 2026-11-14 |
| 0.61^8 = 0.019 (arithmetic for the heterogeneity point) | computed | n/a | 2026-11-14 |
| Frontier 50% time horizon about 50 minutes (Claude 3.7 Sonnet); doubling about every seven months since 2019 | https://arxiv.org/abs/2503.14499 (abstract) | 1 | 2026-11-14 |
| 80% horizons are 4 to 6 times shorter than 50% horizons | same paper, section 3.2.1 | 1 | 2026-11-14 |
| Models improved at adapting to mistakes instead of repeating failed actions | same paper, section 3.3 and appendix | 1 | 2026-11-14 |
| Stripe: `Idempotency-Key`, saves status and body of first request, retries return the saved response, v1 keys can be pruned after 24 hours, differing parameters error, all POSTs accept keys | https://docs.stripe.com/api/idempotent_requests | 1 | 2026-11-14 |
| Anthropic: autonomy brings compounding errors, test in sandboxes, stopping conditions, pause for human feedback at checkpoints | https://www.anthropic.com/engineering/building-effective-agents | 1 | 2026-11-14 |
| Counter: LLMs cannot reliably self-correct reasoning without external feedback, sometimes get worse | https://arxiv.org/abs/2310.01798 (ICLR 2024) | 1 | 2026-11-14 |
| Counter: real curves are flatter than `p^n`; models recover from errors; horizons keep growing | https://arxiv.org/abs/2503.14499 | 1 | 2026-11-14 |
| All simulation numbers | `output.txt`, seed 20261114 | artifact | 2026-11-14 |
| 5% a day compounding post | his own post, `content/blog/five-percent-a-day-sounds-gentle.md` | his | |

Primary sources: every row but the two computed and the one from his own post.

## Counter-argument

Steps are not independent coin flips. A strong model that sees a failing test or a tool error changes course, so real success curves are flatter than `p^n` (METR section 3.3, and the doubling of task horizons). Steelman, as it appears in the post: the simple model understates what current models can do. Where it still holds: METR's 80% horizons are 4 to 6 times shorter than the 50% ones; Huang et al. show recovery needs external feedback; τ-bench shows pass^k falling fast; and the model has no silent failures, which no retry or checkpoint addresses. The τ-bench point (0.61^8 = 1.9% against under 25% reported) is used to show where independence breaks, which cuts in the counter-argument's favour, so it is in the limits section on purpose.

## Self-check against style.md

1. Thesis in the first 150 words: third paragraph, bold sentence, after the opening thought experiment and the sequel link.
2. Artifact: the simulation, its output tables, and the SVG chart; folder linked from the post.
3. Numbers with papers: every external number has an inline link (τ-bench, METR, Stripe); simulation numbers point at the repo folder. This post is about reliability, not cost, so no three-volume cost table; the closed-form table spans four run lengths and three reliabilities.
4. Links as evidence trail: 11 external links in about 1,900 words (limit for the check is 9).
5. Limits: "Where I'd stop trusting this post", strongest objection first with METR and Huang, then what he did not test.
6. Ending that adds: decision rule (work out `p^n`; if under 90%, segment, key, and retry only transient errors) plus what would change his mind.

## Outline

Thesis: per-step reliability compounds; retries, checkpoints, and idempotency each fix a different failure.

1. Opening: thought experiment (labelled), link to the earlier agents post, thesis.
2. The short version.
3. Why does 95% per step fall apart so fast? Table of `p^n`; chart with the 50% line, 0.95 in accent with step 14 marked; τ-bench pass^k.
4. What did I simulate? Setup and five strategies.
5. Do retries fix it? Table at p = 0.95, 20 steps; persistent failures; the 90%, 40 step cell.
6. What do checkpoints buy? Checkpoint against restart; against a better prompt; Anthropic and LangGraph.
7. What happens when a retry isn't safe? Duplicate side effects; Stripe idempotency keys.
8. Where I'd stop trusting this post: independence, METR and Huang; τ-bench flattening; detection assumed; knobs mine; no real model.
9. The takeaway.

Diagram: `public/images/blog/success-vs-steps-compounding.svg`. Success against steps for p = 0.90, 0.95, 0.99 with the 50% line; 0.95 at step 14 (0.49) is the one accent point.

## Open questions

- Has he seen an agent run fail in a way that matches this (a long run, a retried side effect, a silent wrong step)? If so, what and roughly when, and what can be said publicly? The post deliberately has no such story; one real, small anecdote would improve the opening.
- Does he want the sequel to run a real model on a real task and report the curve, to answer the "flatter than `p^n`" objection with data?
- Is the `3n` call cap and the every-five-steps checkpoint a fair default, or does he want other values swept?

## Left out

Self-consistency or majority voting per step; verification steps as a separate reliability stage; cost in tokens and seconds; durable-execution engines (Temporal-style) as the production form of checkpointing; the 95% horizon, which METR says its data cannot measure.
