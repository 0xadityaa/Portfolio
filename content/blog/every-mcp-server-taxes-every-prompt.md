---
title: Every MCP Server You Add Taxes Every Prompt
publishedAt: '2026-11-14'
summary: >-
  Ten popular MCP servers add 23,895 tokens of tool definitions to every request.
  Caching and tool search cut the bill, not the length.
tags:
  - mcp
  - llm
  - cost
  - ai
draft: true
---

Ten MCP servers. 23,895 tokens. Every single request, before you've typed a word.

In [What Exactly Is MCP?](/blog/what-exactly-is-mcp) I wrote one line about cost: every connected server adds its tool definitions to the context window. I never measured it. A sentence like that is easy to nod at and ignore, so on 14 November 2026 I started eleven popular open-source servers on my laptop, asked each one for its tool list, and counted the tokens.

My claim: **tool definitions are a fixed cost on every request, they're easy to never measure, and past a handful of servers they're most of what you send.**

## The short version

- Eleven servers, 146 tools, 24,395 tokens of definitions. Ten of them: 23,895.
- `chrome-devtools` is 6,751 tokens. `fetch` is 296. Tool count and schema size matter more than server count.
- Against a short 2,000-token prompt, five servers are 84% of the input and ten are 92%.
- At 20,000 calls a day on Sonnet 5.5, ten servers cost $28,674 a month uncached. Caching cuts that to $1,433.70. It doesn't make the tokens free.

## How did I count?

