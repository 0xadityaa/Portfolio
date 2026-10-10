# Research note: 5% a Day Sounds Gentle. It Isn't.

Written 10 October 2026, revised the same day after Aditya's review: the first draft read as marketing, so the post now leads with the question and mentions Hivemind once, as the side project the evidence came from.

## What this adds

A short piece on compounding decay, told through a bug in his own ranking code, with the arithmetic and the reason a benchmark could not see it.

## Artifact

The decay table (0.95 to the power of days), the half-life of 13.5 days, the replacement curve, and a simplified recency function.

## Claims and sources

| Claim | Source |
| --- | --- |
| 5% a day compounding; promotion to long-term after five accesses, called earned permanence; benchmark ages all zero; top-k with a budget cutoff; the 2,000-token example | Hivemind `packages/engine/src/retrieval/selection.ts`, header comment |
| Half-life 180 days, floor 0.35, long-term does not decay | same file, `DEFAULT_SELECTION_CONFIG`, `recencyMultiplier` |
| Greedy by value per token plus a swap pass, microseconds on fifty candidates, constant factor of optimal | same file, `packByDensity` comment |
| Half-life of 5% a day is 13.5 days | computed: ln 0.5 / ln 0.95 |
| Lost in the middle | https://arxiv.org/abs/2307.03172 |

## From Aditya

First-person lines restate what the Hivemind repository records (code comments, decision records, benchmark notes). Colour such as "kept bugging me" was added in drafting; he should change anything that is not true to him.

## Open questions

- Hivemind is closed source. The post shows a simplified internal function and two constants. Is that fine?
- Roughly when did he find this?

## Left out

Competitor names, launch status, pricing, calls to action, and any benchmark figure without its conditions.
