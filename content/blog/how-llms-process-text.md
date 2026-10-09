---
title: How LLMs Process Text
publishedAt: '2025-09-28'
summary: >-
  LLMs read and write tokens, not text. What a tokenizer does, with code, and
  why token counts set both your bill and your context limit.
tags:
  - llm
  - ai
  - text processing
updated: '2026-10-09'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

![GIF of search icon rotating around computer screen](https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExamdhaWx4dTZkOGVuNzJ6anZ1cTlybGNhbnFmaXVhZ2RpeW1nMGlvOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9CffOPMLx0Hf2/giphy.gif)

Have you ever typed a prompt into ChatGPT or Claude and wondered, *"How does this thing even understand me?"* Well, spoiler alert: it doesn't *read* text like we do. I was just as curious when I started digging into Large Language Models (LLMs), and what I found changed how I write prompts. The whole post in one sentence: **a model never sees your text, it sees a list of integers called tokens, and that list is what you are billed for and what your context limit counts.**

## TL;DR

LLMs don't deal with raw text, they convert it into something called *tokens*, which are basically numbers, using algorithms like [byte-pair-encoding](https://en.wikipedia.org/wiki/Byte_pair_encoding). These tokens are the currency of AI: you're billed for them, not characters. I'll show you how text becomes tokens, how LLMs crunch these numbers, and why it matters for performance and cost. Stick around for some code to see it in action!

## What's a Token, and Why Should You Care?

If you've ever checked your OpenAI bill (or winced at it), you've probably noticed you're charged by *tokens*, not words or characters. So, what's a token? Imagine breaking down a sentence into bite-sized pieces, sometimes a word, sometimes part of a word, or even punctuation. That's a token. It's how LLMs like GPT-4o or Llama make sense of text, and it's the key to everything they do.

Why care? Because the more tokens you feed or get back, the more you pay. Plus, understanding tokens helps you optimize prompts and get better results. Here is how it works.

## Step 1: Text to Tokens (The Magic Conversion)

LLMs don't *read* text, they work with numbers. Every piece of text you send gets chopped up into tokens using a *tokenizer*. I played around with `js-tiktoken`, a JavaScript port of OpenAI's [tiktoken](https://github.com/openai/tiktoken) and the tokenizer GPT-4o uses, to see this in action. Check this out:

```typescript
   import { Tiktoken } from 'js-tiktoken/lite';
   import o200k_base from 'js-tiktoken/ranks/o200k_base';
   import { readFileSync } from 'node:fs';
   import path from 'node:path';

   const tokenizer = new Tiktoken(
     // NOTE: o200k_base is the tokenizer for GPT-4o
     o200k_base,
   );

   const textToTokens = (text: string) => {
     return tokenizer.encode(text);
   };

   const input = readFileSync(
     path.join(import.meta.dirname, 'input.md'),
     'utf-8',
   );

   const output = textToTokens(input);

   console.log('Content length in characters:', input.length);
   console.log(`Number of tokens:`, output.length);
   console.dir(output, { depth: null, maxArrayLength: 20 });
```

I ran this on a markdown file with about 2,294 characters. Guess how many tokens it turned into? Just 484. Here's the output:

```
  Content length in characters: 2294
  Number of tokens: 484
```

That is about 4.7 characters per token for this file. Tokens aren't individual letters, they're chunks of text. A single token might represent a whole word like “hello” or part of a complex word. This compression is why token counts are way lower than character counts, but it's still what you're billed for.

## Step 2: What LLMs Actually Process

Here's the kicker: LLMs are trained on tokens, not text. All that massive data they're fed? It's tokenized first. When an LLM generates a response, it's predicting the next token (a number) based on patterns in its training data. It's not writing words, it's spitting out numbers that get turned back into words later.

Think of it like this: you send a prompt, it becomes a list of numbers, the LLM crunches those numbers to predict more numbers, and then those numbers are decoded into text. Mind-blowing, right?

## Step 3: Tokens Back to Text (The Reverse Magic)

Let's flip the process. After the LLM outputs tokens, the tokenizer decodes them into readable text. I tried decoding a random token to see what happens:

```typescript
  const tokensToText = (tokens: number[]) => {
     return tokenizer.decode(tokens);
   };

  const tokens = [13984];
  const decoded = tokensToText(tokens);
  console.log(decoded);
```

Turns out, token `13984` decodes to “VC”. Random, but kinda funny! This decoding step is how you get human-readable responses from an LLM's numerical output.

## Why Tokens Matter (Beyond Just Billing)

Tokens aren't just about cost, they're how LLMs *think*. The more text you send, the more tokens it becomes, and the more processing power (and money) it takes. Same goes for the response. Want to save tokens? Keep prompts concise and avoid unnecessary fluff. Plus, knowing tokenization helps you understand context limits. Most models can only handle a fixed number of tokens at once (like 8k or 128k), so long conversations might get cut off.

## Real-World Implications

When I started optimizing prompts for my AI projects, understanding tokens changed the game. Shorter prompts didn't just save money, they made responses faster and often **more accurate** since the model wasn't drowning in irrelevant context. If you're building with LLMs, play around with a tokenizer yourself. Seeing a paragraph shrink into a list of numbers is oddly satisfying!

## Where this stops applying

**The numbers are for one tokenizer and one file.** `o200k_base` is OpenAI's encoding. Claude, Gemini, and Llama each use their own, so the same text gives a different count on each; for Claude you ask the API through its [token counting endpoint](https://docs.anthropic.com/en/docs/build-with-claude/token-counting). My 4.7 characters per token came from English Markdown. Code, JSON, and non-English text usually split into more tokens per character.

**"Shorter prompts are more accurate" is what I saw, not a law.** Cutting irrelevant context helped my projects. Cutting context the model needed would have hurt. The useful habit is measuring, not trimming.

**Tokens are not the whole bill.** Output tokens cost more than input tokens on most price lists, and cached input is billed differently again, so a count alone will not predict a cost.

## Final Thoughts

LLMs don't speak text, they speak tokens. It's a weird, wonderful world of numbers behind the scenes, and knowing this gives you a superpower for working with AI. Before you ship a prompt, run it through the tokenizer for the model you are actually calling. It takes ten lines of code and it replaces guessing with a number.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 9 October 2026: stated the thesis up front, linked the tokenizer, and added the section on where this stops applying.*
