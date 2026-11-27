# Temperature zero and determinism

The artifact behind the post "Is Temperature Zero Deterministic?". Qwen2.5-0.5B-Instruct on CPU: how top-token probabilities move with temperature, how accuracy moves across 50 questions, and whether greedy decoding gives the same text when only the batch changes.

## Run it

1. Set up. The virtualenv and weights live outside the repo. Python 3.12.8, torch 2.7.1, transformers 4.52.4, numpy 2.5.5, Apple silicon CPU (macOS, Darwin 25.5.0).

```sh
python3 -m venv /private/tmp/claude-501/tempzero/venv
/private/tmp/claude-501/tempzero/venv/bin/pip install torch==2.7.1 transformers==4.52.4 numpy accelerate
```

2. Fetch the weights (about 1 GB, ungated):

```sh
/private/tmp/claude-501/tempzero/venv/bin/python -c "from huggingface_hub import snapshot_download; snapshot_download('Qwen/Qwen2.5-0.5B-Instruct', local_dir='/private/tmp/claude-501/tempzero/model')"
```

3. Run. From this folder, with `THREADS=4` (the default). Each script prints to stdout; the commands below write the committed outputs.

```sh
cd content/research/is-temperature-zero-deterministic
PY=/private/tmp/claude-501/tempzero/venv/bin/python
PYTHONPATH=. $PY -u dist.py > output-dist.txt          # also writes results-dist.json
PYTHONPATH=. $PY -u sample.py > output-sample.txt      # 3 prompts x 100 samples (also writes results-sample.json, not committed)
PYTHONPATH=. $PY -u determinism.py > output-determinism.txt   # writes results-determinism.json
PYTHONPATH=. $PY -u logit-scale.py > output-logit-scale.txt
PYTHONPATH=. $PY -u sweep50.py > output-sweep50.txt           # first pass
REDO=2,20,21,43 NEW_REDO=24 PYTHONPATH=. $PY -u sweep50.py > output-sweep50-redo.txt   # final numbers
```

4. How long it takes, on a machine whose load average was 17 to 110 (see below), so expect it to be faster on an idle one:

| Script | Time here |
| --- | --- |
| `dist.py`, `sample.py` | not timed (run on 2026-11-15) |
| `determinism.py` | part (d) alone took 2,271 s in fp32 and 1,893 s in bf16; parts (a) to (c) were not timed separately |
| `logit-scale.py` | about 1 minute |
| `sweep50.py` first pass | 3,779 s |
| `sweep50.py` redo of 4 questions | 301 s |

`sweep50.py` is seeded (`5000 + 10 * question + setting`), so the redo reproduces the first pass for every question it doesn't redo. The partial-results checkpoint it writes while running is deleted by hand once the run completes.

## Load averages

The machine is shared. `uptime` before and after each run is in [`run-load.txt`](run-load.txt). At the start the load average was 19.7 to 20.4, just under the threshold of 20 the brief set for waiting, so the run started right away. It reached 96 to 110 during the `determinism.py` to `sweep50.py` hand-off, which is why the first 50-question pass was stopped at 9 of 50 questions (about 190 s per question) and restarted with a smaller budget.

## Files

- `EXPECTATION.txt`: predictions, written before each run. Items 1 to 3 date from 2026-11-15, items 4 and 5 from 2026-11-26, then a note on the changed budget.
- `common.py`: model loading, chat template, generation settings. Overrides Qwen's shipped sampling defaults (temperature 0.7, top-p 0.8, top-k 20, repetition penalty 1.1) so everything is plain sampling.
- `dist.py`, `output-dist.txt`, `results-dist.json`: top-10 probabilities and entropy under temperature and top-p, four prompts.
- `sample.py`, `output-sample.txt`: 100 samples per setting on three prompts (Australia, 17 * 24, closest planet).
- `questions.py`: the 50 questions with accepted answers.
- `sweep50.py`, `output-sweep50.txt` (first pass, kept for the record), `output-sweep50-redo.txt` (final summary), `results-sweep50.json` (final per-question results).
- `determinism.py`, `determinism_prompts.py`, `output-determinism.txt`, `results-determinism.json`: repeatability and batch tests. `determinism_prompts.py` is the same 200-prompt list, split out so `logit-scale.py` can import it without running the experiment; `determinism.py` itself was not edited after its run.
- `logit-scale.py`, `output-logit-scale.txt`: size of the top logits and the bf16 spacing at that size.
- `social.md`: social cuts.

