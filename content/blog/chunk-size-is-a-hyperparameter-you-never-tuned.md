---
title: Chunk Size Is a Hyperparameter You Never Tuned
publishedAt: '2026-11-14'
summary: >-
  On 10,570 SQuAD questions, chunk size moved recall by 5 points for BM25 and 39 for a small embedding model. The retriever gap at each one's best size was 2.
tags:
  - ai
  - rag
  - retrieval
  - evals
draft: true
---

Most RAG pipelines I read about cut documents into 512-token chunks with a bit of overlap. The reason is rarely a measurement. It's that a tutorial did, or a vendor's docs say [start with 512 tokens and 25% overlap](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents), or the default was 800 and 400 and nobody touched it.

My [earlier post on retrieval](/blog/why-ai-tools-forget-you) asked which retriever finds the right note. This one asks how big the pieces should be, and I ran a sweep to find out. Five chunk sizes, two retrievers, two overlaps, 10,570 questions. Code, seed and raw output are [in the repo](https://github.com/0xadityaa/Portfolio/tree/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned).

The claim I'll defend: **chunk size moves retrieval quality as much as the choice of retriever, and the best size depends on the retriever.** At a 2,000-token budget, chunk size swung recall by 5 points for BM25 and 39 for a small embedding model. The gap between the two retrievers, each at its best size, was 2 points.

## The short version

- At a fixed number of chunks, bigger chunks look better for BM25 (recall@5 went from 76.6% at 64 tokens to 95.3% at 1,024). They also send 16 times more text to the model.
- At an equal 2,000-token budget the picture changes. BM25 was flat from 128 to 512 tokens (91.1%, 92.2%, 91.7%). The embedding model peaked at 64 to 128 tokens (90.1%, 89.7%) and fell to 73.1% at 512.
- At 2,000 tokens, BM25 at its best size beat the embedding model at its best size by 2.1 points. Choosing the wrong chunk size cost far more than choosing the wrong retriever.
- Adding 15% overlap helped small chunks by 4 to 5 points and large ones by under 4. It cost no extra tokens at a given k, only about 18% more chunks to index.

## What did I actually run?

I took the 48 articles in the [SQuAD v1.1](https://arxiv.org/abs/1606.05250) dev set (Rajpurkar et al., 2016; the [data is CC BY-SA 4.0](https://rajpurkar.github.io/SQuAD-explorer/)), and joined each article's paragraphs into one document. That's 330,249 tokens in total, counted with tiktoken's `o200k_base`. Each document is cut into fixed windows of 64, 128, 256, 512 and 1,024 tokens.

Every one of the dev set's 10,570 questions is then answered against the whole corpus of chunks, not just its own article. Two retrievers:

- **BM25**, the classic keyword scorer from [Robertson and Zaragoza's 2009 survey](https://doi.org/10.1561/1500000019). I wrote my own, with Lucene-style idf, `k1` 1.2, `b` 0.75, lowercase words, no stemming and no stop word list. I didn't tune any of it.
- **[bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)**, a 33M-parameter embedding model that runs on a laptop CPU, with cosine similarity and the model card's query prefix. Its input limit is 512 tokens.

A "hit" is strict: a retrieved chunk has to fully contain the gold answer's character span, so a chunk that mentions "1998" somewhere else doesn't count. (SQuAD gives the span, which is why I picked it.) I also tracked the looser "the answer string appears in a retrieved chunk" version, which came out 1 to 7 points higher.

I wrote [my guesses down first](https://github.com/0xadityaa/Portfolio/blob/main/content/research/chunk-size-is-a-hyperparameter-you-never-tuned/EXPECTATION.txt). Some were wrong, and I'll say where.

## What happens at the same k?

This is the table most people would make. Retrieve five chunks, see how often the answer is in them.

| Chunk size | BM25 recall@5 | Embeddings recall@5 | Tokens handed to the model (BM25) |
| --- | --- | --- | --- |
| 64 | 76.6% | 76.7% | 319 |
| 128 | 84.7% | 77.6% | 638 |
| 256 | 89.8% | 78.3% | 1,273 |
| 512 | 93.1% | 77.1% | 2,530 |
| 1,024 | 95.3% | 71.3% | 4,988 |

Read the BM25 column alone and the advice writes itself: bigger chunks, better recall. Read the last column and it falls apart. The 1,024 row hands the model almost 5,000 tokens. Of course it finds the answer more often. It sent sixteen times as much text.

The embedding column is flatter, and I got that wrong. I expected recall to rise with size for both. It sat between 76.7% and 78.3% from 64 to 512 tokens, then dropped at 1,024.

## What happens at an equal token budget?

Tokens are the cost axis. You pay for them, and a longer prompt makes the model worse at [using what's in the middle](https://arxiv.org/abs/2307.03172). So I held the budget at about 2,000 tokens and set `k` to 2,000 divided by the chunk size, rounded: 31 chunks of 64 tokens, down to 2 chunks of 1,024. The actual tokens sent landed between 1,930 and 2,040.

| Chunk size | k | BM25 | Embeddings |
| --- | --- | --- | --- |
| 64 | 31 | 87.0% | 90.1% |
| 128 | 16 | 91.1% | 89.7% |
| 256 | 8 | 92.2% | 84.2% |
| 512 | 4 | 91.7% | 73.1% |
| 1,024 | 2 | 88.1% | 51.4% |

![Line chart of recall at a 2,000-token context by chunk size. BM25 stays between 87 and 92 percent at every size from 64 to 1,024 tokens. The embedding model falls from 90 percent at 64 tokens to 51 percent at 1,024.](/images/blog/chunk-size-equal-budget.svg)

Two retrievers, two different curves.

**BM25 likes 128 to 512.** The difference between 256 and 512 is half a point, with an interval that touches zero. Small chunks lose: at 64 tokens it's 5.3 points worse than at its best, partly because 3.2% of questions have no 64-token chunk that holds the whole answer at all. Their answer sits across a cut.

**The embedding model likes the small end.** 64 and 128 tokens are a tie (90.1% and 89.7%, difference 0.4 points). Each step up from 128 costs it more: 5.5 points, then 11.1, then 21.7.

Now the comparison that gives the claim its shape. Each retriever at its own best size, 2,000-token budget: BM25 92.2%, embeddings 90.1%. BM25 is ahead by 2.1 points (95% interval 1.1 to 3.1). The spread across chunk sizes within one retriever was 5.3 points for BM25 and 38.7 for the embedding model.

I should flag the modelling choice in that last number. A big part of the embedder's collapse is that bge-small can't read long chunks. Re-tokenised with its own tokenizer, 43% of my 512-token chunks and 92% of the 1,024-token ones run past its 512-token limit, so it never sees the tails. That's a real cost of picking a size, but it's about this model. If I only count sizes it reads in full (64 to 256), the embedder's spread is 5.9 points. Still bigger than the 2.1-point retriever gap, and now about the same as BM25's.

## Is 512 a bad default?

Depends who's asking.

For BM25 at a 2,000-token budget, 512 was half a point under the best size (91.7% against 92.2%). Fine. For the embedding model it was 17.0 points under the best (73.1% against 90.1%, interval 15.1 to 18.8). Same default, wildly different bill.

That's the post's point in one comparison. A tutorial's number is a hyperparameter value somebody picked for their retriever, their documents and their model's input limit. [Chroma's July 2024 study](https://www.trychroma.com/research/evaluating-chunking) found something that rhymes: with OpenAI's embeddings on five small corpora, 200-token chunks with no overlap gave the best precision, and OpenAI's default of [800 tokens with 400 overlap](https://developers.openai.com/api/reference/resources/vector_stores/methods/create) was among the lowest on their efficiency metrics. Their recall stayed within about four points across the main configurations. Different data and a different metric, so I'm only borrowing the direction.

## Does overlap help?

At small sizes, yes, and more than I guessed. I'd guessed 1 to 3 points. Fifteen percent overlap (10 tokens at size 64, 154 at size 1,024) added 5.1 points for BM25 and 4.4 for embeddings at 64 tokens, at the 2,000-token budget. Part of that is simple: with no overlap, 3.2% of questions have their answer span cut in half at 64 tokens. With overlap that falls to 0.1%.

At 512 and 1,024 tokens, BM25 gained under a point. The embedder gained 2.7 and 3.5, and I don't know why. Boundaries moving which tail gets truncated is a guess, not a finding.

The tokens handed over barely changed at a fixed k, so overlap's cost is index size: 6,133 chunks instead of 5,187 at 64 tokens. If you also pay to embed every chunk, that bill grows by about 18%. At the 2,000-token budget the best numbers were 94.5% (the embedder at 64 tokens with overlap) and 94.2% (BM25 at 128 with overlap).

## Where I'd stop trusting this post

**SQuAD flatters BM25.** The people writing the questions had the paragraph open in front of them, so questions share words with their answers. The authors of [dense passage retrieval](https://arxiv.org/abs/2004.04906) hit the same thing and said the high lexical overlap gives BM25 a clear advantage on SQuAD. On messier questions the embedder might close the 2-point gap, or beat it. I didn't test that.

**One small embedding model.** I used one 33M-parameter model with a 512-token limit. A model that reads 8,000 tokens would behave differently at 512 and 1,024, and I don't know how. The 256-token result, where nothing is truncated and the model still loses to 64, says size matters for this model without the limit. It doesn't tell you about others.

**48 articles is a small library.** Retrieval over a few hundred thousand tokens is easier than over a few billion. More distractors punish big chunks differently, and I haven't measured how.

**Answer in chunk is a proxy.** It isn't "the chunk lets the model answer". A 1,024-token chunk can contain the answer and bury it. Recall also ignores order, and the model sees the chunks in some order. I didn't run a model on the retrieved text.

**The intervals are narrow but not magic.** The 95% intervals resample the 48 articles (questions in one article aren't independent) and are roughly plus or minus 1 to 3 points at the recall levels here. That's the sampling error for this dataset only. It says nothing about a different dataset, other BM25 settings or another model. I wrote about [how little a small eval can tell you](/blog/your-eval-set-is-too-small-to-tell), and the lesson there applies here too: a point or two between neighbours isn't a finding.

**The strongest objection is that fixed-size sweeps are beside the point.** Splitting on headings and paragraphs keeps an answer's context together. [Late chunking](https://arxiv.org/abs/2409.04701) embeds the whole document first, so each chunk's vector knows what's around it. Anthropic's [contextual retrieval](https://www.anthropic.com/news/contextual-retrieval) prepends a short summary of where each chunk sits, and in their tests cut top-20 retrieval failures from 5.7% to 2.9% when combined with BM25, and to 1.9% with a reranker on top. A reranker re-scores a first-stage shortlist with a stronger model, which makes the first-stage chunk size matter less. And [Qu and colleagues](https://arxiv.org/abs/2410.13070) found that semantic chunking's extra cost wasn't justified by consistent gains over fixed-size chunks, so the picture isn't one-sided. All of that is true, and none of it applies to me here: I tested none of those fixes. If you already do any of them, my table is a weaker guide.

## The takeaway

If you have a RAG pipeline, find where the chunk size is set and ask who chose it. If the answer is "a tutorial", you've found a free experiment.

My rule: sweep 128, 256 and 512 with your own retriever, score each at a fixed token budget, not a fixed k, and try 15% overlap at the small end. Going by my eval simulation, around 200 labelled questions can show a 10-point gap; telling 128 from 256 will take thousands. If your embedding model's input limit is below your chunk size, stop and fix that first. I'd change my mind on all of this if a model that reads the full chunk stopped losing to 64-token pieces. That's the run I'd do next.
