# Few-shot count and chat-template mismatch on AG News

The artifact behind the post "Is Few-Shot Worth the Tokens?". Qwen2.5-0.5B-Instruct classifies 100 AG News test articles under four prompt templates and 0, 1, 3 and 8 examples. The answer is read from the next-token logits of the four label words (World, Sports, Business, Technology). Nothing is generated.

## Run it

1. Set up. The virtualenv lives outside the repo. Python 3.12 and these versions (the ones the committed output was produced with):

```sh
python3 -m venv /private/tmp/claude-501/fewshot/venv
/private/tmp/claude-501/fewshot/venv/bin/pip install torch==2.7.1 transformers==4.52.4 pandas==2.2.3 pyarrow==19.0.1 numpy==2.3.1
```

2. Fetch data and weights.
   - AG News, `fancyzhx/ag_news`, [dataset card](https://huggingface.co/datasets/fancyzhx/ag_news). The Hub API lists the licence as `unknown` (checked 2026-11-27, revision `eb185aade064a813bc0b7f42de02595523103ca4`), so no data is committed:

```sh
mkdir -p /private/tmp/claude-501/fewshot/data && cd /private/tmp/claude-501/fewshot/data
for s in train test; do curl -sL -o ag_$s.parquet https://huggingface.co/datasets/fancyzhx/ag_news/resolve/main/data/$s-00000-of-00001.parquet; done
```

   The files the committed run used have MD5 `3d8861195d2a365e37ee9b22c4de95f8` (test) and `cb98f5dd496713c1818aa88e8f9e3dd6` (train).
   - Weights: [`Qwen/Qwen2.5-0.5B-Instruct`](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), about 1 GB, downloaded on first use.

3. Run it. From the repo root:

```sh
cd content/research/is-few-shot-worth-the-tokens
export AG_DIR=/private/tmp/claude-501/fewshot/data
/private/tmp/claude-501/fewshot/venv/bin/python -I run.py --model Qwen/Qwen2.5-0.5B-Instruct --out raw-0.5b.jsonl --n 100 --shots 0,3,8,1 --templates chat,raw,llama,no_header
/private/tmp/claude-501/fewshot/venv/bin/python -I analyze.py raw-0.5b.jsonl > output.txt
/private/tmp/claude-501/fewshot/venv/bin/python -I paired.py raw-0.5b.jsonl > paired.txt
/private/tmp/claude-501/fewshot/venv/bin/python -I cost.py > cost.txt
python3 -I make_figure.py > ../../../public/images/blog/few-shot-vs-template.svg
```

`run.py` appends one line per article and skips any (template, shots, set) that is already complete, so an interrupted run resumes. `analyze.py`, `paired.py`, `cost.py` and `make_figure.py` need no network or model and finish in seconds. Re-running them on the committed `raw-0.5b.jsonl` reproduces `output.txt`, `results.json`, `paired.txt`, `cost.txt` and the figure.

4. How long it takes. 19 sets of 100 articles. On the sets that ran at a load of 14 to 20, a set took 77 to 96 s, so about 30 minutes on 4 threads when the machine is quiet. The committed run took longer because the machine was shared (see Load).

## Files

- `EXPECTATION.txt`: the expected result, written before the first full run.
- [`run.py`](run.py): builds the prompts, scores every article, writes `raw-0.5b.jsonl`. It also checks that the cached prefix gives the same logits as a full forward pass (largest difference over the four labels 6e-5, printed at the top of each run log).
- [`analyze.py`](analyze.py): accuracy per example set, spread, tokens, label mass, prediction shares, cost per point, mismatch cost.
- [`paired.py`](paired.py): paired comparisons on the same 100 articles with an exact sign test per example set.
- [`cost.py`](cost.py): dollar cost of the extra shot tokens.
- [`make_figure.py`](make_figure.py): draws `public/images/blog/few-shot-vs-template.svg` from `results.json`.
- `raw-0.5b.jsonl`: per article and prompt: gold, prediction, label mass, whether the top token is a label, prompt tokens, margin between the top two labels.
- `output.txt`, `results.json`, `paired.txt`, `cost.txt`: outputs quoted in the post.
- `run-0.5b.part1.log`, `run-0.5b.part2.log`, `load.log`: the run logs and the load readings. The run was stopped once after `chat k=8 set=2`, the mismatch plan was cut from 0, 3, 8 shots to 0 and 8 to fit the time budget, and it resumed from the saved file (`part2`).
- `social.md`: social cuts for Typefully.

## What it does

1. Samples 100 test articles, 25 per label (`random_state=0`), cuts each at 300 characters on a word boundary, and shuffles them with seed 0.
2. Draws three example sets (seeds 1, 2, 3) from training articles of at most 220 characters: 2 per label, shuffled. k shots is the first k of the set, so the sets are nested.
3. Builds four prompt templates around the same instruction and examples:
   - `chat`: Qwen's chat template with a system turn, one user and assistant turn per example, then the article with `add_generation_prompt=True`.
   - `no_header`: the same, without the final assistant header.
   - `llama`: Llama-2's `[INST] <<SYS>> ... [/INST]` format with `</s>` between turns.
   - `raw`: plain text, `Article: ...` then `Category: ...`, ending on `Category:`.
4. Runs the shared prefix once per (template, shots, set), reuses its key/value cache for the 100 articles, and asserts the split does not change tokenisation.
5. Picks the label whose first token has the highest logit at the answer position. Label mass is the softmax probability the full vocabulary puts on the four first tokens; it is near zero when the model wants to emit something else.

## Limits

One 0.5B model, one task, 100 articles, fp32 on CPU. A single 100-article score has a 95% Wilson interval about 18 points wide. The 0-shot arm has one set. Mismatched templates ran at 0 and 8 shots only, and `no_header` at 0 only. Qwen2.5-1.5B-Instruct was planned and not run. Label-logit scoring cannot tell "wrong answer" from "no answer at this position", which is why label mass is reported. Token counts are Qwen tokens.

## Load

The machine was shared. `uptime` readings (full lines in `load.log`):

- Before: 2026-11-27 18:47, load averages 19.34 31.31 32.56. A smoke test then pushed the load to 50 to 67. The rule (wait 5 minutes, retry up to 3 times, then proceed) was applied from 18:55: checks read 48.42, 24.10 and 25.91 on the 1-minute average, all above 20, and the run started by hand at 19:11 at 19.29 1-minute (23.49 5-minute).
- During: the load printed in the run logs ranged from 14.2 to 158.2. One set (`llama`, 8 shots, set 2) took 3,666 s because of it.
- After: 2026-11-27 20:44, load averages 62.86 69.36 46.84.
