---
title: Why Does Every AI Tool Forget You?
publishedAt: '2026-10-10T05:08:22Z'
summary: >-
  LLMs don't remember anything. "Memory" is text an app quietly pastes into your
  prompt. How that works, why it stays stuck in one app, and what retrieval scores.
updated: '2026-11-26'
tags:
  - ai
  - llm
  - memory
  - retrieval
devto_url: 'https://dev.to/0xadityaa/why-does-every-ai-tool-forget-you-3i26'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/122'
---

Tell Claude Code how your project is set up. The next day, open Cursor and explain it again. Then paste the same paragraph into ChatGPT, because of course it has no idea either.

These tools are scary smart. So why do they all have the memory of a goldfish?

The answer is simpler than it looks: **a language model doesn't remember anything, ever. Every "memory" feature is an app pasting text into your prompt before the model sees it.** Once that clicks, a lot of weird behaviour starts to make sense.

## The short version

- A model keeps no state between calls. A chat only feels continuous because the app resends the conversation every time.
- "Memory" is a search over saved notes, plus a paste into your prompt.
- Those notes live inside each app, which is why your other tools know nothing.
- Four ways of choosing what to paste were compared. Fusing keyword and meaning search found the right note 79.5% of the time, at one fortieth the tokens of pasting everything.

## Wait, the model really remembers nothing?

Nothing. A model is a function. Text goes in, text comes out, and it keeps no state between calls.

The reason a chat feels continuous is that the app resends the whole conversation every time you hit enter. All of it has to fit in the [context window](https://docs.anthropic.com/en/docs/build-with-claude/context-windows), which is the fixed amount of text a model can look at in one go. When a conversation gets too long, something has to be dropped or summarised, and that's when it "forgets" what you said an hour ago.

Start a new chat and the window is empty again. Hello, goldfish.

## So what is "memory", then?

A database and a paste.

When a tool says it remembers you, here's what's actually happening:

1. At some point it saved a few sentences about you somewhere. "Prefers TypeScript." "Deploys on Fridays, bravely."
2. When you ask something, it searches those sentences for ones that look relevant.
3. It pastes the winners into the prompt, above your question, where you can't see them.

![Diagram: saved notes are searched, the relevant few are pasted into the prompt above your question, and a stateless model reads the result](/images/blog/memory-is-a-paste.svg)

That's it. It's [retrieval-augmented generation](https://en.wikipedia.org/wiki/Retrieval-augmented_generation) pointed at your own notes. The model isn't remembering. It's reading a cheat sheet somebody slipped it.

## Then why doesn't your other tool know?

Because the cheat sheet lives inside the app that wrote it.

ChatGPT's notes sit on OpenAI's servers. Your editor keeps its own rules file. Your CLI agent has a different file in a different format. None of them can read each other's, so you become the sync mechanism, copy-pasting your own context around like it's 2005.

This is the gap [MCP](https://modelcontextprotocol.io) is nudging at. If tools can call out to a shared server, the cheat sheet doesn't have to live inside any one of them.

## How do you pick what to paste?

Saving sentences is easy. The hard part is step two: picking what to paste.

Paste too little and the model doesn't know the thing. Paste too much and you've burned your context window on trivia, and models are measurably [worse at using stuff buried in the middle](https://arxiv.org/abs/2307.03172) of a long prompt anyway.

The number that matters: how often does a search bring back the note that contains the answer?

[Hivemind](https://gethivemind.xyz), the memory layer Aditya is building, is the shared cheat sheet idea from the last section. It was pointed at [LoCoMo](https://arxiv.org/abs/2402.17753), a public benchmark of long conversations with questions about them, and three ways of picking ten notes per question were compared. Same 1,536 questions for each.

| How the notes get picked | Found the note with the answer | Tokens pasted per question |
| --- | --- | --- |
| Paste the whole conversation | 99.7% | 18,853 |
| Keyword search ([BM25](https://en.wikipedia.org/wiki/Okapi_BM25)) | 63.9% | 349 |
| Meaning search (embeddings) | 70.4% | 389 |
| Both searches fused, then filtered and packed | 79.5% | 465 |

Three results stand out.

**Pasting everything "wins", and it's a trap.** You find the answer 99.7% of the time because the answer is in there somewhere, under 18,000 tokens of everything else. That's forty times the cost per question, every question.

**Keyword search is better than its reputation.** 63.9% from an algorithm from the nineties. It's fast, it's cheap, and it nails exact names and IDs that embeddings blur.

**Neither search wins alone.** Fusing the two beat the better one by nine points. They fail on different questions, so together they cover for each other.

## Where this stops holding

- **This is retrieval, not answers.** "The note came back" isn't "the model answered right". In the full loop, with a tiny model answering, accuracy dropped a lot. Finding the note is necessary. It isn't sufficient.
- **One benchmark, in English, run offline.** LoCoMo is chatty conversation. Codebase notes aren't. Against the live service, on a smaller sample, the same pipeline scored 78.2%, and [the caveats](https://gethivemind.xyz/docs/concepts/evidence) for that run are written up too.
- **One row is Hivemind's.** Same questions, same store, same number of notes for every row, and you should still read the table knowing who ran it.
- **Bigger context windows change the maths.** As windows grow and tokens get cheaper, "paste everything" gets less silly. It probably still loses, because attention is the scarce thing, not space, but where the line ends up is open.

## The takeaway

Your AI tools don't have bad memories. They have no memories, and a thin layer of search-and-paste on top that happens to be locked inside each app.

To see it for yourself, tell one tool a fact. Open a different tool and ask a question that depends on it. Wherever that breaks is exactly where the cheat sheet stops, and now you know why.
