# Is Valid JSON Enough?

- Topic issue: none (series post 12, from the AI-engineering syllabus; the syllabus site was used as a topic list only)
- Format: essay
- Thesis: Constrained decoding and three examples each fix the shape of a small model's JSON, and neither fixes its content: schema-valid went from 57.5% to 100% while all-five-fields-right stayed near 1 in 3.
- Reader: an engineer shipping LLM extraction who tracks parse errors and treats a passing schema as a passing answer.

## What this adds

Prior art is strong on how constraining works and why. [Willard and Louf, Efficient Guided Generation for Large Language Models](https://arxiv.org/abs/2307.09702) is the finite-state-machine index behind Outlines. OpenAI's [Introducing Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) reports 93% to 100% schema adherence. [Tam et al., Let Me Speak Freely?](https://arxiv.org/abs/2408.02442) argues format restrictions hurt reasoning. [Min et al.](https://arxiv.org/abs/2202.12837) shows demonstrations mainly carry format.

What this post adds: one fixed task run four ways (instruction, 3-shot, constrained, both) with the same scorer, putting "valid" and "right" side by side with intervals, and showing the enum field that a schema cannot protect (priority at 31 to 33%, below the best constant guess of 40%).

## Artifact

`content/research/100-percent-valid-json-only-1-in-3-answers-right/`: `make_cases.py`, `cases.jsonl`, `run.py`, `analyze.py`, `inspect_runs.py`, `make_chart.py`, `results/raw_*.jsonl`, `output.txt`, `results.json`, `load.txt`, `EXPECTATION.txt`, `README.md`, `social.md`.

### Expectation, written before running

(Also saved as `EXPECTATION.txt`, written before the first model run.) A raw parse failure 30 to 60%, schema-valid 40 to 70%; B parse failure under 10%; C and D 0% failures and 100% valid; constraint within 5 points of unconstrained accuracy; few-shot about 250 extra tokens; constraint under 20% wall-time overhead; D field accuracy 70 to 85%.

### Commands

```sh
python3 -m venv /private/tmp/claude-501/outlvenv
/private/tmp/claude-501/outlvenv/bin/pip install outlines==1.3.3 torch==2.7.1 transformers==4.52.4 numpy
cd content/research/100-percent-valid-json-only-1-in-3-answers-right
for arm in instr fewshot instr_o fewshot_o; do /private/tmp/claude-501/outlvenv/bin/python run.py $arm; done
python3 analyze.py > output.txt && python3 inspect_runs.py >> output.txt
```

### Environment

Apple M2, macOS (Darwin 25.5.0), Python 3.12.8, torch 2.7.1 (4 threads), transformers 4.52.4, outlines 1.3.3, Qwen2.5-0.5B-Instruct in float32, greedy decoding, 160 new tokens at most. Load average before the run 15.37 15.87 13.88, after 23.74 22.43 21.82; it spiked to about 90 during arm A. The four arms took 19, 15, 11 and 13 minutes.

### Raw output

Full output in `output.txt`. Excerpts:

```text
arm                            raw JSON parse fails         schema-valid (raw)   schema-valid (fences stripped)
A instruction only             100.0% [96.9, 100.0]          0.0% [-0.0,  3.1]               57.5% [48.6, 66.0]   fenced: 120
B 3-shot                          0.0% [-0.0,  3.1]       100.0% [96.9, 100.0]             100.0% [96.9, 100.0]   fenced: 0
C constrained                     0.0% [-0.0,  3.1]       100.0% [96.9, 100.0]             100.0% [96.9, 100.0]   fenced: 0
D 3-shot + constrained            0.0% [-0.0,  3.1]       100.0% [96.9, 100.0]             100.0% [96.9, 100.0]   fenced: 0
all five right (fences stripped): A 26.7%, B 30.8% [23.3, 39.6], C 29.2% [21.8, 37.8], D 32.5% [24.8, 41.3]
priority right: A 30.0%, B 31.7%, C 30.8%, D 33.3%; "high" answered 120, 118, 118, 114 of 120
prompt tokens 163.4 / 694.4 / 163.4 / 694.4; reply tokens 57.0 / 26.9 / 33.9 / 25.9
C minus A mean field accuracy (stripped): -0.3 [-1.7, +1.0]; C minus B: -3.3 [-5.0, -1.8]; D minus B: +0.5 [0.0, 1.2]
```

### Did the expectation hold?

Partly. Held: B and constrained arms 0% failures and 100% valid; constraint within 5 points of unconstrained (-0.3); D mean field accuracy was 86.0%, just above the guessed 70 to 85%. Missed: A raw parse failure was 100%, not 30 to 60%, because every reply was fenced; few-shot cost +531 tokens, not 250; wall-time overhead of the mask could not be separated from the shorter replies under a varying load (per-token seconds were not higher: A 0.167, C 0.152). Not predicted: priority at chance level in every arm.

Known flaws: a first run with `max_new_tokens` 96 truncated arm A and was discarded after about 10 cases. The hand-written token mask built as the fallback ran on 3 cases and was not used for any reported number.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Outlines compiles a schema or regex to a finite-state machine and indexes the vocabulary so generation is guided; model-agnostic | https://arxiv.org/abs/2307.09702 (Willard and Louf, 19 Jul 2023, abstract) | 1 | 2026-11-26 |
| gpt-4o-2024-08-06 reached about 93% schema adherence from training and 100% with constrained decoding; gpt-4-0613 under 40% | https://openai.com/index/introducing-structured-outputs-in-the-api/ (6 Aug 2024) | 1 | 2026-11-26 |
| Demonstrations mainly convey label space, input distribution and format (abstract only read) | https://arxiv.org/abs/2202.12837 | 1 | 2026-11-26 |
| "Significant decline in LLMs reasoning abilities under format restrictions" (abstract only read) | https://arxiv.org/abs/2408.02442 | 1 | 2026-11-26 |
| Qwen2.5-0.5B-Instruct model | https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct | 1 | 2026-11-26 |
| Wilson score interval | https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval | 3 | definitions only |
| Parse, validity, field accuracy, token and time numbers | `output.txt`, `results/raw_*.jsonl` | artifact | 2026-11-26 |
| Always "medium" scores 40%, always "high" 30% | gold counts in `cases.jsonl` (36/48/36) | artifact | 2026-11-26 |
| Counter: format restrictions reduce reasoning accuracy | https://arxiv.org/abs/2408.02442 | 1 | 2026-11-26 |

Primary share: 5 of 9 rows are tier 1 and 2 are the artifact's own measurements.

## From Aditya

Nothing. The post contains no personal history and no first person.

## Outline

Hook (120 valid, priority wrong 69%), stakes, bold thesis. Short version. What was measured (setup, table 1, chart). Which fix breaks less JSON. Does constraining hurt accuracy. Why priority is wrong (table 2). What three examples cost. Where this stops holding (Tam et al.; small templated; timings). Takeaway: report valid and right separately, beat the constant guess.

Diagram: `public/images/blog/valid-json-vs-right-answers.svg`, schema-valid against all-five-right per arm.

## Self-check against the six required things in style.md

1. Thesis in first 150 words: the bold sentence after the stakes paragraph.
2. Artifact: four-arm run, linked in the third paragraph, with raw outputs and a chart.
3. Numbers with their papers: Willard and Louf, OpenAI, Min et al., Tam et al., each with checked date; cost arithmetic at three volumes (1,000, 100,000, 1,000,000 requests) in token counts, with no prices claimed.
4. Links: 12 links in about 1,290 words.
5. Limits: "Where this stops holding", Tam et al. first.
6. Ending that adds: reporting rule, and what result would change the conclusion.

## Open questions

- Does Aditya want a dollar figure for the 531-token cost? It would need a named model and a live price; none was assumed.
- A larger model (1.5B or more) or a priority rubric in the prompt was not run. Both would test whether the ceiling is the model or the prompt.

## Left out

A second example set and example order (`--shots b` exists, not run). A retry-on-failure arm. The hand-written logit mask (worked on 3 cases). Sampling at temperature above zero. A latency breakdown of the mask itself.
