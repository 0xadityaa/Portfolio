## Thread

Say you tweak a prompt and your score goes from 80 to 83 on 100 examples. I simulated that: two systems, one truly 3 points better, 5,000 evals. The better one scored higher 68% of the time. Tied 6%. Scored lower 26%.

---

The 95% interval on that difference is 21 points wide at 100 examples. Only 7% of those evals could say "A is better" with the interval above zero. At 1,000 examples it's 40%.

---

The cheapest fix is pairing. Run both systems on the same examples and compare them example by example. Most examples are easy or hard for both, so that noise cancels. In my simulation the interval got about 30% narrower.

---

How many examples to catch a 3-point gap at 80% power? About 2,700 per system unpaired, about 1,350 paired (assuming the two systems' outcomes correlate at 0.5). For a 10-point gap it's 202 against 101.

---

Reading 50 outputs still beats chasing a metric early on. This is for the moment you choose between two candidates on a number. Post, with the simulation and its raw output: https://www.0xadityaa.dev/blog/your-eval-set-is-too-small-to-tell

## Singles

I simulated a real 3-point improvement (80% to 83%) on a 100-example eval, 5,000 times. The better system looked worse or tied in 32% of runs.

---

95% confidence interval on a 3-point gain, 100 examples: 21 points wide. At 500 examples: 9.6. At 1,000: 6.8. A score "going up 3" at n=100 is a dot inside a very wide band.

---

Same examples for both systems, compared pair by pair: the interval on the difference was about 30% narrower than treating them as two separate totals. Same data, same models. Just a different analysis.

---

If you analyse paired data as if it were two separate samples, you get a test that is too timid. In my simulation, 83% vs 80% at 100 examples showed a clear win 2.2% of the time unpaired and 11.1% paired.

---

Halving the gap you want to detect roughly quadruples the examples you need. At 80% power I got 202 per system for 10 points, 933 for 5 points, and 2,712 for 3 points.

## Substack Note

Say you tweak a prompt and your score goes from 80 to 83 on 100 examples. Is it better?

I simulated it. Two systems, one truly 3 points better, 5,000 simulated evals at each size. At 100 examples the better system scored higher 68% of the time, tied 6%, and scored lower 26% of the time. The 95% interval on the difference was 21 points wide, and only 7% of evals could say "better" with that interval above zero. At 1,000 examples it was 40%.

The cheapest fix is to run both systems on the same examples and compare them pair by pair. Most examples are easy or hard for both, so that noise cancels. With the two systems' outcomes correlated at 0.5 (an assumption, not a measurement), the interval got about 30% narrower and the examples needed for 80% power halved: about 1,350 instead of 2,700 for a 3-point gap.

None of this beats reading your outputs early on. It's for the moment you pick between two candidates on a number. The simulation, raw output, and the full table are in the post: https://www.0xadityaa.dev/blog/your-eval-set-is-too-small-to-tell
