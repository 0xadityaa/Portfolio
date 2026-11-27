---
title: "10x the Agent Steps, 55x the Tokens. Here's the Fix"
publishedAt: '2026-11-14'
summary: >-
  In the model, 10x the agent steps meant 55x the input tokens. Caching cut the bill 92%, but a per-step clear on top of it cost 4x more than caching alone.
tags:
  - ai
  - llm
  - agents
  - cost
  - caching
draft: true
---
Ten times the steps, 55 times the input tokens: 0.18 million at 10 steps, 10.1 million at 100. That is what I got when I priced an agent loop.

Three fixes are meant to tame that, and I priced all of them. One of them quietly undoes another.

If your agent makes dozens of tool calls per task, input is the part of the bill that grows fastest. Every step of an agent loop is a fresh request carrying the whole history, so the total grows with the square of the steps. The numbers come from a priced model, not a live API run. **The input bill of a long agent run is quadratic, and the three common fixes (clear old tool results, compact, cache) bend it differently, so pick the one that matches what your loop repeats.**

I priced five strategies on Claude Sonnet 5.5 at 10, 25, 50 and 100 steps. The model is [`model.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/double-an-agents-steps-and-its-input-nearly-quadruples/model.py), the prices are in [`prices.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/double-an-agents-steps-and-its-input-nearly-quadruples/prices.json), the tokenised tool outputs are in [`samples/`](https://github.com/0xadityaa/Portfolio/tree/main/content/research/double-an-agents-steps-and-its-input-nearly-quadruples/samples), and the full output is [`results/model.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/double-an-agents-steps-and-its-input-nearly-quadruples/results/model.txt).

## The short version

- Doubling the steps multiplied input by 3.4 (25 to 50) and then 3.7 (50 to 100). Pure squaring gives 4.
- Clearing old tool results, or compacting every 25 steps, cut 100-step input from 10.1M tokens to about 3.6M.
- Caching cut the 100-step bill from $20.43 to $1.72 (92%), with the cache assumed always warm.
- Clearing and caching fight. A sliding clear with caching on cost $7.20, against $1.72 for caching alone.

## Why does the bill grow with the square?

Because step n resends everything steps 1 to n-1 produced. Picture a support agent rereading the whole ticket thread before typing each reply. Add up 1 + 2 + ... + n and you get n²/2.

For realistic sizes, I captured six tool outputs from this repo (file reads, a grep, a directory listing, a commit log, a check run) and counted them with [tiktoken](https://github.com/openai/tiktoken)'s `o200k_base`: 8 to 3,559 tokens each, averaging 1,587 in a fixed ten-step cycle. With a 250-token reply, the history grows 1,837 tokens a step on top of an 8,000-token system prompt and tools. [Ten MCP servers](/blog/every-mcp-server-taxes-every-prompt) came to 23,895 tokens in an earlier count, so 8,000 is small.

| Strategy | 10 steps | 25 steps | 50 steps | 100 steps |
| --- | ---: | ---: | ---: | ---: |
| No management | 0.18M | 0.80M | 2.75M | 10.09M |
| Clear results older than 10 steps | 0.18M | 0.61M | 1.47M | 3.68M |
| Clear at a 50k trigger, keep 5 | 0.18M | 0.72M | 1.65M | 3.77M |
| Compact every 25 steps | 0.18M | 0.80M | 1.70M | 3.56M |
| Compact at 100k tokens | 0.18M | 0.80M | 2.75M | 5.69M |

Input tokens billed in total, caching off. The first row matches n(P+U) + g·n(n-1)/2, where P+U is 8,500 and g is 1,837, within 1.5% at 100 steps.

## What does each fix do to the curve?

Each one flattens it, in a different place.

![Chart: cumulative input tokens against step for five strategies. With no management the total reaches 10.1 million tokens at step 100. Clearing old tool results or compacting every 25 steps ends near 3.6 to 3.8 million, and compacting at 100k tokens ends at 5.7 million](/images/blog/agent-input-tokens-by-strategy.svg)

**Clearing** swaps old tool results for a placeholder. Anthropic's [context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) does it on the server once input passes a trigger (100,000 tokens by default), keeping the latest few. The history stops growing and the curve turns into a line. My model covers a sliding window and the documented trigger shape.

**Compaction** swaps the whole history for a summary. [Anthropic's compaction](https://platform.claude.com/docs/en/build-with-claude/compaction-threshold) can fire at a token threshold (150,000 by default, 50,000 at least). The summarising call is billed like any other request, and I counted it: three calls in 100 steps, $0.46 of a $7.48 bill, with a 4,000-token summary (the docs' example shows 3,500).

**Caching** doesn't remove a single token. It changes the price of the ones you already sent. On [Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing) a cache read costs $0.10 per million against $2.00 for fresh input, and a 5-minute write costs $2.50. With automatic caching the [breakpoint moves with the conversation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), so each step reads the old history and writes only the new tail. The traffic side is in [the caching post](/blog/prompt-caching-rewards-boring-prompts).

The one that removes nothing wins by a mile.

## Which fix pays the most?

Caching, and not close. The worst cached run is cheaper than the best uncached one.

| Strategy | Caching off | Caching on | Largest context |
| --- | ---: | ---: | ---: |
| No management | $20.43 | $1.72 | 190,730 |
| Clear results older than 10 steps | $7.61 | $7.20 | 50,904 |
| Clear at a 50k trigger, keep 5 | $7.79 | $1.60 | 49,978 |
| Compact every 25 steps | $7.48 | $1.21 | 57,889 |
| Compact at 100k tokens | $11.72 | $1.38 | 99,965 |

Total for a 100-step run, input plus output, Sonnet 5.5 prices checked 2026-11-14. Caching on assumes every step lands inside the 5-minute window.

Even at 10 steps it cut the bill from $0.39 to $0.10. Before the run, I guessed in [`EXPECTATION.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/double-an-agents-steps-and-its-input-nearly-quadruples/EXPECTATION.txt) that it might barely help. It does not, because the 0.05x read price swamps the 1.25x write premium.

Now the sliding clear, the obvious design. With caching on, it's nearly worthless: $7.20 against $1.72 for doing nothing. Each step edits the middle of the history, so everything after the edit has to be rewritten. Anthropic's docs warn about this and suggest `clear_at_least` so you clear in big batches.

Batching helps without making clearing free: with tool results doubled, the 50k-trigger clear cost $3.89 of input with caching against $2.65 for doing nothing.

Over 30 days of 100-step runs, cache assumed warm:

| Runs a day | No management, no caching | Caching only | Compact every 25 steps, caching |
| ---: | ---: | ---: | ---: |
| 10 | $6,129 | $515 | $364 |
| 100 | $61,293 | $5,151 | $3,636 |
| 1,000 | $612,930 | $51,510 | $36,360 |

That covers the bill. The window is next.

## Does the 200k window still matter?

Only for runs with big tool results. With the measured mix, no management ends a 100-step run at 190,730 tokens and crosses 200k at step 105. With tool results twice as big it crosses at step 57. Every other strategy stays under 106k even at 300 steps, as long as results stay at the measured size.

Sonnet 5.5's window is [1M tokens](https://platform.claude.com/docs/en/build-with-claude/context-windows), so 200k is the yardstick: the limit on older models. At 1,837 tokens a step, 1M is 540 steps away.

## Where I'd stop trusting this post

- **Caching shrinks the price, not the window or the quality bill.** A cached 100-step run costs $1.72 and a cached 10-step run $0.10, so the quadratic barely shows in dollars. Cached tokens still fill the window: the context-windows docs say caching changes what you pay, [not whether tokens count](https://platform.claude.com/docs/en/build-with-claude/context-windows). Anthropic says accuracy and recall degrade as context grows, [Chroma tested 18 models](https://www.trychroma.com/research/context-rot) and found performance varies with input length even on simple tasks, and [Lost in the Middle](https://arxiv.org/abs/2307.03172) reports that performance can drop when relevant information moves position. I didn't measure latency.
- **There's no quality term.** I assumed a 4,000-token summary loses nothing the agent needs, and that cleared results are never re-read. Real summaries drop things. Anthropic's [context engineering post](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) calls clearing the "safest lightest touch" and says to tune compaction for recall first.
- **Sizes come from one repo.** I reran three strategies with tool results at half and double size, and the picture held apart from the clearing result above. The tokeniser is a proxy too: Anthropic's pricing page says newer Claude models produce roughly 30% more tokens for the same text, so these counts are probably low.
- **The cache is always warm.** I assumed every step lands inside the 5-minute window and ignored the 20-block lookback the docs describe. A slow tool call would cost a full rewrite.

## The takeaway

If every step of your loop resends a stable history, turn caching on first and check your usage fields for cache reads. If it piles up big tool results nobody reads again, clear them in batches, and never one at a time under caching. If it runs long enough that early decisions can be summarised, compact. Caching is the money tool; clearing and compaction are window and quality tools.

If someone shows me a real 100-step run whose usage fields disagree with this curve, I'll change the advice.
