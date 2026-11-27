## Thread

BM25 plus a cross-encoder reranker: 92.4% recall.
Plain RRF fusion, no reranker: 92.4%.

Latency per query: 864 ms against 59 ms.

1,675 SQuAD questions, a 2,000-token context. The reranker's lift over fusion is 0.9 points, and the interval includes zero ↓

[image: /images/blog/reranker-vs-fusion-equal-budget.svg]
---
The reranker pays off when the context is tight.

RRF + reranker, lift over RRF alone:
→ 2,000 tokens: +0.9 [-0.5, 2.1]
→ 1,000 tokens: +2.4 [0.7, 4.0]
→ 500 tokens: +3.6 [1.5, 5.4]
---
For the single best chunk, the gap is bigger.

RRF alone is right 63.0% of the time. Add the reranker and it's 72.1% (+9.1 points [6.3, 11.6]).

BM25's own top chunk is right 71.1%, reranked 72.2%. The reranker is an ordering tool.
---
BEIR reports that re-ranking models are the best zero-shot on average, at high compute cost.

This 22.7M-parameter cross-encoder trained on MS MARCO. SQuAD questions were written with the paragraph open, which rewards keywords. A harder corpus could favor the reranker.
---
Fuse first. Add a reranker when one to four chunks reach the model, or when the top result is the one that matters.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/a-reranker-ties-fusion-at-15-times-the-latency

## Singles

A 300-question pass put a reranker's lift over BM25 at 2.3 points. On 1,675 questions it's 1.2, with an interval of 0.0 to 2.3.

The extra 1,375 questions took the headline almost in half.
---
The reranker broke 43 questions RRF had already answered right. It rescued 58.

Net: 15 of 1,675 questions, or 0.9 points.
---
At 500 tokens of context, adding a second retriever made recall worse: RRF 78.1%, BM25 alone 81.8%.

A cross-encoder pulled RRF back to 81.7%.
---
Reranking 50 chunks instead of 20 took 2.5 times as long (2,124 ms against 862 ms).

On RRF it added 0.0 points [-1.9, 2.0].
---
A weak retriever gains the most from a reranker: bge-small went from 83.7% to 89.7%.

Fusing it with BM25 scored 91.7% on the same 300 questions, with no reranker.

## Link post

A reranker ties RRF fusion at a 2,000-token context: 92.4% against 92.4%, at 14.6 times the latency.

It only pulls ahead when one to four chunks reach the model.

<BLOG_URL>

[image: /images/blog/reranker-vs-fusion-equal-budget.svg]

## Question

How many chunks reach your model per query, and was your reranker ever measured against plain RRF fusion instead of BM25 alone?

## Substack Note

92.4% against 92.4%. BM25 plus a cross-encoder reranker scores the same recall as plain reciprocal rank fusion of BM25 and an embedding model, on 1,675 SQuAD questions at a 2,000-token context. The reranker takes 864 ms per query on 4 CPU threads. The fusion takes 59.

The paired lift of the reranker over fusion is 0.9 points, with an interval from -0.5 to 2.1. It does earn its place when the context is small: at 1,000 tokens it adds 2.4 points to fusion, at 500 tokens 3.6, and for the single best chunk 9.1.

It also flips answers: 58 rescued, 43 broken.

The write-up covers pool depth, the weak-retriever case and where the result stops holding, with code and raw output.

<BLOG_URL>
