## Thread

Swapping my retriever moved recall by 2 points. Changing the chunk size moved it by 5 to 6. I tested both on 10,570 SQuAD questions, and I'd never tuned the second one.
---
Most RAG pipelines use 512-token chunks because a tutorial did. I swept 64 to 1,024 tokens with two retrievers, BM25 and a small embedding model, at a fixed 2,000-token context.
---
Quick trap: at a fixed k=5, BM25 recall climbs from 76.6% to 95.3% as chunks grow. It also sends 4,988 tokens instead of 319. Bigger chunks win partly by handing the model 16 times more text.
---
At an equal 2,000 tokens, BM25 is flat from 128 to 512 (91.1%, 92.2%, 91.7%). The embedder peaks at 64 to 128 (90.1%, 89.7%) and falls to 73.1% at 512.
---
Each at its best size: BM25 92.2%, embeddings 90.1%. Gap: 2 points. Chunk-size spread: 5.3 for BM25, 5.9 for the embedder over sizes it reads in full.
---
The embedder also hit 51.4% at 1,024 tokens, a 39-point drop. That's mostly truncation: bge-small reads 512 tokens, and 92% of my 1,024-token chunks run past it. Not chunk size alone.
---
SQuAD favours BM25, it's one small model on 48 articles, and there's no reranker or generation step. Code, seed and raw output for all 10 configs: https://www.0xadityaa.dev/blog/chunk-size-is-a-hyperparameter-you-never-tuned

## Singles

512 tokens cost BM25 half a point against its best chunk size. It cost a small embedding model 17 points (73.1% against 90.1%). Same default, very different bill.
---
Which is better, 64-token chunks or 1,024? At a fixed k, 1,024 wins by 19 points. At a fixed 2,000-token budget, 1,024 loses to 256 by 4. The answer changes with the axis you hold constant.
---
64-token chunks, no overlap: 3.2% of questions have no chunk holding the whole answer. Add 15% overlap and it drops to 0.1%. Recall rose 5 points for BM25. The price is 18% more chunks to index.
---
92% of my 1,024-token chunks were longer than the embedding model's 512-token limit. It never saw their tails. Check your embedder's input limit before you pick a chunk size.
---
A tutorial picked your chunk size. A sweep of 128, 256 and 512 at a fixed token budget takes an afternoon and showed a 5-point spread for me. Retriever swap: 2 points.

## Substack Note

Swapping my retriever changed recall by 2 points. Changing the chunk size changed it by 5 or 6. I'd never tuned the second one.

I took the 10,570 questions in SQuAD v1.1 dev, cut 48 articles into chunks of 64 to 1,024 tokens, and retrieved with BM25 and a small embedding model, holding the context at about 2,000 tokens. BM25 was flat from 128 to 512. The embedder peaked at 64 to 128 and fell to 73.1% at 512, and to 51.4% at 1,024. The last drop is mostly truncation: it reads 512 tokens at most. Over sizes it reads in full, the spread is about 6 points.

So 512 cost BM25 half a point and the embedder 17. Same default, very different bill.

One dataset that favours keyword search, one small model, no reranker, so don't copy my numbers. Do copy the habit: sweep chunk size at a fixed token budget before you tune anything else.

https://www.0xadityaa.dev/blog/chunk-size-is-a-hyperparameter-you-never-tuned
