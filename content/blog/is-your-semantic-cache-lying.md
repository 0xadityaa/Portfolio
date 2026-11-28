---
title: Is Your Semantic Cache Lying?
publishedAt: '2027-01-11'
summary: >-
  On a hard Quora test set, a MiniLM semantic cache at 0.85 gave the wrong answer on 28% of hits. Unrelated queries aren't the problem. Near misses are.
tags:
  - ai
  - embeddings
  - caching
  - rag
draft: true
---

"Is it safe to use castor oil at 36 weeks to induce labor?" and "Is it safe to use castor oil at 39 weeks to induce labor?" have a cosine similarity of **0.989** under MiniLM. Any semantic cache with a threshold below that returns the first answer to the second asker. Those are different questions with different answers.

A semantic cache in front of an LLM saves tokens and latency, and this is the failure it risks: a confident answer to the wrong question. How often does it happen, and can a threshold stop it?

**Raising the similarity threshold does not make a semantic cache safe. The "narrow cone" of embedding space, where even unrelated text scores high, is real but mostly a distraction. The damage comes from near-duplicate questions that differ in one detail, and in my test a MiniLM cache at 0.85 returned the wrong answer on 28% of its hits.**

Read that 28% as a worst case, not a production rate. QQP's non-duplicate pairs are mostly related questions, so almost every close neighbour is a near miss, and a real cache also sees plenty of easy misses.

I measured it on 5,000 Quora question pairs with three small embedding models. The numbers are below, and every script and output is in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-your-semantic-cache-lying). The provider-side kind that reuses an identical prompt prefix is a separate story in [Does Prompt Caching Always Save?](/blog/prompt-caching-rewards-boring-prompts). This post is about the kind that decides two different strings mean the same thing.

## The short version

- Random unrelated question pairs average a cosine of 0.05 on MiniLM, 0.38 on bge-small and **0.77 on e5-small**. At a 0.80 threshold, 14% of unrelated pairs clear the bar on e5-small and 0.02% on the other two.
- On Quora pairs at 0.85 (a hard case), MiniLM hit 32% of pairs and **28% of those hits were wrong** (95% interval 26 to 30%). It still missed 38% of the true duplicates.
- No threshold I tried gave a 5% wrong-hit share on MiniLM or e5-small. bge-small reached it at 0.987, keeping 7% of the duplicates.
- Embedding one query took 33 to 84 ms on 4 CPU threads, a cost every request pays, hit or miss.

## What does a semantic cache actually do?

It embeds the incoming query into a vector, finds the nearest stored query, and if their cosine similarity clears a threshold, returns the stored answer without calling the model. [GPTCache](https://github.com/zilliztech/GPTCache) is one open-source version of the idea. The similarity is the angle between two vectors:

$$
\cos(a, b) = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert}
$$

A hit is any pair at or above the threshold $$\tau$$. What I care about is the share of hits that were wrong:

$$
\text{false-hit share} = \frac{\text{hits on non-duplicate pairs}}{\text{all hits}}
$$

A miss costs one model call you would have paid for anyway. A false hit ships a wrong answer.

## Is the narrow cone real?

