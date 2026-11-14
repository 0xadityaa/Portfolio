# Agent reliability simulation

Artifact for the post `95% Per Step Is a Coin Flip by Step 14`. Standard library only, Python 3.12.

```bash
python3 simulate.py > output.txt                       # about 20 seconds, deterministic (seed 20261114)
python3 make_chart.py ../../../public/images/blog/success-vs-steps-compounding.svg
```

- `simulate.py`: the simulation and the closed-form `p^n` table. Constants at the top (trials, steps, `p`, retry count, persistent share, timeout share, checkpoint interval) are the knobs.
- `output.txt`: the raw output the post quotes.
- `make_chart.py`: draws the diagram.
- `social.md`: cuts for Typefully.

Model: `n` sequential steps, one model call per attempt, each attempt succeeds with probability `p`, failures are detected immediately. Retry and resume strategies are capped at `3n` calls. Calls per completed task is total calls divided by completed tasks, so failed runs count against a strategy.
