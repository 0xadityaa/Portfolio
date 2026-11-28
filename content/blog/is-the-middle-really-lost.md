---
title: Is the Middle Really Lost?
publishedAt: '2027-01-14'
summary: >-
  A 0.5B model answered 46.0% of questions right with the evidence in the middle of seven paragraphs and 55.4% with it last. On 74 questions, that is borderline.
tags:
  - ai
  - llm
  - context
  - evals
draft: true
---

With the answer paragraph in the middle of a seven-paragraph prompt, Qwen2.5-0.5B got **46.0%** of 74 questions right. With the same paragraph last, same question, same six distractors in the same order, it got **55.4%**. First place got 51.4%.

That looks like the famous "lost in the middle" effect. It also looks like what you get from 74 coin-flippy questions. Which is it?

I went in expecting recency: end best, start second, middle worst, a spread of 3 to 8 points. **The middle did score lowest, by about 10 points of F1 against either end, but on the metric I fixed in advance the evidence is borderline, and that 10-point dip is about the same size as the damage from simply having six distractors in the prompt.** So the practical order of operations is: cut the context first, then worry about where things sit.

## The short version

- I put one SQuAD answer paragraph at slot 1, 4 or 7 of 7 paragraphs (1,087 to 1,593 tokens) for 74 questions. Correct answers: 51.4% first, 46.0% in the middle, 55.4% last.
- On F1, the middle is 10.4 points below the start and 10.5 below the end, and both intervals exclude zero. On my pre-chosen "answer contains the gold string" metric, middle minus start is -5.4 points with an interval of -15.8 to +5.3.
- Six distractors cost 11.3 points of accuracy against the answer paragraph alone (62.2%). That is as large as the position effect.
- This sample can only reliably detect a paired gap of about 15 points. The planned 144 questions became 74 when the machine got busy.

## How I built the test

