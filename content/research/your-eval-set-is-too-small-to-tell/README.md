# Eval-size simulation

The artifact behind the post "Your Eval Set Is Too Small to Tell". A seeded NumPy simulation of two systems with known true accuracy, compared on eval sets of 25 to 1,000 examples, with unpaired and paired analysis, plus a sample-size table.

## Run it

The virtualenv lives outside the repo.

```sh
python3 -m venv /private/tmp/claude-501/evalvenv
/private/tmp/claude-501/evalvenv/bin/pip install numpy
cd content/research/your-eval-set-is-too-small-to-tell
/private/tmp/claude-501/evalvenv/bin/python simulate.py > output.txt
```

Seed `20261114`, NumPy 2.5.4, Python 3.12.8. It takes a few minutes on an Apple M2 (the 160-point sample-size search is the slow part). It writes `results.json` next to the script and prints the same numbers.

## Files

- `EXPECTATION.txt`: what I expected, written before the first run.
- `simulate.py`: the simulation. Only dependency is NumPy.
- `output.txt`: raw output of the run quoted in the post.
- `results.json`: the same numbers in machine-readable form.
- `social.md`: social cuts for Typefully.

## What it does

1. True accuracy is 80% for system B and 80% + gap for system A (gap 3, 5, 10 points).
2. For each eval size it simulates 5,000 evals and records whether the better system showed a higher, equal, or lower score, and the width of the 95% percentile bootstrap CI (1,000 resamples) of the difference.
3. "Independent": outcomes of the two systems are independent. "Paired data": same examples, outcomes correlated at phi = 0.5 (phi is the correlation of the two 0/1 outcomes; 0.3 and 0.7 are in the sensitivity run). This is an assumption, not a measurement of any real eval.
4. The correlated data is analysed twice: ignoring the pairing (each system resampled on its own), and with the paired bootstrap and McNemar's test (chi-square without continuity correction, one-sided to the better system in the observed direction).
5. The sample-size table finds the smallest n reaching 80% power at a two-sided 5% level, and checks the simulation against the normal-approximation formula.

## Limits of the simulation

Binary right/wrong scores only. Examples are exchangeable draws, so there is no clustering and no LLM-judge noise. Those only make real evals noisier than this.
