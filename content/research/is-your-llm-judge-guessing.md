# Is Your LLM Judge Guessing?

- Topic issue: none (series post #13, backlog order 4, topic M4 L3 "model as judge")
- Format: essay
- Thesis: a small LLM judge's verdict mostly tells you which slot an answer sat in; scoring both orders and subtracting the margins recovers a real but modest signal that a "pick the longer answer" rule still matches or beats
- Reader: an engineer who grades model outputs with an LLM judge, usually a cheap one, and has never swapped the answer order

## What this adds

- Zheng et al., [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685): names position bias and reports strong-judge agreement with humans.
- Wang et al., [Large Language Models are not Fair Evaluators](https://arxiv.org/abs/2305.17926): shows the ranking changes with the order and proposes balanced position calibration.
- Shi et al., [Judging the Judges](https://arxiv.org/abs/2406.07791): 15 judges, three metrics, bias depends on judge, task and quality gap.

They measure large judges on the full benchmark. This post reads the verdict from the `A` and `B` logits of two small local models, so it can show what the verdict is made of: a constant slot preference plus a small margin that carries the signal, and it prices that signal against a length rule.

## Artifact

`content/research/is-your-llm-judge-guessing/`: `judge.py` scores pairs, `analyze.py` computes the statistics, with raw margins, output and run logs. README has the commands, versions, runtime and load readings.

**Expectation (written 2026-11-26, `EXPECTATION.txt`) against the result:**

| Expectation | Result |
| --- | --- |
| 0.5B agreement 55 to 62% in one order | Wrong. 51.4% (48.5, 54.5): the judge answered A on every pair, so agreement equals the share of humans who picked the first answer (51.4%). Two-order 63.2% (59.5, 66.8) |
| 1.5B agreement 60 to 68% | One order 48.5% (38.5, 58.8) and 64.2% (53.9, 74.3) depending on order, two-order 73.1% (63.0, 82.7), on 100 pairs |
| 0.5B picks slot A in 65 to 85% of verdicts | Wrong. 100% in both orders |
| 1.5B picks slot A in 55 to 70% | Wrong direction. 29.0% (22.5, 35.9): it prefers slot B |
| Flip rate 40 to 60% (0.5B), 25 to 45% (1.5B) | 100% (0.5B, same slot every time) and 60.0% (50.5, 69.7) (1.5B) |
| Consistent-only agreement up 2 to 8 points, large data loss | 1.5B 65.5% (48.1, 83.3) on 40 of 100 pairs, below plain averaging (73.1%) |
| Averaging margins beats either order by 1 to 5 points | 0.5B +11.8 over one order, 1.5B +8.9 over its better order |
| Risk: 0.5B at chance, flips measure noise | Held for one order. The two-order margin carries signal |

**Command and environment.** See the README. Python 3.12, torch 2.7.1, transformers 4.52.4, datasets 3.6.0, numpy 2.3.1, fp32, 4 threads, Apple M2 with 16 GB, shared machine (load 14 to 113 during the 0.5B run, 16 to 75 during the 1.5B run). The 0.5B run took 7,690 s.

**Raw output:** `content/research/is-your-llm-judge-guessing/output.txt` and `results.json`.

**Design choices the post states:** turn 1 only; the dataset's turn-1 rows hold the whole two-turn chat, so only the first exchange is shown to the judge; ties dropped; 136 of 961 eligible pairs dropped because the prompt exceeds 1,000 tokens; agreement counted per human vote; bootstrap resamples matchups (655 for 825 pairs) because 340 pairs have their model-swapped mirror in the set; the 1.5B subset is a seeded random 100 of the 825.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| `lmsys/mt_bench_human_judgments` is ungated, cc-by-4.0, `human` split has 3,355 rows | https://huggingface.co/api/datasets/lmsys/mt_bench_human_judgments (revision f7d2896d), dataset card https://huggingface.co/datasets/lmsys/mt_bench_human_judgments | 1 | 2026-11-26 |
| Strong LLM judges reach over 80% agreement with humans, the same level as human-human (abstract) | https://arxiv.org/abs/2306.05685 | 1 | 2026-11-26 |
| Changing the order of candidate responses can change the ranking | https://arxiv.org/abs/2305.17926 | 1 | 2026-11-26 |
| Position bias varies by judge and task, is weakly affected by prompt length and strongly by the quality gap (abstract) | https://arxiv.org/abs/2406.07791 | 1 | 2026-11-26 |
| Qwen2.5-0.5B-Instruct and 1.5B-Instruct weights | https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct, https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct | 1 | 2026-11-26 |
| All agreement, flip, position and baseline numbers | `content/research/is-your-llm-judge-guessing/output.txt` | artifact | 2026-11-27 |
| Counter: GPT-4-class judges are at human level, so small-judge failure says little about the practice | https://arxiv.org/abs/2306.05685 | 1 | 2026-11-26 |

The abstracts were read; the papers' bodies were not, so the post quotes only what the abstracts say.

## From Aditya

Nothing used. The post's first-person statements describe the artifact (what was run and measured) and do not claim any history.

## Outline

1. Opening: 825 of 825, then the bold thesis. Short version with four findings.
2. How the judge was scored without generating (dataset, filters, logit margin formula, order swap, matchup bootstrap, artifact links).
3. What the 0.5B judge said (constant A, agreement equals the human first-answer share). Figure 1: share of verdicts picking the first slot.
4. Where the signal hides (subtract the orders, 63.2%). Figure 2: agreement bars with the coin line, the length rule and the human ceiling.
5. Does a bigger judge fix it (1.5B: slot B, 60% flip vs 58.5% independent, length correlation 0.77). Table.
6. What to do about it: both orders, average rather than discard, one-pass median re-centring, length baseline.
7. Where I'd stop trusting this post, the takeaway.

## Where each required thing is

1. Thesis in the first 150 words: the bold sentence after the first two paragraphs.
2. Artifact: `content/research/is-your-llm-judge-guessing/`, linked in "How did I score a judge without generating a word?" and in both figure captions.
3. Numbers with sources: every number is from `output.txt`; outside claims link their arXiv abstracts.
4. Links: 14 external or repo links.
5. Where this stops holding: "Where I'd stop trusting this post".
6. Ending that adds: "The takeaway" gives the decision rule and what would change the conclusion.

## Open questions

None for drafting. For review: the title is a question (5 words); the findings that contradict the expectation (A in 100% of verdicts, the 1.5B judge preferring slot B) are stated in the post as results.

## Left out

- Per-confidence-tercile flip rates (68%, 55%, 58% for the 1.5B judge; no clear trend at n=33 each).
- Judge accuracy by which model pair was compared, and by human-vote unanimity.
- Prompt variants (explanation first, "[[A]]" format) and models above 1.5B.
