# Agent reliability simulation

The simulation behind my post `95% Per Step Is a Coin Flip by Step 14`. Standard library only, Python 3.12.

## Set up

Python 3.12 (I tested on 3.12.8). Standard library only: no virtualenv, no `pip install`.

```bash
git clone https://github.com/0xadityaa/Portfolio.git
cd Portfolio/content/research/95-percent-per-step-is-a-coin-flip-by-step-14
python3 --version   # 3.12 or newer
```

## Data and weights

None. I use no dataset and no model: every step is a seeded coin flip.

## Run

```bash
python3 simulate.py > output.txt                                              # seed 20261114
python3 make_chart.py ../../../public/images/blog/success-vs-steps-compounding.svg
```

## How long it takes

`simulate.py` takes about 20 seconds on one CPU core (23 s measured on an arm64 macOS laptop). `make_chart.py` takes under a second. The output is deterministic: a rerun matches the committed `output.txt` and the committed SVG byte for byte.

## Files

- `simulate.py`: the simulation and the closed-form `p^n` table. Constants at the top (trials, steps, `p`, retry count, persistent share, timeout share, checkpoint interval) are the knobs.
- `output.txt`: the raw output the post quotes.
- `make_chart.py`: draws my diagram.
- `social.md`: the post's X and Substack cuts.

My model: `n` sequential steps, one model call per attempt, each attempt succeeds with probability `p`, failures are detected immediately. Retry and resume strategies are capped at `3n` calls. Calls per completed task is total calls divided by completed tasks, so failed runs count against a strategy.

## Closed form: `p^n`

| Per-step success | 5 steps | 10 steps | 20 steps | 40 steps | Steps until it falls to 50% |
| --- | --- | --- | --- | --- | --- |
| 0.90 | 0.590 | 0.349 | 0.122 | 0.015 | 6.6 |
| 0.95 | 0.774 | 0.599 | 0.358 | 0.129 | 13.5 |
| 0.99 | 0.951 | 0.904 | 0.818 | 0.669 | 69.0 |

The last column is `ln 0.5 / ln p`.

With half the failures persistent, the retry-twice strategy lands near the closed form for an effective per-step success of `p + (1-p) × 0.5 × (1 - (1-p)^2)`.
