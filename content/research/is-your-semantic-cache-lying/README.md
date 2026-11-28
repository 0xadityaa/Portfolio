# Semantic-cache false hits on Quora pairs

The measurement behind my post "Is Your Semantic Cache Lying?". I embedded a seeded sample of 5,000 Quora Question Pairs (QQP) validation pairs with three small embedding models, then measured (1) the cosine of random unrelated pairs and (2) the hit rate and false-hit share of a threshold cache.

## Set up

Python 3.12.8. The virtualenv lives outside the repo.

```sh
python3 -m venv /private/tmp/claude-501/cone/venv
/private/tmp/claude-501/cone/venv/bin/pip install torch==2.15.0 transformers==5.24.1 numpy==2.5.5 pandas pyarrow==26.0.1
```

## Fetch the data and weights

QQP validation (40,430 pairs, GLUE copy on Hugging Face) is a 3.7 MB parquet file. The three models download from Hugging Face on first run (all ungated): `sentence-transformers/all-MiniLM-L6-v2`, `BAAI/bge-small-en-v1.5`, `intfloat/e5-small-v2`.

```sh
mkdir -p /private/tmp/claude-501/cone/data
curl -L -o /private/tmp/claude-501/cone/data/qqp_val.parquet \
  "https://huggingface.co/datasets/nyu-mll/glue/resolve/refs%2Fconvert%2Fparquet/qqp/validation/0000.parquet"
```

## Run

```sh
cd content/research/is-your-semantic-cache-lying
/private/tmp/claude-501/cone/venv/bin/python -u run.py 5000 > output.txt   # seed 20261127, 4 threads; writes results.json
python3 make_figs.py ../../../public/images/blog                            # the two SVG figures
```

## How long it takes

About 6 minutes for `run.py` on 4 CPU threads (bulk embedding took 59 to 162 s per model on a loaded machine), under a second for `make_figs.py`. Cosines, hit rates and intervals reproduce; the latency numbers move with machine load.

## Load average (shared machine)

The brief asked to start only below load 20. Load at 18:47 was 21.6, then 55 (18:50) and 58 (18:53); I waited 5 minutes twice (23.3 at 18:58, 19.55 at 19:03) and started then.

| Run | Before | After |
| --- | --- | --- |
| First full run (not committed; same sweep numbers, latency 43, 62, 57 ms median) | 19.11 (19:03) | 19.36 (19:09) |
| Committed run (`output.txt`, with false-hit examples added) | 17.71 (19:10) | 28.13 (19:16) |

The latency in the post (33, 71, 84 ms median, batch 1) comes from the committed run, under that load.

## Files

- `EXPECTATION.txt`: what I expected, written before the first run.
- `run.py`: the whole experiment.
- `output.txt`: raw output quoted in the post.
- `results.json`: the same numbers plus histograms and the false-hit examples.
- `make_figs.py`: draws `embedding-cone-random-pairs.svg` and `semantic-cache-false-hits.svg` from `results.json`.
- `social.md`: social cuts for Typefully.

## What it does

1. Samples 5,000 pairs from QQP validation with a fixed seed (1,852 labelled duplicate, 37.0%).
2. Embeds both questions with each model (mean pooling for MiniLM and e5, CLS for bge; vectors normalised; `query: ` prefix for e5; max 128 tokens).
3. Random unrelated pairs: question 1 of pair i with question 2 of a different pair (a seeded permutation with no fixed points). A few of these can be real paraphrases because QQP repeats questions.
4. Hit = cosine at or above the threshold. False-hit share = hits on pairs labelled non-duplicate divided by all hits, with a 1,000-resample bootstrap 95% interval over pairs.
5. The "5% / 10% wrong" thresholds are the lowest value on a 0.30 to 0.99 grid (700 steps) that keeps the false-hit share at or under the target.
6. Latency: one query at a time (batch 1, 100 queries, median) on 4 threads.

QQP labels are noisy and the non-duplicates are mostly related questions, so the false-hit share is a hard-case figure, not a prediction for your traffic.
