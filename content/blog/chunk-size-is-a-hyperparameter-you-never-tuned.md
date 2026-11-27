---
title: 'Did You Tune Chunk Size?'
publishedAt: '2026-11-14'
summary: >-
  Across 10,570 SQuAD questions, chunk size moved recall 5 to 6 points. Swapping the retriever, each at its best size, moved it 2.
tags:
  - ai
  - rag
  - retrieval
  - evals
draft: true
---

When I swapped the retriever, recall moved by 2 points. When I changed the chunk size, it moved by 5 to 6.

So who picked your chunk size, and did they test it? If you've built a RAG pipeline, the answer is probably a tutorial, and that setting is the one doing more work.

Tutorials cut documents into 512-token chunks because the last tutorial did, or because a vendor's docs say to [start with 512 tokens and 25% overlap](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents), or because the default was 800 and 400 and nobody touched it. My sweep covers five chunk sizes, two retrievers, two overlaps and 10,570 questions. It follows an [earlier post on retrieval](/blog/why-ai-tools-forget-you), which asked which retriever finds the right note. This one asks how big the pieces should be.

**Chunk size moves retrieval quality more than the choice of retriever does, and the best size depends on the retriever.** At a 2,000-token budget, the spread across chunk sizes was 5.3 points for BM25 and 5.9 for a small embedding model (over the sizes it can read in full). The gap between the two retrievers, each at its best size, was 2.1.

## The short version

- At a fixed k, bigger chunks win for BM25: recall@5 climbs from 76.6% to 95.3%. They also send the model 16 times more text.
- At an equal 2,000-token budget, BM25 is flat from 128 to 512 tokens (91.1%, 92.2%, 91.7%). The embedding model peaks at 64 to 128 and drops to 73.1% at 512.
- At its best size, BM25 beat the embedding model's best by 2.1 points. Picking the wrong chunk size cost more than picking the wrong retriever.
- Adding 15% overlap gave small chunks 4 to 5 points and cost 18% more chunks to index.

## What does the sweep cover?