## What each script does

1. `sample.py`: 100 completions per setting (greedy, T=0.2, 0.7, 1.0, 1.5, T=1.0 with top-p 0.9), 12 new tokens, Wilson 95% intervals. Australia: greedy 0/100, T=0.7 54/100.
2. `sweep50.py`: each of 50 questions at greedy (one run) and four temperatures (30 samples each, 8 new tokens). Accuracy is the share of answers containing an accepted answer as whole words, after ASCII-folding and lower-casing. The summary averages over questions and bootstraps over questions (10,000 resamples, seed 20261126).
3. `determinism.py`: (a) greedy repeated 20 times on three prompts; (b) the same 1,000,000 float32 numbers summed in eight orders; (c) one prompt at batch 1 against 2, 8 and 32 copies, max logit difference; (d) 200 prompts, 64 greedy tokens, alone against a left-padded batch of 8, in fp32 and bf16, plus the top-1 minus top-2 logit gap at the first differing token.

## Results cut from the post

Mean accuracy over 50 questions (final, after the redo), with the paired difference from greedy:

| Setting | Mean accuracy | 95% interval | Difference from greedy | 95% interval | Better / worse / same |
| --- | ---: | --- | ---: | --- | --- |
| greedy | 74.0% | 62.0 to 86.0 | n/a | n/a | n/a |
| T = 0.2 | 74.7% | 62.8 to 85.9 | +0.7 | -1.3 to +2.9 | 5 / 4 / 41 |
| T = 0.7 | 70.7% | 60.7 to 80.1 | -3.3 | -8.3 to +1.6 | 11 / 23 / 16 |
| T = 1.0 | 64.7% | 54.8 to 74.0 | -9.3 | -15.8 to -3.1 | 11 / 28 / 11 |
| T = 1.5 | 38.3% | 29.7 to 47.1 | -35.7 | -45.5 to -26.1 | 9 / 37 / 4 |

First pass, before the grader fix and the 24-token rerun of four questions: greedy 68.0%, T=0.2 69.7%, T=0.7 67.2%, T=1.0 62.1%, T=1.5 37.2%.

Greedy was wrong on 13 of 50 questions. On those, mean accuracy at T=0.2, 0.7, 1.0 and 1.5 was 5.9%, 16.7%, 15.1% and 6.2%. On the 37 it got right: 98.8%, 89.6%, 82.1% and 49.6%.

Batch test, 200 prompts, 64 greedy tokens, alone against a left-padded batch of 8:

| Precision | Prompts changed | 95% Wilson | Steps with top-2 gap under 0.1 |
| --- | ---: | --- | ---: |
| fp32 | 0 of 200 | 0.0 to 1.9% | 4.9% of 11,765 |
| bf16 | 75 of 200 | 31.1 to 44.4% | 2.9% of 11,809 |

bf16 flips by top-2 logit gap at the first differing token: 43 at 0.000, 30 at 0.125, 2 at 0.250. First differing token index: median 22, range 1 to 57.

## Limits

One 0.5B model, one CPU, 50 short factual questions with 30 samples each. The grader checks that an accepted answer appears as whole words, so a verbose answer that contains the right one counts. The first pass had two defects, an accent-stripping bug that scored a correct "Brasília" as wrong and three answers cut off at 8 tokens; those four questions were rerun at 24 tokens and the other 46 were not. Padding and batch shape are not separated: identical copies gave identical logits, padded batches of different prompts flipped. No top-p arm in the 50-question run (it is in `sample.py`), no voting, no hosted model.
