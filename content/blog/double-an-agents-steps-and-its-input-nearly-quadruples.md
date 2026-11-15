---
title: Double an Agent's Steps and Its Input Nearly Quadruples
publishedAt: '2026-11-14'
summary: >-
  A simulated agent sent 55x the input tokens for 10x the steps. Clearing, compaction and caching bend the curve differently, and clearing fights caching.
tags:
  - ai
  - llm
  - agents
  - cost
  - caching
draft: true
---

A 10-step agent run sends 0.18 million input tokens. A 100-step run sends 10.1 million. Ten times the steps, 55 times the tokens.

That's from a model I wrote and ran, not a live API. Every step of an agent loop is a fresh request that carries the whole history so far, so the total grows with the square of the steps. My claim: **the input bill of a long agent run is quadratic, and the three common fixes (clear old tool results, compact, cache) bend the curve in different ways, so pick the one that matches what your loop repeats.**

I priced five strategies on Claude Sonnet 5.5 at 10, 25, 50 and 100 steps. The code, the tool outputs I tokenised and the raw results are in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/double-an-agents-steps-and-its-input-nearly-quadruples).

## The short version

- With no management, doubling the steps multiplied input by 3.4 (25 to 50) and then 3.7 (50 to 100). Pure squaring would give 4.
- Clearing old tool results or compacting every 25 steps cut 100-step input from 10.1M tokens to about 3.6M.
- Prompt caching cut the 100-step bill from $20.43 to $1.72 (93%), and it still grows faster than linearly.
- Clearing and caching fight. Clearing a sliding window cost $7.20 with caching on, against $1.72 for caching alone.

## Why does the bill grow with the square?

A step is one API call. It sends the system prompt, the tool definitions, the task, and every earlier reply and tool result. Step n carries about n times the history of step 1, and you pay for every step. Add up 1 + 2 + ... + n and you get n²/2.

