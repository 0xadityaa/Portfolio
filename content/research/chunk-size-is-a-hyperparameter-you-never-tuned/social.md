## Hook

You tuned the wrong RAG setting.

Retriever swap, each at its best size: 2.1 points
Chunk size spread, BM25: 5.3 points
Chunk size spread, embeddings: 5.9 points

10,570 SQuAD questions, same 2,000-token context. What chunk size are you running, and who picked it?

[image: public/images/blog/chunk-size-equal-budget.svg]

## Thread

You tuned the wrong RAG setting.

On 10,570 SQuAD questions, chunk size moved recall 5 to 6 points. Swapping the retriever moved it 2.

The numbers ↓
---
First, a trap. BM25 at a fixed k=5:

→ 64-token chunks: 76.6% recall, 319 tokens sent
→ 1,024-token chunks: 95.3% recall, 4,988 tokens sent

Bigger chunks "won" by sending 16 times more text. That's not a better chunk size.
---
So I held the context at about 2,000 tokens.

BM25: 91.1% at 128, 92.2% at 256, 91.7% at 512. Flat.

Embeddings (bge-small): 90.1% at 64, 89.7% at 128, 84.2% at 256, 73.1% at 512.

Part of that 512 drop is its 512-token input limit: 43% of those chunks run past it.
---
Each at its best size: BM25 92.2%, embeddings 90.1%. A 2.1-point gap.

Chunk-size spread: 5.3 points for BM25, 5.9 for embeddings (64 to 256, the sizes it reads in full).

At 1,024 it hits 51.4%, but 92% of those chunks overflow its input limit. That's the limit, not chunk size.
---
The strongest objection: SQuAD questions were written with the paragraph open, which favours BM25. The embedder might close the 2-point gap on messier questions, or beat it.

And fixed-size chunks may be beside the point if you use contextual retrieval. I tested none of that.
---
Want the chunk-size sweep? Reply CHUNK and I'll DM it.
---
Rule of thumb: don't ship a copied chunk size. Check your embedder's input limit first, then sweep 128, 256 and 512 at a fixed token budget with your own retriever.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/chunk-size-is-a-hyperparameter-you-never-tuned

## Singles

Overlap fixes small chunks cheaply.

At 64 tokens, with 15% overlap:
- answers cut in half: 3.2% → 0.1%
- BM25 recall: +5.1 points
- chunks to index: +18%

The cost is index size, not tokens per query.
---
Tutorials default to 512-token chunks. I measured it against each retriever's best size, same 2,000-token context:

- BM25: 0.5 points lost
- bge-small: 17 points lost, partly because 43% of its 512-token chunks overflow its 512-token input limit

Same default, different bill.
---
Retrieve 5 chunks of 1,024 tokens and the model reads 4,988 tokens. At 64 tokens it reads 319.

BM25 recall@5 is 95.3% against 76.6%.

That's not a better chunk size. It's 16 times more prompt.
---
At k=5, BM25 with 1,024-token chunks beats 256-token chunks by 5.5 points.

At an equal 2,000-token context, 256 beats 1,024 by 4.1.

Whether bigger wins depends on whether you hold k or tokens fixed.
---
Check your embedder's input limit before you tune chunk size.

bge-small reads 512 tokens. 43% of my 512-token chunks and 92% of my 1,024-token chunks ran past it.

Past the limit, you're measuring truncation, not chunking.

## CTA

CHUNK | the chunk-size sweep: code, seed and raw output | https://github.com/0xadityaa/Portfolio/tree/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned

## Reply prompts

I measured this on 10,570 SQuAD questions: at an equal 2,000-token context, BM25 recall was flat from 128 to 512-token chunks (91.1%, 92.2%, 91.7%), so for keyword search the 512 default cost about half a point.
I measured this: with bge-small at a 2,000-token context, recall was 90.1% at 64-token chunks and 73.1% at 512, but 43% of the 512-token chunks overflowed its input limit. Check the limit before the size.
I measured chunk size against retriever choice: each at its best size, BM25 beat bge-small by 2.1 points, while chunk size alone moved recall 5.3 to 5.9 points. Fixed k hides it, so compare at a fixed token budget.

## Substack Note

Swapping my retriever moved recall by 2 points. Changing the chunk size moved it by 5 to 6. Guess which one most pipelines copy from a tutorial.

I took the 10,570 questions in SQuAD v1.1 dev, cut 48 articles into chunks of 64 to 1,024 tokens, and retrieved with BM25 and a small embedding model, holding the context at about 2,000 tokens. BM25 was flat from 128 to 512. The embedder peaked at 64 to 128 and fell to 73.1% at 512. Over the sizes it reads in full, its spread is about 6 points. The steeper drop at 1,024 is mostly its 512-token input limit, not chunk size.

So 512 cost BM25 half a point and the embedder 17, partly from that same limit.

One dataset that favours keyword search, one small model, no reranker. Don't copy my numbers. Do copy the habit: sweep chunk size at a fixed token budget before you tune anything else.

https://www.0xadityaa.dev/blog/chunk-size-is-a-hyperparameter-you-never-tuned
