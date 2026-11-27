---
title: Is Your LLM Judge Guessing?
publishedAt: '2027-01-04'
summary: >-
  A 0.5B judge picked answer A on all 825 MT-Bench pairs, in both orders. Subtracting the two orders lifts agreement with humans from 51% to 63%.
tags:
  - ai
  - evals
  - llm
draft: true
---

Qwen2.5-0.5B picked answer A on 825 of 825 MT-Bench pairs. Then I swapped the two answers and it picked A on 825 of 825 again.

So is a small model judging anything, or just reading the slot labels? If you grade outputs with an LLM judge, and especially a cheap one, you're betting your numbers on the answer.

**A small judge's verdict mostly tells you which slot an answer sat in. Run every pair in both orders and subtract the margins and a real signal appears, but at 0.5B a rule that picks the longer answer still beats it, and at 1.5B the signal is mostly length.**

## The short version

- The 0.5B judge picked slot A in 100% of verdicts across 825 pairs, so its one-order agreement with humans was 51.4% (95% interval 48.5 to 54.5), the same as a coin.
- Subtracting the two orders' margins got it to 63.2% (59.5 to 66.8). "Pick the longer answer" scored 73.2%, and two humans agree 82.6% of the time.
- The 1.5B judge flipped the other way: slot B in 71% of verdicts, and the same slot in both orders on 60% of 100 pairs. Its two-order agreement was 73.1% (63.0 to 82.7).
- That 1.5B margin tracks answer length with a correlation of 0.77, and the longer answer wins it in 84% of pairs.

## How did I score a judge without generating a word?

