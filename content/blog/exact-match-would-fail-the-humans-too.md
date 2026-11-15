---
title: Exact Match Would Fail the Humans Too
publishedAt: '2026-11-14'
summary: >-
  Exact match marks 18% of correct human answers wrong. Softer scoring fixes that, then passes 37 to 74% of wrong answers I wrote to look right.
tags:
  - ai
  - evals
  - nlp
draft: true
---

Eighteen percent. That's how many correct answers exact match marked wrong when I scored people against other people.

[SQuAD](https://arxiv.org/abs/1606.05250) is a reading-comprehension set where crowdworkers answered each question from the same Wikipedia paragraph. Every question in the [v1.1 dev set](https://rajpurkar.github.io/SQuAD-explorer/) has at least two of those human answers, usually three. So I pretended one human was a model: its answer was the prediction, the other humans' answers were the reference. I did that for every answer on every question, 34,723 of them. The code and raw output are [in the repo](https://github.com/0xadityaa/Portfolio/tree/main/content/research/exact-match-would-fail-the-humans-too).

**How you score against a reference decides what "accuracy" means: exact match fails one correct answer in five, and the softer metrics that fix it wave through wrong answers that look right, so pick the metric by the failure you can least afford.**

## The short version

- Exact match, with SQuAD's own normalisation, marked 18.0% of correct human answers wrong (95% interval 16.3 to 20.0). With one reference instead of two or three, 32.7%.
- Token F1 at 0.5 failed 5.6% of them. It also passed 74 of my 100 hand-written wrong answers.
- Embedding cosine at 0.90 failed 11.9% and passed 37 of 100. No threshold I tried was under 10% on both.
- I read 50 exact-match failures. 43 were extra or missing words. 4 were real disagreements.

## What did I score, and with what?

Three metrics, all comparing the prediction with each reference and keeping the best. Exact match uses the [official v1.1 script's](https://github.com/allenai/bi-att-flow/blob/master/squad/evaluate-v1.1.py) normalising: lowercase, strip punctuation and articles, then compare strings. Token F1 is word overlap, from the same script. Cosine is the angle between embeddings of the two answer strings from [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5), run on CPU.

A sanity check. The paper has humans at 80.3 exact match and 90.5 F1 on the v1.0 dev set, scoring the second answer against the rest. My copy of that protocol, on v1.1, gives 81.7 and 91.2. Close enough that I trust the scorer.

## How many correct answers does each metric fail?

Exact match: 18.0%. Token F1 fails 5.6% at a 0.5 threshold and 13.4% at 0.8. Cosine fails 5.8% at 0.80, 8.5% at 0.85, 11.9% at 0.90 and 16.3% at 0.95.

Why so many for exact match? I read 50 of its failures, picked at random, one per question. Of those, 43 were the same answer with words added or dropped: "Fowler" against "Bennie Fowler", "1529" against "October 1529", "80 million adherents" against "80 million". One was formatting (a possessive). Two were different spans that both answer the question. Only four were genuine disagreements, such as a generic "PVR" where the references say the brand, "Sky+". The SQuAD paper says [the same](https://arxiv.org/abs/1606.05250): mismatches come mostly from non-essential phrases.

Four in 50 is 8%, with a wide interval (3 to 19%). Scaled up, that's roughly 1.4% of all answers that humans really disagreed on. The other 16 points or so are the metric.

And this was the generous case. Most eval sets have one reference, not two or three. Score a person against one other person, and exact match fails 32.7%.

## So just use a softer metric?

A softer metric sounds like the fix. To see what it costs, I wrote 100 wrong answers. They're in [`adversarial.jsonl`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/exact-match-would-fail-the-humans-too/adversarial.jsonl): ten each of a wrong year next to the right one, a wrong number, a negation, a wrong qualifier ("ionic bond" for "covalent bond"), a same-type entity ("Lyon" for "Paris"), a wrong unit, a flipped direction, a near name ("Henry VII" for "Henry VIII"), reversed roles, and one wrong detail inside a long answer.

Here's the modelling choice I should flag: I wrote them to sit close to the truth, on purpose. That favours my thesis. For contrast I paired every question with a random answer from another article, and nothing passed, on any metric (0.0%). Softness only hurts on near misses.

![Bar chart: exact match fails 18% of correct human answers and passes 0% of wrong ones; F1 at 0.5 fails 6% and passes 74%; cosine at 0.90 fails 12% and passes 37%; cosine at 0.95 fails 16% and passes 17%](/images/blog/exact-match-vs-wrong-answers.svg)

Exact match let through none of the 100. F1 at 0.5 let through 74, and 23 at 0.8. Cosine let through 69 at 0.80, 55 at 0.85, 37 at 0.90 and 17 at 0.95.

By type, with exact match, F1 at 0.8 and cosine at 0.90 (out of 10 each):

| Wrong answer type | Exact match | F1 at 0.8 | Cosine at 0.90 |
| --- | --- | --- | --- |
| Reversed roles | 0 | 10 | 10 |
| Wrong detail in a long answer | 0 | 7 | 7 |
| Wrong unit | 0 | 0 | 9 |
| Negation | 0 | 4 | 5 |
| Flipped direction | 0 | 2 | 2 |
| Wrong number | 0 | 0 | 2 |
| Wrong qualifier | 0 | 0 | 1 |
| Near name | 0 | 0 | 1 |
| Wrong year | 0 | 0 | 0 |
| Same-type entity | 0 | 0 | 0 |

Each metric is blind somewhere different. "Caesar stabbed Brutus" scores 1.0 F1 against "Brutus stabbed Caesar", because F1 counts words, not their order. Embeddings treat "828 metres" and "828 feet" as near twins, and 9 of 10 unit swaps got through. They did reject "Lyon" for "Paris" every time, as F1 does, since the words differ.

## Is there a threshold that works?

I swept both. The best single cosine threshold, the one that minimises the worse of the two error rates, is 0.96: it fails 17.6% of correct answers and lets 14% of wrong ones through. F1 at 0.9 lands in the same place (17.0% and 14%). Nothing I tried was under 10% on both.

It isn't that cosine knows nothing. A random correct human answer scores above a random wrong one 89.7% of the time (87.0% for F1). The ranking is decent. The problem is that the two distributions overlap, so any cut-off gives something up.

Other people got here first. The authors of [Tomayto, Tomahto](https://arxiv.org/abs/2202.07654) published over 23,000 human judgments on SQuAD and say, in the abstract, that token-level measures underestimate system performance and that F1 gives a false impression of graduality. My 0.5 against 0.8 rows are that, in miniature. [BERTScore](https://arxiv.org/abs/1904.09675) claims, in its abstract, to be more robust than older metrics on adversarial paraphrases. I didn't run it. LLM-as-judge gets its own post next.

## Where I'd stop trusting this post

**A strict metric with a steady bias can be fine.** Exact match is free, reproducible and needs no model. If every system you compare takes the same penalty, the ranking can survive, and the SQuAD paper reports both for every system it ranks. Model judges are slower and cost more, which [a 2024 paper on cheap answer-equivalence](https://arxiv.org/abs/2402.11161) calls out in its abstract. I didn't test whether rankings survive. I'd guess a wordy system loses more than a terse one, which would break "steady", but that's a guess.

**My wrong answers are mine.** One writer, 100 items, written to be hard. With 100 items the interval is about nine points either way, the [same sampling problem](/blog/your-eval-set-is-too-small-to-tell) as any small eval. A real model's mistakes may sit nearer the truth, or nearer nonsense.

**One embedding model, bare strings.** I embedded the answers alone, with no question. The bge-small model card says scores mostly fall between 0.6 and 1 and suggests thresholds of 0.8 to 0.9, so the cosine numbers depend on that model's habits. Another model could move them.

**Fifty is small.** The hand-check is one reader's call on 50 items, so read the 4-of-50 figure as a rough size.

## The takeaway

Before you trust an accuracy number, write down which wrong answer it would pass and which right one it would fail, then read 50 of its disagreements. If a wrong answer costs more than a missed right one (money, units, medicine), stay strict and accept the false failures. If failing right answers is what hurts, go softer, and bolt on separate checks for numbers, negation and order.

What would change my mind is a test on real model outputs showing that exact match and F1 rank systems the way human judges do. That's the thing I'd like to measure next.
