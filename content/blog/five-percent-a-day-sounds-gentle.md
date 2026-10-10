---
title: 5% a Day Sounds Gentle. It Isn't.
publishedAt: '2026-10-10T05:18:22Z'
summary: >-
  I found a tiny age penalty in my ranking code: 5% a day. After six months it
  scored a perfect match at 0.0001. The maths, and why my tests never noticed.
tags:
  - algorithms
  - retrieval
  - debugging
  - ai
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/122'
devto_url: 'https://dev.to/0xadityaa/5-a-day-sounds-gentle-it-isnt-1f9h'
---

I found a bug recently that I can't stop thinking about, mostly because it was one innocent-looking line.

I've been building a memory layer for AI tools ([Hivemind](https://gethivemind.xyz), if you're curious). Part of its job is ranking: you ask a question, it scores every saved note, and the best ones get sent to the model. Somewhere in that scoring was a small age penalty. Older notes lose 5% of their score per day. Recent stuff matters more. Seems fair.

It was quietly destroying everything older than a month.

The lesson I took, and the reason I'm writing this down: **compounding turns "a little" into "everything" much faster than your gut says, and a test can only catch a bug its data is able to express.**

## The short version

- A 5% daily penalty compounds. It halves a score every 13.5 days and leaves one ten-thousandth after six months.
- In my ranking code that meant any note older than a couple of months could never win, however well it matched.
- The benchmark missed it because every test note was the same age: zero.
- The fix is a half-life in months with a floor underneath, and a test input where age actually varies.

## How bad can 5% be?

Bad. The trick is that it's 5% of what's left, every single day. That's [exponential decay](https://en.wikipedia.org/wiki/Exponential_decay), the same maths as radioactive stuff.

Go on, guess what a note is worth after six months. "Maybe a third" feels about right, doesn't it? Here's the real answer:

| Age of the note | Score multiplier (0.95 ^ days) |
| --- | --- |
| 1 day | 0.95 |
| 7 days | 0.70 |
| 30 days | 0.21 |
| 90 days | 0.0099 |
| 180 days | 0.0001 |
| 365 days | 0.00000001 |

After a month, a note has lost four fifths of its score. After six months it's worth one ten-thousandth of an identical note written today. It could match the question word for word and still lose to basically anything from this week.

A handy way to feel this: 5% a day is a [half-life](https://en.wikipedia.org/wiki/Half-life) of about 13.5 days. Every two weeks, half of what was left is gone. Thirteen halvings in six months. Nothing survives thirteen halvings.

## The funny part

A different part of the same system was doing the exact opposite.

It tracked how often each note got used, and after five uses it promoted the note to a "long-term" tier. The comment in the code literally called it earned permanence.

So one piece of code was carefully deciding which notes deserved to live forever. And another piece, a single multiplication nobody had looked at in ages, was killing them anyway. Two subsystems, opposite policies, and the quiet one won.

## And there was a second one hiding next to it

While I was in there I found its sibling.

The system is supposed to fit the most useful notes into a fixed token budget. I'd been calling that a [knapsack](https://en.wikipedia.org/wiki/Knapsack_problem): pick the most valuable set that fits. What the code actually did was sort by score and fill from the top until the budget ran out.

That's not packing. That's top-k with a cutoff. Cost never enters into it, so one 2,000-token note scoring 0.9 would shove out twenty 100-token notes scoring 0.85. Same budget. One answer where there could've been twenty.

## Why didn't the tests catch any of this?

This is the bit that gets me, because I had a benchmark and it looked great.

It looked great because every note in a benchmark run gets loaded at the same moment. Every age is zero. Every multiplier is 1. I could have set the decay to 99% a day and the score wouldn't have moved.

Same story for the packing bug. If your test notes are all about the same length, "sort by score" and "pack by value" pick nearly the same set.

The benchmark wasn't wrong. It just had no way to see the thing that was broken.

## What I changed

**Age is a nudge now.** A half-life measured in months, with a floor that age can never push a note below:

```ts
// Simplified from the real thing.
function recencyMultiplier(tier: Tier, days: number): number {
  // Long-term notes don't decay. That's what the tier means.
  if (tier === "longterm") return 1;

  const halfLife = 180; // days
  const floor = 0.35; // age can never push a note below this
  return floor + (1 - floor) * 0.5 ** (days / halfLife);
}
```

Same ages, both curves:

| Age of the note | Before | After |
| --- | --- | --- |
| 7 days | 0.70 | 0.98 |
| 30 days | 0.21 | 0.93 |
| 90 days | 0.0099 | 0.81 |
| 180 days | 0.0001 | 0.68 |
| 365 days | 0.00000001 | 0.51 |

![Chart: with 5% daily decay a note's score is near zero within two months, while a 180-day half-life with a 0.35 floor still keeps 0.68 after six months](/images/blog/decay-curves.svg)

A year-old note keeps about half its weight. If it's the best match, it still wins.

**Packing actually packs.** Candidates get ranked by value per token (score divided by size) and added greedily, then a swap pass puts back any high-value note the small ones were blocking. It takes microseconds on fifty candidates.

## Where I'd stop trusting this post

**Every constant in there is a guess.** 180 days and 0.35 aren't measured truths. They live in one config so I can sweep them later, and I fully expect them to move.

**Greedy isn't optimal.** Value-per-token plus a swap gets within a constant factor of the best possible set. Exact dynamic programming is affordable at this size. I haven't seen it change a result, so I haven't switched.

**More notes isn't always better.** Twenty small notes mean twenty things for the model to read, and models are [worse at the middle of a long context](https://arxiv.org/abs/2307.03172). Packing is only half the job. Ordering matters too.

**Sometimes you want things to fade fast.** If it's a scratchpad for this week's task, steep decay is a feature. My bug wasn't that decay existed. It ran on everything, including stuff the system had already decided to keep.

## The takeaway

Two habits I'm keeping.

First, whenever I see "a small percentage, repeatedly", I stop and work out the half-life. It takes one line and it has embarrassed me every time.

Second, for every signal that feeds a ranking, I go find the test input where that signal isn't a constant. If I can't find one, the signal is untested, however green the suite looks.
