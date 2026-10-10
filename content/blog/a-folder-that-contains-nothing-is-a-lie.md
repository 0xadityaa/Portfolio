---
title: A Folder That Contains Nothing Is a Lie
publishedAt: '2026-10-10'
summary: 'Hivemind filed every memory into a folder when it was written. That one decision broke the only promise the product makes. Here''s what replaced it.'
tags:
  - architecture
  - ai
  - hivemind
  - product
draft: true
---

[Hivemind](https://gethivemind.xyz), the thing I'm building, makes exactly one promise: tell one AI tool something, and your other tools already know it.

For a while, my own data model made that impossible. Not flaky. Impossible, by design. And the design looked completely reasonable when I wrote it.

The lesson, up front: **if you sort things into containers at write time, you're betting you know where they'll be needed. For a memory, you don't.**

## The reasonable-looking design

Every memory got a folder when it was written. Every search looked inside exactly one folder. Projects stay separate, results stay relevant, everyone understands folders. Lovely.

Then I made capture silent. You don't get asked "where should I file this?" every time you say something worth keeping, because nobody would put up with that. So the folder had to be inferred from wherever you were:

- In a coding tool, connected over [MCP](https://modelcontextprotocol.io): the repo you're in.
- In a browser chat: the site you're on.

Still sounds fine, right?

## The bug you can't fix with code

Walk through the one thing the product exists to do:

| Step | What happens | Folder |
| --- | --- | --- |
| 1 | In Claude Code, inside `acme/payments`, you say you're migrating off Stripe Checkout | `acme/payments` |
| 2 | Later, in ChatGPT, you ask about the migration | `chatgpt.com` |
| 3 | The search looks in one folder | `chatgpt.com` |
| 4 | Result | Nothing. The memory doesn't come back. |

The memory is sitting right there in the database. The search will never see it, because it's in a different folder.

That's not an edge case. That's the headline feature, structurally blocked by the storage model. No ranking tweak fixes it, because the memory gets excluded before ranking ever runs.

Two smaller problems pointed the same way. A company-wide convention you happen to mention inside one repo isn't a fact about that repo. And "the site you're on" tells you almost nothing about which project you're thinking about.

## What replaced it: views

Memories aren't filed anywhere now. Every search looks at everything you've kept.

What used to be a folder is a **view**: a saved search. A memory can show up in several views, in one, or in none. Deleting a view deletes the saved search and never touches a memory. The [views docs](https://gethivemind.xyz/docs/concepts/views) say it in one line: views don't contain anything.

The "where was this written" signal didn't get thrown away. It got demoted from a wall to a weight. Every memory still carries its origin (the repo, the page, the tool), and when you ask from that same place, results from there rank higher. They're just never the only thing you can get.

In code it looks like this:

```ts
const work = hm.withOrigin("acme");
await work.remember({ content: "Staging runs Postgres 16" });
```

Ask from `acme` and that memory gets a boost. Ask from anywhere else and it can still show up if it's the best answer.

## Why I renamed it too

I could have kept calling them folders. People know what a folder is.

That's exactly the problem. If you remove something from a folder, you expect it to be gone from somewhere. With a saved search, it isn't, because it was never "in" there. The name promises containment and the system can't deliver it. Keep the name and you keep the broken promise.

So "folder" is retired, and the word is "view" everywhere: docs, dashboard, API.

I also didn't bring back an older name I'd already retired once. Reusing dead vocabulary is how I ended up with one word, "session", meaning two unrelated things in the same schema (a stretch of work, and a browser login). Never again.

## Where I'd stop trusting this post

**A weight is not a wall.** If you need hard separation, say client A's context must never appear while you work for client B, ranking won't give you that. Origin is a preference. The real boundary in Hivemind is the account: one account's data is isolated from every other's. Inside an account, everything is searchable on purpose.

**Searching everything isn't free.** With no partition to shrink the haystack, the relevance cutoff has to be good, or unrelated projects leak into each other's answers. That's the trade I took, and it puts more weight on [retrieval](https://gethivemind.xyz/docs/concepts/retrieval) being strict about returning nothing when nothing fits.

**The inference still has a blind side.** Origin is a strong signal in a repo and a weak one in a browser tab. Making it a ranking weight means the weak side does less damage. It doesn't make it smart.

**Folders are right for lots of things.** Files, photos, email you'll go looking for yourself. This is about data that has to find you, in a place you didn't predict.

## The takeaway

When you pick a container at write time, you're predicting the future. For stuff a person will go looking for, that's fine. For stuff that has to turn up on its own, in a tool you weren't using when you saved it, the prediction is wrong often enough to break the product.

My rule now: decide at read time whenever you can. Keep the write-time signal as a hint, never as a gate. And if a name in your interface promises something the system doesn't do, change the name before a user finds out for you.
