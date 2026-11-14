## Thread

Your eval goes from 80 to 83 on 100 examples. I simulated that 5,000 times with a system that was truly 3 points better. It scored higher 68% of the time, tied 6%, and lost 26%. Thread on what that means for your evals.

---

The 95% interval on that 3-point gap is 21 points wide at 100 examples. Only 7% of runs could say "better" with the interval above zero. At 1,000 examples, 40%.

---

Cheapest fix: run both systems on the same examples and compare pair by pair. Most examples are easy or hard for both, so that noise cancels. The interval got about 30% narrower.

---

How many examples to catch a 3-point gap? About 2,700 per system unpaired, about 1,350 paired (I assumed the two systems' outcomes correlate at 0.5). For a 10-point gap: 202 against 101.

---

Reading 50 outputs still beats chasing a metric early on. This is for when you're choosing between two candidates on a number. Post, simulation, and raw output: https://www.0xadityaa.dev/blog/your-eval-set-is-too-small-to-tell

## Singles

A real 3-point gain, 100 eval examples: the better system looked worse or tied in 32% of runs. One eval in three can't even get the direction right.

---

Confidence interval on a 3-point gain at 100 examples: 21 points wide. At 500: 9.6. At 1,000: 6.8. "Up 3" is a dot inside a very wide band.

---

Before: two separate totals, a clear win 2.2% of the time. After: the same data compared pair by pair, 11.1%. Same models, same examples. Only the analysis changed.

---

Half the gap, four times the examples. At 80% power I needed 202 per system for 10 points, 933 for 5, and 2,712 for 3. A 50-example eval can't see a 3-point change.

---

Rule of thumb: if your eval has fewer examples than the table says for the gap you care about, don't call it a win. Read the outputs instead.

## Substack Note

Your score goes from 80 to 83 on 100 examples. Do you ship it?

I simulated exactly that: two systems, one truly 3 points better, 5,000 runs at each eval size. At 100 examples the better system scored higher 68% of the time, tied 6%, and lost 26%. The 95% interval on the difference was 21 points wide, and only 7% of runs could say "better" with it above zero. At 1,000 examples that rose to 40%.

The cheapest fix is to run both systems on the same examples and compare them pair by pair. Most examples are easy or hard for both, so that noise cancels. With the two systems' outcomes correlated at 0.5 (an assumption, not a measurement), the interval got about 30% narrower and the examples needed for 80% power halved: about 1,350 instead of 2,700 for a 3-point gap.

None of this beats reading your outputs early on. It's for the moment you pick between two candidates on a number. Simulation, raw output, and the full tables: https://www.0xadityaa.dev/blog/your-eval-set-is-too-small-to-tell
