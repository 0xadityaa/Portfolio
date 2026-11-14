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
