# Research note: A Reranker Ties Fusion at 15 Times the Latency

- Topic issue: none (series post 9, planned for Thu 24 December 2026)
- Format: essay
- Thesis: at a 2,000-token context, a cross-encoder reranker adds under a point over reciprocal rank fusion at about 15 times the latency; it pays off when one to four chunks reach the model.
- Reader: an engineer who has built a RAG pipeline, knows BM25 and embeddings, and has been told to "add a reranker".

Written 2026-11-26.

## What this adds

This is the sequel to [You Tuned the Wrong RAG Setting (It's Chunk Size)](../blog/chunk-size-is-a-hyperparameter-you-never-tuned.md) and reuses its data and chunking. The strongest existing writing on rerankers:

- Thakur et al., [BEIR](https://arxiv.org/abs/2104.08663) (2021): across a heterogeneous zero-shot benchmark, "re-ranking and late-interaction-based models on average achieve the best zero-shot performances," at high computational cost (abstract).
- Nogueira and Cho, [Passage Re-ranking with BERT](https://arxiv.org/abs/1901.04085) (2019): a BERT reranker took the top of the MS MARCO passage leaderboard, 27% relative over the previous best in MRR@10 (abstract).
- Anthropic, [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) (2024): reranking 150 candidates down to 20 took top-20 failures from 5.7% to 1.9% (2.9% before the reranker).

What this post adds: the reranker's lift measured against fusion rather than only against BM25, at equal token budgets, with paired intervals, and a latency figure on a CPU for pools of 10, 20 and 50. The published results show where rerankers win; this one shows how big the win is once a second retriever is already in the pipeline, on keyword-heavy data.

## Artifact

`content/research/a-reranker-ties-fusion-at-15-times-the-latency/`. SQuAD v1.1 dev (48 articles), 256-token `o200k_base` chunks (128-token first stages for reference), BM25, bge-small, RRF (k = 60), `cross-encoder/ms-marco-MiniLM-L-6-v2` over the top 10, 20 and 50. 1,675 of 2,000 randomly drawn questions fully scored at pool 20; pool 50 on the first 150; bge-small arm on the first 300. Paired bootstrap, 5,000 resamples, seed 20261115.

### Expectation, written before running

From `EXPECTATION.txt` (2026-11-15) and how each held:

1. RRF beats the better single retriever by 1 to 3 points at both sizes. Held at 256 (1.2 points over BM25, interval [-0.2, 2.6]); at 128 it was 3.7 [2.6, 4.9], above the guess.
2. BM25 + rerank and RRF + rerank both end above 94%, RRF + rerank best by about a point over BM25 + rerank. Wrong: 92.4% and 93.3%. RRF + rerank was 0.9 [0.2, 1.6] above BM25 + rerank, as guessed. The 128-token reranker arm was not run.
3. The reranker helps most where the first stage is weakest. Held in direction: +6.0 [2.4, 10.0] for bge-small against +2.7 [0.4, 5.4] for BM25 on the same 300 questions, a difference of 3.3 [-0.3, 7.2].
4. Reranking 50 chunks at 256 tokens takes 0.3 to 1 second per query. Wrong: 2.1 s median over three passes, 1.05 s on the quietest pass, with the machine loaded.
5. The lift over BM25 is under 5 points. Held: 1.2 [0.0, 2.3].

### Commands

See the artifact README. In short:

```bash
venv/bin/python $R/latency.py data cache $R/results 2000
venv/bin/python $R/run.py data cache $R/results 2000 35
venv/bin/python $R/analyze.py $R/results
venv/bin/python $R/make_chart.py $R/results public/images/blog/reranker-vs-fusion-equal-budget.svg
```

### Environment

Apple M2, 8 cores, 16 GB, CPU only, 4 torch threads, shared machine (load averages in the artifact README: 15 to 21 during latency and the start of the run, 44 at the end). Python 3.12, torch 2.15.0, sentence-transformers 6.3.0, tiktoken 0.14.0, numpy 2.5.5, scipy 1.18.1. `dev-v1.1.json` SHA-256 `95aa6a52d5d6a735563366753ca50492a658031da74f301ac5238b03966972c9`. bge-small revision `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a`; cross-encoder revision `233902d25c440f23af6f7d6e94d2946bac0bee0a`.

### Raw output

Full tables: `results/analysis.txt`. Headline lines:

```text
budget 2000 (k=8), first 1675 questions, 256-token chunks
  BM25 91.2 [88.8, 93.2]  bge-small 83.8  RRF 92.4 [90.5, 94.1]
  BM25 + rerank (pool 20) 92.4 [90.6, 94.1]  RRF + rerank 93.3 [91.6, 94.9]
reranker lift on BM25 = 1.2 [0.0, 2.3]; on RRF = 0.9 [-0.5, 2.1]
BM25 + rerank minus RRF alone = 0.0 [-1.3, 1.3]; RRF + rerank minus BM25 alone = 2.1 [0.8, 3.4]
budget 1000: reranker lift on RRF = 2.4 [0.7, 4.0]; budget 500: 3.6 [1.5, 5.4]
recall@1: RRF 63.0 -> 72.1 (+9.1 [6.3, 11.6]); BM25 71.1 -> 72.2 (+1.1 [-1.4, 3.4])
rescued / broken at budget 2000: BM25 55 / 35, RRF 58 / 43
latency ms (median of 3 pass medians, 30 queries): BM25 2.4, dense 56.5, RRF 0.3, rerank 10: 497, 20: 862, 50: 2124
```

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| SQuAD v1.1: 48 dev articles, 10,570 questions | https://arxiv.org/abs/1606.05250 and the dataset file (hash above) | 1 | 2026-11-26 |
| bge-small-en-v1.5 is a 33M-parameter embedding model | https://huggingface.co/BAAI/bge-small-en-v1.5 | 1 | 2026-11-14 |
| The cross-encoder has 22.7M parameters, trained on MS MARCO, 1,800 docs/s on a V100 | https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2 | 1 | 2026-11-26 |
| RRF is from Cormack, Clarke and Buettcher (SIGIR 2009); k = 60 is the constant used here | https://dl.acm.org/doi/10.1145/1571941.1572114 (blocks scripts; the DOI resolves, and the authors' PDF is dated May 2009) | 1 | 2026-11-26 |
| BM25 reference | https://doi.org/10.1561/1500000019 (resolves to "The Probabilistic Relevance Framework: BM25 and Beyond") | 1 | 2026-11-26 |
| BEIR: re-ranking and late-interaction models achieve the best zero-shot performance on average, at high compute cost | https://arxiv.org/abs/2104.08663 (abstract) | 1 | 2026-11-26 |
| BERT reranker beat the previous MS MARCO best by 27% relative in MRR@10 | https://arxiv.org/abs/1901.04085 (abstract) | 1 | 2026-11-26 |
| Contextual retrieval: reranking 150 chunks to 20, failures 5.7% to 1.9% (2.9% before reranking) | https://www.anthropic.com/news/contextual-retrieval | 1 | 2026-11-26 |
| Every measured number | `results/analysis.txt`, `results/latency.json` | artifact | 2026-11-26 |
| Counter: reranking is the strongest addition to a retrieval stack | BEIR and Anthropic above | 1 | 2026-11-26 |

## Counter-argument

The case that a reranker is worth its cost is BEIR's finding plus Anthropic's 2.9% to 1.9% result. The post states both in the limits section and says the SQuAD result is for keyword-heavy questions and a small cross-encoder.

## Where the six required things are

1. Thesis: bold sentence in the second paragraph.
2. Artifact: the run, the table, the chart, the artifact link in the takeaway.
3. Numbers with sources: every measured number from the artifact; external figures link to their pages. The post is about latency and shows it at pools 10, 20 and 50 rather than a price table.
4. Links: 12 links in about 1,300 words.
5. Where this stops holding: its own section.
6. Ending: "The takeaway" gives the decision rule and what would overturn it.

## Outline

- Opening: 92.4% against 92.4%, 864 ms against 59 ms. Thesis. Sequel link.
- The short version.
- What got compared.
- Does the reranker beat fusion? Table and chart.
- Where does a reranker earn its keep? Tight budgets and top-1.
- Does reranking a deeper pool help?
- Does it also break things?
- Does a weak first stage need it more?
- Where this stops holding.
- The takeaway.

## Open questions

- None blocking. A GPU latency figure would change the 15x; none was measured.

## Left out

- A 128-token reranker arm, a larger cross-encoder, tuned fusion weights, an LLM reranker, and a generator in the loop.
- The first 300-question pass (lift +2.3 [-0.3, 4.9] over BM25, latency about 5 s under load average 170 to 260), kept in `earlier-300q-loaded/`.
