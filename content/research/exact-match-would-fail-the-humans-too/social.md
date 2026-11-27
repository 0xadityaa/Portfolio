## Hook

Your eval metric would flunk a third of correct human answers.

Exact match, one reference each: 32.7% of right answers marked wrong.

Token F1 at 0.5 cut that to 12.4%, then passed 74 of 100 hand-written near-miss wrong answers.

What do you grade answers with?

## Thread

Your eval metric would flunk a third of correct human answers.

SQuAD's crowdworkers scored against each other, one reference each. Then 100 hand-written wrong answers, close to the truth, show what softer metrics let through ↓
---
Token F1 at 0.5 failed 12.4% of correct answers and passed 74 of the 100 wrong ones.

At 0.8 it flips:
→ 26.4% of correct answers fail
→ 23 wrong ones pass

F1 counts words, not order. All 10 reversed-role answers passed at 0.8 ("Brutus stabbed Caesar"), and 4 of 10 negations.
---
Embeddings (bge-small cosine at 0.90, one reference each):

→ 24.0% of correct answers fail
→ 37 of the 100 wrong ones pass

9 of 10 unit swaps ("828 feet" for "828 metres") got through. "Lyon" for "Paris" never did.
---
Why does exact match fail so many right answers?

50 of its failures between humans (run with 2 to 3 references), read by hand: 43 were the same answer with words added or dropped, like "Fowler" vs "Bennie Fowler". 4 were real disagreements.
---
The strongest objection: a strict metric with a steady bias can still rank systems fine, and it's free.

Whether rankings survive isn't covered. The numbers here are per-answer errors on one dataset against hand-written wrong answers, not leaderboard order.
---
Want the 100 wrong answers and the scoring code? Reply GRADE and it lands in your DMs.
---
Rule of thumb: if a wrong answer costs more than a missed right one (money, units, medicine), stay strict. If failing right answers hurts, go softer and add checks for numbers, negation and order.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/exact-match-would-fail-the-humans-too

## Singles

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

That's the bill for 8.7 points.

---

If a wrong answer costs more than a missed right one, stay on exact match and accept the false failures. If failing right answers is the pain, go softer and add separate checks for numbers, negation and order. Read 50 disagreements first.

---

Myth: embedding similarity handles paraphrase, so it's a safe grader.

Measured: bge-small cosine at 0.90 passed 9 of 10 wrong units and 10 of 10 reversed roles among 100 hand-written near misses.

It matches topic. Facts are a different job.

## CTA

GRADE | the 100 hand-written wrong answers and the scoring code | https://github.com/0xadityaa/Portfolio/tree/main/content/research/exact-match-would-fail-the-humans-too

## Reply prompts

On SQuAD, one human scored against one other human fails exact match 32.7% of the time. Worth remembering before you read a model's EM number. How many references does your eval have?

Token F1 pass lines need testing on wrong answers. Across 100 hand-written near misses, F1 at 0.5 passed 74 and at 0.8 passed 23. Do you test your threshold on wrong answers, or only on right ones?

Embedding-similarity grading on 100 hand-written near-miss wrong answers: bge-small cosine at 0.90 passed 9 of 10 wrong units and 10 of 10 reversed roles. Are you checking numbers and negation separately?

## Substack Note

Exact match failed a third of correct answers when SQuAD's crowdworkers were scored against each other with one reference each: 32.7%, over 84,310 pairs of answers.

Reading 50 of the failures from a run with two or three references showed the pattern. 43 were the same answer with words added or dropped, like "Fowler" against "Bennie Fowler" or "1529" against "October 1529". Only 4 were real disagreements.

Softer metrics trade one error for another. 100 hand-written wrong answers that sit close to the truth (wrong years, negations, wrong units) put a price on it. Token F1 at 0.5 failed 12.4% of correct answers and passed 74 of the wrong ones. Embedding cosine at 0.90 failed 24.0% and passed 37.

A metric is a choice about which mistake you can live with. Write-up, code and the wrong answers:

https://www.0xadityaa.dev/blog/exact-match-would-fail-the-humans-too
