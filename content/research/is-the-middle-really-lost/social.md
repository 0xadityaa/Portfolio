## Thread

A 0.5B model got 55.4% of questions right with the answer paragraph last, and 45.9% with it in the middle. Same question, same six distractors, same order.

Is that lost in the middle, or noise on 74 questions? ↓

[image: /images/blog/middle-of-the-context-dip.svg]
---
On the accuracy metric I fixed before running, the case is borderline.

Middle minus end: -9.5 points, interval -18.1 to -1.3. Middle minus start: -5.4, interval -15.8 to +5.3, which crosses zero. Permutation test on the whole curve: p = 0.18.
---
Two secondary metrics point the same way. On F1 the middle sits 10.4 points under the start and 10.5 under the end, both intervals clear of zero.

Same 222 answers, no correction for multiple looks. They support the direction, not the size.
---
Six distractor paragraphs cost 11.3 points of accuracy against the answer paragraph alone (62.2%), on the same 74 questions. Position moved accuracy by 9.5 points at most.

Clutter costs about as much as position, or more.
---
Cut the context before you reorder it, and keep your best chunk off the middle slot. On 74 questions I'm calling the dip borderline, not proven.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-the-middle-really-lost

## Singles

Only 20 of 74 questions changed outcome with the answer's position. 28 were right everywhere and 26 wrong everywhere.

A position effect can only live in that last quarter, which is why 74 questions is thin.
---
I expected a recency effect from a 0.5B model. I got a shallow U: 51.4% with the answer first, 45.9% in the middle, 55.4% last.

But middle minus start has an interval of -15.8 to +5.3. Borderline, not settled.
---
Six distractor paragraphs cost a 0.5B model 11.3 points of accuracy. Moving the answer from the end into the middle cost 9.5.

On F1, the secondary metric, it is 14.7 against 10.5. Clutter costs at least as much as position on both.
---
Seven paragraphs with no answer in them: 4.0% correct (25 questions). The answer paragraph alone: 62.2%.

I had guessed 70 to 85% for that ceiling. A 0.5B model fails plenty of these with nothing in the way.
---
A 74-question paired sample can only detect a 14.8-point gap at 80% power.

A real 5-point middle penalty can sit inside that. A null from a sample this size would not have meant "no effect".

## Link post

With the answer in the middle of seven paragraphs, a 0.5B model scores 9.5 points lower than with it last. Borderline on 74 questions. Six distractors cost 11.3 points, so cut context before you reorder it.

<BLOG_URL>

[image: /images/blog/middle-of-the-context-dip.svg]

## Question

When you pack retrieved chunks into a prompt, do you keep them in rank order, or put the best one first and the second best last? Did you ever test it?

## Substack Note

Qwen2.5-0.5B answered 55.4% of 74 questions correctly with the relevant paragraph last among seven, and 45.9% with it in the middle. Same question, same six distractors, same order. Is that lost in the middle, or noise?

Borderline. On the accuracy metric I fixed in advance, middle minus end is -9.5 points (interval -18.1 to -1.3), but middle minus start is -5.4 (-15.8 to +5.3) and a permutation test on the whole curve gives p = 0.18. The secondary metrics, F1 and gold-answer log-probability, show a clearer dip, though they reuse the same answers with no multiple-comparison correction.

The six distractors cost 11.3 points, as much as position does, so I would trim the prompt before reordering it. The post covers what 74 questions can and cannot detect.

<BLOG_URL>
