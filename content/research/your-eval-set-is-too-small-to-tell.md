# Your Eval Set Is Too Small to Tell

- Topic issue: none (series topic from the AI-engineering syllabus; the syllabus site was used as a topic list only)
- Format: essay
- Thesis: A 50 to 100 example eval cannot tell a 3-point improvement from noise, and scoring both systems on the same examples and comparing them in pairs is the cheapest fix.
- Reader: an engineer who compares two prompts or models on a small eval set and reads the difference as a result. Knows what accuracy is, may not know what a confidence interval or McNemar's test is.

## What this adds

Prior art on the statistics is strong. Evan Miller's [Adding error bars to evals](https://arxiv.org/abs/2411.00640) covers standard errors, paired differences, clustering, and power for evals. Hamel Husain's [Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) and [A Field Guide to Rapidly Improving AI Products](https://hamel.dev/blog/posts/field-guide/) cover eval practice and error analysis, and argue against chasing generic metrics. McNemar's [1947 note](https://doi.org/10.1007/BF02295996) is the original paired test for proportions.

What this post adds: a reproducible simulation with the numbers at the sizes people actually use (25 to 1,000), showing how often the better system loses or ties, how wide the interval is, and one table of examples needed for 2, 3, 5, and 10 point gaps at three pairing strengths. It reads the paper's advice as a decision rule for the moment of choosing between two candidates.

## Artifact

`content/research/your-eval-set-is-too-small-to-tell/`: `simulate.py` (NumPy, seeded), `output.txt` (raw output), `results.json`, `README.md`, `EXPECTATION.txt`, `social.md`.

### Expectation, written before running

(Also saved as `EXPECTATION.txt`, written before the first run.) For 80% vs 83% at n = 100, independent outcomes: the better system scores higher about 70% of the time, interval about 21 points wide, interval excludes zero about 10% of the time. With outcome correlation 0.5 and paired analysis: interval about 15 points, a third narrower. At 80% power for 3 points: about 2,600 per system unpaired, about 1,300 paired. Hunch: the size of the gap to detect, not pairing, dominates.

### Commands

```sh
python3 -m venv /private/tmp/claude-501/evalvenv
/private/tmp/claude-501/evalvenv/bin/pip install numpy
cd content/research/your-eval-set-is-too-small-to-tell
/private/tmp/claude-501/evalvenv/bin/python -u simulate.py > output.txt
```

### Environment

Apple M2, macOS (Darwin 25.5.0), Python 3.12.8, NumPy 2.5.4, seed 20261114, 5,000 simulated evals per table cell, 1,000 bootstrap resamples per eval, 20,000 simulated evals per point in the sample-size search. Runtime about 3.5 minutes. The virtualenv is outside the repo.

### Raw output

The full output is in `content/research/your-eval-set-is-too-small-to-tell/output.txt`. Headline excerpts:

```text
=== TRUE 83% vs 80% (gap 3 points), phi = 0.5 for paired ===
    n |  IND win    tie   lose  CI w    sig | PAIRED-DATA win    tie   lose | CIw unp CIw pair narrower | sig unp sig pair sig McN
   25 |    53.7%  13.9%  32.5%  41.4   4.2% |           53.2%  20.5%  26.4% |    41.3     28.2    31.7% |    1.0%     5.0%    4.9%
  100 |    67.9%   6.1%  25.9%  21.2   6.9% |           73.8%   7.8%  18.4% |    21.1     14.9    29.5% |    2.2%    11.1%   11.7%
 1000 |    95.5%   0.5%   3.9%   6.8  40.4% |           99.3%   0.1%   0.6% |     6.8      4.8    29.3% |   36.3%    67.8%   68.5%

true gap |  phi | unpaired sim  analytic | paired sim  analytic |  saving
     3pt |  0.5 |         2712      2626 |       1352      1316 |   50.1%
    10pt |  0.5 |          202       197 |        101       103 |   50.0%
```

### Did the expectation hold?

Mostly. At n = 100, independent: wins 67.9% (expected about 70%), CI width 21.2 (expected 21), CI excluded zero 6.9% (expected about 10%, so I was too generous). Paired CI width 14.9 (expected 15). Sample size for 3 points at 80% power: 2,712 unpaired and 1,352 paired (expected 2,600 and 1,300; the simulation sits about 3% above the formula, consistent with a discrete-count test). The hunch that the gap dominates held: halving the gap roughly quadruples n (10 points: 202, 5 points: 933), while pairing at correlation 0.5 halves it at every gap.

One thing that surprised me: analysing correlated data while ignoring the pairing is worse than analysing independent data (CI above zero 2.2% vs 6.9% at n = 100), because the interval is wider than it needs to be and the test becomes conservative.

Known flaws in the run: an earlier run crashed on the last row of the sample-size table because a correlation of 0.7 is impossible for 90% vs 80% (the Frechet bound). I added a guard that prints "not possible" and reran with the same seed; every other number was identical.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Miller: evals are experiments, questions are a draw from a super-population; paper covers comparing two models and planning an eval | https://arxiv.org/abs/2411.00640 (arXiv:2411.00640, 1 Nov 2024, Evan Miller) | 1 | 2026-11-14 |
| Paired standard error uses per-question differences and is smaller when scores are positively correlated (section 4.2); worked example of correlation 0.5 | https://arxiv.org/html/2411.00640 | 1 | 2026-11-14 |
| Sample size n = (z_a/2 + z_b)^2 (w^2 + s_A^2/K_A + s_B^2/K_B) / d^2; worked example lands at about 969 questions for a 3-point difference at 80% power, and the paper suggests at least about 1,000 questions for a new eval (section 5) | https://arxiv.org/html/2411.00640 | 1 | 2026-11-14 |
| Clustered SE can be much larger than naive: DROP 1.34 vs 0.44 (ratio 3.05) in Miller's Table 4 | https://arxiv.org/html/2411.00640 | 1 | 2026-11-14 |
| McNemar statistic (b - c)^2 / (b + c) on discordant pairs; exact binomial variant for small b + c | https://en.wikipedia.org/wiki/McNemar%27s_test | 3 | 2026-11-14 |
| McNemar 1947, "Note on the sampling error of the difference between correlated proportions or percentages", Psychometrika 12(2), 153-157 | https://doi.org/10.1007/BF02295996 | 1 | 2026-11-14 |
| Hamel: error analysis is the highest-return activity; generic metrics can create false confidence; binary pass/fail with critiques; no statistical-significance discussion | https://hamel.dev/blog/posts/field-guide/ (24 Mar 2025) | 2 | 2026-11-14 |
| Hamel: keep reading logs until you stop learning anything new; binary labels easier than granular scores | https://hamel.dev/blog/posts/evals/ (29 Mar 2024) | 2 | 2026-11-14 |
| Win/tie/lose rates, CI widths, share of evals with CI above zero, McNemar power, sample-size table | simulate.py, output.txt | artifact | 2026-11-14 |
| Simulated sample sizes agree with the normal-approximation formula within about 5% (3 points: 2,712 vs 2,626) | output.txt, formula as in Miller section 5 | artifact | 2026-11-14 |
| Outcome correlation 0.5 is a typical-looking value | Assumption: Miller uses 0.5 in a made-up example. No measured value. | assumption | 2026-11-14 |
| Counter: early on, reading outputs and error analysis beat chasing a metric | https://hamel.dev/blog/posts/field-guide/ | 2 | 2026-11-14 |
| Wikipedia pages linked for definitions only (bootstrap, power of a test): no numbers taken from them | https://en.wikipedia.org/wiki/Bootstrapping_(statistics), https://en.wikipedia.org/wiki/Power_of_a_test | 3 | not fetched; definitions only |

Primary share: of the 11 rows that carry a factual claim, 5 cite tier 1 sources and 3 are the artifact's own measurements, which are tier 1 for this post. Hamel (2 rows) is tier 2. One row is a labelled assumption. The McNemar formula row is tier 3 (Wikipedia) but is backed by the tier 1 McNemar 1947 row.

## From Aditya

Nothing yet. The post contains no first-person past-tense experience. It opens on a labelled thought experiment and says "I simulated", which is true of the artifact.

## Outline

Thesis in the first 150 words (opening plus claim). "The short version" bullets. Then:

1. How often does the better system win on 100 examples? The unpaired table (win, tie, lose, CI width) and the 5- and 10-point numbers. Diagram: share of evals whose CI excludes zero against eval size, unpaired vs paired, with the 80% line and the 100-example point highlighted.
2. What does pairing change? Mechanism (shared difficulty cancels), McNemar in two sentences, the paired table, the sensitivity to correlation (17%, 30%, 46% narrower).
3. How many examples do I need? The power table and the check against the formula.
4. Where I'd stop trusting this post: Hamel's counter-argument steelmanned (largely right early on), where the advice applies (choosing between two candidates on a number), binary only, LLM-judge noise, clustering, representativeness, what was not tested.
5. The takeaway: decision rule (look up the gap, compare against n, otherwise read outputs; pair the comparison), and what would change my mind.

## Self-check against the six required things in style.md

1. Thesis in first 150 words: the "claim I'll defend" paragraph after the opening, a sentence an engineer could dispute.
2. Artifact: the NumPy simulation, `simulate.py` with raw output, linked in the second paragraph; tables are its output; one SVG diagram.
3. Numbers with their papers: Miller's figures and McNemar's formula are linked with checked dates in the table above; all other numbers come from the artifact and say so. No cost claims, so no three-volume arithmetic (the sample-size table gives four gaps and three correlations instead).
4. Links: 10 distinct external links in about 1,900 words (checker passes).
5. Limits: "Where I'd stop trusting this post": Hamel's objection steelmanned with link, where the advice applies, binary-only, judge noise, clustering, representativeness, what was not tested.
6. An ending that adds: decision rule plus what would change my mind.

## Open questions

- Does Aditya have a real eval (his own or a public one) with two systems scored on the same examples, so the correlation can be measured and the 0.5 assumption replaced or confirmed? Not needed to publish; it would strengthen a follow-up.
- Is he comfortable with the opening staying a thought experiment, or does he have a real "score went from X to Y on N examples" moment he can tell?
- Should the post mention Hivemind's benchmark? Only if he says what its eval size was; nothing was assumed.

## Left out

Resampling each question K times (Miller section 3) and scoring next-token probabilities to cut variance. Exact McNemar for small discordant counts. Multiple-comparison problems when trying many prompt variants (testing ten tweaks on one eval set makes false wins likely). Continuous and rubric metrics. A follow-up measuring correlation on a real eval.
