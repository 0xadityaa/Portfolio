# Does a small model know when it's wrong?

Artifact for the post [Does It Know It's Wrong?](https://www.0xadityaa.dev/blog/does-it-know-its-wrong). Closed-book TriviaQA, Qwen2.5-1.5B-Instruct and Qwen2.5-0.5B-Instruct, the probability each model gave its own answer, and what that probability predicts.

## What is here

| File | What it is |
| --- | --- |
| [`EXPECTATION.txt`](EXPECTATION.txt) | The predictions, written before any run |
| [`run.py`](run.py) | Generates short answers and saves every token's log probability |
| [`analyze.py`](analyze.py) | Grades answers, then computes AUROC, ECE, risk-coverage and cutoff tables |
| [`make_figs.py`](make_figs.py) | Draws the two SVG figures from `results/analysis.json` |
| [`results/gen_qwen2.5-1.5b.jsonl`](results/gen_qwen2.5-1.5b.jsonl), [`results/gen_qwen2.5-0.5b.jsonl`](results/gen_qwen2.5-0.5b.jsonl) | Raw output: question, aliases, answer, tokens, log probabilities |
| [`results/graded_qwen2.5-1.5b.jsonl`](results/graded_qwen2.5-1.5b.jsonl), [`results/graded_qwen2.5-0.5b.jsonl`](results/graded_qwen2.5-0.5b.jsonl) | One line per question: strict match, rule grade, best F1, confidence |
| [`results/overrides.json`](results/overrides.json) | Hand corrections to the rule grader (9 answers for the 1.5B, 3 for the 0.5B) |
| [`results/analysis.txt`](results/analysis.txt), [`results/analysis.json`](results/analysis.json) | Every number in the post |
| [`results/ids.json`](results/ids.json) | The 112 question ids both models answered, in order |
| `results/run_*.log`, `results/uptime_*.txt` | Run logs and load averages before and after |

## Setup

Python 3.12, CPU only. Keep the venv and data outside the repo.

```sh
python3 -m venv /tmp/calib/venv
/tmp/calib/venv/bin/pip install torch==2.7.1 transformers==4.52.4 numpy==2.2.6 pyarrow huggingface_hub
```

## Fetch the data and weights

The TriviaQA validation split without passages (17,944 questions, 7.3 MB, not committed; first 16 hex digits of its SHA-256 are `48a5005c0eb4f8a4`):

```sh
mkdir -p /tmp/calib/data
curl -sL -o /tmp/calib/data/validation.parquet \
  "https://huggingface.co/datasets/mandarjoshi/trivia_qa/resolve/main/rc.nocontext/validation-00000-of-00001.parquet"
```

The model weights download from Hugging Face on first use (`Qwen/Qwen2.5-1.5B-Instruct`, `Qwen/Qwen2.5-0.5B-Instruct`).

## Run

```sh
cd content/research/does-it-know-its-wrong
PY=/tmp/calib/venv/bin/python
D=/tmp/calib/data/validation.parquet

# 1.5B: shuffled with a fixed seed, stops after 30 minutes (this run reached 112 questions)
$PY -I run.py Qwen/Qwen2.5-1.5B-Instruct results/gen_qwen2.5-1.5b.jsonl --data $D --minutes 30 --n 1000 --dtype bfloat16

# the 0.5B answers exactly the same questions
python3 -c "import json;json.dump([json.loads(l)['id'] for l in open('results/gen_qwen2.5-1.5b.jsonl')],open('results/ids.json','w'))"
$PY -I run.py Qwen/Qwen2.5-0.5B-Instruct results/gen_qwen2.5-0.5b.jsonl --data $D --ids results/ids.json --minutes 15 --dtype bfloat16

# grade and analyse (about 2 minutes of bootstrap), then draw
$PY -I analyze.py results
$PY -I make_figs.py results ../../../public/images/blog
```

## How long it takes

The 1.5B run took about 33 minutes for 112 questions on 4 threads while the machine was shared with other jobs (load average 14.45 before, 97.82 after the 0.5B run; see `results/uptime_*.txt`). The 0.5B run took 7 minutes. An idle machine will get through many more questions in the same time. The question order is fixed by the seed `20261126`, so a longer run extends this sample rather than replacing it. Answers will not match bit for bit: batches of 8 in bf16 on a loaded CPU can shift the last digits of a probability.

## Method notes

- **Prompt.** Chat template with the system message "Answer the trivia question. Reply with only the answer, a few words, no explanation." Greedy decoding, at most 16 new tokens, left-padded batches of 8. Probabilities come from the raw logits (no repetition penalty, no sampling filters).
- **bf16.** A first attempt in float32 used about 6 GB for the 1.5B and thrashed the shared machine's swap, so both models ran in bf16 instead. No results from the abandoned attempt are used.
- **Confidence.** `p_seq` is the product of the answer-token probabilities (the EOS token is excluded). `mean_token_p` is the geometric mean. `shortness` is the negative token count, used as a length baseline.
- **Grading.** Answers and aliases are normalised the SQuAD way (lowercase, strip punctuation and articles). Strict: the answer equals an alias. Rule: strict, or token F1 of at least 0.5 against any alias, the rule from [Is Exact Match Lying?](https://www.0xadityaa.dev/blog/exact-match-would-fail-the-humans-too). The post's headline numbers use the rule. `overrides.json` marks the rule's passes that were read as wrong and failures read as right; the hand-corrected numbers are in `analysis.txt`.
- **Intervals.** Percentile bootstrap over questions, 2,000 resamples, seed 7. Accuracy uses a Wilson interval.
- **Cutoffs.** The "halve the wrong answers" cutoff is picked on the same questions it is reported on. The split-half line in `analysis.txt` repeats the choice 500 times on a random half and reports the other half.
- **Aliases.** TriviaQA alias lists include odd entries (Wikipedia page titles such as "Administrative divisions of Denmark"). They are used as given.