I used [`lmsys/mt_bench_human_judgments`](https://huggingface.co/datasets/lmsys/mt_bench_human_judgments), the human votes behind the [MT-Bench paper](https://arxiv.org/abs/2306.05685). It's ungated and licensed cc-by-4.0. Each row is one human picking the better of two models' answers to a question, or calling a tie.

I kept turn 1 only, so the judge sees one question and two answers. Of 1,204 unique pairs, 961 have at least one non-tie vote. I dropped the 136 whose prompt ran past 1,000 tokens (dropped, not truncated), which left 825 pairs and 1,106 human votes.

The prompt is the MT-Bench pairwise judge instruction, shortened, ending in "reply with a single letter, A or B". I don't let the model write anything. I read the next-token logits for `A` and `B` and take the difference:

$$
m = z_A - z_B
$$

Positive means the judge picked the first slot. Every pair runs twice, once as (model_a, model_b) and once swapped. The code is [`judge.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-llm-judge-guessing/judge.py), the statistics are [`analyze.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-llm-judge-guessing/analyze.py), and the raw margins are in [`raw-0.5b.jsonl`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-llm-judge-guessing/raw-0.5b.jsonl) and [`raw-1.5b.jsonl`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-llm-judge-guessing/raw-1.5b.jsonl).

Agreement counts per human vote. Intervals are 95% bootstraps that resample whole matchups, because the dataset lists 340 of these pairs twice, once per model order, and I didn't want to count them as strangers.

## What did the 0.5B judge say?

The same thing every time. Slot A, 825 times out of 825, in both orders. The smallest margin was 0.18, the median 1.91, and the model put 99.94% of its probability on those two letters, so it followed the format and still didn't look at the answers.

That makes its one-order agreement with humans a tautology. Humans picked the first-listed answer in 51.4% of votes, and a judge that always says "first" agrees 51.4% of the time. Swapped, it drops to 48.6%.

![Horizontal bars of the share of verdicts that pick the first slot: the 0.5B judge picks it in 100% of verdicts in both orders, the 1.5B judge in 25% and 33%.](/images/blog/judge-picks-first-slot.svg "Share of verdicts that pick the first slot, from [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-llm-judge-guessing/output.txt). Qwen2.5-0.5B on 825 pairs, Qwen2.5-1.5B on a seeded subset of 100 pairs.")

Think of a coin that lands heads on every flip. You learn nothing from a flip, and you learn nothing from flipping it a second time with the sides swapped. The coin isn't perfectly constant, though.

## Where is the signal hiding?

In the difference between the two orders. The margin varies from pair to pair even when its sign doesn't: the median gap between the order-1 and order-2 margins is 0.25, sitting on top of an offset of 1.91. Order 2 asks about the swapped slots, so $m_1 - m_2$ is the margin for the first model with the slot preference subtracted out.

$$
s = m_1 - m_2
$$

If $s > 0$, the first model wins. That one subtraction takes the 0.5B judge from 51.4% to **63.2% agreement with humans** (59.5 to 66.8). It's a real signal, because the interval no longer touches 50.

![Horizontal bars of agreement with human votes for the 0.5B judge on 825 pairs: 51.4% from one order, 63.2% from both orders subtracted, 73.2% for picking the longer answer, 82.6% between two humans.](/images/blog/judge-agreement-with-humans.svg "Agreement with human votes, Qwen2.5-0.5B, 825 pairs and 1,106 votes. Human against human uses the 236 pairs with two or more non-tie votes. Intervals and the other baselines are in [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-llm-judge-guessing/output.txt).")

Now the part that stings. A rule with zero parameters, "pick the longer answer by character count", agrees with humans **73.2% of the time** (70.0 to 76.5). The 0.5B judge, even after the fix, loses to `len()`. Two humans agree with each other 82.6% (77.5 to 87.4), which is the ceiling to compare against.

It isn't just a length detector, though. The subtracted margin picks the longer answer in 63.6% of pairs, and its correlation with the log length ratio is only 0.19. Some of the 63.2% is length. Some of it isn't. I can't tell you how much from this data.

If you've read [Is Exact Match Lying?](/blog/exact-match-would-fail-the-humans-too), the move is the same: score the humans against each other first, so you know what "good" can even look like.

## Does a bigger judge fix it?

It fixes the wrong thing. I ran Qwen2.5-1.5B on a seeded random subset of 100 pairs (134 votes), which is as many as the machine's load allowed. It does look at the answers, and it picks slot B in 71% of verdicts. The bias moved from the first slot to the second, and it's no smaller.

Flip rate is the share of pairs where the verdict changes when only the order changes, which is the same as picking the same slot twice. It was **60.0%** (50.5 to 69.7). If the two orders were independent, with $p_1$ and $p_2$ the share of verdicts that pick slot A in each order, you'd expect

$$
p_1 p_2 + (1 - p_1)(1 - p_2) = 0.25 \times 0.33 + 0.75 \times 0.67 = 58.5\%
$$

so 60% observed is what independent coin flips with a slot preference would give. The 1.5B judge doesn't keep its verdict when you swap the answers. In 51 of the 60 flips it chose B both times.

| Judge | Pairs | One order | Both orders | Longer answer | Picks slot A |
| --- | --- | --- | --- | --- | --- |
| 0.5B | 825 | 51.4% (48.5, 54.5) | 63.2% (59.5, 66.8) | 73.2% (70.0, 76.5) | 100% |
| 0.5B, same 100 | 100 | 53.0% (43.1, 63.2) | 64.9% (55.0, 74.0) | 68.7% (58.5, 78.7) | 100% |
| 1.5B | 100 | 48.5% (38.5, 58.8) | 73.1% (63.0, 82.7) | 68.7% (58.3, 78.6) | 29% |

"One order" is the original order. The 1.5B judge's swapped order scored 64.2%, so the single-order number swings 16 points on nothing but where the answers sit. On the same 100 pairs the two judges' both-order intervals overlap, so I can't claim 1.5B beats 0.5B. I can claim its margin follows length: correlation 0.77, and the longer answer wins in 84% of pairs.

## What do you do about it?

First, run every pair both ways and print the share of verdicts that pick slot A and the share that keep the same slot, before you look at a single score. If one slot wins nearly every time, you're holding a position detector. It costs two forward passes instead of one.

Second, don't throw away the flips. Keeping only the pairs where the 1.5B judge gave the same model both times scored 65.5% (48.1 to 83.3) and discarded 60 of the 100 pairs. Averaging the margins kept every pair and scored 73.1%.

Third, if you can only afford one pass, re-centre the margin on its own median, which needs no human labels. For the 1.5B judge that single pass scored 71.6% (62.6 to 79.7), close to the 73.1% from two passes. For the 0.5B judge it did nothing (51.1%), because its signal lives in the difference between orders, not in the offset.

Fourth, put the length rule next to every judge you run. It costs nothing, and it tells you whether the judge is earning its compute. Intervals this wide are the same problem as in [Is Your Eval Too Small?](/blog/your-eval-set-is-too-small-to-tell), so report them.

## Where I'd stop trusting this post

**Two small models and one prompt.** Zheng et al. report that GPT-4 [matches human preferences at over 80% agreement](https://arxiv.org/abs/2306.05685) (from their abstract), and Shi et al. find that [position bias varies by judge and task and depends strongly on the quality gap](https://arxiv.org/abs/2406.07791) between answers. A frontier judge, a different prompt or a verdict after a written explanation could behave nothing like a 0.5B model reading a one-letter instruction. Wang et al. showed that [simply changing the order of candidate responses can change the ranking](https://arxiv.org/abs/2305.17926), which is the same effect at the other end of the size range.

**The 1.5B result is 100 pairs.** The intervals are about 20 points wide, the consistent-only number rests on 40 pairs, and 1.5B against 0.5B is not a significant difference.

**The length rule is a property of this dataset.** MT-Bench pairs mix strong and weak models, and humans often prefer the longer reply. On a set where answers have equal length, or where long means padded, "pick the longer one" falls apart. The 136 pairs I dropped for length are the longest ones, so they're missing here.

**Not covered:** ties, turn 2, explanation-first judging, prompt variants, and any model above 1.5B.

## The takeaway

Before you trust a judge, run each pair in both orders and count how often it picks the same slot. Near 100% means the verdict is the slot. Then subtract the margins and compare against "pick the longer answer". If the judge can't beat `len()`, it's guessing with extra steps.

If someone shows me a small judge that beats the length rule on these human votes from a single order, I'll happily eat my words. Until then, swap the answers.
