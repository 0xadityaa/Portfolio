## Thread

Exact match marks 32.7% of correct human answers wrong when each has one reference. Softer metrics fix that, then pass wrong answers that look right. I scored SQuAD's humans against each other, then wrote 100 near-miss wrong answers to see what gets through.

[image: /images/blog/exact-match-vs-wrong-answers.svg]
---
With 2 to 3 references per question, exact match still fails 18.0% of correct human answers.

I read 50 of those failures. 43 were the same answer with words added or dropped, like "Fowler" vs "Bennie Fowler". Only 4 were real disagreements.
---
Token F1 at 0.5 failed 12.4% of correct answers and passed 74 of my 100 near-miss wrong answers. At 0.8, 23 still passed.

F1 counts words, not order. All 10 reversed-role answers passed: "Brutus stabbed Caesar" scores 1.0 against "Caesar stabbed Brutus".
---
Embeddings (bge-small cosine at 0.90):

→ 24.0% of correct answers fail
→ 37 of the 100 wrong ones pass

9 of 10 unit swaps ("828 feet" for "828 metres") got through. "Lyon" for "Paris" never did. Similarity measures topic, not facts.
---
If a wrong answer costs more than a missed right one (money, units, medicine), stay strict. If failing right answers hurts, go softer and add checks for numbers, negation and order.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/exact-match-would-fail-the-humans-too

## Singles

32.7%.

That's how many correct SQuAD answers exact match marks wrong when I score a human against one other human.

Count the references in your eval before you read a model's EM number.
---
I ran token F1 at 0.8 on 100 hand-written near-miss wrong answers:

→ reversed roles: 10 of 10 passed
→ wrong detail in a long answer: 7 of 10
→ negations: 4 of 10
→ wrong years: 0 of 10

F1 counts words. Word order carries the meaning.
---
Your token F1 pass line is a number somebody picked. Against my 100 near-miss wrong answers:

→ 0.5 passes 74
→ 0.6 passes 45
→ 0.8 passes 23

Test the line on wrong answers before you trust it.
---
I swapped exact match for bge-small cosine at 0.90, one reference each:

→ correct answers failed: 32.7% down to 24.0%
→ near-miss wrong answers passed: 0 up to 37

Embeddings match topic. Facts are a different job.
---
I found no threshold that works. The best single cosine cut (0.96) fails 17.6% of correct answers and passes 14% of wrong ones. F1 at 0.9 lands in the same place: 17.0% and 14%.

Nothing got under 10% on both.

## Link post

Exact match fails one correct human answer in five. The softer metrics that fix it pass 74 of my 100 near-miss wrong answers.

Pick the metric by the failure you can least afford.

<BLOG_URL>
[image: /images/blog/exact-match-vs-wrong-answers.svg]

## Question

How many references does each question in your eval have, and have you ever checked what your pass threshold lets through?

## Substack Note

When I scored SQuAD's crowdworkers against each other with one reference each, exact match failed 32.7% of correct answers, over 84,310 pairs.

I read 50 of the failures from a run with two or three references. 43 were the same answer with words added or dropped, like "Fowler" against "Bennie Fowler" or "1529" against "October 1529". Only 4 were real disagreements.

Softer metrics trade one error for another. I wrote 100 wrong answers that sit close to the truth (wrong years, negations, wrong units) to price it. Token F1 at 0.5 failed 12.4% of correct answers and passed 74 of the wrong ones. Embedding cosine at 0.90 failed 24.0% and passed 37.

A metric is a choice about which mistake you can live with.

<BLOG_URL>
