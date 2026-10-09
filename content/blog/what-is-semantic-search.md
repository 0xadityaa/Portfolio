---
title: What is semantic search & how to implement it?
publishedAt: '2025-04-06'
summary: >-
  How I added semantic search to an LLM pipeline: embeddings, why I cut them
  to 2,000 dimensions, picking an ANN index, and what the benchmarks showed.
tags:
  - vector embeddings
  - semantic search
  - llm
  - db
updated: '2026-10-09'
---

![GIF of search icon rotating around computer screen](https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWM5NmM0aWRueDkzNnh5endseWYwenhldzAzb2g3dmdxd21wc2dmciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgFLfWUZigjoem4/giphy.gif)

Last week, I was assigned an interesting task at work to implement semantic search in our API pipeline so that our LLM could answer customer queries more accurately and in real-time. I had a rough idea of how semantic search worked _shoutout to my ML professor, that class finally paid off_, but I didn't really know how to get started with implementing it. Here's how I did it.

What I learned, in one sentence: **most of the work in semantic search is not the embedding model, it is choosing a vector size and an index your database can actually serve quickly.**

## TL;DR

Semantic search focuses on matching meaning rather than just keywords. I implemented it using OpenAI's embeddings model, optimized the vector dimensions for better performance, created a fast indexing layer, and updated our query flow to use semantic similarity instead of parameter-based matching. Result was a smarter search with faster, more relevant responses improving performance and accuracy of the LLM responses.

## What is semantic search and how is it different?

![rest vs semantic search based agents](/images/blog/rest-vs-semantic-search.png)
Traditional search systems rely on _lexical matching_ where they look for exact or partial keyword matches in the data. If a user searches for “laptop”, the system will only return results that contain the exact word “laptop.” It doesn't understand that “chromebook” or “MacBook” might mean the same thing in context.

Semantic search works differently. Instead of just matching strings, it _tries to match meanings_.

So even if the user doesn't use the exact keyword in the dataset, the search engine can still find conceptually relevant results. This is what makes semantic search more intelligent and useful than plain keyword-based search.

## How to implement semantic search?

#### 1. Choose a model and generate embeddings

- The first step is to convert your data into embeddings, which are high-dimensional vector representations that encode semantic meaning.
- I used OpenAI's [`text-embedding-3-large`](https://platform.openai.com/docs/guides/embeddings) model. You send it text, and it gives you a vector. My initial output was a 3,072 dimensional vector. That's a lot, which is great for accuracy, but not so great for performance so I trimmed it down to 2000 dimensions (why? more on that next).
- You don't need multimodal embeddings unless you're dealing with images or videos. For me text-only works fine.

#### 2. Choose the right dimensionality

- More dimensions = better semantics = better results... but unless you have a supercomputer, it also means higher compute and slower queries.
- Larger vectors slow down queries and add pressure on your database, especially at scale. This is why it's important to experiment and find the right balance. For me, trimming the dimensions from 3,072 to 2,000 gave a good trade-off between speed and relevance. Two facts make that number less arbitrary than it looks: the `text-embedding-3` models are built to be shortened through the API's `dimensions` parameter, and [pgvector](https://github.com/pgvector/pgvector) can only index its `vector` type up to 2,000 dimensions.
- The right number will depend on your specific use case, data, and performance requirements.

#### 3. Index Your Embeddings

- Once your data is vectorized and stored, you need an indexing strategy that supports fast similarity searches. Without an index, every query would require scanning the entire dataset, which is slow and inefficient.
- This is where [approximate nearest neighbor](https://www.mongodb.com/resources/basics/ann-search) (ANN) search comes in. ANN indexing sacrifices a small amount of recall to dramatically improve performance, making it a practical choice for most production setups.
- Here are the three indexing methods I considered:
  1. [IVFFlat](https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/understand-inverted-file-flat-vector-indexes.html)
     - This method uses k-means clustering to partition your data into lists. During a search, only a subset of those lists are scanned. You can control how many lists to probe, which allows you to adjust the balance between speed and accuracy.
     - This method requires training and works well when you want more control over performance tuning.
  2. [HNSW](https://www.pinecone.io/learn/series/faiss/hnsw/) ([original paper](https://arxiv.org/abs/1603.09320))
     - The HNSW algorithm builds a multi-layered graph of vectors. It starts the search at the top layer and narrows down as it gets closer to the best matches.
     - HNSW usually has a better speed-to-recall tradeoff than IVFFlat and does not require training. You can create an HNSW index even if your table is currently empty.
  3. [DiskANN](https://www.timescale.com/blog/understanding-diskann)
     - DiskANN is built for scale. It provides high recall and low latency even with billions of records. While it requires more time and memory to build, it is a solid choice for high-throughput, low-latency scenarios.

#### 4. Update the Query Flow

- In a typical search setup, you parse the user query, extract parameters, and generate a structured SQL or NoSQL query. With semantic search, the flow changes.
- You first generate an embedding for the user's natural language query. Then, you compare this vector with the stored embeddings in your database.
- There are a few options for calculating vector similarity:
  - [Euclidean distance](https://en.wikipedia.org/wiki/Euclidean_distance)
  - [Manhattan (or Taxicab) distance](https://www.datacamp.com/tutorial/manhattan-distance)
  - [Negative inner product](https://en.wikipedia.org/wiki/Inner_product_space)
  - [Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- I used cosine similarity because it worked well for my text-based use case. After comparing, you return the top n most similar results. This flow allows users to ask questions in plain language, and still get highly relevant responses.

Incase you are wondering if it's worth the effort, here are some performance benchmarks I ran:
![semantic search performance benchmarks](/images/blog/semantic-search-benchmarks.png)

## Where this stops applying

**The benchmarks are one dataset on one system.** They show what happened for our data and our queries. Treat the direction as the finding, not the exact numbers, and rerun them on your own data before you believe them.

**Semantic search is bad at exact matches.** Embeddings blur a product code, an error ID, or a rare name into its neighbours. Keyword search finds those instantly. Production systems usually run both and merge the results (hybrid search); Postgres already ships [full-text search](https://www.postgresql.org/docs/current/textsearch.html) for the keyword half.

**ANN indexes trade recall for speed, silently.** An approximate index can miss the true best match and nothing will tell you. Measure recall against an exact scan on a sample before you trust it.

**Fewer dimensions is a lossy choice.** Shortening the vector kept quality good enough here. On a different corpus the cut-off that works may be higher or lower.

## Final Thoughts

- Semantic Search + LLMs = 🔥
- Semantic search is a perfect complement to LLMs. Instead of passing all your data to the model, you can first use semantic search to narrow it down to only the most relevant parts.
- This leads to faster responses, lower token usage, and better accuracy. It also reduces hallucinations because the model receives focused, relevant information rather than having to reason over a massive context.
- In short, semantic search _filters_ and the LLM _interprets_, creating much better user experiences together.

*Updated 9 October 2026: corrected the embedding size (3,072 dimensions, not 3,075), explained the 2,000 dimension limit with sources, and added the section on where this stops applying.*
