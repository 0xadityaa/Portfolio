## Hook

Swapping my retriever moved recall by 2 points. Changing the chunk size moved it by 5 to 6 (10,570 SQuAD questions, 2,000-token context).

What chunk size are you running, and who picked it?
[image: public/images/blog/chunk-size-equal-budget.svg]

## Thread

Swapping my retriever moved recall by 2 points. Changing the chunk size moved it by 5 to 6. 10,570 SQuAD questions, BM25 and a small embedding model. Here's what moved the number, and what didn't:
---
First, a trap. At a fixed k=5, BM25 recall climbs from 76.6% to 95.3% as chunks grow from 64 to 1,024 tokens. It also hands the model 4,988 tokens instead of 319. Bigger chunks win partly by sending 16 times more text.
---
So I held the context at about 2,000 tokens. BM25 went flat: 91.1% at 128, 92.2% at 256, 91.7% at 512. The embedding model wants small chunks: 90.1% at 64, 89.7% at 128, then 84.2% at 256 and 73.1% at 512.
---
Each at its best size: BM25 92.2%, embeddings 90.1%. A 2.1-point gap. Chunk-size spread: 5.3 points for BM25, 5.9 for the embedder over the sizes it reads in full (64 to 256).
---
The embedder also hit 51.4% at 1,024 tokens. That 39-point drop is not a chunk-size effect: bge-small reads 512 tokens, and 92% of my 1,024-token chunks run past it. It never saw their tails.
---
Objection: SQuAD questions were written with the paragraph open, which favours BM25. It's one small model on 48 articles, with no reranker and no generation step. Fixed-size chunking may be beside the point if you use contextual retrieval.
---
Rule of thumb: don't ship a copied chunk size. Sweep 128, 256 and 512 at a fixed token budget with your own retriever, and check your embedder's input limit first. Full write-up, code and raw output: https://www.0xadityaa.dev/blog/chunk-size-is-a-hyperparameter-you-never-tuned

## Singles

I scored BM25 at 512-token chunks against its best size: half a point lost. Same 512 for a small embedding model, against its own best: 17 points lost, partly because 43% of those chunks overflow its 512-token input limit.
---
Which is better for BM25, 64-token chunks or 1,024? At a fixed k=5, 1,024 wins by 19 points. At a fixed 2,000-token budget, 1,024 loses to 256 by 4. The answer changes with the axis you hold constant.
---
Your 64-token chunks cut the answer in half for 3.2% of my questions. Add 15% overlap and it drops to 0.1%. BM25 recall rose 5 points at the same 2,000-token context. The price is 18% more chunks to index.
---
The retriever gap is smaller than people argue about. At a 2,000-token context with 15% overlap, each retriever at its best size: embeddings 94.5% (64 tokens), BM25 94.2% (128). Without overlap the gap was 2.1 points.
---
If your embedder's input limit is below your chunk size, fix that before you tune anything else. 92% of my 1,024-token chunks ran past bge-small's 512 tokens, and recall at that size was 51.4%.

## Reply prompts

We measured this on 10,570 SQuAD questions: at an equal 2,000-token context, BM25 recall was flat from 128 to 512-token chunks (91.1%, 92.2%, 91.7%), so for keyword search the 512 default costs about nothing.
We measured this: with bge-small, recall at a 2,000-token context was 90.1% at 64-token chunks and 73.1% at 512, and 43% of the 512-token chunks overflowed its input limit. Check the limit before the size.
We measured chunk size against retriever choice: each at its best size, BM25 beat bge-small by 2.1 points, while chunk size alone moved recall 5.3 to 5.9 points. Fixed k hides it, so compare at a fixed token budget.

## Substack Note

Swapping my retriever moved recall by 2 points. Changing the chunk size moved it by 5 to 6. Guess which one most pipelines copy from a tutorial.

I took the 10,570 questions in SQuAD v1.1 dev, cut 48 articles into chunks of 64 to 1,024 tokens, and retrieved with BM25 and a small embedding model, holding the context at about 2,000 tokens. BM25 was flat from 128 to 512. The embedder peaked at 64 to 128 and fell to 73.1% at 512. Over the sizes it reads in full, its spread is about 6 points. The drop to 51.4% at 1,024 is mostly its 512-token input limit, not chunk size.

So 512 cost BM25 half a point and the embedder 17, partly from that same limit.

One dataset that favours keyword search, one small model, no reranker. Don't copy my numbers. Do copy the habit: sweep chunk size at a fixed token budget before you tune anything else.

https://www.0xadityaa.dev/blog/chunk-size-is-a-hyperparameter-you-never-tuned