The corpus is the 48 articles in the [SQuAD v1.1](https://arxiv.org/abs/1606.05250) dev set (the [data is CC BY-SA 4.0](https://rajpurkar.github.io/SQuAD-explorer/)), cut into fixed windows of 64 to 1,024 tokens. I answered all 10,570 questions against the whole pile of chunks, not just their own article.

The retrievers are [BM25](https://doi.org/10.1561/1500000019), the old keyword scorer, with untuned settings, and [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5), a 33M-parameter embedding model that runs on a laptop CPU and reads 512 tokens at most. A hit is strict: a retrieved chunk has to fully contain the gold answer's span.

I [wrote my expectations down first](https://github.com/0xadityaa/Portfolio/blob/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned/EXPECTATION.txt), and some were wrong. The code is [`run.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned/run.py) (chunking and retrieval) and [`analyze.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned/analyze.py) (tables and bootstrap intervals). The tables are in [`results/analysis.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned/results/analysis.txt), the chunk counts and truncation shares in [`results/stats.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned/results/stats.json), and the [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned/README.md) has the method, the seed and how to rerun it.

## Don't bigger chunks just win?

No, that's a cost trick. Retrieve five chunks and BM25's recall@5 goes from 76.6% at 64 tokens to 95.3% at 1,024. It looks like a free win until you see that the 1,024 row hands the model 4,988 tokens and the 64 row hands it 319. More text, more hits. That's the cheap part. (The full k = 5 table is in the [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned/README.md).)

The fair test holds the bill still. Tokens are what you pay for, and a longer prompt makes the model worse at [using what's in the middle](https://arxiv.org/abs/2307.03172). So I set the budget at about 2,000 tokens, with `k` set to 2,000 divided by the chunk size: 31 chunks of 64 tokens, down to 2 chunks of 1,024.

| Chunk size | k | BM25 | Embeddings |
| --- | --- | --- | --- |
| 64 | 31 | 87.0% | 90.1% |
| 128 | 16 | 91.1% | 89.7% |
| 256 | 8 | 92.2% | 84.2% |
| 512 | 4 | 91.7% | 73.1% |
| 1,024 | 2 | 88.1% | 51.4% |

![Line chart of recall at a 2,000-token context by chunk size. BM25 stays between 87 and 92 percent at every size from 64 to 1,024 tokens. The embedding model falls from 90 percent at 64 tokens to 51 percent at 1,024.](/images/blog/chunk-size-equal-budget.svg)

Two retrievers, two different curves. BM25 likes 128 to 512, and 256 versus 512 is half a point, inside the noise. The embedding model likes the small end, and every step up from 128 costs it more: 5.5 points, then 11.1, then 21.7.

Each at its best size, BM25 got 92.2% and the embedder 90.1%. That's the 2.1-point gap, with a 95% interval of 1.1 to 3.1.

## Is the 39-point drop a chunk-size effect?

Mostly not, and it's the number to handle with the most care. The embedder's raw spread, from 90.1% at 64 tokens to 51.4% at 1,024, is 38.7 points. Most of that isn't chunk size on its own. It's that bge-small can't read long chunks. Re-tokenised with its own tokenizer, 43% of the 512-token chunks and 92% of the 1,024-token ones run past its 512-token limit, so it never sees their tails.

That's a real cost of picking a size, but it's about this model's input limit. Count only the sizes it reads in full, 64 to 256, and the spread is 5.9 points. That's still bigger than the retriever gap, and about the same as BM25's.

## Is 512 a bad default?

It depends on the retriever. For BM25, 512 was half a point under its best size. For the embedding model it was 17 points under (73.1% against 90.1%), though much of that is its input limit, since 43% of the 512-token chunks overflow it. Same default, very different bill.

Chroma's [July 2024 study](https://www.trychroma.com/research/evaluating-chunking) points the same way: with OpenAI's embeddings on five small corpora, 200-token chunks with no overlap gave the best precision, and OpenAI's default of [800 tokens with 400 overlap](https://developers.openai.com/api/reference/resources/vector_stores/methods/create) was among the lowest on their efficiency metrics. The data and the metric differ, so only the direction carries over.

## Does overlap help?

At small sizes, yes, and by more than the 1 to 3 points I expected. At 64 tokens, 15% overlap added 5.1 points for BM25 and 4.4 for the embedder. Without it, 3.2% of questions have their answer span cut in half by a chunk boundary. With it, that falls to 0.1%.

At 512 and 1,024 tokens BM25 gained under a point. Overlap sends no extra tokens at a fixed k. The price is index size: 6,133 chunks instead of 5,187 at 64 tokens, so about 18% more to embed.

## Where I'd stop trusting this post

**Fixed-size windows are one family of chunking.** Splitting on headings keeps an answer's context together. [Late chunking](https://arxiv.org/abs/2409.04701) embeds the whole document first. Anthropic's [contextual retrieval](https://www.anthropic.com/news/contextual-retrieval) prepends a short summary of where each chunk sits and, in their tests, cut top-20 retrieval failures from 5.7% to 2.9% with BM25, and to 1.9% with a reranker. [Qu and colleagues](https://arxiv.org/abs/2410.13070) found semantic chunking's extra cost wasn't justified by consistent gains, so the evidence isn't one-sided. I tested none of these, so with one of them in your stack, my table is a weaker guide.

**SQuAD flatters BM25.** The question writers had the paragraph open, so questions share words with their answers, the same effect the [dense passage retrieval](https://arxiv.org/abs/2004.04906) authors hit. On messier questions the embedder might close the 2-point gap, or beat it. My setup is one small model on 48 articles, far easier than billions of tokens of distractors, and a model that reads 8,000 tokens would behave differently at 512 and 1,024.

**Answer-in-chunk is a proxy.** A 1,024-token chunk can contain the answer and bury it, and I ran no model on the retrieved text. A point or two between neighbouring sizes isn't a finding, as [how little a small eval can tell you](/blog/your-eval-set-is-too-small-to-tell) lays out.

## The takeaway

Find where your chunk size is set and ask who chose it. If the answer is "a tutorial", you've found a free experiment.

Sweep 128, 256 and 512 with your own retriever, score at a fixed token budget instead of a fixed k, and try 15% overlap at the small end. The [eval-size simulation](/blog/your-eval-set-is-too-small-to-tell) says about 200 labelled questions can show a 10-point gap, and telling 128 from 256 takes thousands. If your embedder's input limit is below your chunk size, fix that first.

If you have a model that reads the full chunk and stops losing to 64-token pieces, I'd like to see it, because it would overturn the embedder half of this.
