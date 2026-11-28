## Thread

A 0.5B model got 55.4% of questions right with the answer paragraph last, and 46.0% with it in the middle. Same question, same six distractors, same order.

Is that lost in the middle, or noise on 74 questions? ↓

[image: /images/blog/middle-of-the-context-dip.svg]
---
Scored by F1, the middle slot sits 10.4 points under the start and 10.5 under the end. Both paired intervals exclude zero.

On the log-probability of the gold answer, the permutation test gives p below 0.001.
---
On the metric I fixed before running, the case is weaker. Middle minus start is -5.4 points, interval -15.8 to +5.3. The permutation test on the whole curve gives p = 0.18.

I'm calling it borderline, not proven.
---
Six distractor paragraphs cost 11.3 points of accuracy against the answer paragraph alone (62.2%). That is the same size as the position effect.
---
Cut the context before you reorder it, and keep your best chunk off the middle slot.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-the-middle-really-lost

## Singles

Only 20 of 74 questions changed outcome with the answer's position. 28 were right everywhere and 26 wrong everywhere.

A position effect can only live in that last quarter, which is why 74 questions is thin.
---
I expected a recency effect from a 0.5B model. I got a shallow U: 51.4% with the answer first, 46.0% in the middle, 55.4% last.

The end beat the start, but the middle fell under both.
---
Six distractor paragraphs cost a 0.5B model 11.3 points of accuracy. Moving the answer from either end into the middle cost about 10 points of F1.

Clutter and position are the same order of magnitude.
---
Seven paragraphs with no answer in them: 4.0% correct (25 questions).

The model wasn't guessing from the question, so the middle penalty comes from how it reads the context, not from luck.
---
A 74-question paired sample can only detect a 14.8-point gap at 80% power.

A real 5-point middle penalty can sit inside that. A null from a sample this size would not have meant "no effect".

## Link post

A 0.5B model loses about 10 points of F1 when the answer sits in the middle of seven paragraphs. Six distractors cost about as much, so cut context before you reorder it.

<BLOG_URL>

[image: /images/blog/middle-of-the-context-dip.svg]

## Question

When you pack retrieved chunks into a prompt, do you keep them in rank order, or put the best one first and the second best last? Did you ever test it?

## Substack Note

Qwen2.5-0.5B answered 55.4% of 74 questions correctly with the relevant paragraph last among seven, and 46.0% with it in the middle. Same question, same six distractors, same order. I wanted to know whether that is the lost-in-the-middle effect or sampling noise, so I measured it with a paired bootstrap that resamples whole articles.

The answer is borderline. On F1 the middle is about 10 points below both ends, and the intervals clear zero. On the accuracy metric I fixed in advance, middle minus start is -5.4 points with an interval from -15.8 to +5.3. The distractors themselves cost 11.3 points, as much as the position does, so I would trim the prompt before reordering it. The 74 questions can only detect a gap of about 15 points, and I say what that means for the null in the post.

<BLOG_URL>
