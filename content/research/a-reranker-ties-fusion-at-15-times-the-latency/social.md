## Thread

I ran two retrieval pipelines on 1,675 SQuAD questions.

BM25 + a cross-encoder reranker: 92.4% recall.
Plain RRF fusion, no reranker: 92.4%.

Latency per query: 864 ms vs 59.

At a 2,000-token context the reranker adds 0.9 points, and the interval includes zero ↓

[image: /images/blog/reranker-vs-fusion-equal-budget.svg]
---
Where it does earn its place: a tight context.

RRF + reranker, lift over RRF alone:
→ 2,000 tokens: +0.9 [-0.5, 2.1]
→ 1,000 tokens: +2.4 [0.7, 4.0]
→ 500 tokens: +3.6 [1.5, 5.4]
---
For the single best chunk the gap is bigger.

RRF alone is right 63.0% of the time. Add the reranker and it's 72.1% (+9.1 points [6.3, 11.6]).

BM25's own top chunk is right 71.1%, reranked 72.2%. The reranker is an ordering tool, not a recall tool.
---
Caveat: the reranker is a 22.7M-parameter model trained on MS MARCO, and SQuAD questions were written with the paragraph open, which rewards keywords.

BEIR reports rerankers as the best zero-shot on average, at high compute cost. A harder corpus could favor the reranker.
---
Fuse first. Add a reranker when one to four chunks reach the model, or when the top result is the one that matters.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/a-reranker-ties-fusion-at-15-times-the-latency

## Singles

My first pass put a reranker's lift over BM25 at 2.3 points, on 300 questions. On 1,675 it's 1.2, with an interval of 0.0 to 2.3.

The extra 1,375 questions took the headline almost in half. 300 questions is noise.
---
The reranker broke 43 questions RRF had already answered right. It rescued 58.

Net: 15 of 1,675 questions, or 0.9 points.
---
At 500 tokens of context, adding a second retriever made recall worse: RRF 78.1%, BM25 alone 81.8%.

A cross-encoder pulled RRF back to 81.7%. The fusion needed the reranker to fix its ordering.
---
Reranking 50 chunks instead of 20 took 2.5 times as long (2,124 ms against 862 ms).

On RRF it added 0.0 points [-1.9, 2.0]. A deeper pool bought me latency and nothing else.
---
A weak retriever gains the most from a reranker: bge-small went from 83.7% to 89.7%.

Fusing it with BM25 scored 91.7% on the same 300 questions, with no reranker. The cheaper fix won.

## Link post

I expected a reranker to beat fusion. At a 2,000-token context it ties it: 92.4% against 92.4%, at 14.6 times the latency.

It only pulls ahead when one to four chunks reach the model.

<BLOG_URL>

[image: /images/blog/reranker-vs-fusion-equal-budget.svg]

## Question

How many chunks reach your model per query, and did you ever measure your reranker against plain RRF fusion instead of BM25 alone?

## Substack Note

92.4% against 92.4%. On 1,675 SQuAD questions at a 2,000-token context, BM25 plus a cross-encoder reranker scores the same recall as plain reciprocal rank fusion of BM25 and an embedding model. The reranker takes 864 ms per query on 4 CPU threads. The fusion takes 59.

The paired lift of the reranker over fusion is 0.9 points, with an interval from -0.5 to 2.1. It does earn its place when the context is small: at 1,000 tokens it adds 2.4 points to fusion, at 500 tokens 3.6, and for the single best chunk 9.1.

It also flips answers: 58 rescued, 43 broken.

I wrote up pool depth, the weak-retriever case and where I'd stop trusting the result, with code and raw output.

<BLOG_URL>
