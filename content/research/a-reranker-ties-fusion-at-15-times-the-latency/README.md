# Reranker vs fusion: BM25, bge-small, RRF and a cross-encoder on SQuAD v1.1 dev

Companion to the post `content/blog/a-reranker-ties-fusion-at-15-times-the-latency.md`, the sequel to the chunk-size sweep (`content/research/chunk-size-is-a-hyperparameter-you-never-tuned/`).

The question I wanted answered: at an equal token budget, how many points does a cross-encoder add over BM25 and over reciprocal rank fusion (RRF), and what does it cost per query on a 4-thread CPU? Short answer: 0.9 points over RRF at 2,000 tokens, interval includes zero, for 15 times the latency.

## What it does

- Same corpus, chunking, gold definition (a retrieved chunk fully contains a gold answer span), BM25 and bge-small setup as the chunk-size post: 48 SQuAD v1.1 dev articles, `o200k_base` token chunks, no overlap, retrieval over the whole chunk corpus.
- First stages: BM25 (own code), `BAAI/bge-small-en-v1.5`, RRF of the two (k = 60, top 100 of each).
- Reranker: `cross-encoder/ms-marco-MiniLM-L-6-v2` (22.7M parameters) reorders the top 20 of BM25 and of RRF for every question. For the first 300 questions it also reorders the top 20 of bge-small. For the first 150 it reads the top 50 of BM25 and of RRF as well. Pools of 10 come free from the pool-20 scores.
- Chunk sizes 128 and 256 are retrieved with every first stage; the reranker runs at 256 only.
- Questions are processed in a seeded random order (seed 20261115), so any prefix is a random sample. My run stopped on its time budget after 1,675 of the 2,000 drawn questions. Every number in the post uses those 1,675 (150 and 300 for the pool-50 and bge-small arms, as stated).
- Every (question, chunk) cross-encoder score is cached, so the whole result can be re-derived from `results/ce_scores_256.npz` without re-scoring.
- Intervals: paired bootstrap on per-question hit differences, 5,000 resamples, seed 20261115. The reported interval resamples the 48 articles (questions in one article are not independent); the question-level interval is printed beside it in `results/analysis.txt` and is similar.

## Files

- `EXPECTATION.txt`: what was expected, written 2026-11-15 before any reranker ran.
- `run.py`: first stages, pair scoring with an on-disk cache, ranks. Resumable.
- `latency.py`: per-query latency, one query at a time, three passes over 30 queries, with `uptime` before and after.
- `analyze.py`: tables and paired bootstrap intervals, writes `results/analysis.txt` and `analysis.json`.
- `make_chart.py`: draws `public/images/blog/reranker-vs-fusion-equal-budget.svg` from `results/ranks.npz`.
- `results/`: `ranks.npz`, `stats.json`, `ce_scores_256.npz` (all cached pair scores), `analysis.txt`, `latency.json`, `latency.log`, `run_part1.log`, `run_part2.log`, `uptime_*.txt`.
- `earlier-300q-loaded/`: my first pass (300 questions, pool 50, machine at load average 170 to 260). Its lift of +2.3 [-0.3, 4.9] and latency of about 5 s per query are superseded by the run above, and I kept it only as a record of how noisy 300 questions are.
- `social.md`: social cuts for the post.

## Run it again

Everything big lives outside the repo.

```bash
WORK=/private/tmp/claude-501/rerank
mkdir -p $WORK/data && cd $WORK
uv venv --python 3.12 venv
uv pip install --python venv/bin/python tiktoken numpy scipy sentence-transformers

# dataset (4.8 MB, CC BY-SA 4.0)
curl -sSL -o data/dev-v1.1.json https://rajpurkar.github.io/SQuAD-explorer/dataset/dev-v1.1.json
shasum -a 256 data/dev-v1.1.json   # 95aa6a52d5d6a735563366753ca50492a658031da74f301ac5238b03966972c9

R=/path/to/repo/content/research/a-reranker-ties-fusion-at-15-times-the-latency
# optional: skip the 50 minutes of scoring by seeding the cache with the committed scores
mkdir -p cache && cp $R/results/ce_scores_256.npz cache/ce_256_2000_20261115.npz
uptime                                                # record the load before
venv/bin/python $R/latency.py data cache $R/results 2000          # run on its own, not alongside run.py
venv/bin/python $R/run.py data cache $R/results 2000 35           # N questions, minutes of scoring budget
uptime                                                # and after
venv/bin/python $R/analyze.py $R/results
venv/bin/python $R/make_chart.py $R/results public/images/blog/reranker-vs-fusion-equal-budget.svg
```

Downloads: the 4.8 MB dataset, bge-small weights (about 130 MB), the cross-encoder weights (about 90 MB) and the tiktoken `o200k_base` vocabulary, each fetched on first use. Query and chunk embeddings are cached in `cache/` (about 2 minutes to compute).

Runtime on an Apple M2 under shared load: `latency.py` about 6 minutes; `run.py` about 50 minutes of cross-encoder scoring for 51,000 pairs (about 16 to 25 pairs a second), or about 3 minutes with the committed score cache (then it only recomputes first stages and ranks); `analyze.py` under a minute. With a different time budget the run covers a different number of questions; `analysis.txt` states the count.

## Machine load

The machine was shared with other jobs. Load averages (1, 5, 15 minutes) from `uptime`:

| When | Load average |
| --- | --- |
| Before the first look, 22:02 | 22.34, 14.19, 11.57 |
| Before `latency.py`, 22:05 | 20.73, 16.27, 12.95 |
| After `latency.py`, 22:10 | 16.87, 16.14, 13.80 |
| Before `run.py`, first start, 22:11 | 15.37, 15.87, 13.88 |
| Restart of `run.py`, 22:26 | 20.33, 25.16, 24.53 |
| After `run.py`, 23:02 | 44.10, 27.70, 23.09 |

The load started above 20 on the 1-minute figure, and fell under it within two minutes while the environment was being set up, so I started the run without the full wait. Load climbed to 62 for a few minutes after the first launch. Treat the latency figures as the high end of what this CPU does; the quietest pass of `latency.py` ran the 20-chunk reranker in 440 ms against 862 ms for the median of the three.

## Changes from the plan

- I stopped `run.py` 14 minutes in and restarted it from its cache with the pool-50 subsample cut from 300 to 150 questions (BM25 and RRF candidates only), because pool-50 pairs would have eaten most of the time budget at 16 pairs a second. The 10,507 pairs already scored were kept. The first 14 minutes are in `run_part1.log`, the rest in `run_part2.log`.
- I didn't run the 128-token reranker arm or the bge-small pool-50 arm.

## Where I'd stop trusting this

- SQuAD questions were written with the paragraph open, which favours BM25 and keyword overlap. The cross-encoder was trained on MS MARCO web queries.
- A hit is "a chunk contains the answer span", not "a model answered correctly". No generator ran.
- Latency is CPU, 4 threads, one query at a time, and the load was not low. A GPU, batching or a smaller pool changes the ratio.
- The bge-small arm covers 300 questions and the pool-50 arm 150, so their intervals are wide.
