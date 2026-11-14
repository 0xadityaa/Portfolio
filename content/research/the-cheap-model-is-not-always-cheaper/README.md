# Cost per useful answer: calculator and cascade simulation

Artifact for the post `content/blog/the-cheap-model-is-not-always-cheaper.md`.

Standard library only, Python 3.12.8 (any Python 3.8+ should do). No virtualenv, no downloads, no network at run time.

## Files

- `prices.json`: per-million-token prices copied from the live pricing pages on 2026-11-14, with each source URL.
- `cost_model.py`: the calculator, the break-even solver, the cascade (closed form and seeded Monte Carlo), the leak and hard-case sweeps, and the volume tables.
- `output.txt`: the raw output of `cost_model.py`.
- `make_chart.py`: draws the SVG chart for the post.
- `EXPECTATION.txt`: what I expected, written before the first run.
- `social.md`: cuts for Typefully.

## Commands

From this folder:

```bash
python3 cost_model.py > output.txt
python3 make_chart.py ../../../public/images/blog/cost-per-useful-answer.svg
xmllint --noout ../../../public/images/blog/cost-per-useful-answer.svg
```

The seed is 20261114, 200,000 tasks per Monte Carlo row.

## What is a price and what is an assumption

Prices (`prices.json`) are facts as of 2026-11-14 and will drift. Everything else is an assumption the script sweeps:

- success rate of the cheap model (0.50 to 0.95) and the expensive model (0.95, and 0.99 in one table)
- the cost `F` of a delivered wrong answer ($0 to $5)
- verifier true-positive rate (0.95) and leak, the chance it passes a wrong answer (0 to 1)
- the expensive model's success rate on escalated tasks (0.95 down to 0.50 in one table)

Request shape: 3,000 input and 500 output tokens. Verifier call: 3,500 in and 100 out, priced as a call to the cheap model.

To use your own numbers, edit `prices.json` and the constants near the top of `cost_model.py` (`S_E`, `S_C`, `T_PASS`, the token counts).

## Modelling choices that favour the post's thesis

- Single models have no check: every wrong answer is delivered and costs `F`. The cascade gets a verifier, which is a second opinion the single models do not get.
- Verifier errors are independent of the task. Real verifiers probably fail on the same hard cases as the cheap model.
- Escalated tasks default to the expensive model's average success. Section 7 of the output shows what happens when they are harder.

## Tables moved out of the post

All numbers are from `output.txt`. Prices as of 2026-11-14; success rates and failure costs are swept assumptions.

### Request prices (3,000 in, 500 out)

| Model | Input $/MTok | Output $/MTok | One request |
| --- | --- | --- | --- |
| Claude Haiku 5.5 | 0.10 | 0.50 | $0.00055 |
| Claude Opus 5.5 | 4.00 | 20.00 | $0.022 |
| gpt-5.4-mini | 0.75 | 4.50 | $0.0045 |
| gpt-5.4 | 2.50 | 15.00 | $0.015 |

### Break-even failure cost F*, expensive model held at 95%

```text
F* = (c_exp / s_exp - c_cheap / s_cheap) / (1 / s_cheap - 1 / s_exp)
```

| Cheap model right | Claude pair | OpenAI pair |
| --- | --- | --- |
| 60% | $0.036 | $0.013 |
| 80% | $0.114 | $0.051 |
| 90% | $0.386 | $0.184 |
| 94% | $2.02 | $0.982 |
| 95% | never | never |

### Cost per useful answer, cascade with leak 0.10

| Cost of a wrong answer | Cheap alone | Expensive alone | Cascade |
| --- | --- | --- | --- |
| $0.05 | $0.013 | $0.026 | $0.0076 |
| $0.25 | $0.063 | $0.036 | $0.014 |
| $1 | $0.251 | $0.076 | $0.038 |
| $5 | $1.25 | $0.286 | $0.166 |

The cheap model alone is cheapest only up to $0.025. Above that the cascade wins to $5.

### Volume, wrong answer costs $0.25 (spend plus failure cost, not an invoice)

| Useful answers | Cheap alone | Expensive alone | Cascade |
| --- | --- | --- | --- |
| 10,000 | $632 | $363 | $140 |
| 1,000,000 | $63,188 | $36,316 | $13,973 |
| 100,000,000 | $6.3M | $3.6M | $1.4M |
