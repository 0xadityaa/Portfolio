---
title: 'Is 5% a Day Gentle?'
publishedAt: '2026-10-10T05:18:22Z'
updated: '2026-11-27'
summary: >-
  I found a tiny 5% daily age penalty in my ranking code. After six months it
  crushed a perfect match to 0.0001. Here is the math and why my tests missed it.
tags:
  - algorithms
  - retrieval
  - debugging
  - ai
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/122'
devto_url: 'https://dev.to/0xadityaa/5-a-day-sounds-gentle-it-isnt-1f9h'
---

I found a bug recently that I still find funny, mostly because it looked harmless when I wrote it.

While building [Hivemind](https://gethivemind.xyz), my side-project memory layer for AI tools, I had a ranking function that scores every saved note and picks the best ones to send to the model. Tucked inside that scoring math was one tiny line: an age penalty. Older notes lose 5% of their score per day. Recent context usually matters more, right? Five percent sounds gentle, almost polite.

It was erasing every note older than a month.

**Compounding turns "a little" into "basically zero" much faster than intuition expects, and a test suite can only catch bugs your test data can express.**

## The short version

- A 5% daily penalty compounds into a half-life of just 13.5 days. After six months, a note keeps one ten-thousandth of its original score.
- In my ranking code, a perfect match from two months ago could almost never beat a mediocre note from this morning.
- My benchmark stayed green because every test note had the exact same age: zero.
- I fixed it with a 180-day half-life, a hard floor at 0.35, and test inputs where age actually varies.

## Wait, how bad can 5% really be?

Worse than it sounds. It isn't 5% once. It's 5% of whatever is left, every single day, stacked on top of itself. That's [exponential decay](https://en.wikipedia.org/wiki/Exponential_decay), the same math that governs radioactive isotopes.

Guess first: if a note loses 5% a day, how much of its score is left after six months? "Maybe a third?" sounds plausible. Here is what happens:

| Age of the note | Score multiplier ($$0.95^{\text{days}}$$) |
| --- | --- |
| 1 day | 0.95 |
| 7 days | 0.70 |
| 30 days | 0.21 |
| 90 days | 0.0099 |
| 180 days | 0.0001 |
| 365 days | 0.00000001 |

After thirty days, your note has already lost four fifths of its score. After six months, it is worth one ten-thousandth of an identical note written today. It could match your question word for word and still lose to basically anything you typed this week.

The shortcut: convert any daily percentage into its [half-life](https://en.wikipedia.org/wiki/Half-life). The formula is $$\frac{\ln 0.5}{\ln 0.95}$$, and for 5% a day it gives **13.5 days**. It's the same formula that gave the 95% agent its coin-flip step in [the reliability post](/blog/95-percent-per-step-is-a-coin-flip-by-step-14). Every two weeks the score halves. Six months is thirteen halvings in a row. Fold a piece of paper in half thirteen times and see what's left.

## Two subsystems that disagreed

While that one line was erasing old notes, another part of my codebase was doing the opposite.

I had written a promotion system that tracked how often a note got retrieved. After five uses, it promoted that note to a "long-term" tier. My own code comment called it *earned permanence*.

So one subsystem promoted my most important notes to live forever, while another, a single multiplication I hadn't looked at in weeks, zeroed them out anyway. The silent one won.

## A second bug, ten lines away

Since I was already in the ranking file, I kept reading and found a second bug.

After scoring the notes, my code has to pack the best ones into a fixed token budget. I had been calling this a [knapsack](https://en.wikipedia.org/wiki/Knapsack_problem) packer: pick the highest-value combination that fits. What my code did was sort by raw score and shovel notes in from the top until the budget ran out.

That isn't knapsack packing. That's just top-k with a ceiling. Token size never entered the math, so one bloated 2,000-token note scoring 0.90 would shove out twenty crisp 100-token notes scoring 0.85. Same budget, one note instead of twenty.

![Two bars with the same token budget: sorting by raw score fills it with one 2,000-token note scoring 0.90; packing by value per token fills it with twenty 100-token notes scoring 0.85](/images/blog/top-k-vs-value-per-token.svg "Illustrative, using the example above. See the [research note](https://github.com/0xadityaa/Portfolio/blob/main/content/research/five-percent-a-day-sounds-gentle.md).")

## Why did my benchmark miss all of this?

This part humbled me. I had a benchmark, and the numbers looked great.

They looked great because a benchmark loads every test note at the exact same timestamp. Every note had `age = 0`. Every multiplier evaluated to `1`. I could have set the decay to 99% per day and the score wouldn't have moved by a decimal.

Same story with the packing bug. When all your benchmark notes are roughly the same length, "sort by raw score" and "pack by value per token" pick almost the same set. The test suite wasn't lying. It had no way to express the bug.

## How I fixed both of them

First, I turned age from an executioner into a nudge. Long-term notes don't decay at all, and normal notes follow a 180-day half-life with a floor of 0.35 so age can never bury a great match:

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

The difference across a full year:

![Score multiplier against note age over 365 days: 0.95 to the power of days is half gone by day 13.5 and near zero by six months; the 180-day half-life with a 0.35 floor keeps 68 percent at day 180 and 51 percent at a year](/images/blog/decay-curves.svg "Before is 0.95 to the power of days. After is the 180-day half-life with a 0.35 floor, normal tier. Sources in the [research note](https://github.com/0xadityaa/Portfolio/blob/main/content/research/five-percent-a-day-sounds-gentle.md).")

The numbers side by side:

| Age of the note | Before | After |
| --- | --- | --- |
| 7 days | 0.70 | 0.98 |
| 30 days | 0.21 | 0.93 |
| 90 days | 0.0099 | 0.81 |
| 180 days | 0.0001 | 0.68 |
| 365 days | 0.00000001 | 0.51 |

The floor does the work: the multiplier approaches 0.35 as age grows and never goes below it. A year-old note still holds half its weight (0.51). If it's the best answer to your question, it still wins.

For the packing bug, I switched to ranking candidates by value per token (score divided by size), filling greedily, and running a quick swap pass so small notes can't block one high-value note. On fifty candidates, it runs in microseconds.

## Where I'd stop trusting this post

**Those constants are educated guesses.** A 180-day half-life and a 0.35 floor aren't laws of physics. I put them in one config file so I can tune them once I have real longitudinal data, and I expect them to move.

**Greedy plus swap isn't mathematically optimal.** Exact [dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming) is cheap enough at fifty items, and I could switch to it. I haven't yet because I haven't seen it change a real output.

**Stuffing in more notes isn't always better.** Twenty tiny notes give the model twenty separate threads to juggle, and LLMs still struggle with [facts tucked in the middle of a long context](https://arxiv.org/abs/2307.03172). Packing the right set is only half the puzzle; ordering them matters too.

**Sometimes fast decay is a feature.** If you're building a scratchpad for this week's sprint, you *want* last month's notes to fade away. My mistake wasn't adding decay. My mistake was applying steep decay to everything, including long-term facts.

## The takeaway

This bug left me with two habits.

First, whenever I catch myself writing "a small percentage, applied repeatedly", I stop and calculate the half-life right there. It takes ten seconds and has saved me from bad math more than once.

Second, for every signal inside a ranking function, I check whether my test data actually varies on that axis. If a signal is constant across your test set, it's untested, however green CI looks.
