---
title: 'LLMs Don''t Read Your Prompt. They Count It.'
publishedAt: '2025-09-28'
summary: 'A model never sees your text. It sees a list of integers called tokens, and that list is what you pay for and what your context limit counts.'
tags:
  - llm
  - ai
  - tokens
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

Ever typed a prompt into ChatGPT or Claude and wondered how this thing actually understands you? Spoiler: it doesn't read text the way we do. I got curious, went digging into how Large Language Models (LLMs) handle input, and it changed how I write prompts.

The whole post in one sentence: **a model never sees your text, it sees a list of integers called tokens, and that list is what you get billed for and what your context limit counts.**

## The short version

LLMs don't work with raw text. They turn it into *tokens*, which are just numbers, using algorithms like [byte-pair encoding](https://en.wikipedia.org/wiki/Byte_pair_encoding). Tokens are the currency of AI. You pay per token, not per character. Below I show text turning into tokens, tokens turning back into text, and why any of this matters for cost and quality. There's code, so you can try it yourself.

## What's a token, and why should you care?

If you've ever looked at your OpenAI bill (and winced), you'll have noticed you're charged by tokens, not words. So what is one? Picture a sentence chopped into bite-sized pieces. Sometimes a piece is a whole word, sometimes half a word, sometimes a comma. Each piece is a token. That's how models like GPT-4o or Llama take in text, and everything they do runs on it.

Why care? More tokens in or out means more money. And once you get how tokens work, you write tighter prompts and get better answers.

## Step 1: text goes in, numbers come out

Every bit of text you send gets chopped into tokens by a *tokenizer*. I played with `js-tiktoken`, a JavaScript port of OpenAI's [tiktoken](https://github.com/openai/tiktoken) and the tokenizer GPT-4o uses, to watch it happen:

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

I ran that on a markdown file with 2,294 characters. Guess how many tokens came out? Just 484.

```
  Content length in characters: 2294
  Number of tokens: 484
```

That's about 4.7 characters per token for this file. Tokens aren't letters. They're chunks. One token might be a whole word like "hello", or a slice of a longer word. That's why the token count is way lower than the character count. It's still the number on your bill.

## Step 2: what the model actually chews on

Here's the kicker. LLMs are trained on tokens, not text. All that data they learned from got tokenized first. When a model "writes" a reply, it's predicting the next token, a number, based on patterns it picked up in training. It isn't writing words. It's producing numbers that get turned into words afterwards.

So the loop is: your prompt becomes a list of numbers, the model crunches them to predict more numbers, and those numbers get decoded into text. Kind of wild, right?

## Step 3: numbers back to text

Now the reverse. After the model outputs tokens, the tokenizer decodes them into something readable. I decoded a random token to see what I'd get:

```typescript
  const tokensToText = (tokens: number[]) => {
     return tokenizer.decode(tokens);
   };

  const tokens = [13984];
  const decoded = tokensToText(tokens);
  console.log(decoded);
```

Token `13984` decodes to "VC". Random, and kind of funny. This decoding step is how a pile of numbers ends up as the reply you read.

## Why tokens matter beyond the bill

Tokens aren't only about cost. They're the unit the model works in. More text means more tokens, which means more compute and more money. Same for the response. Want to save tokens? Keep prompts tight and skip the fluff.

It also explains context limits. A model can only handle a fixed number of tokens at once (like 8k or 128k), so a long conversation eventually gets cut off.

## What changed for me

When I started tuning prompts for my AI projects, thinking in tokens made a real difference. Shorter prompts didn't only save money. Responses came back faster and were often **more accurate**, because the model wasn't wading through stuff it didn't need. If you build with LLMs, go play with a tokenizer. Watching a paragraph shrink into a list of numbers is weirdly satisfying.

## Where I'd stop trusting this post

**These numbers are one tokenizer and one file.** `o200k_base` is OpenAI's encoding. Claude, Gemini, and Llama each have their own, so the same text gets a different count on each. For Claude you ask the API through its [token counting endpoint](https://docs.anthropic.com/en/docs/build-with-claude/token-counting). My 4.7 characters per token came from English Markdown. Code, JSON, and non-English text usually split into more tokens per character.

**"Shorter prompts are more accurate" is what I saw, not a law.** Cutting junk context helped my projects. Cutting context the model needed would have hurt. The habit worth keeping is measuring, not trimming.

**Tokens aren't the whole bill.** Output tokens cost more than input tokens on most price lists, and cached input is priced differently again. A count alone won't tell you the cost.

## The takeaway

LLMs don't speak text. They speak tokens. It's all numbers back there, and knowing that makes you better at working with these things. Before you ship a prompt, run it through the tokenizer for the model you're actually calling. It's ten lines of code, and it swaps a guess for a number.
