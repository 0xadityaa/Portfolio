---
title: Empty Folders Are Lies
publishedAt: '2026-10-10T05:28:22Z'
updated: '2026-11-27'
summary: >-
  Folders force you to guess where you'll need a note before you know. I built
  that into my side project and it broke the whole point of it.
tags:
  - architecture
  - design
  - data-modeling
  - ai
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/122'
devto_url: 'https://dev.to/0xadityaa/a-folder-that-contains-nothing-is-a-lie-5gnp'
---

Have you ever stopped to wonder why Gmail doesn't have folders?

It has [labels](https://support.google.com/mail/answer/118708). One email can wear three labels at once, or none at all, and peeling a label off doesn't delete the message. For years I assumed that was a quirky Google UI choice. Then I built a side project and hit the exact problem labels exist to solve.

**A folder forces you to decide where something belongs at the moment you save it. That's a bet on where you'll need it later, and for some kinds of data you lose that bet constantly.**

## The short version

- A folder is a write-time bet about where you'll go looking later.
- In my AI memory project, I filed every note by the app or repo where it was written. Ask from anywhere else and the note vanished, which defeated the point of the product.
- The fix was to drop the walls, search everything at read time, and demote "where it was written" from a hard filter to a ranking weight.
- When a word in your UI promises containment and your system doesn't actually contain, rename it before your users get burned.

## The data model that looked reasonable

I've been building a shared memory layer for AI tools called [Hivemind](https://gethivemind.xyz). The whole pitch is simple: tell one AI tool something about your work, and your other AI tools already know it.

My first schema was the obvious one. Every note goes into a folder when it's saved. Every search looks inside one folder. Projects stay tidy, results stay relevant, and everyone understands folders. Clean, right?

Then I made saving automatic. Nobody wants a "Which folder?" modal popping up mid-thought. So I inferred the folder from wherever you happened to be:

- Inside a coding agent connected over [MCP](https://modelcontextprotocol.io): the git repo you're in.
- Inside a browser chat: the website you're on.

Still clean on paper. Then I used it.

## The bug no ranking algorithm could fix

Here is the most basic thing my app is supposed to do:

| Step | What happens | Folder |
| --- | --- | --- |
| 1 | In Claude Code, inside `acme/payments`, I mention we're migrating off Stripe Checkout | `acme/payments` |
| 2 | Later that afternoon, in ChatGPT, I ask about the migration plan | `chatgpt.com` |
| 3 | Search looks inside one folder | `chatgpt.com` |
| 4 | Result | Nothing. Zero notes returned. |

The note was sitting right there in the database. My search could never see it because it lived on the other side of a folder wall.

That wasn't an edge case. It was the *reason I built the project*, defeated by my own storage model. No embedding model or reranker could rescue it, because the folder filter was a `WHERE` clause that ran before ranking, so the note never reached it.

Two other cracks showed up fast. A company-wide coding convention I happened to mention inside one repo isn't really about that repo. And "which website tab I have open" tells you almost nothing about which project is actually in my head.

## Demote the wall to gravity

The fix was simple once I stepped back: stop filing things into boxes.

Now notes don't live inside folders at all. They sit in one space, and every search looks across all of it. What used to be a folder became a saved view, just like Gmail's labels or a [database view](https://en.wikipedia.org/wiki/View_(SQL)): a lens for looking at your data, not a locked box the data gets trapped inside.

![With folders, a note filed under acme/payments is invisible to a query from chatgpt.com and returns 0 notes; with views the same query finds it](/images/blog/wall-vs-weight.svg "The Stripe scenario from the table above, before and after dropping the folder filter.")

I didn't throw away the "where was this written?" signal. I demoted it from a hard filter to a ranking weight. Every note still remembers its origin. If I'm asking from `acme`, notes from `acme` get a ranking boost. If I'm asking from ChatGPT, a strong match from `acme` can still win.

```ts
const work = hm.withOrigin("acme");
await work.remember({ content: "Staging runs Postgres 16" });
```

Ask from `acme` and that note gets a boost. Ask from anywhere else and it still shows up when it's the right answer.

## Why I had to kill the word "folder" too

I was tempted to keep calling them folders in the UI. Everyone knows what a folder is, so why invent a new word?

Because words make promises. If you remove a note from a folder, you expect it to be gone from somewhere. With a saved view, it isn't gone, because it was never "inside" the view to begin with. Keeping the word "folder" meant misdescribing the system to my own users.

So I renamed it to "view" everywhere.

I also resisted the lazy urge to recycle an older term I had already retired. Reusing dead vocabulary is how I once ended up with "session" meaning two unrelated things in one schema: a stretch of work, and a browser login. Future-you will not thank you.

## Where I'd stop trusting this post

**Gravity is not a security boundary.** If you need strict isolation, like making sure Client A's private context can *never* leak while you're working for Client B, a ranking weight won't save you. A preference isn't a wall. For real isolation, use real partitions: separate workspaces or accounts.

**Searching everything raises the bar on relevance.** Without folders shrinking the haystack, your relevance cutoff has to be good, or unrelated projects bleed into each other. I traded a structural guarantee for a ranking problem. I think it's the right trade here, but it is a trade.

**Folders are still right for plenty of things.** Source files, photos, tax receipts: anything a human is going to walk over and browse by hand. Hierarchies are good for navigation. This post is specifically about data that has to find *you* in places you didn't predict.

**"Decide at read time" can go too far.** Push [schema-on-read](https://en.wikipedia.org/wiki/Data_lake) to the extreme far enough and you get a data swamp. Some structure at write time keeps data sane.

## The takeaway

Every time you force a piece of data into a container at write time, you're making a prediction about the future. When a person is going to browse for it later, that bet usually pays off. When a system has to surface it automatically somewhere new, that bet breaks the feature.

My rule now is simple: decide at read time whenever you can, keep write-time context as a ranking hint instead of a gate, and if a word in your UI promises containment your database doesn't enforce, change the word before a user learns the difference for you.
