## Thread

Exact match marks 32.7% of correct human answers wrong when each has one reference. Softer metrics fix that, then pass wrong answers that look right.

[image: /images/blog/exact-match-vs-wrong-answers.svg]
---
SQuAD's crowdworkers, scored against each other, one reference each: 32.7% of right answers fail exact match.

With 2 to 3 references it's 18.0%. Of 50 failures read by hand, 43 were the same answer with words added or dropped, like "Fowler" vs "Bennie Fowler".
---
Token F1 at 0.5 failed 12.4% of correct answers and passed 74 of 100 hand-written near-miss wrong answers.

At 0.8: 23 pass. F1 counts words, not order, so all 10 reversed-role answers passed ("Brutus stabbed Caesar").
---
Embeddings (bge-small cosine at 0.90):

→ 24.0% of correct answers fail
→ 37 of the 100 wrong ones pass

9 of 10 unit swaps ("828 feet" for "828 metres") got through. "Lyon" for "Paris" never did.
---
If a wrong answer costs more than a missed right one (money, units, medicine), stay strict. If failing right answers hurts, go softer and add checks for numbers, negation and order.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/exact-match-would-fail-the-humans-too

## Singles

32.7%.

That's how many correct SQuAD answers exact match marks wrong when a human is scored against one other human.

Check how many references your eval has before you read a model's EM number.
---
Token F1 at 0.8 on 100 hand-written near-miss wrong answers:

→ reversed roles: 10 of 10 passed
→ wrong detail in a long answer: 7 of 10
→ negations: 4 of 10
→ wrong years: 0 of 10

F1 counts words, and word order carries the meaning.
---
The pass line on your token F1 is a number someone picked. Against 100 near-miss wrong answers:

→ 0.5 passes 74
→ 0.6 passes 45
→ 0.8 passes 23

Test the line on wrong answers before you trust it.
---
Swapping exact match for bge-small cosine at 0.90, one reference each:

→ correct answers failed: 32.7% down to 24.0%
→ hand-written near-miss wrong answers passed: 0 up to 37

Embedding similarity matches topic. Facts are a different job.
---
No threshold worked. The best single cosine cut (0.96) fails 17.6% of correct answers and lets 14% of wrong ones through. F1 at 0.9 lands in the same place: 17.0% and 14%.

Nothing got under 10% on both.

## Link post

Exact match fails one correct human answer in five. The softer metrics that fix it pass 74 of 100 near-miss wrong answers.

Pick the metric by the failure you can least afford.

<BLOG_URL>
[image: /images/blog/exact-match-vs-wrong-answers.svg]

## Question

How many references does each question in your eval have, and did you ever check what your pass threshold lets through?

## Substack Note

Exact match failed a third of correct answers when SQuAD's crowdworkers were scored against each other with one reference each: 32.7%, over 84,310 pairs of answers.

Reading 50 of the failures from a run with two or three references showed the pattern. 43 were the same answer with words added or dropped, like "Fowler" against "Bennie Fowler" or "1529" against "October 1529". Only 4 were real disagreements.

Softer metrics trade one error for another. 100 hand-written wrong answers that sit close to the truth (wrong years, negations, wrong units) put a price on it. Token F1 at 0.5 failed 12.4% of correct answers and passed 74 of the wrong ones. Embedding cosine at 0.90 failed 24.0% and passed 37.

A metric is a choice about which mistake you can live with.

<BLOG_URL>
