---
title: A Reranker Ties Fusion at 15 Times the Latency
publishedAt: '2026-12-24'
summary: >-
  At 2,000 tokens, BM25 plus a cross-encoder scores 92.4%, the same as RRF fusion, at 14.6 times the latency. It pays off at 1,000 tokens or fewer.
tags:
  - ai
  - rag
  - retrieval
  - evals
draft: true
---

BM25 plus a cross-encoder reranker scores 92.4%. Reciprocal rank fusion of BM25 and an embedding model, with no reranker, also scores 92.4%. The first takes 864 ms per query. The second takes 59.

This is the sequel to [You Tuned the Wrong RAG Setting (It's Chunk Size)](/blog/chunk-size-is-a-hyperparameter-you-never-tuned) and reuses its SQuAD data, its 256-token chunks and its 2,000-token context. This time the question is what a reranker adds once the retrieval stage is already decent. **At a 2,000-token context a cross-encoder adds 0.9 points on top of RRF, an interval that includes zero, for 15 times the latency. It earns its place when the context holds one to four chunks.**

## The short version

- At 2,000 tokens: BM25 91.2%, RRF 92.4%, BM25 plus reranker 92.4%, RRF plus reranker 93.3%. The reranker's lift is 1.2 points over BM25 and 0.9 over RRF.
- Reranking the top 20 costs 862 ms on 4 CPU threads. BM25, bge-small and RRF together cost 59 ms.
- At 500 tokens the reranker adds 3.6 points to RRF. For the best single chunk it adds 9.1.
- A reranker also flips answers the first stage had right: 43 of 1,675 questions after RRF, against 58 rescued.

## What got compared?

The corpus is the 48 articles of the [SQuAD v1.1](https://arxiv.org/abs/1606.05250) dev set, cut into 256-token chunks. A hit means a retrieved chunk fully contains a gold answer span, and every question searches the whole pile of 1,314 chunks. The first stages are [BM25](https://doi.org/10.1561/1500000019) and [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5), fused with [reciprocal rank fusion](https://dl.acm.org/doi/10.1145/1571941.1572114) at k = 60. The reranker is [ms-marco-MiniLM-L-6-v2](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2), a 22.7M-parameter cross-encoder trained on MS MARCO, reading the query and each chunk together and reordering the top 20.

The run covers 1,675 questions, a seeded random subset of the 10,570, because scoring pairs ran for about 50 minutes before the time budget ended. Intervals are paired bootstraps: 5,000 resamples of the 48 articles, with each question's hit or miss compared across pipelines. A first pass on 300 questions had put the reranker's lift over BM25 at 2.3 points [-0.3, 4.9]. On 1,675 it's 1.2 [0.0, 2.3], so the first number was mostly noise.

## Does the reranker beat fusion?

Not at this budget. All four pipelines land within 2.1 points of each other, and the paired difference between BM25 plus reranker and RRF alone is 0.0 points [-1.3, 1.3].

| Pipeline (256-token chunks, k = 8) | Recall at 2,000 tokens | Latency per query |
| --- | --- | --- |
| BM25 | 91.2% [88.8, 93.2] | 2.4 ms |
| bge-small | 83.8% [80.9, 86.7] | 56.5 ms |
| RRF of both | 92.4% [90.5, 94.1] | 59.1 ms |
| BM25 + reranker | 92.4% [90.6, 94.1] | 864 ms |
| RRF + reranker | 93.3% [91.6, 94.9] | 921 ms |

![Bar chart of recall at equal token budgets, 256-token chunks, 1,675 SQuAD questions. At 2,000 tokens BM25 gets 91.2 percent, RRF 92.4, BM25 with a reranker 92.4 and RRF with a reranker 93.3, so RRF alone ties BM25 plus reranker. At 500 tokens the reranked pipelines reach 81.9 and 81.7, against 78.1 for RRF alone.](/images/blog/reranker-vs-fusion-equal-budget.svg)

Stacking both is the only combination that clearly beats BM25 alone: 2.1 points [0.8, 3.4]. More than half of that, 1.2 points, comes from the fusion step alone, which costs a 56 ms query embedding. Switch to 128-token chunks and fusion alone adds 3.7 points over BM25 [2.6, 4.9], with nothing slower than a vector lookup.

Latency is the median of three passes over 30 queries, one query at a time, with the machine's load average at 21 at the start and 17 at the end. The quietest pass ran the 20-chunk reranker in 440 ms, so 862 ms is the high end. The model card lists 1,800 documents a second on a V100 GPU, so the 15x is a CPU ratio.

## Where does a reranker earn its keep?

When the context is tight. Cut the budget to 1,000 tokens (four chunks) and the reranker adds 2.4 points to RRF [0.7, 4.0]. At 500 tokens (two chunks) it adds 3.6 [1.5, 5.4], and fusion alone is 3.6 points worse than plain BM25 [-6.1, -1.4], so the second retriever hurts until the reranker fixes the order.

The clearest effect is at the top of the list. For the single best chunk, RRF alone is right 63.0% of the time. With the reranker it's 72.1%, a lift of 9.1 points [6.3, 11.6]. BM25's own top chunk is already right 71.1% of the time, and the reranker moves it to 72.2%. Both reranked pipelines converge on the same number, which makes the reranker an ordering tool: it matters when one chunk reaches the model, and it matters less when eight do.

## Does reranking a deeper pool help?

Not measurably. On the first 150 questions, with the reranker reading the top 10, 20 or 50, BM25 plus reranker scores 91.3%, 92.7% and 93.3%, and RRF plus reranker scores 93.3% at all three. Pool 50 minus pool 20 is 0.7 points for BM25 [-2.3, 3.6] and 0.0 for RRF [-1.9, 2.0]. The 50-chunk pool takes 2,124 ms, 2.5 times the 20-chunk pool. A gold chunk sat in the top 20 of the RRF list for 97.3% of those questions, so the pool leaves little to find.

## Does it also break things?

Yes, in numbers that match the lift. After BM25 the reranker rescued 55 questions and broke 35, from 148 first-stage misses. After RRF it rescued 58 and broke 43 (128 misses). The net, 20 and 15 questions out of 1,675, is the 1.2 and 0.9. SQuAD questions share words with their answers, which is exactly what BM25 rewards.

## Does a weak first stage need it more?

It did in the 300 questions that also ran the bge-small arm. Reranking bge-small's top 20 lifted it from 83.7% to 89.7%, 6.0 points [2.4, 10.0], against 2.7 points for BM25 on the same questions [0.4, 5.4]. That gap of 3.3 points has an interval of [-0.3, 7.2], so the direction is clear and the size isn't. Fusing in BM25 was still cheaper: on those 300 questions RRF alone scored 91.7%, above the reranked bge-small.

## Where this stops holding

The reranker was trained on MS MARCO web queries, and SQuAD questions were written with the paragraph open, which rewards keyword matching. [BEIR](https://arxiv.org/abs/2104.08663), a heterogeneous zero-shot benchmark, reports that "re-ranking and late-interaction-based models on average achieve the best zero-shot performances," at high computational cost, and [Nogueira and Cho](https://arxiv.org/abs/1901.04085) beat the previous best MS MARCO system by 27% relative in MRR@10 with a BERT reranker. Anthropic's [contextual retrieval](https://www.anthropic.com/news/contextual-retrieval) pipeline reranks 150 candidates down to 20 and took top-20 failures from 5.7% to 1.9%, 2.9% before the reranker. A larger reranker, a harder corpus or a bigger pool could all land above this. Those weren't run, nor was a reranker at 128 tokens, tuned fusion weights, or a generator reading the chunks.

## The takeaway

Fuse first. RRF takes a few lines of code and a query embedding, and it recovered 1.2 of the full pipeline's 2.1-point gain over BM25 here. Add a reranker when only one to four chunks reach the model, when the top result is the one that matters, or when the first stage is weak. At eight chunks or more, measure before paying 860 ms.

Measuring takes more questions than most eval sets hold: a 1-point lift needed 1,675 paired questions to come out with an interval of [0.0, 2.3], and [Your 100-Example Eval Is Lying About That 3-Point Win](/blog/your-eval-set-is-too-small-to-tell) explains why a 100-question eval can't see it. Everything is in the [artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/a-reranker-ties-fusion-at-15-times-the-latency). A 5-point lift on a corpus without keyword overlap would overturn the "fuse first" rule.
