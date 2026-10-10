# Research note: My Memory Layer Was Quietly Forgetting Everything

Written 10 October 2026 from the Hivemind repository (private).

## What this adds

A first-hand bug story: two defects in Hivemind's selection stage that a retrieval benchmark could not see, why it could not, and what replaced them. The general point (a benchmark only catches what its data can express) is backed by a concrete case with arithmetic.

## Artifact

The decay arithmetic (0.95 to the power of days, recomputed here: 0.698, 0.215, 0.0099, 0.000098, and 7.4e-9 at a year), the replacement curve (floor 0.35, half-life 180 days: 0.983, 0.929, 0.810, 0.675, 0.509), and a simplified version of the recency function.

## Claims and sources

| Claim | Source |
| --- | --- |
| Old selection sorted by score and filled until the budget ran out; a 2,000-token memory at 0.9 displaced twenty 100-token memories at 0.85 | `packages/engine/src/retrieval/selection.ts`, header comment |
| Scores decayed 5% a day, compounding | same |
| A memory was promoted to long-term after five accesses, called "earned permanence" | same |
| Benchmark runs ingest everything at once, so every age is zero | same |
| New packing: greedy by score per token, then a bounded swap pass; microseconds on fifty candidates; within a constant factor of optimal; exact DP affordable | same file, `packByDensity` doc comment |
| Task half-life 180 days, floor 0.35; long-term does not decay | same file, `DEFAULT_SELECTION_CONFIG` and `recencyMultiplier` |
| Tokens counted with a real tokenizer, not characters over four | same file, `estimateTokens` doc comment |
| "Every number here is a hypothesis" | same file, `SelectionConfig` doc comment |
| Lost in the middle | https://arxiv.org/abs/2307.03172 |

## From Aditya

Everything in first person comes from the code comments above, which record what was found and why it was changed. "It stung" and "a bit awkward" are colour added in drafting.

## Outline

Opening and thesis. Bug one (packing). Bug two (decay, with the table). Why the benchmark missed both. The fix (density packing, half-life with a floor, real token counts). Limits. Takeaway: find the input where each ranking signal is not a constant.

## Open questions

- Hivemind is closed source (ADR 0017). This post shows a simplified internal function and its constants. Is he fine publishing those?
- Roughly when did he find this? A month in the opening would help.
- The post does not claim a before and after benchmark number for this change. Is there one he wants cited?

## Left out

The scratch tier's separate half-life (21 days, floor 0.05), the access-count weight, the diversity penalty, and issue numbers.
