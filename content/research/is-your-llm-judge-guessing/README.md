# Judge position bias on MT-Bench human votes

The artifact behind the post "Is Your LLM Judge Guessing?". Qwen2.5-0.5B-Instruct judges every eligible turn-1 pair of `lmsys/mt_bench_human_judgments` in both answer orders, and Qwen2.5-1.5B-Instruct judges a seeded 100-pair subset. The verdict is read from the logits of the tokens `A` and `B`; nothing is generated.

## Run it

1. Set up. The virtualenv lives outside the repo. Python 3.12 and these versions (the ones the committed output was produced with):

```sh
python3 -m venv /private/tmp/claude-501/judge/venv
/private/tmp/claude-501/judge/venv/bin/pip install torch==2.7.1 transformers==4.52.4 datasets==3.6.0 numpy==2.3.1
export HF_HOME=/private/tmp/claude-501/judge/hf
```

2. Fetch data and weights. Nothing to do by hand: `judge.py` downloads them on first use into `HF_HOME`.
   - Dataset: [`lmsys/mt_bench_human_judgments`](https://huggingface.co/datasets/lmsys/mt_bench_human_judgments), the `human` split (3,355 rows; 1,689 are turn 1). Ungated, licence cc-by-4.0, checked on the Hub API on 2026-11-26 (revision `f7d2896d2cc5d80f8b55c2bbc722613555233c25`).
   - Models: [`Qwen/Qwen2.5-0.5B-Instruct`](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) and [`Qwen/Qwen2.5-1.5B-Instruct`](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct), about 1 GB and 3 GB.

3. Run it. From the repo root:

```sh
cd content/research/is-your-llm-judge-guessing
/private/tmp/claude-501/judge/venv/bin/python -I judge.py --model Qwen/Qwen2.5-0.5B-Instruct --out raw-0.5b.jsonl
/private/tmp/claude-501/judge/venv/bin/python -I judge.py --model Qwen/Qwen2.5-1.5B-Instruct --out raw-1.5b.jsonl --subset 100
/private/tmp/claude-501/judge/venv/bin/python -I analyze.py raw-0.5b.jsonl raw-1.5b.jsonl > output.txt
```

`judge.py` appends one line per pair and skips pairs already in the file, so an interrupted run resumes. `analyze.py` needs no network after the dataset is cached and finishes in seconds. Re-running it on the committed `raw-*.jsonl` reproduces `output.txt` and `results.json` exactly (seeded bootstrap).

4. How long it takes. On an unloaded Apple M2 with 4 threads, about 4 s per pair for the 0.5B judge (two forward passes of about 580 tokens), so about 55 minutes for 825 pairs (extrapolated from the first 10 pairs, which took 41 s). The 1.5B subset was only timed on the loaded machine: 901 s for 100 pairs. The committed run was much slower because the machine was shared (see Load).

## Files

- `EXPECTATION.txt`: the expected result, written before the first run.
- [`judge.py`](judge.py): builds the prompt, scores both orders, writes `raw-*.jsonl`.
- [`analyze.py`](analyze.py): agreement, position preference, flip rate, baselines, intervals.
- `raw-0.5b.jsonl`, `raw-1.5b.jsonl`: per pair, the human votes and the four numbers `margin1`, `margin2` (logit of `A` minus logit of `B` in each order) and `mass1`, `mass2` (probability mass the model puts on `A` or `B`).
- `output.txt`, `results.json`: the analysis output quoted in the post.
- `run-0.5b.log`, `run-1.5b.log`: the run logs, with the machine load every 10 pairs.
- `social.md`: social cuts for Typefully.

## What it does

1. Takes the 1,204 unique turn-1 pairs (question plus two models). Keeps the 961 that have at least one non-tie human vote. Drops the 136 whose judge prompt is over 1,000 tokens (dropped, not truncated), leaving 825 pairs and 1,106 non-tie human votes. The turn-1 rows carry the whole two-turn chat; only the first exchange was judged, so only it is shown to the judge.
2. Builds one prompt per order from the MT-Bench pairwise judge instructions (shortened, and asking for a single letter instead of an explanation) and the chat template of the model. The verdict is the margin $m = z_A - z_B$ at the first generated position. In order 1 the slots are (`model_a`, `model_b`); in order 2 they are swapped.
3. Agreement with humans is counted per non-tie human vote. A pair with two votes counts twice. Intervals are 95% percentile bootstraps over matchups (10,000 resamples, seed 7). A matchup is a question plus two models in either order; 340 of the 825 pairs have their mirror image (same matchup, models swapped, different human voters) in the set, so the bootstrap keeps them together. There are 655 matchups.
4. Averaged margin: the order-2 margin is for `model_b`, so $m_1 - m_2$ is the margin for `model_a` with the slot preference subtracted. Positive means `model_a` wins.
5. Flip: the model-level verdict changes when only the order changes, which is the same as picking the same slot (A or B) in both orders. The expected flip rate if the two orders were independent is $p_1 p_2 + (1-p_1)(1-p_2)$, with $p_i$ the share of verdicts that pick slot A in order $i$.
6. Baselines: the human-human rate (over ordered pairs of votes within the 236 pairs that have two or more non-tie votes), the share of human votes that pick the first-listed answer, a "pick the longer answer" rule by character count, and the margin re-centred on its own median (no labels used).

## Limits

Two small models, one prompt wording, fp32 on CPU. The 1.5B arm is 100 pairs (98 matchups, 134 votes), so its intervals are about 20 points wide. Ties are dropped, only turn 1 is judged, and the judge gives no explanation before the verdict. Frontier models were not run.

## Load

The machine was shared. `uptime` readings:

- Start of the 0.5B run (2026-11-26 23:11): load averages 16.45 19.22 20.55. A first check at 23:07 read 22.29 21.68 21.50, above 20, and the load was under 20 by the time the run started at 23:11, so the 5-minute wait rule did not trigger.
- During the 0.5B run, from the load printed in `run-0.5b.log` every 10 pairs: minimum 14.0, median 26.9, maximum 113.3. It finished in 7,690 s (2 h 8 min) instead of about 55 min. The last reading was 18.6.
- During the 1.5B run (`run-1.5b.log`): 15.7 to 74.8, median 60.8. 100 pairs took 901 s.
- The `uptime` calls meant to bracket the runs were logged late, after a pause in the session, so they are not a record of the load at the end of each run. The run logs are.
