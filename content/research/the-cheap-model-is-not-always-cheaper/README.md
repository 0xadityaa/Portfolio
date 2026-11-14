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
