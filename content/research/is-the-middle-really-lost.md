# Is the Middle Really Lost?

- Topic issue: none (series backlog item NEW-A, M3 L3 "lost in the middle")
- Format: essay
- Thesis: In a 7-paragraph, about 1,250-token context, Qwen2.5-0.5B does worse when the answer paragraph sits in the middle (about 10 F1 points below either end), but on the pre-chosen metric and 74 questions the evidence is borderline, and the cost of six distractors is as large as the position effect.
- Reader: someone who packs retrieved chunks into prompts and has heard "put the important thing first or last".

## What this adds

- Liu et al., [Lost in the Middle](https://arxiv.org/abs/2307.03172): the original measurement, on larger models.
- [What Does Context Really Cost?](/blog/your-context-window-is-a-memory-bill): the memory and token bill of long context.
- [Is Your Eval Too Small?](/blog/your-eval-set-is-too-small-to-tell): why paired comparison and intervals matter at n of 100.

This post adds a paired measurement at about 1,250 tokens on a model small enough to rerun on a laptop, reports its power, and puts the position penalty next to the distractor penalty.

## Artifact

`content/research/is-the-middle-really-lost/`. Expectation, written before the first run (`EXPECTATION.txt`): gold-only 70 to 85%; six distractors cost 10 to 20 points; a mild recency effect (end best, start second, middle worst) with a spread of 3 to 8 points; a 3 to 5 point effect right at the edge of detectable with 144 questions.

Commands: see the artifact README ("Run it again"). Environment: Apple laptop, 8 cores, 16 GB, 4 threads, Python 3.12, torch 2.7.1, transformers 4.52.4, numpy 2.2.6. Load average before the run 19.04, after 44.04 (`results/load-log.txt`).

Raw output, `results/analysis.txt`, headline rows: contains 62.16 alone and 51.35 / 45.95 / 55.41 at slots 1 / 4 / 7; middle minus start -5.41 [-15.79, 5.26]; middle minus end -9.46 [-18.06, -1.33]; permutation p = 0.178. F1 53.81 / 43.45 / 53.96, permutation p = 0.021. Log-prob -4.84 / -5.32 / -4.44, p below 0.001. 28 / 20 / 26 questions right at every / some / no slot. Smallest reliably detectable gap 14.8 points. 74 questions from 48 articles.

Did the expectation hold? Partly. The distractor cost held (11.3 points). The position spread was a little above my range on contains (9.5) and F1 (10.5). The recency-only shape did not hold: the middle was below the start too, a shallow U. Gold-only (62.2%) was below the 70 to 85% I wrote. The sample was 74 questions, not 144, after a load spike on the shared machine; the design went from five slots to three (dated amendment in `EXPECTATION.txt`).

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Liu et al. studied multi-document QA and key-value retrieval; performance is highest when relevant information is at the start or end and degrades in the middle | https://arxiv.org/abs/2307.03172 (abstract only) | 1 | 2026-11-27 |
| SQuAD v1.1 dev, 48 articles | https://rajpurkar.github.io/SQuAD-explorer/ | 1 | 2026-11-27 |
| Qwen2.5-0.5B-Instruct weights | https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct | 1 | 2026-11-27 |
| All measured numbers | `content/research/is-the-middle-really-lost/results/analysis.txt` | own | 2026-11-27 |
| Counter: a small model's curve may not carry to larger ones; Liu et al. cover larger models only and this artifact has no frontier run | https://arxiv.org/abs/2307.03172 | 1 | 2026-11-27 |

## From Aditya

Nothing needed.

## Outline

1. Opening: 45.9 against 55.4 on the same question; bold thesis.
2. The short version: four bullets with numbers.
3. How I built the test: paired design, metric fixed in advance.
4. What the curve looks like: figure `middle-of-the-context-dip.svg`, table of three metrics.
5. Is that dip noise? Primary against secondary metrics, the 20 informative questions.
6. What does clutter cost compared with position?
7. Where I'd stop trusting this post: sample size, 0.5B model, no fix tested, SQuAD friendliness.
8. The takeaway: trim before reordering; what would change my mind.

Style.md's six things: thesis (opening, bold); artifact (README, figure, table); numbers with sources (Liu et al. and the artifact links); links (11 external); limits (the "Where I'd stop trusting this post" section); ending (rule, what would change my mind, next measurement).

## Open questions

None.

## Left out

The slot 2 and slot 6 runs on the first two questions (design cut); a 1.5B run; a test of a reordering strategy (best first, second best last).
