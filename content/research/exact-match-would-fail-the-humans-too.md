# Research note: Exact Match Would Fail the Humans Too

- Topic issue: none (series post 14, planned for Tue 23 February)
- Format: essay
- Thesis: how you score against a reference decides what "accuracy" means: exact match fails one correct human answer in five, the softer metrics that fix it let through near-miss wrong answers, so pick the metric by the failure you can least afford.
- Reader: an engineer who scores model answers against references (QA, RAG, extraction), has used exact match or F1, and may be tempted to swap in embedding similarity.

Written 2026-11-15.

## What this adds

The strongest existing work on the topic:

- Rajpurkar, Zhang, Lopyrev and Liang, [SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) (2016): defines EM and F1 for SQuAD, and scores humans by treating the second answer as the prediction. It notes mismatches come mostly from non-essential phrases.
- Bulian et al., [Tomayto, Tomahto. Beyond Token-level Answer Equivalence for Question Answering Evaluation](https://arxiv.org/abs/2202.07654) (2022): 23k human judgments on SQuAD candidates; limits of F1; a learned BERT matching measure.
- Zhang et al., [BERTScore](https://arxiv.org/abs/1904.09675) (2019): contextual-embedding similarity as a metric, with an adversarial paraphrase test (abstract only read).

What this post adds: one reproducible measurement on one public set, putting the strictness cost (human answers marked wrong) and the leniency cost (hand-written near-miss answers passed) for EM, F1 and embedding cosine on the same chart, with the hand-written set committed so anyone can add to it.

## Artifact

`content/research/exact-match-would-fail-the-humans-too/`. SQuAD v1.1 dev, leave-one-out human-vs-human scoring with EM, F1 (official normalisation) and bge-small cosine; 100 hand-written adversarial wrong answers; a random-mismatch control; a 50-item hand-check of EM failures; threshold sweeps.

### Expectation, written before running

From `EXPECTATION.txt` (written before any scoring ran):

1. EM fails about 20% of correct human answers (17 to 23%).
2. F1 at 0.5 fails about 7%; at 0.8 about 13%.
3. Cosine at 0.80 fails under 3%; 0.85 about 5%; 0.90 about 12%.
4. On the adversarial set EM passes 0%; F1 at 0.5 about 40%; cosine at 0.85 over 70% and at 0.90 over 40%.
5. No single cosine threshold gets both error rates under 10%.
6. Of 50 hand-read EM failures, 60% or more are extra words or formatting; under 15% genuine disagreement.
7. Control (random other-question answer): cosine at 0.80 lets through about 10%; EM and F1 about 0%.

### Commands

See the artifact `README.md`. In short:

```bash
$WORK/venv/bin/python $R/run.py $WORK/data/dev-v1.1.json $R/adversarial.jsonl $WORK/cache $R/results
$WORK/venv/bin/python $R/analyze.py $R/adversarial.jsonl $R/results
$WORK/venv/bin/python $R/make_chart.py $R/results public/images/blog/exact-match-vs-wrong-answers.svg
```

### Environment

Apple M2, 8 cores, 16 GB, CPU, 4 torch threads. Python 3.12.8, torch 2.15.0, sentence-transformers 6.3.0, numpy 2.5.4. bge-small-en-v1.5 revision `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a`. `dev-v1.1.json` SHA-256 `95aa6a52d5d6a735563366753ca50492a658031da74f301ac5238b03966972c9` (fetched 2026-11-14 for an earlier post, reused). Seed 20261115.

### Raw output

Full tables: `results/analysis.txt`; log: `results/run.log`. Headline lines:

```text
[loo]   n=34723 mean EM 82.0  mean F1 91.7  mean cos 0.967
[paper] n=10431 mean EM 81.7  mean F1 91.2   (paper, v1.0 dev: 80.3 / 90.5)
leave-one-out, share of correct human answers marked wrong (95% article-cluster CI):
  EM 18.0 [16.3, 20.0]   F1>=0.5 5.6 [4.9, 6.4]   F1>=0.8 13.4 [12.1, 14.7]
  cos>=0.80 5.8   cos>=0.85 8.5   cos>=0.90 11.9 [10.7, 13.0]   cos>=0.95 16.3
one reference at a time (84,310 pairs): EM fails 32.7 [29.5, 35.9]
adversarial (100), passed:  EM 0   F1>=0.5 74   F1>=0.8 23
  cos>=0.80 69   cos>=0.85 55   cos>=0.90 37   cos>=0.95 17
random-mismatch control (10,570): 0.0% passed on every metric
best single threshold: cos 0.96 -> 17.6% human fail, 14% adversarial pass
                       F1  0.90 -> 17.0% human fail, 14% adversarial pass
separation (random correct human outscores random adversarial): cos 0.897, F1 0.870
hand-check of 50 EM failures: extra_words 43, different 4, both_defensible 2, formatting 1
```

### Did the expectation hold?

1. Yes. 18.0%, inside 17 to 23.
2. Roughly. F1 at 0.5 failed 5.6% (I said 7); at 0.8, 13.4% (said 13).
3. Partly. Cosine at 0.80 failed 5.8% (I said under 3, wrong); 0.85 failed 8.5% (said 5, wrong); 0.90 failed 11.9% (said 12, right). Embedding scores for correct-but-shorter answers fall faster than I thought.
4. Mixed. EM 0 as expected. F1 at 0.5 passed 74, far above my 40: a wrong year has no shared token, but most other categories share nearly all of theirs. Cosine at 0.85 passed 55 (I said over 70, wrong) and at 0.90 passed 37 (I said over 40, just under).
5. Held. Best cosine threshold left 17.6% and 14%.
6. Held, more strongly: 43 of 50 extra or missing words (86%), 4 of 50 different (8%).
7. Wrong. The random control passed 0.0% at cosine 0.80, not 10%. Embeddings of unrelated short answers are far apart; the leniency problem is only near misses.

Two things I did not expect and report: all 10 reversed-role answers score F1 = 1.0 (a bag of words ignores order), and cosine rejected all 10 same-type entity swaps ("Lyon" for "Paris") even at 0.80.

Decisions made after seeing results: none changed the headline numbers. I reported the single-reference variant (EM fails 32.7%) because the human items use up to five references against the adversarial items' one; more references make every metric's human failure rate look better than the one-reference case most eval sets have, so the single-reference figure is the fairer one.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| SQuAD v1.1 dev: 10,570 questions, 48 articles, mostly 3 answers per question | `dev-v1.1.json`, counts in `run.log` and README | 1 | 2026-11-15 |
| Dataset page and download | https://rajpurkar.github.io/SQuAD-explorer/ | 1 | 2026-11-15 |
| EM and F1 ignore punctuation and articles; max over ground truths | https://arxiv.org/abs/1606.05250 section 6.1 (PDF read) | 1 | 2026-11-15 |
| Humans scored by taking the second answer as prediction and the rest as truth; 80.3 EM / 90.5 F1 on v1.0 dev | same, section 6.2 and Table 5 | 1 | 2026-11-15 |
| Mismatch "occurs mostly due to inclusion/exclusion of non-essential phrases" | same, section 6.2 | 1 | 2026-11-15 |
| Official v1.1 normalisation (lowercase, strip punctuation, articles, whitespace) | https://github.com/allenai/bi-att-flow/blob/master/squad/evaluate-v1.1.py (header: "Official evaluation script for v1.1"; the explorer page itself links only the v2.0 script) | 1 | 2026-11-15 |
| bge v1.5 scores mostly lie in about 0.6 to 1; suggested thresholds 0.8, 0.85, 0.9 | https://huggingface.co/BAAI/bge-small-en-v1.5 (model card FAQ) | 1 | 2026-11-15 |
| Token-level measures underestimate performance; F1 gives a false impression of graduality; 23k human judgments on SQuAD | https://arxiv.org/abs/2202.07654 (abstract only) | 1 | 2026-11-15 |
| BERTScore claims better human correlation and more robustness on adversarial paraphrases than older metrics | https://arxiv.org/abs/1904.09675 (abstract only) | 1 | 2026-11-15 |
| LLM-based scorers correlate better but are expensive and slow | https://arxiv.org/abs/2402.11161 (abstract only) | 1 | 2026-11-15 |
| Eval-size sampling error | /blog/your-eval-set-is-too-small-to-tell (series post, open PR) | his | |
| All measured numbers (18.0%, 5.6%, 74 of 100, ...) | `results/analysis.txt` | artifact | 2026-11-15 |
| Counter: a stable bias in a strict, cheap metric can be fine for comparing systems | My steelman. Supporting fact: the SQuAD paper ranks systems with EM and F1. I found no source that argues it and did not test ranking preservation | 3 (reasoning) | 2026-11-15 |

## From Aditya

Nothing needed for this post; it contains no personal history.

## Outline

1. Open on 18%, the experiment, and the thesis in bold.
2. The short version (4 bullets).
3. What did I score, and with what? Three metrics, the paper-protocol sanity check (81.7 / 91.2 against 80.3 / 90.5).
4. How many correct answers does each metric fail? Numbers, the 50-item hand-check, the single-reference 32.7%.
5. So just use a softer metric? Adversarial set, the flagged modelling choice, the random control, the diagram (human answers failed against wrong answers passed, per metric and threshold), the per-category table.
6. Is there a threshold that works? Sweep, separation, prior work.
7. Where I'd stop trusting this post: the steelman first, then my wrong answers, one embedding model, 50 is small.
8. The takeaway: strict when wrong answers cost more, softer plus separate checks otherwise; what would change my mind.

Diagram: `public/images/blog/exact-match-vs-wrong-answers.svg`, paired horizontal bars per metric (correct human answers failed vs wrong answers passed). Carries the thesis claim that no setting is low on both.

## The six things in style.md

1. Thesis in first 150 words: bold sentence after the opening paragraphs.
2. Artifact: the scoring run, the committed adversarial set, the hand-check, in the repo folder.
3. Numbers with papers: every number is from `results/analysis.txt`; the paper figures link to arXiv with the 2026-11-15 check recorded here. The post has no cost claims, so no three-volume arithmetic applies.
4. Links as evidence trail: SQuAD paper and dataset, official script, bge-small card, Tomayto Tomahto, BERTScore, the cheap answer-equivalence paper, the eval-size post, the repo folder (more than 5 per 1,000 words).
5. Limits: "Where I'd stop trusting this post" (the steelman first, linked to the sources above and flagged as my reasoning in the note).
6. Ending: decision rule, and what would change my mind (a ranking test on real model outputs).

## Open questions

- None blocking. Optional: Aditya may want to name which of his own evals (if any) score with EM or F1; the post deliberately says nothing about that.

## Left out

- Ranking-preservation test (do EM and F1 order real systems the same as human judges?): needs real model outputs, a good next measurement.
- Including the question in the embedded text, a larger embedding model, and BERTScore proper.
- LLM-as-judge, left for its own post.
