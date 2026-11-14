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

In [What Exactly Is MCP?](/blog/what-exactly-is-mcp) I wrote one line about cost: every connected server adds its tool definitions to the context window. I never measured it. This post does, because a sentence like that is easy to nod at and ignore.

So on 14 November 2026 I started eleven popular open-source MCP servers on my laptop, asked each one for its tool list, and counted the tokens. My claim: **tool definitions are a fixed cost on every request, almost nobody measures it, and past a handful of servers it is most of what you send.**

## The short version

- Eleven servers, 146 tools, 24,395 tokens of definitions. Ten of them: 23,895.
- One server (`chrome-devtools`) is 6,751 tokens. One (`fetch`) is 296. Server count tells you little. Tool count and schema size tell you more.
- Against a short 2,000-token prompt, five servers are 84% of the input and ten are 92%.
- At 20,000 requests a day on Sonnet 5.5, ten servers cost $28,674 a month uncached. Caching cuts that by 95%, to $1,433.70. It does not make the tokens free.

## What did I actually run?

An [MCP server](https://modelcontextprotocol.io/specification/latest/server/tools) advertises its tools through a `tools/list` request. The reply holds each tool's name, description, and a JSON Schema for its arguments. Your client takes that list and puts it in every request it sends to the model. That is the tax.

I wrote a small Node client with no dependencies. It starts a server over stdio, sends `initialize`, then pages through `tools/list` and saves the raw JSON. I pointed it at the [reference servers](https://github.com/modelcontextprotocol/servers) (`filesystem`, `memory`, `everything`, `sequential-thinking`, `fetch`, `git`, `time`) plus `github`, [Playwright](https://github.com/microsoft/playwright-mcp), [Context7](https://github.com/upstash/context7) and [Chrome DevTools](https://github.com/ChromeDevTools/chrome-devtools-mcp). None needed real credentials. All eleven started.

Then I counted tokens with [tiktoken](https://github.com/openai/tiktoken)'s `o200k_base`. That is OpenAI's tokenizer, so it is a proxy: Claude and other models tokenize differently, and your provider's meter will disagree with mine. For each tool I counted compact JSON of the name, description, and input schema.

Everything is in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/every-mcp-server-taxes-every-prompt): the client, the raw JSON, the counter, and a README with the commands.

Before running it I wrote down a guess: 500 to 3,000 tokens per server, a few heavy ones at 5,000 to 15,000, ten servers at 25,000 to 40,000. The per-server guess held for about half of them. The total was lower than I expected, because my "heavy" servers weren't as heavy as I thought.

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

Two things stood out. First, tools average 100 to 200 tokens each, but a few are fat: `context7`'s `resolve-library-id` alone is 608 tokens, and its server only has two tools. Second, `github` here is the old reference server. The current GitHub server is a different product with far more tools, and I did not measure it.

Now the part the title is about. Adding servers in the order of that listing (filesystem first), the running totals look like this:

| Servers | Tools | Tokens per request |
| ---: | ---: | ---: |
| 1 | 16 | 2,925 |
| 3 | 26 | 5,150 |
| 5 | 68 | 10,417 |
| 10 | 143 | 23,895 |

Order matters, so I also averaged over every possible pick. The mean five-server setup is 11,089 tokens, with a range of 3,782 to 18,892. The two browser servers alone, `chrome-devtools` and `playwright`, are 10,685 tokens.

![Bar chart: tool definitions from 1, 3, 5 and 10 MCP servers cost 2,925, 5,150, 10,417 and 23,895 tokens on every request, against a 2,000-token example prompt for scale](/images/blog/tool-definitions-per-request.svg)

## Why does this matter more than it looks?

Because it is a ratio, not a number. 23,895 tokens sounds small next to a 200,000-token window. Next to your actual question it is not. I assumed a short 2,000-token prompt, which is my number, not a measured one. Then three servers are 72% of the input, five are 84%, and ten are 92%.

You pay for those tokens whether or not the model uses a single tool. Anthropic's [pricing page](https://platform.claude.com/docs/en/about-claude/pricing) says tool use is priced as input tokens, including the `tools` parameter. It also adds a hidden tool-use system prompt: 286 tokens on Sonnet 5.5 and Opus 5.5. I did not count that.

There is a second cost I did not price. Longer contexts are not free for the model either. [Lost in the Middle](https://arxiv.org/abs/2307.03172) found models use information in the middle of a long context worse than at the edges. And Anthropic's [tool search docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) say tool selection accuracy degrades once you exceed 30 to 50 tools. My ten-server setup has 143.

## What does it cost in money?

Overhead tokens times model calls per day times 30 days times the input price. I copied prices from the live pages on 2026-11-14: [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) lists Claude Sonnet 5.5 at $2 per million input tokens and $0.10 for a cache hit. [OpenAI](https://developers.openai.com/api/docs/pricing) lists gpt-5.5 at $5.00 and $0.50 cached.

"Calls" means model calls, not user sessions. An agent that loops six times sends your tools six times. My three volumes are 1,000, 20,000 and 500,000 calls a day, picked as rough sizes for a side project, a small product, and a large one.

Ten servers (23,895 tokens), monthly, overhead only:

| Model | Calls/day | Uncached | Fully cached |
| --- | ---: | ---: | ---: |
| Sonnet 5.5 | 1,000 | $1,433.70 | $71.69 |
| Sonnet 5.5 | 20,000 | $28,674.00 | $1,433.70 |
| Sonnet 5.5 | 500,000 | $716,850.00 | $35,842.50 |
| gpt-5.5 | 1,000 | $3,584.25 | $358.43 |
| gpt-5.5 | 20,000 | $71,685.00 | $7,168.50 |
| gpt-5.5 | 500,000 | $1,792,125.00 | $179,212.50 |

Three servers (5,150 tokens) on Sonnet 5.5 are $309, $6,180 and $154,500 uncached. The full grid, with Opus 5.5 and gpt-6.1-sol, is in `results.md` in the folder.

"Fully cached" is a lower bound. It treats every call as a cache read and ignores the one-off write charges. I will come back to it, because it is the best argument against me.

## Doesn't caching fix this?

Mostly, on price. It is the strongest objection, so here it is in full.

Tool definitions sit at the front of the request, and [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) works on prefixes in the order tools, system, messages. A stable tool list is a perfect cache candidate. On Sonnet 5.5 a hit costs $0.10 per million against $2, so 95% off. [OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching) caches automatically from 1,024 tokens and includes tool definitions in the prefix. Every row in my table drops by 90% to 95%.

Then there is [tool search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool). You mark tools `defer_loading: true`, and only the few the model searches for enter its context. Anthropic's [engineering post](https://www.anthropic.com/engineering/advanced-tool-use) reports one five-server setup going from about 77,000 tokens to about 8,700, an 85% reduction. It also reports accuracy gains: Opus 4 from 49% to 74%. If that ratio held for my ten servers, 23,895 would shrink to about 3,600. That is arithmetic on their ratio, not something I ran.

I think both are right and neither makes the tax zero:

- **Caching has a lifetime and a fragile key.** The default Anthropic lifetime is 5 minutes. [Changing any tool definition](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) invalidates the tools, system and message caches. A server that returns a different list per user, or a tool you toggle mid-session, throws the cache away.
- **Caching cuts the price, not the length.** The model still reads every token, and the accuracy and middle-of-context problems stay.
- **Tool search still sends everything.** Anthropic's docs say you send every definition in the `tools` array on every request. Deferral controls what enters the context, not the payload. A deferred tool also cannot carry `cache_control`.
- **Someone has to turn them on.** Both depend on your client or SDK. A chat app that connects ten servers may do neither.

## Where I'd stop trusting this post

**My counter is a proxy.** `o200k_base` is not Claude's tokenizer. I would trust the ranking of servers and the order of magnitude. I would not put the exact figure in a budget. Your provider's `usage` field is the real number.

**These are eleven servers I picked.** They are popular and credential-free, which is a bias. Servers behind logins often have more tools, not fewer. I did not sample the wider ecosystem.

**The `github` server is outdated.** It is the deprecated reference one, run with a placeholder token because it only lists tools. The current one is a different product.

**The "full raw object" count is higher.** If a client forwards `outputSchema` and annotations, `everything` goes from 1,721 to 11,160 tokens. Most function-calling formats carry only name, description and schema, so I counted that, but I did not check each client.

**I have not run any of this against a live model.** I priced the overhead. I did not measure latency, or whether the model picks worse tools with ten servers. I am quoting Anthropic's figures for accuracy, and they are the vendor's.

**The advice stops applying** in three cases: you run one or two small servers, your prompts are already large so the ratio is small, or your cache hit rate is high and your tool list never changes. Then the tax is a rounding error, and I would not touch it.

## The takeaway

Here is my rule. Before you connect another server, run its `tools/list` and count the tokens. It takes ten lines of code, and the folder has a client you can copy. If the server costs more than about a quarter of your typical prompt and you use it in a small share of requests, it should be deferred or off by default.

What would change my mind: a measurement from a real workload showing cache hit rates above 90% and no accuracy loss at 100-plus tools. Until I see one, I count first. Next I want to run the same servers against live models and measure what the tokens do to latency and tool choice, not only the bill.