I took [SQuAD v1.1](https://rajpurkar.github.io/SQuAD-explorer/) dev questions, three from each of its 48 Wikipedia articles. Each prompt holds seven numbered paragraphs from one article: the one that answers the question, plus six others that contain none of the gold answer strings. The distractors and their order are fixed per question. Only the slot of the answer paragraph changes, so every comparison below is between the same question asked three ways. That pairing is the whole trick, the same one from [Is Your Eval Too Small?](/blog/your-eval-set-is-too-small-to-tell).

The model is [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) on CPU, greedy decoding, up to 16 new tokens. The prompt asks for a short phrase copied from the passages. I also ran the answer paragraph alone as a ceiling, and on 25 questions seven paragraphs with no answer in them as a floor (4.0% right, so the model is not guessing from the question).

A result is "correct" if a normalised gold answer appears in the output, which I wrote down as the primary metric in [`EXPECTATION.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-the-middle-really-lost/EXPECTATION.txt) before running anything. Intervals come from a paired bootstrap that resamples whole articles, 10,000 times. The code is [`run.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-the-middle-really-lost/run.py) and [`analyze.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-the-middle-really-lost/analyze.py), the [README](https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-the-middle-really-lost) has the commands and the load log, and every answer is in [`records.jsonl`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-the-middle-really-lost/results/records.jsonl).

## What the curve looks like

![Bars of the share of questions answered correctly by Qwen2.5-0.5B: 62.2 percent with the answer paragraph alone, 51.4 with it first of seven, 46.0 in the middle, 55.4 last](/images/blog/middle-of-the-context-dip.svg "Qwen2.5-0.5B-Instruct, 74 SQuAD questions, 7 paragraphs, 95% article-cluster bootstrap intervals. From [`analysis.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-the-middle-really-lost/results/analysis.txt).")

The shape is a shallow U with a taller right arm. The numbers on the three metrics I recorded:

| Answer paragraph | Correct (%) | F1 | Log-prob of gold answer |
| --- | --- | --- | --- |
| Alone | 62.2 | 65.1 | -3.85 |
| Slot 1 (start) | 51.4 | 53.8 | -4.84 |
| Slot 4 (middle) | 46.0 | 43.5 | -5.32 |
| Slot 7 (end) | 55.4 | 54.0 | -4.44 |

The log-prob column is how likely the model thought the first gold answer was before it wrote anything, in nats. It needs no grading and has less noise than a right-or-wrong count, so it is the sharpest view of the same effect. Here the middle is 0.48 nats below the start (interval -0.91 to -0.06) and 0.88 below the end (-1.29 to -0.50).

My guess about recency was half right. The end beat the start on accuracy and log-prob, but on F1 they tie (53.96 against 53.81). What I did not predict was the middle falling this clearly below the start. My expectation for the ceiling was also wrong: I wrote 70 to 85% for the answer paragraph alone and got 62.2%. A 0.5B model fails some of these even with nothing in the way.

## Is that dip noise?

Partly unproven, partly not. On the pre-chosen metric the picture is mixed:

- Middle minus end: **-9.5 points**, interval -18.1 to -1.3. That excludes zero.
- Middle minus start: -5.4 points, interval -15.8 to +5.3. That does not.
- A within-question permutation test on the gap between the best and worst slot gives p = 0.18. Shuffling which slot each result belongs to produces a spread this big about one time in five.

Then the metrics I labelled secondary. F1 gives p = 0.021 on the same permutation test, and log-prob gives p below 0.001. These three scores are not three independent experiments. They are three views of the same 222 answers, and I ran no correction for looking at more than one. So here is what I'll claim: a middle penalty of roughly 5 to 10 points is the best reading of this data, the primary metric alone cannot prove it, and the other two agree on the direction.

The 74 questions also split three ways. 28 were right at every slot, 26 were wrong at every slot, and **20 (27%)** were right in some slots and wrong in others. Only those 20 can carry the effect. That is why 74 is thin: three quarters of the sample is simply easy or impossible for a 0.5B model whatever the order.

## What does clutter cost compared with position?

The mean of the three slots sits 11.3 points below the answer paragraph alone (interval -20.8 to -2.2). Six extra paragraphs, about 1,000 extra tokens, cost as much as moving the answer from either end into the middle. They also cost time: prefill grows with every token ([What Does Context Really Cost?](/blog/your-context-window-is-a-memory-bill) has the memory side of that bill).

That ordering of effort is the useful part. If retrieval hands you ten chunks and four are noise, dropping the four is worth at least as much as any shuffle. A reorder is free, so do it too, but I would not expect it to rescue a padded prompt.

## Where I'd stop trusting this post

**The sample is small, and it got smaller.** I planned 144 questions and five slots. A shared machine spiked to a load average of 160, the first run hit its time limit, and I cut the design to three slots and 74 questions. The smallest paired gap this sample detects reliably is 14.8 points. A real 3-point effect would have been invisible, so the honest summary for anything under about 10 points is "unresolved".

**This is a 0.5B model.** [Liu et al.](https://arxiv.org/abs/2307.03172) measured larger models on multi-document question answering and report best performance when the relevant passage is at the start or end and worse in the middle. My result points the same way, but the models, tasks and context lengths differ, and I do not know if a frontier model's curve is flatter or steeper at 1,250 tokens. I did not test one.

**I did not test a fix.** The data says the middle is weaker, not that "best chunk first, second best last" recovers the points. That is a separate experiment.

**SQuAD is a friendly task.** Each question was written looking at its paragraph, the distractors come from the same article, and a normalised substring match is generous to long answers. Real retrieval has messier distractors.

## The takeaway

Trim before you reorder. If your prompt carries more than a handful of retrieved chunks, test it with the bottom half removed before you test any ordering trick, and when you do order, keep your best chunk off the middle slot.

You can check your own model in an afternoon: take 100 questions you already grade, ask each three times with the evidence first, middle and last, and compare per question. I would change my mind about the middle penalty if a run of 300 or more questions showed a gap under 3 points, and I would like to run that next, with a 1.5B model as well.
