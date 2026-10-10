# Research note: Why Does Every AI Tool Forget You?

Written 10 October 2026, revised the same day after Aditya's review: the first draft read as marketing, so the post now leads with the question and mentions Hivemind once, as the side project the evidence came from.

## What this adds

An explainer of why chat tools forget: models are stateless, memory is retrieval plus a paste, and each app keeps its own store. The evidence is a four-way comparison of how the pasted notes get chosen.

## Artifact

The LoCoMo baseline table: full context, BM25, embedding search, and the fused pipeline, on the same 1,536 questions.

## Claims and sources

| Claim | Source |
| --- | --- |
| Recall and tokens per question for the four rows (99.7% and 18,853; 63.9% and 349; 70.4% and 389; 79.5% and 465), n=1,536, K=10 | Hivemind `docs/BENCHMARKS.md`, Baseline controls, 15 September 2026, offline harness, category 5 excluded |
| End-to-end accuracy with a small answering model is much lower than recall | same file, End-to-end QA accuracy (44.9% with a 1B model) |
| 78.2% against the live service | https://gethivemind.xyz/docs/concepts/evidence |
| Context windows | https://docs.anthropic.com/en/docs/build-with-claude/context-windows |
| Lost in the middle | https://arxiv.org/abs/2307.03172 |
| LoCoMo | https://arxiv.org/abs/2402.17753 |

## From Aditya

First-person lines restate what the Hivemind repository records (code comments, decision records, benchmark notes). Colour such as "kept bugging me" was added in drafting; he should change anything that is not true to him.

## Open questions

- The baseline table is from the internal benchmark file, which says nothing there is published without its caveats. The post states them (offline, one benchmark, retrieval not answers). Is he happy publishing these rows?
- The description of how other apps store memory is general knowledge, not sourced to their docs. Add sources or soften if he prefers.

## Left out

Competitor names, launch status, pricing, calls to action, and any benchmark figure without its conditions.
