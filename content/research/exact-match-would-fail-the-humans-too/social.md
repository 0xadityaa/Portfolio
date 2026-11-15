## Hook

Your eval metric would flunk a third of correct human answers.

Exact match, each SQuAD answer scored against one other human: 33% marked wrong. Token F1 at 0.5 cut that to 12%, then passed 74 of 100 near-miss wrong answers I wrote.

What do you grade answers with?

## Thread

Your eval metric would flunk a third of correct human answers.

I scored SQuAD's crowdworkers against each other, then wrote 100 wrong answers to see what the softer metrics let through:
---
Token F1 at 0.5 failed 12.4% of correct answers and passed 74 of my 100 wrong ones. Move the cut-off to 0.8 and it flips: 26.4% of correct answers fail, 23 wrong ones pass. All one reference each.
---
F1 counts words, not order. "Caesar stabbed Brutus" scores 1.0 against "Brutus stabbed Caesar". All 10 of my reversed-role answers passed F1 at 0.8, and negations did too (4 of 10).
---
Embeddings (bge-small cosine at 0.90) failed 24.0% of correct answers and passed 37 of 100 wrong ones. 9 of 10 unit swaps ("828 feet" for "828 metres") got through. "Lyon" for "Paris" never did.
---
Why does exact match fail so many right answers? I read 50 of its failures between humans. 43 were the same answer with words added or dropped ("Fowler" vs "Bennie Fowler"). 4 were real disagreements.
---
The strongest objection: a strict metric with a steady bias can still rank systems fine, and it's free. I didn't test whether rankings survive. I measured per-answer errors on one dataset, not leaderboard order.
---
Rule of thumb: if a wrong answer costs more than a missed right one (money, units, medicine), stay strict. If failing right answers hurts, go softer and add checks for numbers, negation and order.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/exact-match-would-fail-the-humans-too

## Singles

I guessed token F1 at 0.5 would pass about 40 of my 100 hand-written near-miss wrong answers. It passed 74. A wrong year shares no words with the right one. "Ionic bond" for "covalent bond" shares half, enough to pass at 0.5.

---

If you picked a pass line for token F1 without testing it on wrong answers you wrote yourself, you chose a number, not a metric. On my 100 near misses, F1 at 0.5 passed 74, at 0.6 passed 45, and at 0.8 passed 23.

---

Swapping exact match for bge-small cosine at 0.90, one reference each: correct answers failed drop from 32.7% to 24.0%. Hand-written wrong answers passed go from 0 of 100 to 37. That's the bill for 8.7 points.

---

If a wrong answer costs more than a missed right one, stay on exact match and accept the false failures. If failing right answers is the pain, go softer and add separate checks for numbers, negation and order. Read 50 disagreements first.

---

The pitch for embedding similarity is that it handles paraphrase. On 100 hand-written near-miss wrong answers, bge-small cosine at 0.90 passed 9 of 10 wrong units and 10 of 10 reversed roles. It matches topic, and facts are a different job.

## Reply prompts

On SQuAD, a human scored against one other human fails exact match 32.7% of the time, Most failures I read (43 of 50, scored with 2 to 3 references) were extra or missing words. Worth remembering before reading a model's EM number. How many references does your eval have?

Token F1 pass lines need testing on wrong answers. I wrote 100 near misses: F1 at 0.5 passed 74, at 0.8 passed 23. Do you test your threshold on wrong answers you wrote yourself, or on right ones only?

I measured embedding-similarity grading on 100 hand-written near-miss wrong answers: bge-small cosine at 0.90 passed 9 of 10 wrong units and 10 of 10 reversed roles. Are you checking numbers and negation separately?

## Substack Note

Exact match failed a third of correct answers when I scored SQuAD's crowdworkers against each other with one reference each: 32.7%, over 84,310 pairs of answers.

I read 50 of the failures from the run with two or three references. 43 were the same answer with words added or dropped. "Fowler" against "Bennie Fowler". "1529" against "October 1529". Only 4 were real disagreements.

So I tried softer metrics, and wrote 100 wrong answers by hand that sit close to the truth: wrong years, negations, wrong units. Token F1 at 0.5 failed 12.4% of correct answers and passed 74 of my wrong ones. Embedding cosine at 0.90 failed 24.0% and passed 37.

A metric is a choice about which mistake you can live with. Write-up, code and the wrong answers:

https://www.0xadityaa.dev/blog/exact-match-would-fail-the-humans-too
