---
title: 'Semantic Search: What It Is and How I Built It'
publishedAt: '2025-04-06'
summary: 'Semantic search matches meaning, not keywords. The embedding model was the easy bit. Picking a vector size and an index my database could serve was the job.'
tags:
  - vector embeddings
  - semantic search
  - llm
  - db
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

A while back I got a fun one at work: add semantic search to our API pipeline so our LLM could answer customer questions more accurately, in real time. I had a rough idea of how semantic search worked (shoutout to my ML professor, that class finally paid off), but I had no clue where to start building it. So here's how it went.

What I learned, in one sentence: **most of the work in semantic search isn't the embedding model. It's picking a vector size and an index your database can actually serve fast.**

## The short version

Semantic search matches what you mean, not which words you typed. I built it with OpenAI's embeddings model, trimmed the vector dimensions so queries stayed quick, added an index, and switched our query flow from parameter matching to similarity. The result was search that got smarter and faster, which made the LLM's answers better too.

## What is semantic search, and how is it different?

![rest vs semantic search based agents](/images/blog/rest-vs-semantic-search.png)

Old-school search does *lexical matching*. It looks for the exact word, or part of it. Search for "laptop" and you get results with the word "laptop" in them. It has no idea that "chromebook" or "MacBook" might be what you're after.

Semantic search *tries to match meaning* instead of strings. So even if you don't type the exact keyword that's in the data, it can still find the stuff that's conceptually close. That's the whole trick, and it's why it beats plain keyword search for questions written like a human wrote them.

## How I built it

#### 1. Pick a model and generate embeddings

- First you turn your data into embeddings. An embedding is a long list of numbers (a vector) that captures what a piece of text means.
- I used OpenAI's [`text-embedding-3-large`](https://platform.openai.com/docs/guides/embeddings). You send text, you get a vector back. Mine came out at 3,072 dimensions. Great for accuracy, rough for performance, so I cut it to 2,000. More on why in a sec.
- You don't need multimodal embeddings unless you're dealing with images or video. Text-only did the job for me.

#### 2. Pick the right number of dimensions

- More dimensions means more nuance and better results. It also means more compute and slower queries, unless you happen to own a supercomputer.
- Bigger vectors slow queries down and lean on your database, especially at scale. So you experiment until you find the balance. For me, going from 3,072 to 2,000 was a good trade between speed and relevance.
- That number is less random than it looks. The `text-embedding-3` models are designed to be shortened through the API's `dimensions` parameter, and [pgvector](https://github.com/pgvector/pgvector) can only index its `vector` type up to 2,000 dimensions.
- Your right number depends on your data, your use case, and how fast you need it to be.

#### 3. Index your embeddings

- Once the vectors are stored, you need an index. Without one, every query scans the whole dataset, and that gets slow fast.
- This is where [approximate nearest neighbor](https://www.mongodb.com/resources/basics/ann-search) (ANN) search comes in. You give up a little recall and get a huge speedup, which is a trade most production setups happily take.
- The three index types I looked at:
  1. [IVFFlat](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/understand-inverted-file-flat-vector-indexes.html)
     - Uses k-means clustering to split your data into lists. A search only scans some of the lists, and you choose how many to probe, so you can dial speed against accuracy.
     - It needs training, and it's good when you want knobs to tune.
  2. [HNSW](https://www.pinecone.io/learn/series/faiss/hnsw/) ([original paper](https://arxiv.org/abs/1603.09320))
     - Builds a multi-layered graph of vectors. The search starts at the top layer and narrows in as it gets closer to the best matches.
     - Usually a better speed-to-recall trade than IVFFlat, with no training. You can even create the index on an empty table.
  3. [DiskANN](https://www.timescale.com/blog/understanding-diskann)
     - Built for scale. High recall and low latency even with billions of records. It takes more time and memory to build, but it's a solid pick when you need high throughput.

#### 4. Change the query flow

- In a normal search setup you parse the user's query, pull out parameters, and build a SQL or NoSQL query. Semantic search flips that.
- You embed the user's plain-language question, then compare that vector against the ones stored in your database.
- There are a few ways to measure how close two vectors are:
  - [Euclidean distance](https://en.wikipedia.org/wiki/Euclidean_distance)
  - [Manhattan (or Taxicab) distance](https://www.datacamp.com/tutorial/manhattan-distance)
  - [Negative inner product](https://en.wikipedia.org/wiki/Inner_product_space)
  - [Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- I went with cosine similarity because it worked well for text. Compare, grab the top n matches, return them. Now people can ask in plain language and still get relevant results.

Was it worth it? Here are the benchmarks I ran:

![semantic search performance benchmarks](/images/blog/semantic-search-benchmarks.png)

## Where I'd stop trusting this post

**Those benchmarks are one dataset on one system.** They show what happened with our data and our queries. Trust the direction, not the exact numbers, and rerun them on your own data before you believe anything.

**Semantic search is bad at exact matches.** Embeddings blur a product code, an error ID, or a rare name into its neighbours. Keyword search nails those instantly. Production systems usually run both and merge the results (hybrid search), and Postgres already ships [full-text search](https://www.postgresql.org/docs/current/textsearch.html) for the keyword half.

**ANN indexes trade recall for speed, and they do it quietly.** An approximate index can miss the true best match and nothing will tell you. Measure recall against an exact scan on a sample before you trust it.

**Fewer dimensions means losing information.** Shortening the vector kept quality good enough for us. On a different corpus the cut-off that works could be higher or lower.

## The takeaway

Semantic search and LLMs are a great pair. Instead of shoving all your data at the model, you use semantic search to narrow it down to the relevant bits first.

That gets you faster responses, fewer tokens, and better answers. It also cuts down on hallucinations, because the model gets focused, relevant context and not a giant haystack to reason over.

Short version: semantic search *filters*, the LLM *interprets*, and your users get something that feels a lot smarter.
