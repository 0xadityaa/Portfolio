## Thread

Exact match marked 18% of correct human answers wrong. I scored SQuAD's crowdworkers against each other (34,723 answers, official script), then tried the softer metrics. Here's what each one lets through.

---

Why 18%? I read 50 of the failures. 43 were extra or missing words: "Fowler" vs "Bennie Fowler", "1529" vs "October 1529". Only 4 were real disagreements. With one reference instead of two or three, exact match fails 32.7%.

---

Token F1 at 0.5 fixes most of it: 5.6% of correct answers failed. But I wrote 100 wrong answers that sit close to the truth (wrong year, negation, wrong unit). F1 at 0.5 passed 74 of them.

---

Embeddings (bge-small cosine) catch wrong names: "Lyon" for "Paris" never passed. They don't catch "828 feet" for "828 metres": 9 of 10 unit swaps passed at 0.90. F1 scores "Caesar stabbed Brutus" against "Brutus stabbed Caesar" at 1.0.

---

I swept the thresholds. The best cosine cut-off fails 17.6% of right answers and passes 14% of wrong ones. Nothing I tried was under 10% on both. Choose by the mistake you can least afford.

---

Write-up, code, and the 100 wrong answers: https://www.0xadityaa.dev/blog/exact-match-would-fail-the-humans-too

## Singles

Humans score 82% exact match against each other on SQuAD dev. With one reference instead of two or three, 32.7% of correct answers fail. A model at 80 isn't necessarily doing badly.

---

Why does exact match fail correct answers? I read 50 of its failures: 43 were extra or missing words, 1 was formatting, 4 were real disagreements. It mostly punishes length, not wrongness.

---

Token F1 at 0.5 fails 5.6% of correct human answers but passes 74 of my 100 near-miss wrong ones. At 0.8 it fails 13.4% and passes 23. Moving the threshold swaps one error for the other.

---

F1 counts words, not order. "Caesar stabbed Brutus" scores 1.0 against "Brutus stabbed Caesar", and 10 of 10 reversed-role answers passed F1 at 0.8. If order or negation matters in your task, F1 can't be the only check.

---

bge-small cosine at 0.90 passed 9 of 10 wrong-unit answers ("828 feet" for "828 metres") and rejected "Lyon" for "Paris" every time. Embedding similarity tracks topic more than truth. Test it on wrong answers you wrote yourself.

## Substack Note

Eighteen percent of correct answers fail exact match. That's what I got when I scored SQuAD's crowdworkers against each other: 34,723 human answers, each one treated as a model's prediction and checked against the others, using the official normalisation.

Most of those "failures" are extra or missing words. "Fowler" against "Bennie Fowler". "1529" against "October 1529". I read 50 of them and only 4 were real disagreements.

So I tried softer metrics, and wrote 100 wrong answers that sit close to the truth. Token F1 at 0.5 passed 74 of them. Embedding cosine at 0.90 passed 37. No threshold I tried was under 10% on both kinds of error.

The metric is a choice about which mistake you can live with. Write-up, code and the wrong answers:

https://www.0xadityaa.dev/blog/exact-match-would-fail-the-humans-too
