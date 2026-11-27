# Does It Know It's Wrong?

- Topic issue: none (series post #15, backlog order 5)
- Format: essay (about 1,600 prose words, two figures, one table)
- Thesis: A small model's probability for its own answer ranks right above wrong (AUROC 0.79 for Qwen2.5-1.5B), and abstaining below 0.225 halves the wrong answers at a 15% cost in right ones, but the number overstates real accuracy, so use it to rank and cut, not to quote.
- Reader: an engineer shipping a model that can answer or say "I don't know" (support bot, RAG answerer, router), who has token log probabilities available.

## What this adds

Prior art: [Kadavath et al., "Language Models (Mostly) Know What They Know"](https://arxiv.org/abs/2207.05221) (larger models, multiple choice and true/false, plus P(True) and P(IK)); [Guo et al., "On Calibration of Modern Neural Networks"](https://arxiv.org/abs/1706.04599) (the ECE definition and the overconfidence finding for classifiers); [Kuhn et al., semantic entropy](https://arxiv.org/abs/2302.09664) (the main counter: token probabilities split across paraphrases). This post adds a free-form, sequence-level measurement on two small open models, with an abstention table a reader can use and a length baseline that shows when "confidence" is mostly "short answer".

## Artifact

Closed-book TriviaQA validation (rc.nocontext, 17,944 questions), a fixed-seed shuffle, answered in order for a 30-minute budget: 112 questions by Qwen2.5-1.5B-Instruct, then the same 112 by Qwen2.5-0.5B-Instruct. Greedy, 16 tokens, bf16, 4 threads, batches of 8. Everything is in [`content/research/does-it-know-its-wrong/`](https://github.com/0xadityaa/Portfolio/tree/main/content/research/does-it-know-its-wrong); commands and runtime in its README.

### Expectation (written before the run, [`EXPECTATION.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/EXPECTATION.txt))

1. Accuracy 30 to 40% for 1.5B, 15 to 25% for 0.5B.
2. AUROC of sequence probability 0.75 to 0.85 for 1.5B; answer length under 0.6.
3. Overconfident, ECE 0.08 to 0.20.
4. The cutoff that halves wrong answers keeps 70 to 80% of right ones.
5. 0.5B less informative than 1.5B by 0.03 to 0.08 AUROC.

### What happened

| Expectation | Result | Held? |
| --- | --- | --- |
| 1.5B accuracy 30 to 40% | 30.4% (22.6 to 39.4), rule grader; 26.8% hand-corrected | Edge of range |
| 0.5B accuracy 15 to 25% | 14.3% (9.0 to 22.0) | Just below |
| AUROC 0.75 to 0.85, length under 0.6 | 0.793 (0.689 to 0.883); length 0.581 | Yes |
| ECE 0.08 to 0.20 | 0.126 (0.101 to 0.221) | Yes |
| Halving wrong keeps 70 to 80% of right | 85.3% (71.4 to 96.7); split-half 84.5% | No, better |
| 0.5B AUROC lower by 0.03 to 0.08 | 0.790 vs 0.793; but length baseline 0.754 and confidence adds 0.037 (-0.087 to 0.166) | No |

### Environment and raw output

Python 3.12.8, torch 2.7.1, transformers 4.52.4, numpy 2.2.6, macOS (Darwin 25.5.0), 8 cores, 4 threads used, 16 GB RAM shared with other jobs. Load average before the run 14.45, after 97.82 ([`uptime_before_run.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/uptime_before_run.txt), [`uptime_after_run.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/uptime_after_run.txt)). Raw output: [`analysis.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/analysis.txt). A first float32 attempt stalled on swap and was abandoned with no results used.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| TriviaQA has 95K question-answer pairs by trivia enthusiasts | https://arxiv.org/abs/1705.03551 | 1 | 2026-11-27 |
| The closed-book config is `rc.nocontext`; validation has 17,944 questions | https://huggingface.co/datasets/mandarjoshi/trivia_qa (counted from the parquet file) | 1 | 2026-11-27 |
| Qwen2.5-1.5B-Instruct and 0.5B-Instruct are open-weight instruct models | https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct | 1 | 2026-11-27 |
| Larger models are well-calibrated on diverse multiple choice and true/false questions (abstract, quoted) | https://arxiv.org/abs/2207.05221 | 1 | 2026-11-27 |
| Modern neural networks are poorly calibrated; ECE as the measure (abstract read only) | https://arxiv.org/abs/1706.04599 | 1 | 2026-11-27 |
| Selective classification trades coverage for reliability (abstract read only) | https://arxiv.org/abs/1705.08500 | 1 | 2026-11-27 |
| Counter: semantic equivalence makes sentence-level uncertainty hard; semantic entropy predicts accuracy better than baselines (abstract read only) | https://arxiv.org/abs/2302.09664 | 1 | 2026-11-27 |
| The token-F1 rule (at least 0.5) and its cost in false passes | [`exact-match-would-fail-the-humans-too`](https://github.com/0xadityaa/Portfolio/blob/post/exact-match-would-fail-the-humans-too/content/blog/exact-match-would-fail-the-humans-too.md), branch `post/exact-match-would-fail-the-humans-too` | own | 2026-11-27 |
| Every measured number | [`analysis.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/analysis.txt) | artifact | 2026-11-27 |

## From Aditya

Nothing needed. The post uses first person only for what the run did.

## Outline

Open on the 9-of-11 and 3-of-26 split. Bold thesis. Short version. How it was measured (formula for the answer probability, grading with the F1 rule and the 8 hand-read passes). Does it separate right from wrong (AUROC, length baseline, grader sensitivity). Is it a real probability (ECE formula, figure 1). What abstaining buys (figure 2, cutoff table, split-half check). Does a smaller model know less (0.5B, length baseline). Limits. Takeaway.

Figures: `calibration-bands.svg` (share right by confidence band, with the mean stated probability as a tick; clay marks the top band); `abstain-keeps-right.svg` (right kept against wrong given as the cutoff moves; clay marks the halving cutoff).

### Where each of the six required things is

1. Thesis in the first 150 words: the bold paragraph after the opening.
2. Artifact: the run in [`content/research/does-it-know-its-wrong/`](https://github.com/0xadityaa/Portfolio/tree/main/content/research/does-it-know-its-wrong), two figures, the cutoff table.
3. Numbers with their papers: dataset, models and papers linked at first mention; checked 2026-11-27. The post has no cost claims.
4. Links as the evidence trail: every dataset, model, paper and script is linked at first mention.
5. Limits: "Where I'd stop trusting this post" (semantic entropy objection first, then sample size, my own grading, task scope).
6. Ending that adds: the takeaway gives the rule, a 100-question test, what would change the conclusion, and what to measure next.

## Open questions

None. The experiment is the author's own run, nothing biographical.

## Left out

- A P(True) style self-check (ask the model whether its answer is right), as in Kadavath et al., which needs a second forward pass per question.
- Semantic entropy by sampling several answers per question and clustering them.
- Cascade routing from the 0.5B to the 1.5B by confidence (backlog item NEW-B), which this result makes worth measuring.
- Natural Questions as a second dataset.