Yes. Embedding models do not spread text evenly over the sphere. [Ethayarajh (2019)](https://arxiv.org/abs/1909.00512) showed that contextual representations are not isotropic, and the model cards say so for the two models I tested that have it. The [bge-small card](https://huggingface.co/BAAI/bge-small-en-v1.5) says its similarity distribution is "about in the interval [0.6, 1]" and that a score above 0.5 does not mean two sentences are similar. The [e5-small-v2 card](https://huggingface.co/intfloat/e5-small-v2) says scores distribute around 0.7 to 1.0, because of a low temperature in its contrastive loss.

I took a seeded sample of 5,000 pairs from the validation split of Quora Question Pairs (QQP, part of [GLUE](https://arxiv.org/abs/1804.07461); 37.0% of the sample is labelled duplicate), then paired each question 1 with the question 2 of a different pair. I embedded them with [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), [bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5) and [e5-small-v2](https://huggingface.co/intfloat/e5-small-v2) (with its required `query: ` prefix).

![Range of cosine similarity for random unrelated question pairs: MiniLM from about -0.11 to 0.31, bge-small from 0.23 to 0.57, e5-small from 0.70 to 0.86, with a line at 0.80 that only e5-small straddles.](/images/blog/embedding-cone-random-pairs.svg "5,000 random Quora question pairs, middle 98% (1st to 99th percentile) and the mean. Values from [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-semantic-cache-lying/output.txt).")

The same kind of pair is "0.77 similar" on one model and "0.05 similar" on another, so a threshold copied from a blog post, including this one, belongs to one model. On e5-small, 99% of unrelated pairs score at least 0.70 and 69% score at least 0.75, so the 0.80 default people reach for would hit 14% of pairs about nothing in common. On MiniLM and bge-small only one random pair in 5,000 reached 0.80. The maximum was about 0.9, probably a question QQP repeats, which I did not check.

So for two of the three models, unrelated text is not what trips the cache. I expected the cone to matter more than it does.

## Where do the false hits come from?

From questions that share almost every word. Four pairs QQP labels as not duplicates, all above 0.95 (MiniLM unless noted):

- "Which is a suitable inpatient drug and alcohol rehab center in Hale County AL?" against the same sentence with Clarke County (0.961).
- "What are the strengths and weaknesses of the advising system at Northeastern Illinois University?" against Western Illinois University (0.959).
- "What language is used in Visual Basic? How does it compare to C#?" against the same question about C++ (0.990 on e5-small).
- The castor oil pair at 36 and 39 weeks (0.989).

An embedding model is trained to put paraphrases close together, and the detail that flips the answer (a county, a university, a gestation week, a language) is a tiny part of the vector. A higher threshold cannot separate these pairs from real duplicates, because they score the same.

![Horizontal bars of hits as a share of all pairs for a MiniLM cache at thresholds 0.70 to 0.95, each split into right and wrong answers; at 0.85 the cache hits 32 percent and 28 percent of hits are wrong, and at 0.95 it hits 9 percent with 14 percent wrong.](/images/blog/semantic-cache-false-hits.svg "MiniLM-L6 on 5,000 QQP validation pairs, a hard case because most non-duplicates are related questions. Seed 20261127. Full sweep for all three models in [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-semantic-cache-lying/output.txt) and [`results.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-semantic-cache-lying/results.json).")

The wrong share shrinks slowly as the threshold rises, and the hits disappear faster. Each cell is the hit rate over all 5,000 pairs, then the share of those hits that were wrong:

| Threshold | MiniLM-L6 | bge-small | e5-small |
| --- | --- | --- | --- |
| 0.80 | 42% hit, 33% wrong | 59% hit, 41% wrong | 92% hit, 60% wrong |
| 0.85 | 32% hit, 28% wrong | 45% hit, 35% wrong | 83% hit, 55% wrong |
| 0.90 | 20% hit, 21% wrong | 29% hit, 26% wrong | 65% hit, 45% wrong |
| 0.95 | 9% hit, 14% wrong | 13% hit, 14% wrong | 34% hit, 31% wrong |

At 0.85, MiniLM's cache is wrong on 28% of hits, bge-small's on 35% and e5-small's on 55%. Same threshold, same data, a twofold difference in how often the cache lies. The cone sets what a given number means, and the near misses set the error floor underneath it.

## What does a low false-hit rate cost?

Most of the cache. I searched the threshold for the lowest value that held the wrong share to 5%, then 10%.

| Model | Threshold for at most 10% wrong | Duplicates still hit | Threshold for at most 5% wrong |
| --- | --- | --- | --- |
| MiniLM-L6 | 0.966 | 13% | none up to 0.99 |
| bge-small | 0.969 | 18% | 0.987 (7% of duplicates) |
| e5-small | 0.990 | 11% | none up to 0.99 |

At a 10% wrong share, the cache serves roughly one in eight real duplicates. "Tune the threshold" quietly assumes your traffic has a clean gap between paraphrases and near misses. QQP does not, and I would not bet yours does.

One more cost shows up on every request, hit or miss: the lookup embeds the query first. On 4 CPU threads, one query at a time, the median was 33 ms for MiniLM, 71 ms for bge-small and 84 ms for e5-small. That ran on a loaded shared machine, so treat it as an upper estimate. A hit only pays if the model call it replaces costs more than this.

## What would I do instead?

I did not test these, so they are next experiments. First, calibrate the threshold on your own labelled pairs, per model, and report the wrong-hit share next to the hit rate. Second, put a cheap check between the vector match and the cached answer: compare numbers, names and other entities in the two queries, and refuse the hit when they differ. That catches the county, university and week pairs above. Third, scope what you cache: a definition tolerates a near miss, a question with a number, name or date does not.

## Where I'd stop trusting this post

**QQP is a hard case on purpose.** That is why 28% is not a forecast for your traffic. The hit rate on non-duplicates, which does not depend on the duplicate share, is 14% for MiniLM at 0.85, 25% for bge-small and 73% for e5-small. Use your own traffic mix for your own number.

**My pairs are not a cache lookup.** I scored each pair directly. A real cache searches thousands of entries for the nearest one, which can only raise the best similarity, for hits and false hits alike.

**The labels are noisy.** Some false hits above are arguable: "largest city in the world by area" against "largest city in the world" scored 0.908 and is labelled non-duplicate, and a user might accept that answer. I did not clean the labels, so the wrong shares are measured against QQP's judgement, not yours. I could not read Quora's own description of how the labels were made (the page returned 403), so I claim nothing about it.

**Three small models, short questions.** Larger embedding models, long prompts and other languages may separate paraphrases from near misses better. I did not test them, and I left out the vector index and storage.

**Two of my expectations were off.** I guessed 5 to 15% wrong hits at 0.85 to 0.90 and measured 21 to 55%, and I guessed 5 to 15 ms per query and measured 33 to 84. My cone guesses were close (bge-small came in a little under my range, at 0.38). [`EXPECTATION.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-your-semantic-cache-lying/EXPECTATION.txt) has them, written before the run.

## The takeaway

Before you ship a semantic cache, take 200 pairs of real queries that differ in one detail and 200 genuine paraphrases, embed them with your model, and plot both score distributions. If they overlap, no threshold is safe and you need an entity check or a narrower scope. The same bge-small I used in [Did You Tune Chunk Size?](/blog/chunk-size-is-a-hyperparameter-you-never-tuned) is fine for ranking and not fine for deciding that two questions are the same question.

If someone shows me a cache on production traffic holding a sub-5% wrong-hit share at a useful hit rate without an entity check, I will happily eat my words. Until then, I would count a hit only when I could stand behind the answer it returns.
