---
title: I Got Tired of Re-Explaining Myself to Every AI Tool
publishedAt: '2026-10-10'
summary: 'So I built Hivemind: one memory that Claude Code, Cursor and ChatGPT all read and write. What it does, how a recall works, and where it''s weak.'
tags:
  - ai
  - llm
  - mcp
  - hivemind
draft: true
---

My week used to go like this. Monday, I tell Claude Code how my project is set up. Tuesday, I open Cursor and explain it again. Wednesday, I paste the same paragraph into ChatGPT, because of course it has no idea either. Every tool is brilliant and every tool has amnesia.

So I built the thing I wanted. It's called [Hivemind](https://gethivemind.xyz), and the claim behind it is simple: **the missing piece in my AI setup wasn't a smarter model. It was a memory that doesn't belong to any single tool.**

## The short version

Hivemind is one memory that all your AI tools read and write. Tell one of them something once and the others already know. It connects to coding tools over [MCP](https://modelcontextprotocol.io), to chat sites through a browser extension, and to your own agents through an SDK.

The setup for coding tools is one command:

```bash
npx @get-hivemind/cli init
```

It signs you in, finds the AI clients on your machine, and writes each one's config for you. Nothing to copy, nothing to paste.

## What it looks like when it works

You're in Claude Code on Monday:

> We cap deploys at three a month.

Friday, different tool, different window:

> How often can we deploy?

And it just answers. You didn't repeat yourself, you didn't paste anything, and you didn't maintain a rules file in four different formats.

If you change your mind later ("make it five"), the old memory gets retired and the new one takes over. You can see what changed.

## It's the same memory from code, too

The tools aren't special. They use the same API you can call yourself:

```ts
import { Hivemind } from "@get-hivemind/sdk";

const hm = new Hivemind({ apiKey: process.env.HIVEMIND_API_KEY });

await hm.remember({ content: "Newsletters go out on Tuesdays" });

const { payload } = await hm.recall({ q: "When do we send the newsletter?" });
```

## Storing is the easy part

Anyone can save sentences to a database. The hard part is deciding what to send back, and what to leave out. A memory tool that stuffs your context window is worse than no memory tool.

So every recall goes through the same four steps (the [retrieval docs](https://gethivemind.xyz/docs/concepts/retrieval) have the long version):

1. **Search two ways at once.** A keyword search and a meaning-based search run together, and the results get fused, so something both agree on beats either one's favourite.
2. **Cut the junk.** If nothing is close enough, you get nothing back. An empty answer is the right answer to a question your memory has nothing to say about.
3. **Pack to a budget.** You give it a token ceiling and it picks the most valuable set that fits. Not "the top ten, whatever they cost".
4. **Order it for attention.** Models read the start and end of a long context much better than the middle (there's [a whole paper on that](https://arxiv.org/abs/2307.03172)), so the best stuff goes where it'll get read.

By default a recall adds at most 1,500 tokens to your context. I wrote up [what each piece costs](https://gethivemind.xyz/docs/concepts/context-cost) because "trust me, it's small" isn't an answer.

## Does it actually work?

I didn't want to hand-wave this, so I measured it. The test is [LoCoMo](https://arxiv.org/abs/2402.17753), a public set of long conversations with questions about them. I ran it against the live service, not a lab copy: 330 questions across all ten conversations.

| Question type | Found the memory it needed |
| --- | --- |
| Single fact | 82.2% |
| When something happened | 78.7% |
| Combining several facts | 73.0% |
| Open-ended | 57.1% |
| **Overall** | **78.2%** (95% interval 73.4% to 82.3%) |

A plain keyword search finds about 15 points less on the same questions. The full write-up, caveats included, is on the [evidence page](https://gethivemind.xyz/docs/concepts/evidence).

## Where I'd stop trusting this post

**That number is retrieval, not answers.** It says the right memory came back. It doesn't say the model then answered correctly. That part depends on the model you're using.

**It's one benchmark, in English.** Your projects aren't LoCoMo. The honest test is the retrieval inspector in the dashboard, which shows exactly what a tool would be sent for your question, and what got left out.

**Multi-step questions are the weak spot.** Anything that needs several conversations stitched together does worse, and the open-ended group is small, so 57.1% is a rough figure.

**It's not the cheapest option.** Just sending raw conversation turns uses slightly fewer tokens per question. Hivemind wins on finding the answer, not on size.

**And I'm the guy who built it.** Read all of the above with that in mind.

## The takeaway

I think memory is going to stop being a feature of one chat app and become a layer underneath all of them. Your context shouldn't be locked inside whichever tool you happened to type it into.

Here's the test I'd use, on Hivemind or anything like it: tell one tool a fact, then ask a different tool a question that depends on it. If it answers without being told again, the memory is real. If it doesn't, nothing else on the feature list matters.

It's live and free to start at [gethivemind.xyz](https://gethivemind.xyz). Break it and tell me how.
