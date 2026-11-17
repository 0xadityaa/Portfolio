## Hook

Your 100-example eval is lying about that 3-point win.

Simulated: the truly better system looked worse or tied in 1 run in 3.

Only 7% of runs showed a clear win.

How many examples do you ship prompt changes on?

[image: public/images/blog/eval-size-power-paired-vs-unpaired.svg]

## Thread

Your 100-example eval is lying about that 3-point win.

I simulated it 5,000 times. The truly better system looked worse or tied in a third of runs. Here's what it takes to see a 3-point gain ↓
---
Two systems, 83% vs 80% true accuracy. 100 examples, 5,000 runs.

→ Better one scored higher 68%, tied 6%, lower 26%
→ 95% interval on the gap: 21 points wide
→ Clear win, interval above zero: 7%

At 500 examples 21%. At 1,000, 40%.
---
Cheapest fix: score both systems on the same examples and compare pair by pair. Shared difficulty cancels.

Same 100 examples, outcomes correlated at 0.5 (my assumption):

→ Two separate totals: clear win in 2.2% of runs
→ Pair by pair: 11.1%

Interval about 30% narrower.
---
Examples needed to catch the gap 80% of the time:

3 points: about 2,700 per system, or about 1,350 paired
5 points: 933, or 465 paired
10 points: 202, or 101 paired

Paired figures assume the 0.5 correlation. I didn't measure it on a real eval.
---
Strongest objection, Hamel Husain's: early on, reading real outputs beats chasing a metric. He's right. This is for choosing between two candidates on a number.

Also, simulated binary scores on independent examples. Real evals are noisier.
---
Want the simulation and the sample-size table? Reply EVAL and I'll DM it.
---
Rule of thumb: look up the gap you care about. If your eval has fewer examples than the table says, don't call it a win. Read the outputs. If you can, score both systems on the same examples.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/your-eval-set-is-too-small-to-tell

## Singles

A real 3-point gain, 100 examples, 5,000 simulated runs.

Clear win: 7% of runs.
Looked worse or tied: 32%.

An 80 to 83 jump on a small eval tells you less than it feels like.

---

Most evals score two systems as two separate totals. On the same 100 examples (correlation 0.5, assumed):

- Separate totals: interval 21 points, clear win 2.2%
- Pair by pair: interval 15 points, clear win 11.1%

Same data. Only the analysis changed.

---

The bill for catching a real gap 80% of the time, per system:

- 10 points: 202 examples
- 5 points: 933
- 3 points: 2,712

Halve the gap, roughly quadruple the examples.

---

Pairing cuts the interval by 30% at a correlation of 0.5. At 0.3 it's 17%. At 0.7 it's 46%.

It pays most when your two systems mostly agree. Two versions of one prompt probably do.

---

Myth: 500 examples is plenty.

Measured, for a real 3-point gain: 21% of simulated runs showed a clear win at 500, 40% at 1,000.

Below 1,000 examples, a 3-point change is a coin you can't read.

## CTA

EVAL | the eval-size simulation with raw output and the sample-size table | https://github.com/0xadityaa/Portfolio/tree/main/content/research/your-eval-set-is-too-small-to-tell

## Reply prompts

In my simulation, a real 3-point gain on a 100-example eval showed a clear win (95% interval above zero) in 7% of runs. Do you score candidates on the same examples every time?

On small evals: the 95% interval on a 3-point difference at 100 examples came out 21 points wide. Pair-by-pair comparison on the same examples cut it about 30%.

Re "we went from 80 to 83": in my simulation a truly better system looked worse or tied on one 100-example eval in three. How many examples was this run on?

## Substack Note

On 100 examples, a system that's truly 3 points better looked worse or tied in one run out of three.

I simulated it: two systems, 83% against 80%, 5,000 runs at each eval size. At 100 examples the better one scored higher 68% of the time and lower 26%. The 95% interval on the gap was 21 points wide, and only 7% of runs could say "better" with it above zero. At 1,000 examples that rose to 40%.

The cheapest fix is to score both systems on the same examples and compare them pair by pair. Most examples are easy or hard for both, so that noise cancels. With outcomes correlated at 0.5 (my assumption), the interval got about 30% narrower and the examples needed for a 3-point gap halved, to about 1,350.

Simulation, raw output and full tables: https://www.0xadityaa.dev/blog/your-eval-set-is-too-small-to-tell
