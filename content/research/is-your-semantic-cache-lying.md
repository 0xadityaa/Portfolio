# Is Your Semantic Cache Lying?

- Topic issue: none (series post #25, backlog order 6)
- Format: essay (about 1,600 prose words, two figures, two tables)
- Thesis: Raising the threshold does not make a semantic cache safe. The narrow cone is real but mostly a distraction; near-duplicate questions that differ in one detail cause the false hits (28% of MiniLM hits wrong at 0.85 on QQP).
- Reader: an engineer putting a semantic cache in front of an LLM.

## What this adds

Prior art: [Ethayarajh 2019](https://arxiv.org/abs/1909.00512) on anisotropy; the bge-small and e5-small-v2 model cards, which warn about the score range; [GPTCache](https://github.com/zilliztech/GPTCache) as an example cache. The cone result is known. This adds the false-hit curve on labelled Quora pairs for three models, the cost in lost duplicates of holding the wrong share to 5% or 10%, and a per-query embedding cost.

## Artifact

[`content/research/is-your-semantic-cache-lying/`](https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-your-semantic-cache-lying). 5,000 QQP validation pairs, seed 20261127, three models, 4 threads. Expectation: [`EXPECTATION.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-semantic-cache-lying/EXPECTATION.txt). Raw output: [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-semantic-cache-lying/output.txt).

### What happened

| Expectation | Result | Held? |
| --- | --- | --- |
| Random-pair mean: MiniLM 0.0 to 0.1, bge 0.4 to 0.5, e5 0.7 to 0.8 | 0.045, 0.382, 0.767 | Yes, bge slightly under |
| 5 to 15% wrong hits at 0.85 to 0.90 | MiniLM 28% and 21%, bge 35% and 26%, e5 55% and 45% | No, worse |
| 5% wrong threshold costs over half the duplicates | MiniLM and e5 never reach 5% (grid to 0.99); bge at 0.987 keeps 7% of duplicates | Yes, more than expected |
| e5 needs the highest threshold | Yes (10% wrong needs 0.990) | Yes |
| Batch-1 embed 5 to 15 ms (MiniLM), more for the others | 33, 71, 84 ms median under load 18 to 28 | No |

### Environment

Python 3.12.8, torch 2.15.0, transformers 5.24.1, numpy 2.5.5, macOS (Darwin 25.5.0), 4 threads on a shared machine. Load averages are in the artifact README (17.71 before and 28.13 after the committed run).

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Contextual representations are not isotropic in any layer | https://arxiv.org/abs/1909.00512 (abstract) | 1 | 2026-11-27 |
| bge-small: similarity distribution about [0.6, 1]; above 0.5 does not mean similar | https://huggingface.co/BAAI/bge-small-en-v1.5 | 1 | 2026-11-27 |
| e5-small-v2: scores distribute around 0.7 to 1.0 (low InfoNCE temperature); needs `query: ` prefix | https://huggingface.co/intfloat/e5-small-v2 | 1 | 2026-11-27 |
| QQP is part of GLUE | https://arxiv.org/abs/1804.07461 | 1 | 2026-11-27 |
| GPTCache is an open-source semantic cache | https://github.com/zilliztech/GPTCache | 1 | 2026-11-27 |
| Quora's own description of label quality | https://quoradata.quora.com/First-Quora-Dataset-Release-Question-Pairs returned 403; not used | n/a | 2026-11-27 |
| Every measured number | [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-semantic-cache-lying/output.txt) | artifact | 2026-11-27 |

Counter-argument: QQP negatives are hard by construction and real traffic has many easy misses, so the false-hit share overstates it. It is the first item in the post's limits.

## From Aditya

Nothing needed.

## Outline

Opening on the castor-oil pair (0.989). Bold thesis. Short version. What a cache does (cosine, false-hit share formulas). Is the cone real (figure 1). Where false hits come from (examples, figure 2, table). What a low false-hit rate costs (10% and 5% table, latency). What to do instead (untested). Limits. Takeaway.

### Where each of the six required things is

1. Thesis in the first 150 words: the bold paragraph after the opening.
2. Artifact: the run in the artifact folder, two figures, two tables.
3. Numbers with their papers: model cards and papers linked at first mention, checked 2026-11-27; no cost claims.
4. Links as the evidence trail: every model, dataset, paper, script and output file linked.
5. Limits: "Where I'd stop trusting this post".
6. Ending that adds: a 200 plus 200 pair test, and what would change my mind.

## Open questions

None.

## Left out

- A true top-1 lookup against a cache of thousands of entries.
- An entity or number guard, and a cross-encoder check on the hit.
- Larger embedding models.
