## Hook

A system that's truly 3 points better looked worse or tied in 32% of my simulated 100-example evals. Only 7% could call it better with the 95% interval above zero.

What eval size are you shipping prompt changes on?

[image: public/images/blog/eval-size-power-paired-vs-unpaired.svg]

## Thread

A system that's truly 3 points better looked worse or tied on 32% of my simulated 100-example evals. Here's what that does to your "80 to 83", and what actually moves the number:

---

At 100 examples the better system scored higher 68% of the time, tied 6%, lost 26%.

The 95% interval on the gap was 21 points wide. Your "up 3" is a dot in a band from about -8 to +13.

---

Only 7% of those evals could call the better system better, with the interval above zero.

At 500 examples: 21%. At 1,000: 40%.

---

Cheapest fix: run both systems on the same examples and compare pair by pair. Most examples are easy or hard for both, so that noise cancels.

Interval about 30% narrower. On the same data, a clear win went from 2.2% of runs to 11.1%.

---

How many examples to catch a 3-point gap, 80% power?

About 2,700 per system unpaired. About 1,350 paired, if the two systems' outcomes correlate at 0.5 (my assumption, not a measurement).

For a 10-point gap: 202 against 101.

---

The strongest objection is Hamel Husain's: early on, reading real outputs beats chasing a metric. He's right. This is for when you're choosing between two candidates on a number.

Also, this is binary scores and independent examples. Real evals are noisier.

---

Rule of thumb: look up the gap you care about. If your eval has fewer examples than the table says, don't call it a win. Read the outputs. If you can, score both systems on the same examples.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/your-eval-set-is-too-small-to-tell

## Singles

I expected a real 3-point gain to show a clear win about 10% of the time on 100 examples. Five thousand simulated runs said 7%. In one run in three the better system looked worse or tied.

---

The bill for catching a real gap at 80% power, per system: 202 examples for 10 points, 933 for 5, 2,712 for 3. Halve the gap, roughly quadruple the examples.

---

Same models, same 100 examples. Analysed as two separate totals, a real 3-point gain showed a clear win in 2.2% of runs. Analysed pair by pair: 11.1%. Only the analysis changed.

---

A 500-example eval is still too small for a 3-point change. At 500, 21% of simulated runs showed a clear win. At 1,000, 40%. The 95% interval at 1,000 is still 6.8 points wide.

---

If your eval has fewer examples than the table says for the gap you care about, don't call it a win. Read the outputs. At a correlation of 0.5: about 100 shared examples for 10 points, 465 for 5, 1,350 for 3.

## Reply prompts

I simulated this: on a 100-example eval, a real 3-point gain showed a clear win (95% interval above zero) 7% of the time. Do you score candidates on the same examples every time?

Re small evals: the 95% interval on a 3-point difference at 100 examples came out 21 points wide in my simulation. Comparing pair by pair on the same examples cut it about 30%.

Re "we went from 80 to 83": in my simulation a truly better system looked worse or tied on one 100-example eval in three. How many examples was this run on?

## Substack Note

On 100 examples, a system that's truly 3 points better looked worse or tied one run in three.

I simulated it: two systems, 83% against 80%, 5,000 runs at each eval size. At 100 examples the better one scored higher 68% of the time and lower 26%. The 95% interval on the gap was 21 points wide, and only 7% of runs could say "better" with it above zero. At 1,000 examples that rose to 40%.

The cheapest fix is to score both systems on the same examples and compare them pair by pair. Most examples are easy or hard for both, so that noise cancels. With outcomes correlated at 0.5 (my assumption), the interval got about 30% narrower and the examples needed for a 3-point gap halved, to about 1,350.

Simulation, raw output and full tables: https://www.0xadityaa.dev/blog/your-eval-set-is-too-small-to-tell
