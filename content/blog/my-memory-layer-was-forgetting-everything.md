---
title: My Memory Layer Was Quietly Forgetting Everything
publishedAt: '2026-10-10'
summary: 'Hivemind decayed every memory 5% a day, compounding. At six months a perfect match scored 0.0001. My benchmark never noticed. Here''s why, and the fix.'
tags:
  - ai
  - retrieval
  - hivemind
  - debugging
draft: true
---

I'm building [Hivemind](https://gethivemind.xyz), a memory layer for AI tools. The whole pitch is that it remembers what you told it months ago.

So it was a bit awkward to open the selection code one day and find that it was aggressively forgetting everything older than a few weeks. Two bugs, both in the stage that decides what actually gets sent to the model, both invisible to my benchmark.

What I took from it: **a benchmark can only catch the bugs its data is able to express.** Mine couldn't express "old", so it happily scored a system that threw old things away.

## Bug one: the packing that never packed

Hivemind's job on every recall is to fit the most useful memories into a hard token budget. I'd been describing that as a [knapsack](https://en.wikipedia.org/wiki/Knapsack_problem): choose the most valuable set that fits, not just the top few.

Here's what the code did. It sorted candidates by score and filled the budget from the top until it ran out.

That's top-k with a budget cutoff. Token cost never entered the ordering. So one 2,000-token memory scoring 0.9 would shove out twenty 100-token memories scoring 0.85. Same budget, one answer where there could have been twenty.

The thing I was telling people made it different from everybody else? It wasn't happening.

## Bug two: 5% a day, forever

The second one is worse. Every score got multiplied by an age penalty: 5% per day, compounding. Sounds gentle. It isn't. Here's the arithmetic:

| Age of the memory | Multiplier (0.95 ^ days) |
| --- | --- |
| 7 days | 0.70 |
| 30 days | 0.21 |
| 90 days | 0.0099 |
| 180 days | 0.0001 |

A memory from six months ago scored one ten-thousandth of an identical one written today. It could match your question perfectly and it would still lose to almost anything recent.

And here's the funny part. A different part of the system was doing the opposite. It promoted a memory to "long-term" once it had been used five times, and called that tier earned permanence. So one subsystem was carefully deciding what deserved to live forever, while another one, the one nobody reads, was quietly killing it anyway.

Two subsystems, opposite policies. The quiet one won.

## Why the benchmark missed it

This is the part that stung. I had a retrieval benchmark and it looked fine.

It looked fine because every memory in a benchmark run gets ingested at the same moment. Every age is zero. Every multiplier is 1. The decay curve could have been anything at all and the score wouldn't have moved.

Same for the packing bug, mostly. If your test memories are all roughly the same length, "sort by score" and "pack by value" pick almost the same set.

The test wasn't wrong. It just had no way to see the thing that was broken.

## The fix

**Pack by value per token.** Selection now scores every candidate, then packs greedily by density (score divided by tokens), followed by a swap pass that puts back a high-value item the small ones were blocking. It runs in microseconds on fifty candidates.

**Make age a nudge, not an execution.** The 5% curve is gone. The replacement is a half-life with a floor underneath it:

```ts
// Simplified from the real thing.
function recencyMultiplier(tier: Tier, days: number): number {
  // Long-term memories don't decay. That's what the tier means.
  if (tier === "longterm") return 1;

  const halfLife = 180; // days
  const floor = 0.35; // age can never push a memory below this
  return floor + (1 - floor) * 0.5 ** (days / halfLife);
}
```

Same ages, new curve:

| Age of the memory | Old multiplier | New multiplier |
| --- | --- | --- |
| 7 days | 0.70 | 0.98 |
| 30 days | 0.21 | 0.93 |
| 90 days | 0.0099 | 0.81 |
| 180 days | 0.0001 | 0.68 |
| 365 days | 0.00000001 | 0.51 |

A year-old memory now keeps about half its weight. If it's the best match, it still wins. Recent stuff gets a small edge, which is all recency ever deserved.

**Count tokens for real.** The budget is a promise to whoever's calling, so selection counts tokens with an actual tokenizer now, not `characters / 4`. That shortcut is off by different amounts for code and JSON, and code and JSON are exactly what a developer's memory is full of.

## Where I'd stop trusting this post

**Every constant up there is a hypothesis.** 180 days, 0.35, all of it. They're collected in one config so a test harness can sweep them, not because I think they're right.

**Density-greedy isn't optimal.** It's within a constant factor of the best answer for this shape of problem, and exact dynamic programming is affordable at this size. I haven't shown the difference matters on any metric, so I haven't switched.

**"Lost in the middle" cuts both ways.** Packing more small memories into the same budget means more items for the model to read, and models are [worse with the middle of a long context](https://arxiv.org/abs/2307.03172). That's why ordering is its own step after packing. It's also a reason not to assume twenty beats one every time.

**Maybe forgetting is right for you.** If your memory is a scratchpad for this week's task, a steep decay is a feature. The bug wasn't that decay existed. It's that it ran on everything, including what the system had already decided to keep.

## The takeaway

Before you trust a benchmark, ask what it physically can't see. Mine had no notion of time, so anything time-shaped was free to be broken.

The check I run now is boring and it works: for every signal that touches ranking, find the test input where that signal isn't a constant. If there isn't one, the signal is untested, however green the suite looks.

If you want to poke at the result, the [retrieval inspector](https://gethivemind.xyz/docs/concepts/retrieval) shows what a recall sent and what it left out, and the numbers I'm willing to stand behind are on the [evidence page](https://gethivemind.xyz/docs/concepts/evidence).
