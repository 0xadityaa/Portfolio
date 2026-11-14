# Chunk-size sweep: BM25 and bge-small on SQuAD v1.1 dev

Companion to the post `content/blog/chunk-size-is-a-hyperparameter-you-never-tuned.md`.

Question: does the chunk size you pick move retrieval quality as much as the retriever does, and does the best size depend on the retriever?

## What it does

- Takes the 48 articles in SQuAD v1.1 dev and joins each article's paragraphs into one document (330,249 tokens in all, o200k_base).
- Cuts each document into fixed windows of 64, 128, 256, 512 and 1,024 tokens, with 0% and 15% overlap.
- Retrieves over the whole corpus of chunks, for all 10,570 dev questions, with:
  - BM25 (my own implementation, Lucene-style idf, k1 = 1.2, b = 0.75, lowercase alphanumeric tokens, no stemming, no stop words).
  - `BAAI/bge-small-en-v1.5` (33M parameters, 384 dimensions, cosine similarity, query instruction prefix on, 512-token limit), on CPU.
- A hit means a retrieved chunk fully contains a gold answer span (`span`, the primary measure). It also records the looser "the answer string appears anywhere in a retrieved chunk" (`string`).
- Records, for every question, the rank of the first hit in the top 100, so recall@k for any k, and the mean number of tokens handed to the model for the top k.

## Files

- `EXPECTATION.txt`: what I expected, written before the first retrieval ran.
- `run.py`: chunking, retrieval, ranks. Took about 30 minutes on an M2 laptop under load, most of it embedding.
- `analyze.py`: tables and 95% article-cluster bootstrap intervals (2,000 resamples, seed 20261114).
- `make_chart.py`: draws `public/images/blog/chunk-size-equal-budget.svg`.
- `results/`: `ranks.npz` (per-question ranks), `stats.json` (chunk counts, mean cumulative tokens, truncation share), `analysis.txt` and `analysis.json` (the tables), `run.log` (raw output of the run).
- `social.md`: social cuts for the post.

## Run it again

Everything big lives outside the repo.

```bash
WORK=/private/tmp/claude-501/chunk
mkdir -p $WORK/data && cd $WORK
uv venv --python 3.12 venv
uv pip install --python venv/bin/python tiktoken numpy scipy sentence-transformers

# dataset (4.8 MB, CC BY-SA 4.0)
curl -sSL -o data/dev-v1.1.json https://rajpurkar.github.io/SQuAD-explorer/dataset/dev-v1.1.json
shasum -a 256 data/dev-v1.1.json   # 95aa6a52d5d6a735563366753ca50492a658031da74f301ac5238b03966972c9

R=content/research/chunk-size-is-a-hyperparameter-you-never-tuned
venv/bin/python $R/run.py data cache $R/results       # downloads bge-small weights on first use
venv/bin/python $R/analyze.py $R/results
venv/bin/python $R/make_chart.py $R/results public/images/blog/chunk-size-equal-budget.svg
```

`cache/` holds the chunk embeddings and is safe to delete. `run.py` is deterministic apart from tiny floating-point differences in the embeddings.

## Environment

Apple M2, 8 cores, 16 GB, CPU only (the machine was also busy with other jobs, so the timings are not clean). Python 3.12.8, torch 2.15.0, sentence-transformers 6.3.0, tiktoken 0.14.0, numpy 2.5.4, scipy 1.18.1. Model revision `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a`.

## Things to know before trusting it

- 43% of the 512-token chunks and 92% of the 1,024-token chunks are longer than bge-small's 512-token limit once re-tokenised, so the model never sees their tails. See `results/analysis.txt`.
- The corpus is 48 articles. A real knowledge base has more distractors.
- SQuAD questions were written by people looking at the paragraph, which favours BM25.
- Intervals are clustered by article. They cover sampling noise over questions and articles, not the choice of dataset, model or BM25 parameters.

## Detail moved out of the post

Corpus and retrievers: SQuAD v1.1 dev ([Rajpurkar et al., 2016](https://arxiv.org/abs/1606.05250)), 48 articles joined into one document each, 330,249 tokens counted with tiktoken `o200k_base`. BM25 follows [Robertson and Zaragoza (2009)](https://doi.org/10.1561/1500000019). The looser "answer string appears in a retrieved chunk" measure came out 1 to 7 points higher than the strict span measure.

### Same k (k = 5)

| Chunk size | BM25 recall@5 | Embeddings recall@5 | Tokens handed to the model (BM25) |
| --- | --- | --- | --- |
| 64 | 76.6% | 76.7% | 319 |
| 128 | 84.7% | 77.6% | 638 |
| 256 | 89.8% | 78.3% | 1,273 |
| 512 | 93.1% | 77.1% | 2,530 |
| 1,024 | 95.3% | 71.3% | 4,988 |

I expected embedding recall to rise with size. It sat between 76.7% and 78.3% from 64 to 512 tokens, then dropped at 1,024.

### Equal 2,000-token budget, details

- `k` is 2,000 divided by the chunk size, rounded. Actual tokens sent landed between 1,930 and 2,040.
- BM25 at 64 tokens is 5.3 points under its best size, partly because 3.2% of questions have no 64-token chunk holding the whole answer.
- Embedder: 64 and 128 tokens tie (90.1% and 89.7%). Spread across all five sizes 38.7 points; over 64 to 256 (read in full) 5.9 points. BM25 spread 5.3 points.
- BM25 best 92.2% against embedder best 90.1%: 2.1 points, 95% interval 1.1 to 3.1. At 512 tokens the embedder is 17.0 points under its best (interval 15.1 to 18.8).

### Overlap (15%)

- 10 tokens of overlap at size 64, 154 at size 1,024.
- At 64 tokens: +5.1 points for BM25, +4.4 for embeddings, at the 2,000-token budget. Answer spans cut in half: 3.2% without overlap, 0.1% with.
- At 512 and 1,024 tokens BM25 gained under a point and the embedder 2.7 and 3.5. Why is unknown; boundaries moving which tail gets truncated is a guess.
- Chunk count at 64 tokens: 6,133 with overlap against 5,187 without (about 18% more to index). Tokens handed over barely change at a fixed k.
- Best numbers at the 2,000-token budget with overlap: 94.5% (embedder, 64 tokens) and 94.2% (BM25, 128 tokens).
