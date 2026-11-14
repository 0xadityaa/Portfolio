## Thread

Most RAG pipelines cut documents into 512-token chunks because a tutorial did. I swept chunk size from 64 to 1,024 tokens on 10,570 SQuAD questions, with two retrievers. Chunk size moved recall at least as much as the retriever did.
---
At a fixed k=5, BM25 recall climbs from 76.6% (64-token chunks) to 95.3% (1,024). Looks great until you count what was sent: 319 tokens against 4,988. Bigger chunks win partly by handing the model 16 times more text.
---
Hold the budget at about 2,000 tokens instead. BM25 is flat from 128 to 512 tokens (91.1%, 92.2%, 91.7%). bge-small embeddings peak at 64 to 128 (90.1%, 89.7%) and fall to 73.1% at 512 and 51.4% at 1,024.
---
Each retriever at its best chunk size, 2,000 tokens: BM25 92.2%, embeddings 90.1%. A 2-point gap. Chunk size alone swung BM25 by 5 points and the embedder by 39 (partly because bge-small cuts off input at 512 tokens).
---
Where I'd stop trusting it: SQuAD questions were written with the paragraph in view, which favours BM25. One small embedding model, 48 articles, no reranker, no generation step. Answer-in-chunk is only a proxy for "the chunk answers the question".
---
Write-up, code and raw output for all 10 chunking configs (5 sizes, 2 overlaps) over 10,570 questions: https://www.0xadityaa.dev/blog/chunk-size-is-a-hyperparameter-you-never-tuned

## Singles

A 512-token chunk was within half a point of the best size for BM25 at a 2,000-token budget (91.7% against 92.2%). For a small embedding model it was 17 points off the best (73.1% against 90.1%). Same default, very different bill.
---
15% overlap on 64-token chunks added 5.1 points of recall for BM25 at a 2,000-token budget and sent no extra tokens per query. The price is about 18% more chunks to index. At 512 tokens it added under a point for BM25.
---
With 64-token chunks and no overlap, 3.2% of SQuAD questions have no chunk that holds the whole answer. It straddles a cut. With 15% overlap that drops to 0.1%.
---
Compare recall at a fixed k and bigger chunks win: BM25 recall@5 goes from 76.6% to 95.3% between 64 and 1,024 tokens. Compare at a fixed 2,000-token budget and 1,024 trails 256 by 4 points (88.1% against 92.2%). The cost axis changes the answer.
---
bge-small takes 512 tokens at most. Re-tokenised with its own tokenizer, 43% of my 512-token chunks and 92% of my 1,024-token chunks were longer than that. A chunk size you picked can be one your embedding model can't fully read.

## Substack Note

Most RAG tutorials cut documents into 512-token chunks with some overlap. Few of them show a measurement of whether that's a good number for your setup, so I ran one.

I took the 10,570 questions in SQuAD v1.1 dev, chunked 48 articles at 64, 128, 256, 512 and 1,024 tokens, and retrieved with BM25 and a small embedding model. At a 2,000-token budget, chunk size swung BM25's recall by 5 points and the embedding model's by 39. The gap between the two retrievers, each at its best size, was 2 points.

The default hurts one and not the other. At 512 tokens BM25 lost half a point against its best size. The embedding model lost 17, partly because it can't read past 512 tokens.

It's one dataset that favours keyword search, one small model and no reranker, so I wouldn't copy my numbers. I would copy the habit: sweep chunk size at a fixed token budget before you tune anything else. Code and raw output are in the write-up.

https://www.0xadityaa.dev/blog/chunk-size-is-a-hyperparameter-you-never-tuned