An [MCP server](https://modelcontextprotocol.io/specification/latest/server/tools) advertises its tools through a `tools/list` request. The reply holds each tool's name, description, and a JSON Schema for its arguments. Your client pastes that list into every request it sends to the model. That's the tax.

I wrote a small dependency-free Node client that starts a server over stdio and saves the raw `tools/list` reply. I pointed it at the [reference servers](https://github.com/modelcontextprotocol/servers) (`filesystem`, `memory`, `everything`, `sequential-thinking`, `fetch`, `git`, `time`) plus `github`, [Playwright](https://github.com/microsoft/playwright-mcp), [Context7](https://github.com/upstash/context7) and [Chrome DevTools](https://github.com/ChromeDevTools/chrome-devtools-mcp). Then I counted tokens with [tiktoken](https://github.com/openai/tiktoken)'s `o200k_base`. The client, the raw JSON and the commands are in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/every-mcp-server-taxes-every-prompt).

Before running it I wrote down a guess: ten servers at 25,000 to 40,000 tokens. The real number came in lower, because my "heavy" servers weren't as heavy as I thought.

## What does each server cost?

| Server | Tools | Tokens |
| --- | ---: | ---: |
| `chrome-devtools` | 33 | 6,751 |
| `playwright` | 25 | 3,934 |
| `github` | 26 | 3,546 |
| `filesystem` | 16 | 2,925 |
| `memory` | 9 | 1,736 |
| `everything` | 16 | 1,721 |
| `git` | 14 | 1,435 |
| `context7` | 2 | 1,062 |
| `time` | 3 | 500 |
| `sequential-thinking` | 1 | 489 |
| `fetch` | 1 | 296 |

Tools average 100 to 200 tokens each, but a few are fat. `context7`'s `resolve-library-id` alone is 608 tokens, in a server with two tools.

Stack them up in that order and it climbs fast: 2,925 tokens for one server, 5,150 for three, 10,417 for five, 23,895 for ten. Order matters, so I also averaged over every possible pick. The mean five-server setup is 11,089 tokens, ranging from 3,782 to 18,892. The two browser servers alone are 10,685.

![Bar chart: tool definitions from 1, 3, 5 and 10 MCP servers cost 2,925, 5,150, 10,417 and 23,895 tokens on every request, against a 2,000-token example prompt for scale](/images/blog/tool-definitions-per-request.svg)

## Why does it matter more than it looks?

Because it's a ratio, not a number. 23,895 tokens looks tiny next to a 200,000-token window. Next to your actual question it isn't. With a 2,000-token prompt (my number, not a measured one), three servers are 72% of the input, five are 84%, and ten are 92%.

And you pay whether or not the model touches a single tool. Anthropic's [pricing page](https://platform.claude.com/docs/en/about-claude/pricing) says tool use is billed as input tokens, including the `tools` parameter.

There's a cost I didn't price, too. Models use information in the middle of a long context [worse than at the edges](https://arxiv.org/abs/2307.03172). And Anthropic's [tool search docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) say tool selection accuracy degrades past 30 to 50 tools. My ten-server setup has 143.

## What does it cost in money?

Overhead tokens, times model calls a day, times 30, times the input price. I copied prices on 2026-11-14: [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) lists Claude Sonnet 5.5 at $2 per million input tokens and $0.10 for a cache hit. [OpenAI](https://developers.openai.com/api/docs/pricing) lists gpt-5.5 at $5.00 and $0.50 cached.

"Calls" means model calls, not sessions. An agent that loops six times sends your tools six times. I picked 1,000, 20,000 and 500,000 calls a day as a side project, a small product and a large one.

Ten servers, 23,895 tokens, monthly, overhead only:

| Model | Calls/day | Uncached | Fully cached |
| --- | ---: | ---: | ---: |
| Sonnet 5.5 | 1,000 | $1,433.70 | $71.69 |
| Sonnet 5.5 | 20,000 | $28,674.00 | $1,433.70 |
| Sonnet 5.5 | 500,000 | $716,850.00 | $35,842.50 |
| gpt-5.5 | 20,000 | $71,685.00 | $7,168.50 |

Three servers (5,150 tokens) on Sonnet 5.5 come to $309, $6,180 and $154,500 uncached. The full grid, with Opus 5.5 and gpt-6.1-sol, is in `results.md` in the folder.

"Fully cached" is a lower bound: every call a cache read, no write charges. Which brings me to the best argument against me.

## Doesn't caching fix this?

Mostly, on price. That's the strongest objection, so here it is properly.

Tool definitions sit at the front of the request, and [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) works on prefixes in the order tools, system, messages. A stable tool list is a perfect candidate. On Sonnet 5.5 a hit costs $0.10 per million against $2, so 95% off. [OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching) caches automatically from 1,024 tokens and includes tool definitions in the prefix.

Then there's [tool search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool). You mark tools `defer_loading: true` and only the few the model searches for enter its context. Anthropic's [engineering post](https://www.anthropic.com/engineering/advanced-tool-use) reports one five-server setup going from about 77,000 tokens to about 8,700, and Opus 4 accuracy from 49% to 74%. If that ratio held for my ten servers, 23,895 would shrink to about 3,600. That's arithmetic on their ratio, not something I ran.

Both are real wins. Neither makes the tax zero:

- **Caching has a short life and a fragile key.** The default Anthropic lifetime is 5 minutes, and [changing any tool definition](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) invalidates the cache. A server that returns a different list per user throws it away.
- **Caching cuts the price, not the length.** The model still reads every token.
- **Tool search still sends everything.** Anthropic's docs say you send every definition in the `tools` array on every request. Deferral controls what enters the context, not the payload.
- **Someone has to turn them on.** A chat app that connects ten servers may do neither.

## Where I'd stop trusting this post

**My counter is a proxy.** `o200k_base` is OpenAI's tokenizer, not Claude's. Trust the ranking and the order of magnitude, not the exact figure in a budget. Your provider's `usage` field is the real number.

**Eleven servers I picked.** They're popular and credential-free, which is a bias. Servers behind logins often have more tools, not fewer. And `github` here is the old reference server, not the current one, which I didn't measure.

**Nothing ran against a live model.** I priced the overhead. I didn't measure latency or whether the model picks worse tools with ten servers. The accuracy figures are Anthropic's own.

**Sometimes the tax is a rounding error.** One or two small servers, prompts that are already large, or a high cache hit rate on a tool list that never changes. Then I wouldn't touch it.

## The takeaway

Before you connect another server, run its `tools/list` and count the tokens. It's ten lines of code, and the folder has a client you can copy. If a server costs more than about a quarter of your typical prompt and you use it in a small share of requests, defer it or leave it off by default.

What would change my mind: a real workload showing cache hit rates above 90% and no accuracy loss at 100-plus tools. I'd like to measure next what the tokens do to latency and tool choice, not only the bill.