To make it concrete I needed realistic sizes. I captured six real tool outputs from this repo (file reads of 100 to 400 lines, a grep, a directory listing, a commit log, a check run) and counted them with [tiktoken](https://github.com/openai/tiktoken)'s `o200k_base`. They came to 8 to 3,559 tokens each. I cycled through them in a fixed ten-step pattern, which averages 1,587 tokens per tool result. Add a 250-token reply and the history grows 1,837 tokens a step.

The fixed part is 8,000 tokens of system prompt and tools. [Ten MCP servers](/blog/every-mcp-server-taxes-every-prompt) alone were 23,895 in my earlier count, so 8,000 is on the small side.

| Strategy | 10 steps | 25 steps | 50 steps | 100 steps |
| --- | ---: | ---: | ---: | ---: |
| No management | 0.18M | 0.80M | 2.75M | 10.09M |
| Clear results older than 10 steps | 0.18M | 0.61M | 1.47M | 3.68M |
| Clear at a 50k trigger, keep 5 | 0.18M | 0.72M | 1.65M | 3.77M |
| Compact every 25 steps | 0.18M | 0.80M | 1.70M | 3.56M |
| Compact at 100k tokens | 0.18M | 0.80M | 2.75M | 5.69M |

Input tokens billed in total, caching off. The first row matches n(P+U) + g·n(n-1)/2 within 1.5% at 100 steps (P+U is 8,500, g is 1,837).

One choice inflates short runs: my cycle starts with the biggest file read, so 10 steps run 8.7% over the formula. It fades by 100.

## What does each fix do to the curve?

![Chart: cumulative input tokens against step for five strategies. With no management the total reaches 10.1 million tokens at step 100. Clearing old tool results or compacting every 25 steps ends near 3.6 to 3.8 million, and compacting at 100k tokens ends at 5.7 million](/images/blog/agent-input-tokens-by-strategy.svg)

**Clearing** replaces old tool results with a placeholder. Anthropic's [context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) does this on the server once input passes a trigger (100,000 tokens by default), keeping the latest few. The history stops growing, so the curve turns into a line. I modelled it two ways: a sliding window that clears one result per step, and the documented trigger shape.

**Compaction** replaces the whole history with a summary. [Anthropic's compaction](https://platform.claude.com/docs/en/build-with-claude/compaction-threshold) can fire at a token threshold (150,000 by default, 50,000 at least). The context becomes a sawtooth, and the summarisation call is billed like any other request, so I counted it. I assumed a 4,000-token summary, since the docs' example shows 3,500. Compacting every 25 steps means three calls in 100 steps, $0.46 of a $7.48 bill.

**Caching** doesn't change a single token. It changes the price of the ones you already sent. On [Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing) a cache read costs $0.10 per million against $2.00 for fresh input, and a 5-minute write costs $2.50. With automatic caching the [breakpoint moves with the conversation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), so each step reads the old history and writes only the new tail. The traffic side is in [the caching post](/blog/prompt-caching-rewards-boring-prompts).

## Which one actually pays?

| Strategy | Caching off | Caching on | Largest context |
| --- | ---: | ---: | ---: |
| No management | $20.43 | $1.72 | 190,730 |
| Clear results older than 10 steps | $7.61 | $7.20 | 50,904 |
| Clear at a 50k trigger, keep 5 | $7.79 | $1.60 | 49,978 |
| Compact every 25 steps | $7.48 | $1.21 | 57,889 |
| Compact at 100k tokens | $11.72 | $1.38 | 99,965 |

Total for a 100-step run: input plus output, Sonnet 5.5 prices checked 2026-11-14.

Caching is the biggest lever by far. The worst cached run is cheaper than the best uncached one. Even at 10 steps it cut the bill from $0.39 to $0.10. I'd guessed it would barely help there. I was wrong: the 0.05x read price swamps the 1.25x write premium.

Then look at the sliding clear. It's the obvious design, and with caching on it's nearly worthless. Each step edits the middle of the history, so everything after the edit has to be rewritten. The Anthropic docs warn about this and suggest `clear_at_least` so you clear in big batches. I'd guessed it would be worse than caching alone, and it was, by 4x.

Batching helps, but it isn't free either. When I doubled the tool result sizes, the 50k-trigger clear cost $3.89 of input with caching against $2.65 for doing nothing. It fires so often that it keeps rewriting the cache.

Over 30 days of 100-step runs: at 10 runs a day, no management costs $6,129 and caching with compaction $364. At 100 a day, $61,293 against $3,636. At 1,000 a day, $612,930 against $36,360.

## Where does the 200k window come in?

With the measured mix, no management stays under 200k for 100 steps (190,730 at the end) and crosses at step 105. With tool results twice as big it crosses at step 57. Every other strategy stays under 106k even at 300 steps.

Sonnet 5.5's window is [1M tokens](https://platform.claude.com/docs/en/build-with-claude/context-windows), so 200k is my yardstick, the limit on older models. At 1,837 tokens a step, 1M is about 540 steps away.

## Where I'd stop trusting this post

**The strongest objection: with caching the quadratic barely matters.** A cached 100-step run costs $1.72 and a 10-step run $0.10, and nothing I ran contradicts that. Three things caching leaves alone. Cached tokens still fill the window: the context-windows docs say caching changes what you pay, [not whether tokens count](https://platform.claude.com/docs/en/build-with-claude/context-windows). Quality: Anthropic says accuracy and recall degrade as context grows, and [Chroma tested 18 models](https://www.trychroma.com/research/context-rot) and found performance varies with input length even on simple tasks. [Lost in the Middle](https://arxiv.org/abs/2307.03172) reports that performance can drop when relevant information moves position. And latency, which I didn't measure.

**There's no quality term.** I assumed a 4,000-token summary loses nothing the agent needs and that cleared results are never re-read. Real summaries drop things. Anthropic's [context engineering post](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) calls clearing the "safest lightest touch" and says to tune compaction for recall first.

**The sizes come from one repo.** A loop that reads 20k-token files looks different. I reran three strategies with tool results at half and double size, and the picture held apart from the clearing result above. The tokeniser is a proxy too: Anthropic's pricing page says newer Claude models produce roughly 30% more tokens for the same text, so my counts are probably low.

**The cache is always warm.** I assumed every step lands inside the 5-minute window and ignored the 20-block lookback the docs describe. A slow tool call would cost a full rewrite.

## The takeaway

Find what your loop repeats before you pick a fix. If every step resends a stable history, turn caching on first: it changed my bill more than anything else and doesn't change what the model sees. If your loop piles up big tool results nobody reads again, clear them in batches. If it runs long enough that early decisions can be summarised, compact. Treat the last two as window and quality tools, and caching as the money tool.

What would change my mind is the usage fields from a real 100-step run disagreeing with this curve. I'd like to run one and compare.
