---
title: A Folder That Contains Nothing Is a Lie
publishedAt: '2026-10-25T13:00:00Z'
summary: 'Folders make you decide where something belongs before you know where you''ll need it. I made that bet in a side project and it broke the whole point of it.'
tags:
  - architecture
  - design
  - data-modeling
  - ai
preview: true
---

Have you ever noticed that Gmail doesn't have folders?

It has [labels](https://support.google.com/mail/answer/118708). An email can carry three labels, or none, and "removing" one doesn't delete anything. I never thought much about why, until I ran into the exact problem labels solve.

Here's what I learned, and I learned it by getting it wrong: **a folder makes you decide where something belongs at the moment you save it. That's a bet on where you'll need it later, and for some kinds of data you lose that bet constantly.**

## The short version

- A folder is a decision made at write time about where you'll need something later.
- I filed every note by where it was written. Ask from anywhere else and the note was invisible, which broke the one thing the project was for.
- The fix: search everything, and treat "where it was written" as a ranking hint, not a wall.
- If a name in your interface promises containment and the system doesn't contain, rename it.

## The design that looked totally fine

I've been building a memory layer for AI tools called [Hivemind](https://gethivemind.xyz). The idea is that you tell one tool something and your other tools already know it.

My first data model was the obvious one. Every note gets a folder when it's written. Every search looks inside exactly one folder. Projects stay separate, results stay relevant, and everybody understands folders. Lovely.

Then I made saving automatic. Nobody wants a "where should I file this?" popup every time they say something worth keeping. So the folder had to be guessed from wherever you were:

- In a coding tool, connected over [MCP](https://modelcontextprotocol.io): the repo you're in.
- In a browser chat: the site you're on.

Still sounds reasonable, right?

## The bug you can't fix with code

Now walk through the one thing the project exists to do:

| Step | What happens | Folder |
| --- | --- | --- |
| 1 | In Claude Code, inside `acme/payments`, you say you're migrating off Stripe Checkout | `acme/payments` |
| 2 | Later, in ChatGPT, you ask about the migration | `chatgpt.com` |
| 3 | The search looks in one folder | `chatgpt.com` |
| 4 | Result | Nothing. The note never comes back. |

The note is sitting right there in the database. The search will never see it, because it's in a different folder.

That's not an edge case. That's the entire point of the thing, blocked by the storage model. And no ranking tweak can save you, because the note gets excluded before ranking even runs.

Two smaller cracks pointed the same way. A company-wide convention you happen to mention inside one repo isn't a fact about that repo. And "the site you're on" says almost nothing about which project is in your head.

## Decide at read time

The fix was to stop filing things.

Notes don't go anywhere now. Every search looks at everything. What used to be a folder became a saved search, the same move as Gmail's labels or a [database view](https://en.wikipedia.org/wiki/View_(SQL)): a named way of looking at the data, not a box the data lives in.

![Diagram: with folders the note sits behind a wall the search never crosses, and with views there is one store where the note's origin only adjusts its rank](/images/blog/wall-vs-weight.svg)

The "where was this written" signal didn't get thrown away. It got demoted from a wall to a weight. Each note still remembers where it came from, and if you ask from that same place, notes from there rank a bit higher. They're just never the only thing you can get.

```ts
const work = hm.withOrigin("acme");
await work.remember({ content: "Staging runs Postgres 16" });
```

Ask from `acme` and that note gets a boost. Ask from anywhere else and it can still show up, if it's the best answer.

## Why I had to rename it too

I could've kept calling them folders. Everyone knows what a folder is.

And that's the problem. If you take something out of a folder, you expect it to be gone from somewhere. With a saved search it isn't, because it was never "in" there. The name promises containment and the system can't deliver it. Keep the name, keep the broken promise.

So the word is "view" now, everywhere.

I also resisted reviving an older name I'd already retired once. Recycling dead vocabulary is how I ended up with one word, "session", meaning two unrelated things in the same schema: a stretch of work, and a browser login. That's exactly as confusing as it sounds.

## Where I'd stop trusting this post

**A weight is not a wall.** If you need hard separation, say client A's context must never show up while you're working for client B, ranking won't give you that. A preference isn't a boundary. For real isolation you need a real partition, like separate accounts.

**Searching everything costs you.** With no folder to shrink the haystack, your relevance cutoff has to be good, or unrelated projects leak into each other's answers. I traded a structural guarantee for a quality problem. I think it's the right trade here. It's still a trade.

**Folders are great for plenty of things.** Files, photos, anything you'll go looking for yourself. Hierarchies are how people navigate. This is about data that has to find you, somewhere you didn't predict.

**"Decide at read time" can go too far.** [Schema-on-read](https://en.wikipedia.org/wiki/Data_lake) is the same idea taken to its limit, and plenty of data lakes turned into swamps that way. Some structure at write time is what keeps data usable.

## The takeaway

Any time you pick a container when something is saved, you're predicting the future. For things a person will go fetch, that's fine. For things that have to turn up on their own, the prediction is wrong often enough to break what you're building.

My rule now: decide at read time when you can, and keep the write-time signal as a hint, never a gate. And if a name in your interface promises something the system doesn't do, change the name before a user finds out for you.
