---
title: 'Why Does AI Forget You?'
publishedAt: '2026-10-10T05:08:22Z'
updated: '2026-11-27'
summary: >-
  LLMs don't remember anything. "Memory" is just text an app quietly pastes into
  your prompt. Here is how that works, why it stays trapped, and what I measured.
tags:
  - ai
  - llm
  - memory
  - retrieval
devto_url: 'https://dev.to/0xadityaa/why-does-every-ai-tool-forget-you-3i26'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/122'
---

This drove me nuts for months. I spend ten minutes telling Claude Code how my repo is structured and why I avoid a certain pattern. The next morning I open Cursor and explain it all again. Then I tab over to ChatGPT for a sanity check and paste the same paragraph a third time.

These models can write distributed systems and debug race conditions. So why do they have the memory of a goldfish?

So I went digging. **A language model doesn't remember anything. Every "memory" feature you've seen is an app pasting text into your prompt right before the model sees it.**

## The short version

- An LLM is a stateless function. It keeps zero state between calls, and a chat only feels continuous because the app resends the whole conversation every time you hit enter.
- "Memory" is a search over saved notes, followed by an invisible paste into your prompt.
- Those saved notes are trapped inside each app's database, which is why Cursor has no clue what you told ChatGPT yesterday.
- I tested four ways to pick which notes to paste on 1,536 benchmark questions. Fusing keyword search and meaning search found the right note 79.5% of the time, with 40x fewer tokens than pasting everything.

## Wait, the model really remembers nothing?

Nothing. Picture a pure function: text goes in, text comes out, and when it finishes answering, its state resets.

A chat thread feels like a conversation only because the app fakes it. The API takes the full message list on every call and keeps nothing between requests. Every time you send a new message, the app bundles up your entire chat history and sends the whole stack back into the [context window](https://docs.anthropic.com/en/docs/build-with-claude/context-windows), which is the fixed bucket of text the model can look at in one shot. Once the thread gets too long for that bucket, the app has to chop off or summarize older messages. That is when your AI "forgets" the decision you made an hour ago.

Open a brand new chat, and the bucket is empty again. Hello, goldfish.

## What "memory" actually is

Think of an exam where you can't remember anything from yesterday, so a friend slips a sticky note onto your desk before each question.

That is all AI memory is: a database and an invisible paste. When an app says it remembers you, three steps happen behind the curtain:

1. Earlier on, the app saved a few short facts about you in a database. Things like "Prefers TypeScript" or "Runs Postgres 16 in staging."
2. When you type a new question, the app runs a quick search over those saved notes to find the ones that look relevant.
3. It pastes the winning notes right above your question, invisibly, before handing the combined prompt to the model.

![A saved note is found by search and pasted above the question, so the model receives one prompt and keeps nothing between calls](/images/blog/memory-is-a-paste.svg "An illustrative example: the note and the question are made up to show the flow.")

Under the hood, it's [retrieval-augmented generation](https://en.wikipedia.org/wiki/Retrieval-augmented_generation) pointed at your own notes. The model isn't recalling a memory from its weights. It's reading a cheat sheet the app slipped onto its desk a millisecond ago.

## Why your other tools still have no idea who you are

Once you see the trick, the cross-app amnesia makes sense. Each app keeps its own cheat sheet in its own drawer.

ChatGPT's notes sit on OpenAI's servers. Your code editor keeps its own rules file. Your terminal agent reads a different markdown file in a different format. None of them can peek into each other's drawers, which makes you the sync layer, repeating yourself across four windows.

[MCP](https://modelcontextprotocol.io) is starting to bridge that gap. If your tools can all talk to one shared server, your cheat sheet doesn't have to live inside any single app anymore.

## The part I wanted to test

Saving facts about yourself is the easy part. The hard part is step two: deciding *which* notes belong on the cheat sheet for this specific question.

Paste too little, and the model flies blind. Paste everything you've ever said, and you burn your token budget on trivia. Models also get measurably [worse at noticing facts buried in the middle](https://arxiv.org/abs/2307.03172) of a huge prompt anyway.

I wanted numbers. I've been building a shared memory layer on the side called [Hivemind](https://gethivemind.xyz), which is that cross-tool cheat sheet. I pointed it at [LoCoMo](https://arxiv.org/abs/2402.17753), a public benchmark of long conversations and questions about them, and tested four ways of picking ten notes per question across the same 1,536 questions. The sources and caveats are in the [research note](https://github.com/0xadityaa/Portfolio/blob/main/content/research/why-ai-tools-forget-you.md).

| How the notes get picked | Found the note with the answer | Tokens pasted per question |
| --- | --- | --- |
| Paste the whole conversation | 99.7% | 18,853 |
| Keyword search ([BM25](https://en.wikipedia.org/wiki/Okapi_BM25)) | 63.9% | 349 |
| Meaning search (embeddings) | 70.4% | 389 |
| Both searches fused, then filtered and packed | 79.5% | 465 |

![Bars of tokens pasted per question: 18,853 for pasting everything against 465 for both searches fused, with how often each found the note](/images/blog/retrieval-tokens-vs-recall.svg "Same 1,536 LoCoMo questions, ten notes per question, offline harness. Sources and caveats in the [research note](https://github.com/0xadityaa/Portfolio/blob/main/content/research/why-ai-tools-forget-you.md).")

Three things stand out.

First, **pasting everything "wins", and it's a trap.** It finds the answer 99.7% of the time because the answer is somewhere inside 18,853 tokens of noise. That is forty times the token cost on every question, forever. Over 1,000 questions it is 18.9 million input tokens against 465 thousand.

Second, **keyword search is better than its reputation.** An algorithm from the nineties hit 63.9% on its own. It's fast, cheap, and handles exact variable names, error codes, and proper nouns that embeddings tend to blur.

Third, **neither search wins alone.** Fusing them beat embeddings alone by nine points, at 465 tokens. They fail on different kinds of questions, so each covers the other's blind spots.

## Where I'd stop trusting this post

**Finding the note is not the same as answering right.** This table measures retrieval, not final answer accuracy. When I ran the full loop with a tiny model answering the questions, accuracy fell from 79.5% retrieval to 44.9% end-to-end. Getting the right sticky note onto the desk is necessary, not sufficient.

**One offline English benchmark.** LoCoMo is casual chat history, not messy codebase architecture notes. Against the live service on a smaller sample, the same pipeline scored 78.2%, and I wrote down [the caveats](https://gethivemind.xyz/docs/concepts/evidence) there too.

**I built one of the rows.** I kept the test as fair as I could: same 1,536 questions, same note store, same ten-note limit. Read any benchmark knowing who wrote the code.

**Bigger context windows might shift the math.** As windows grow and input tokens get cheaper, "just paste everything" looks less silly. My bet is that attention stays the bottleneck even when space is cheap, but I could be wrong about where that line settles.

## The takeaway

Your AI tools don't have bad memories. They have none, plus a hidden search-and-paste loop inside each app.

If you want to feel that firsthand, try a quick experiment today: tell one AI tool a specific preference about your project, then immediately open a different tool and ask a question that depends on it. The moment it misses is where the cheat sheet ends.
