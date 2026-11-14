# Research note: Chunk Size Is a Hyperparameter You Never Tuned

- Topic issue: none (series post 8, planned for Tue 12 January)
- Format: essay
- Thesis: in a RAG pipeline, chunk size moves retrieval quality as much as the choice of retriever, and the best size depends on the retriever.
- Reader: an engineer who has built or used a RAG pipeline, picked 512 tokens because a tutorial did, and knows what BM25 and embeddings are.

Written 2026-11-14.

## What this adds

This is a sequel to [Why Does Every AI Tool Forget You?](../blog/why-ai-tools-forget-you.md), which compared BM25, embeddings and a fused retriever at one fixed chunking. The three strongest existing writeups on chunk size:

- Chroma, [Evaluating Chunking Strategies for Retrieval](https://www.trychroma.com/research/evaluating-chunking) (Smith and Troynikov, 3 July 2024): token-level recall, precision and IoU for many chunkers on five small corpora; 200-token chunks with no overlap were strongest on efficiency metrics.
- Qu, Tu and Bao, [Is Semantic Chunking Worth the Computational Cost?](https://arxiv.org/abs/2410.13070) (16 October 2024): semantic chunking's cost was not justified by consistent gains over fixed-size chunks.
- Anthropic, [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) (19 September 2024): the chunk-context fix, with failure-rate numbers.

What this post adds: recall at an equal token budget, for two retrievers, over one public set where "the chunk contains the answer" is checkable from the answer's character span, with the sampling error shown. The studies above mostly vary chunkers; this one holds the chunker fixed and varies only the size and the cost axis (tokens handed to the model).

## Artifact

A sweep, in `content/research/chunk-size-is-a-hyperparameter-you-never-tuned/`. SQuAD v1.1 dev (48 articles, 10,570 questions), each article's paragraphs joined into one document, chunked at 64, 128, 256, 512 and 1,024 `o200k_base` tokens with 0% and 15% overlap. Retrieval over the whole chunk corpus with my own BM25 and with `BAAI/bge-small-en-v1.5` on CPU. Recall@1/5/10 by span containment, tokens handed over at each k, recall at equal budgets (500, 1,000, 2,000, 4,000), 95% article-cluster bootstrap intervals.

### Expectation, written before running

Copied from `EXPECTATION.txt` (written before any retrieval ran):

1. At fixed k=5, recall rises with chunk size for both retrievers; recall@5 at 1,024 is more than 20 points above 64.
2. At an equal 2,000-token budget the ordering flips: embeddings peak around 128 to 256 and fall at 1,024; BM25 is flatter and peaks around 256 to 512.
3. At equal budget, the spread across sizes within a retriever is at least the gap between retrievers (guess: 5 to 10 points against 5 to 15, embeddings ahead).
4. 15% overlap helps the smallest chunks by 1 to 3 points and does almost nothing at 512 and above.
5. Span gold and "answer string appears" gold differ by a few points, string higher.

### Commands

See `README.md` in the artifact folder. In short:

```bash
venv/bin/python $R/run.py data cache $R/results
venv/bin/python $R/analyze.py $R/results
venv/bin/python $R/make_chart.py $R/results public/images/blog/chunk-size-equal-budget.svg
```

### Environment

Apple M2, 8 cores, 16 GB, CPU only, machine under other load (timings are not clean). Python 3.12.8, torch 2.15.0, sentence-transformers 6.3.0, tiktoken 0.14.0, numpy 2.5.4, scipy 1.18.1. `dev-v1.1.json` SHA-256 `95aa6a52d5d6a735563366753ca50492a658031da74f301ac5238b03966972c9` (fetched 2026-11-14). bge-small revision `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a`. Seed 20261114 for the bootstrap; no other randomness (the retrieval is deterministic).

### Raw output

Full log: `results/run.log`. Full tables with intervals: `results/analysis.txt`. The headline lines:

```text
[64_0]   bm25 span recall@1/5/10: 0.577/0.766/0.811   embed: 0.532/0.767/0.829
[128_0]  bm25 span recall@1/5/10: 0.663/0.847/0.889   embed: 0.493/0.776/0.856
[256_0]  bm25 span recall@1/5/10: 0.713/0.898/0.933   embed: 0.463/0.783/0.868
[512_0]  bm25 span recall@1/5/10: 0.748/0.931/0.960   embed: 0.423/0.771/0.870
[1024_0] bm25 span recall@1/5/10: 0.768/0.953/0.977   embed: 0.356/0.713/0.833
[512_0]  embedder tokens per chunk: mean 494, share over 512: 0.431
[1024_0] embedder tokens per chunk: mean 953, share over 512: 0.925

budget 2000 (k = round(2000 / size)), recall %, BM25 | embeddings
  64 (k=31)  87.0 | 90.1
  128 (k=16) 91.1 | 89.7
  256 (k=8)  92.2 | 84.2
  512 (k=4)  91.7 | 73.1
  1024 (k=2) 88.1 | 51.4
budget 2000: BM25 best 256 minus worst 64 = 5.3 points [4.7, 5.8]
budget 2000: embeddings best 64 minus worst 1024 = 38.7 points [36.0, 41.2]
budget 2000: each at its best size, embeddings minus BM25 = -2.1 points [-3.1, -1.1]
```

### Did the expectation hold?

1. Partly. BM25 recall@5 rose 18.6 points from 64 to 1,024 (76.6 to 95.3), short of my "more than 20". Embeddings did not rise: 76.7, 77.6, 78.3, 77.1, then 71.3. Wrong for embeddings.
2. Mostly. The flip held. Embeddings peaked at 64 to 128 (earlier than my 128 to 256); BM25 was flat from 128 to 512, with 256 on top by 0.5 points over 512 (interval touching zero).
3. The first half held (spread bigger than the gap: 5.3 and 38.7 points against 2.1). The guess that embeddings would be ahead was wrong: BM25 was ahead by 2.1 points at each one's best size, and by far more at large chunks. Much of the embedder's large spread is its 512-token limit; over sizes it reads in full (64 to 256) its spread is 5.9 points.
4. Not quite. Overlap helped small chunks by more than I guessed (5.1 points BM25 and 4.4 embeddings at 64 tokens, budget 2,000; 5.9 and 5.6 at recall@5), and helped the embedder by 2.7 to 3.5 points at 512 and 1,024, where I expected nothing. BM25 at 512 and above gained under a point, as expected.
5. Held: string gold was higher by 1.1 to 3.1 points for BM25 and 4.2 to 7.3 for embeddings at k=5.

Decision made after seeing the first run of the analysis: I had set the budget cut as `k = floor(budget / size)`, which gave bigger chunks fewer tokens than small ones (1,519 against 1,980 for the 512 and 64 rows). That favoured my thesis, so I changed it to `round` before writing the post; every number quoted in the post is from the rounded version.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| SQuAD v1.1: Rajpurkar, Zhang, Lopyrev, Liang, 2016 (arXiv 16 Jun 2016) | https://arxiv.org/abs/1606.05250 | 1 | 2026-11-14 |
| SQuAD data is distributed under CC BY-SA 4.0 (the download section names the v2.0 files; I assumed the same licence for v1.1, which the page does not state separately) | https://rajpurkar.github.io/SQuAD-explorer/ | 1 | 2026-11-14 |
| BM25: Robertson and Zaragoza, Foundations and Trends in IR 3(4), pp. 333-389, 2009 | https://nowpublishers.com/article/Details/INR-019 (publisher page returned 403; bibliographic details from search results citing it and from dblp) | 1 | 2026-11-14 |
| bge-small-en-v1.5: MIT licence, 512-token max, 33.4M parameters, 384 dimensions, query instruction prefix | https://huggingface.co/BAAI/bge-small-en-v1.5 | 1 | 2026-11-14 |
| Azure AI Search suggests starting at 512 tokens with 25% overlap (128 tokens) for fixed-size chunks | https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents | 1 | 2026-11-14 |
| OpenAI vector stores default to 800-token chunks with 400 overlap (auto strategy) | https://developers.openai.com/api/reference/resources/vector_stores/methods/create (page returned 403 to my fetch; the figures come from the API reference as shown in search results, and I did not open the page myself) | 1 | 2026-11-14 |
| Chroma: 200/0 chunks best on precision and IoU, OpenAI-default 800/400 among the lowest on efficiency metrics, recall within about 4 points across the main configurations (text-embedding-3-large, top 5, five corpora, 328,208 tokens, 472 queries) | https://www.trychroma.com/research/evaluating-chunking | 1 | 2026-11-14 |
| DPR paper: lower performance on SQuAD attributed partly to annotators writing questions after seeing the passage, giving high lexical overlap that favours BM25 | https://arxiv.org/abs/2004.04906 (read the PDF text, section 5.1) | 1 | 2026-11-14 |
| Anthropic contextual retrieval: top-20 failure 5.7% to 2.9% (contextual embeddings plus contextual BM25), to 1.9% with reranking | https://www.anthropic.com/news/contextual-retrieval | 1 | 2026-11-14 |
| Late chunking embeds the whole document with a long-context model, then pools token embeddings into chunks | https://arxiv.org/abs/2409.04701 | 1 | 2026-11-14 |
| Qu, Tu, Bao: semantic chunking's cost not justified by consistent gains | https://arxiv.org/abs/2410.13070 | 1 | 2026-11-14 |
| Models use information in the middle of long contexts worse | https://arxiv.org/abs/2307.03172 | 1 | 2026-11-14 |
| Every recall, token, overlap, truncation and interval figure | `results/analysis.txt`, `results/run.log` | artifact | 2026-11-14 |
| Eval-size rule of thumb (a 10-point gap is detectable at about 200 examples; a 3-point gap takes thousands) | the eval post on branch `post/your-eval-set-is-too-small-to-tell` | artifact (own simulation) | 2026-11-14 |
| Counter: contextual retrieval, late chunking, rerankers and structure-aware chunking can make fixed-size sweeps beside the point | Anthropic and Jina links above | 1 | 2026-11-14 |

## From Aditya

Nothing. The post has no first-person history beyond running the sweep.

## Outline

Thesis: chunk size moved recall by 5 points for BM25 and 39 for bge-small at a 2,000-token budget, against a 2-point gap between retrievers at their best sizes.

1. Opening: the 512-token default, and the vendor docs that set it. Sequel link. Thesis.
2. The short version.
3. What did I run? Dataset, strict hit definition, the two retrievers, expectation file.
4. Same k: the table where bigger chunks win, and the token column that spoils it.
5. Equal budget: the table and the chart (BM25 flat from 128 to 512, embeddings peak at 64 to 128), best-versus-best gap, the truncation disclosure placed right at the spread number.
6. Is 512 a bad default? Depends on the retriever (0.5 against 17 points). Chroma as a corroborating direction.
7. Does overlap help? Yes at small sizes; cost is index size.
8. Where I'd stop trusting this post: SQuAD favours BM25 (DPR), one small model, 48 articles, proxy metric, intervals, and the steelman (structure-aware chunking, late chunking, contextual retrieval, rerankers, Qu et al.).
9. Takeaway: sweep 128, 256, 512 at a fixed token budget; what would change his mind.

Diagram: `public/images/blog/chunk-size-equal-budget.svg`, recall at a 2,000-token budget against chunk size for both retrievers. It carries the claim that the best size differs by retriever.

### Where each of style.md's six required things is

1. Thesis in the first 150 words: the "claim I'll defend" paragraph, with numbers, in the third paragraph.
2. Artifact: the sweep, linked in the second paragraph; tables and chart in the middle.
3. Numbers with their papers: every cost-like number is a measured token count or has a link (Azure, OpenAI, Chroma, Anthropic). It is a measurement post, not a price post, so the "three volumes" rule is met by the four token budgets in `results/analysis.txt` (500, 1,000, 2,000, 4,000); the post prints 2,000 and mentions fixed k.
4. Links as the evidence trail: 14 distinct external links for about 1,950 words.
5. Limits: "Where I'd stop trusting this post", including the strongest objection with its holders linked, where the advice stops applying, and what was not tested.
6. An ending that adds: a decision rule (sweep 128, 256, 512 at a fixed token budget) and what would change his mind (a long-context embedder that stops losing to 64-token chunks).

## Open questions

- None block the draft. Optional: does he want a run with a long-context embedding model (nomic-embed-text or bge-m3) to remove the 512-token-limit confound? It is the follow-up I named at the end of the post.
- He may want to mention a retrieval setup he actually uses; I wrote none.
- The post links `/blog/your-eval-set-is-too-small-to-tell`, which is still an open pull request. If it merges later than this post, that link will 404 until it does.

## Left out

- Recall@1 and recall@10 tables (in `results/analysis.txt`).
- The 500, 1,000 and 4,000-token budgets. At 4,000 the embedder's best size moves to 128 (93.4%) and BM25's to 512 (95.2%).
- The "never in the top 100" shares (0.5% to 9.0% for BM25, 2.1% to 5.6% for embeddings).
- Hybrid (fused) retrieval, rerankers, and a generation step: not run.
