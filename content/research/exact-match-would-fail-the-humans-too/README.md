# Scoring SQuAD humans against each other: exact match, token F1, embedding cosine

Companion to `content/blog/exact-match-would-fail-the-humans-too.md`.

Question: if one correct human answer is the "prediction" and the other human answers are the references, how many does each metric mark wrong? And how many hand-written wrong answers does each metric let through?

## What it does

- Takes SQuAD v1.1 dev (10,570 questions, 48 articles; 8,490 questions have 3 answers, the rest 1 to 6).
- Leave-one-out: each human answer is the prediction, the other answers are the references. 34,723 items. Score = best over references, as the official script does.
- Single-reference variant: every ordered pair of answers, one reference each. 84,310 items.
- Paper protocol check: the second answer is the prediction, the rest are references (10,431 items). The SQuAD paper reports 80.3 EM and 90.5 F1 for humans on v1.0 dev; this gives 81.7 and 91.2 on v1.1.
- Metrics: exact match and token F1 with the official v1.1 normalisation (reimplemented in `run.py` from the script's text); cosine of `BAAI/bge-small-en-v1.5` embeddings of the two answer strings (answers alone, no question, no query prefix).
- Adversarial set: `adversarial.jsonl`, 100 wrong answers I wrote, 10 each of: wrong year, wrong number, negation, wrong qualifier, same-type entity, wrong unit, flipped direction, near name, reversed roles, wrong detail in a long answer. Each has a question, a correct reference and a wrong answer. Scored with one reference.
- Control: each question's reference answers against the first answer of a random question from a different article (10,570 items, seed 20261115).
- Hand-check: 50 random exact-match failures (one per question, seed 20261115) in `results/handcheck_sample.json`, categorised by me in `handcheck.json`.

## Files

- `EXPECTATION.txt`: what I expected, written before the first run.
- `run.py`: builds items, embeds every unique string once, scores everything, draws the hand-check sample. Embedding the 15,048 unique strings is nearly all of the run time.
- `analyze.py`: tables, 95% article-cluster bootstrap intervals (2,000 resamples, seed 20261115) for the human items, Wilson intervals for the 100 adversarial items, threshold sweeps, separation (the probability that a random correct human answer outscores a random wrong one), and the hand-check summary.
- `make_chart.py`: draws `public/images/blog/exact-match-vs-wrong-answers.svg`.
- `adversarial.jsonl`, `handcheck.json`: the hand-written inputs.
- `results/`: `scores.npz` (per-item scores), `handcheck_sample.json`, `analysis.txt`, `analysis.json`, `run.log`.
- `social.md`: social cuts.

## Run it again

Everything big lives outside the repo. Needs `uv` (any recent version), Python 3.12 and network access for the dataset and the model weights.

### 1. Set up

```bash
WORK=/private/tmp/claude-501/em
mkdir -p $WORK/data $WORK/cache $WORK/out && cd $WORK
uv venv --python 3.12 venv
uv pip install --python venv/bin/python numpy sentence-transformers
```

This installed torch 2.15.0, sentence-transformers 6.3.0 and numpy 2.5.4 (see Environment).

### 2. Fetch the data and weights

```bash
# dataset (4.8 MB, CC BY-SA 4.0)
curl -sSL -o data/dev-v1.1.json https://rajpurkar.github.io/SQuAD-explorer/dataset/dev-v1.1.json
shasum -a 256 data/dev-v1.1.json   # 95aa6a52d5d6a735563366753ca50492a658031da74f301ac5238b03966972c9
```

The model weights (`BAAI/bge-small-en-v1.5`, about 130 MB) download from Hugging Face on the first run of `run.py`; nothing to fetch by hand. Embeddings are cached in `$WORK/cache`, which is safe to delete.

### 3. Run

From the repo root:

```bash
R=content/research/exact-match-would-fail-the-humans-too
$WORK/venv/bin/python $R/run.py $WORK/data/dev-v1.1.json $R/adversarial.jsonl $WORK/cache $R/results
$WORK/venv/bin/python $R/analyze.py $R/adversarial.jsonl $R/results
$WORK/venv/bin/python $R/make_chart.py $R/results public/images/blog/exact-match-vs-wrong-answers.svg
```

To leave the committed output alone, send `run.py` to another directory (the first command's last argument) and point the other two at it.

### 4. How long it takes

About 5 minutes end to end on CPU. I reran it from an empty cache on 2026-11-15 (M2, 4 torch threads, machine busy with other jobs): `run.py` took 5 minutes 6 seconds including the model download and embedding all 15,048 strings, `analyze.py` took about 2 seconds, `make_chart.py` under a second. With embeddings cached, `run.py` takes about 50 seconds. The rerun gave `analysis.txt`, `handcheck_sample.json`, the per-item scores and the SVG identical to the committed files.

## Environment

Apple M2, 8 cores, 16 GB, CPU only, 4 torch threads, machine busy with other jobs. Python 3.12.8, torch 2.15.0, sentence-transformers 6.3.0, numpy 2.5.4. Model revision `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a`.

## Things to know before trusting it

- The adversarial items are hand-written to be close to the truth. Random wrong answers (the control) passed 0.0% on every metric.
- 100 items: an interval of about 9 points either side on each pass rate.
- Human items use the best of 1 to 5 references; adversarial items have one. The single-reference variant (EM fails 32.7%) is the fairer comparison on that axis.
- The hand-check categories are one reader's judgement on 50 items (`handcheck.json` has the method and notes).
- One embedding model, bare answer strings. Cosine scores depend heavily on the model; the model card says bge scores mostly sit between 0.6 and 1.
- The official-script normalisation was reimplemented from the v1.1 script in `allenai/bi-att-flow` (its header says "Official evaluation script for v1.1"), not imported.
- Floating point: identical strings give cosine of about 0.99999994, so a threshold of exactly 1.00 is not meaningful.
