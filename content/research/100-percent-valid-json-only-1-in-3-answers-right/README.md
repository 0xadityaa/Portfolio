# Structured-output run: instruction, 3-shot, constrained decoding

The artifact behind the post "100% Valid JSON, Only 1 in 3 Answers Right". I ran four setups that extract five fields from 120 invented customer messages with Qwen2.5-0.5B-Instruct on CPU, and scored them on format and on content. Three of the four setups were 100% schema-valid, and none got all five fields right more than 32.5% of the time.

## Run it

1. Set up. Python 3.12. The virtualenv lives outside the repo.

```sh
python3 -m venv /private/tmp/claude-501/outlvenv
/private/tmp/claude-501/outlvenv/bin/pip install outlines==1.3.3 torch==2.7.1 transformers==4.52.4 numpy
```

My run used outlines 1.3.3 (outlines_core 0.2.14), torch 2.7.1, transformers 4.52.4, tokenizers 0.21.4, numpy 2.5.5. `analyze.py` and `make_cases.py` need only the standard library.

2. Fetch data or weights. The cases are generated, not downloaded: `python3 make_cases.py` rewrites `cases.jsonl` byte for byte (seed 1231), and the committed file is the one used. The model, [Qwen/Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), downloads from Hugging Face on first run (about 1 GB, cached under `~/.cache/huggingface`, not in the repo).

3. Run it. From this folder, one arm at a time (`instr`, `fewshot`, `instr_o`, `fewshot_o`):

```sh
export TOKENIZERS_PARALLELISM=false
/private/tmp/claude-501/outlvenv/bin/python run.py instr        # writes results/raw_instr.jsonl
/private/tmp/claude-501/outlvenv/bin/python run.py fewshot
/private/tmp/claude-501/outlvenv/bin/python run.py instr_o
/private/tmp/claude-501/outlvenv/bin/python run.py fewshot_o
python3 analyze.py > output.txt && python3 inspect_runs.py >> output.txt
python3 make_chart.py                                          # writes public/images/blog/valid-json-vs-right-answers.svg
```

4. How long it takes. The four arms took 19, 15, 11 and 13 minutes (58 minutes in all) on 4 threads of an Apple M2 shared with other jobs. Scoring and the chart take a few seconds. I didn't repeat the run. The committed `results/raw_*.jsonl` are that run's raw outputs, and `output.txt` is `analyze.py` plus `inspect_runs.py` over them. Generation is greedy, so a rerun on the same versions should reproduce the text; the `seconds` column will differ.

## Load average

Recorded with `uptime` (full log in `load.txt`).

- Before the run, 22:11: 15.37 15.87 13.88. The machine read 20.4 at 22:02, so I waited for it to fall under 20 first.
- After the run, 23:09: 23.74 22.43 21.82.
- Other jobs pushed the load to about 90 for a few minutes during arm A. Timings in the post are indicative only. Token counts and outputs are not affected by load.

## Files

- `EXPECTATION.txt`: guesses written before the first model run.
- `make_cases.py`, `cases.jsonl`: the 120 evaluation messages (`split: eval`), the three examples used by arms B and D (`shots`), and a second, unused example set (`shots_b`).
- `run.py`: the four arms. `analyze.py`: scoring, Wilson intervals, paired bootstrap. `inspect_runs.py`: why invalid outputs were invalid, and which `priority` values each arm gave. `make_chart.py`: the chart.
- `results/raw_*.jsonl`: every raw reply with prompt tokens, reply tokens and seconds. `results.json`, `output.txt`: scored numbers.
- `load.txt`: load average before, between and after the arms.
- `social.md`: social cuts for Typefully.

## What it does

1. Each message is built from templates with a seeded generator: a name in the signature, a product, a quantity as digits or a word, a priority cue (urgent, a week, no rush), and a refund or replacement request, plus distractors (order number, price, weeks to arrive, a support agent's first name). Gold: 36 high, 48 medium, 36 low priority; 65 refund, 55 replacement.
2. The schema has five required keys: `customer` and `product` (strings), `quantity` (integer), `priority` (low, medium or high), `refund` (boolean). No other keys.
3. Arms A and B use plain greedy decoding (`max_new_tokens` 160; no reply reached it). C and D use the same prompts and greedy decoding through an `outlines` generator built from the schema.
4. B and D put three worked examples ahead of the message as earlier chat turns. The example set (a high priority refund, a low priority replacement, a medium priority refund) is fixed. `--shots b` selects a different set; it was not run.
5. Scoring. "Raw" parses the reply as is with `json.loads`. "Fences stripped" removes a Markdown code fence and keeps the first `{` to the last `}`. A reply that does not parse scores zero on all fields. `product` is compared case-insensitively with a trailing "s" removed, since the model often pluralises. Intervals are 95% Wilson. Paired differences use a 5,000-resample bootstrap over cases, seed 7.

## Library choice

`outlines` installed cleanly in a fresh virtualenv and ran at about the same speed as a hand-written token mask on a 3 to 4 case trial, so I used it for C and D. I never needed the hand-written fallback for a reported number, so it isn't included.

## Discarded start

I stopped a first start of arm A with a 96-token cap after about 10 cases, because pretty-printed, fenced replies were being cut off and would have inflated the parse failures. I raised the cap to 160 and ran all four arms from scratch. The reported run is the only complete one.

## Where I'd stop trusting this

One model (0.5B), one fixed set of three examples, 120 templated messages, greedy decoding only. The prompt does not define the priority levels. Constrained arms emit the library's default spaced JSON, the example replies are compact JSON. Timings were taken on a shared machine.
