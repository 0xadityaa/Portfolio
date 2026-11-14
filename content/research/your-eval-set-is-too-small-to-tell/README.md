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

## Tables cut from the post

Outcomes by eval size, true 83% against 80%, independent samples (5,000 runs each):

| Examples | A scores higher | Tie | A scores lower | 95% CI width of A minus B |
| --- | --- | --- | --- | --- |
| 25 | 53.7% | 13.9% | 32.5% | 41.4 points |
| 50 | 59.7% | 9.3% | 31.0% | 29.7 points |
| 100 | 67.9% | 6.1% | 25.9% | 21.2 points |
| 200 | 75.6% | 3.5% | 20.9% | 15.1 points |
| 500 | 88.0% | 1.4% | 10.6% | 9.6 points |
| 1,000 | 95.5% | 0.5% | 3.9% | 6.8 points |

Same 83 against 80, same examples for both systems (correlation 0.5), analysed unpaired and paired:

| Examples | CI width, unpaired | CI width, paired | Narrower by | CI above zero, unpaired | CI above zero, paired | McNemar |
| --- | --- | --- | --- | --- | --- | --- |
| 50 | 29.7 | 20.7 | 30% | 1.1% | 7.2% | 6.9% |
| 100 | 21.1 | 14.9 | 30% | 2.2% | 11.1% | 11.7% |
| 200 | 15.1 | 10.6 | 30% | 4.1% | 17.4% | 19.1% |
| 500 | 9.6 | 6.8 | 29% | 13.7% | 38.8% | 40.1% |
| 1,000 | 6.8 | 4.8 | 29% | 36.3% | 67.8% | 68.5% |

Ignoring the pairing on correlated data is worse than the independent case (2.2% against 6.9% at 100 examples): the interval comes out too wide, so the test is too timid.
