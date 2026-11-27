## Thread

I found chunk size moved RAG recall 5 to 6 points. Swapping the retriever moved it 2.

I ran 10,570 SQuAD questions at the same 2,000-token context. Chunk size is the setting most pipelines copy from a tutorial ↓

[image: /images/blog/chunk-size-equal-budget.svg]
---
The trap first. BM25 at a fixed k=5:

→ 64-token chunks: 76.6% recall, 319 tokens sent
→ 1,024-token chunks: 95.3% recall, 4,988 tokens sent

Bigger chunks "won" by sending 16 times more text.
---
Hold the context at about 2,000 tokens and BM25 goes flat: 91.1% at 128, 92.2% at 256, 91.7% at 512.

The embedding model (bge-small) peaks at 64 to 128 with 90.1% and 89.7%, then falls: 84.2% at 256, 73.1% at 512.
---
Each at its best size, BM25 got 92.2% and the embedder 90.1%. A 2.1-point gap.

Chunk-size spread: 5.3 points for BM25, 5.9 for the embedder over the sizes it reads in full (64 to 256).
---
Check your embedder's input limit before sweeping sizes, then sweep 128, 256 and 512 at a fixed token budget.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned

## Singles

43% of 512-token chunks run past bge-small's 512-token input limit. So do 92% of 1,024-token chunks.

Past the limit, the benchmark measures truncation, not chunking.
---
The 512-token default cost BM25 half a point against its best size.

For bge-small it cost 17 points (73.1% against 90.1%), partly from its input limit.

Same default, very different outcome.
---
At k=5, BM25 with 1,024-token chunks beats 256-token chunks by 5.5 points.

At an equal 2,000-token context, 256 beats 1,024 by 4.1.

Whether bigger wins depends on whether k or tokens is held fixed.
---
Overlap fixes small chunks cheaply.

At 64 tokens, 15% overlap cuts split answers from 3.2% to 0.1% and lifts BM25 recall by 5.1 points. The price is 18% more chunks to index.
---
BM25 recall at an equal 2,000-token budget barely moves from 128 to 512 tokens: 91.1%, 92.2%, 91.7%.

For keyword search, 256 versus 512 sits inside the noise.

## Link post

In my sweep, chunk size moved retrieval recall 5 to 6 points. Swapping the retriever, each at its best size, moved it 2.1.

The setting most RAG pipelines copy from a tutorial is the one doing more work.

<BLOG_URL>

[image: /images/blog/chunk-size-equal-budget.svg]

## Question

What chunk size is your RAG pipeline running in prod, and has anyone tested another?

## Substack Note

Swapping the retriever moved my recall by 2 points. Changing the chunk size moved it by 5 to 6. Guess which one most pipelines copy from a tutorial.

My sweep: the 10,570 questions in SQuAD v1.1 dev, 48 articles cut into chunks of 64 to 1,024 tokens, retrieved with BM25 and a small embedding model, with the context held at about 2,000 tokens. BM25 was flat from 128 to 512. The embedder peaked at 64 to 128 and fell to 73.1% at 512. Over the sizes it reads in full, its spread is about 6 points. The steeper drop at 1,024 is mostly its 512-token input limit, not chunk size.

So 512 cost BM25 half a point and the embedder 17, partly from that same limit.

The data favours keyword search, and the model is one small embedder with no reranker. The habit travels better than the numbers: sweep chunk size at a fixed token budget before tuning anything else.

<BLOG_URL>
