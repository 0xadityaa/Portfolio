---
title: 'What Do MCP Servers Cost?'
publishedAt: '2026-11-16T20:17:56.100Z'
updated: '2026-11-27'
summary: >-
  Ten popular MCP servers add 23,895 tokens to every request, 92% of a short
  prompt. Caching cuts the bill 95%, not the context length.
tags:
  - mcp
  - llm
  - cost
  - ai
devto_url: 'https://dev.to/0xadityaa/your-mcp-servers-eat-24000-tokens-before-you-type-7m5'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/143'
---

Back when I wrote [What Exactly Is MCP?](/blog/what-exactly-is-mcp), I tossed in one casual line about how connecting ten servers makes your model burn tokens reading tool menus. I never actually measured it.

Recently I got curious enough to stop guessing. I booted up eleven popular MCP servers on my laptop, asked each one for its tool list, and counted the tokens.

**Ten MCP servers add 23,895 tokens to every single request before you've typed a single word.** Tool definitions are a quiet fixed tax on every turn, and past a handful of servers, they're almost the entire prompt you're sending.

## The short version

- Across eleven servers (146 tools total), definitions came to 24,395 tokens. Ten of them add up to 23,895.
- `chrome-devtools` alone is 6,751 tokens, while `fetch` is just 296. Schema bloat matters way more than raw server count.
- Next to a normal 2,000-token prompt, five servers eat 84% of your input, and ten servers eat 92%.
- At 20,000 calls a day on Sonnet 5.5, ten servers cost $28,674 a month uncached. Prompt caching cuts that to $1,433.70, but it doesn't shrink what the model has to read.

## How I actually counted the menu

Every [MCP server](https://modelcontextprotocol.io/specification/latest/server/tools) advertises what it can do via a `tools/list` request. Back comes a big JSON payload containing every tool's name, description, and argument schema. Your client silently glues that entire menu onto every request it sends to the model.

On 14 November 2026, I wrote a tiny dependency-free Node script ([`list-tools.mjs`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/every-mcp-server-taxes-every-prompt/list-tools.mjs)) that spins up a server over stdio and dumps its raw `tools/list` reply. I ran it against the [reference servers](https://github.com/modelcontextprotocol/servers) (`filesystem`, `memory`, `everything`, `sequential-thinking`, `fetch`, `git`, `time`) plus `github`, [Playwright](https://github.com/microsoft/playwright-mcp), [Context7](https://github.com/upstash/context7), and [Chrome DevTools](https://github.com/ChromeDevTools/chrome-devtools-mcp). Then I counted the tokens with [tiktoken](https://github.com/openai/tiktoken)'s `o200k_base` ([`count-tokens.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/every-mcp-server-taxes-every-prompt/count-tokens.py)). The script, the [raw JSON](https://github.com/0xadityaa/Portfolio/tree/main/content/research/every-mcp-server-taxes-every-prompt/raw), and exact commands are all sitting in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/every-mcp-server-taxes-every-prompt).

Before running it, I guessed ten servers would land somewhere between 25,000 and 40,000 tokens. It came in just under that, mostly because a couple of servers I expected to be big were lean.

## Which servers are eating all the tokens?

`chrome-devtools` is the biggest at 6,751 tokens. `fetch` is the smallest at 296.

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

Most tools average 100 to 200 tokens, though a few individual schemas are much bigger. `context7`'s `resolve-library-id` alone is 608 tokens, inside a server that only has two tools.

Stacked, they add up fast: 2,925 tokens for one server, 5,150 for three, 10,417 for five, and 23,895 for ten. Since pick order matters, I also averaged across every possible combination of five servers. The mean five-server setup lands at 11,089 tokens (ranging from 3,782 to 18,892). The two browser servers alone come to 10,685 tokens.

![Bars growing as servers are added: 2,925 tokens for one, 5,150 for three, 10,417 for five, 23,895 for ten](/images/blog/mcp-server-climb.svg "Running total of tool-definition tokens as servers are added, in the order listed in [`results.md`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/every-mcp-server-taxes-every-prompt/results.md). The shares assume the same 2,000-token prompt.")

## What the ratio looks like

In isolation, 23,895 tokens sounds tiny next to a 200,000-token context window. That's the trap. Compare it against your actual prompt, and the picture flips completely.

![A short 2,000-token prompt as a small sliver beside 23,895 tokens of tool definitions from ten MCP servers, 92 percent of the request](/images/blog/tool-definitions-per-request.svg "Eleven servers were measured. This stack is the ten without `time`: 23,895 tokens across 143 tools. The 2,000-token prompt is an assumed size, picked for scale.")

The orange sliver on the left is your actual 2,000-token question (an illustrative prompt size I picked for scale). Everything else is tool schemas. Three servers make up 72% of the request, five make up 84%, and ten make up 92%. It's like walking into a diner for a coffee and handing the waiter a twelve-page binder every single time you ask for a refill.

And yes, you pay for that binder even when the model never calls a single tool. Anthropic's [pricing page](https://platform.claude.com/docs/en/about-claude/pricing) confirms that the `tools` parameter is billed straight as input tokens.

There is also an accuracy tax I didn't put a dollar sign on. Models are measurably [worse at pulling details from the middle of a long context](https://arxiv.org/abs/2307.03172), and Anthropic's [tool search docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) explicitly warn that tool selection degrades once you cross 30 to 50 tools. My ten-server setup had 143.

## What this turns into on your monthly invoice

The math is simple: overhead tokens times model calls per day times 30 days times input price. I pulled prices on 2026-11-14: [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing) lists Claude Sonnet 5.5 at $2 per million input tokens and $0.10 for a cache hit, and [OpenAI](https://developers.openai.com/api/docs/pricing) lists gpt-5.5 at $5.00 and $0.50 cached.

Remember, "calls" means *model calls*, not user sessions. If your agent loops six times to answer one question, it sends that entire 23,895-token menu six times. I picked 1,000, 20,000, and 500,000 calls a day to represent a side project, a growing product, and a busy production app.

Here is the monthly bill for ten servers (23,895 tokens), overhead only:

| Model | Calls/day | Uncached | Fully cached |
| --- | ---: | ---: | ---: |
| Sonnet 5.5 | 1,000 | $1,433.70 | $71.69 |
| Sonnet 5.5 | 20,000 | $28,674.00 | $1,433.70 |
| Sonnet 5.5 | 500,000 | $716,850.00 | $35,842.50 |
| gpt-5.5 | 20,000 | $71,685.00 | $7,168.50 |

Even a modest three-server setup (5,150 tokens) on Sonnet 5.5 comes out to $309, $6,180, and $154,500 a month uncached. (I put the full grid, including Opus 5.5 and gpt-6.1-sol, in [`results.md`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/every-mcp-server-taxes-every-prompt/results.md) in the repo.)

"Fully cached" is the optimistic floor: every single call hits cache, zero write fees. Which brings me to the best pushback against this whole post.

## Wait, doesn't prompt caching solve this?

On price, it solves most of it. That's the strongest counterargument, so it gets full credit.

Tool definitions sit right at the front of the request, and [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) caches prefixes in the exact order of tools, system prompt, and messages. A static tool list is the textbook use case. On Sonnet 5.5, a cache read drops the price by 95% ($0.10 per million instead of $2). [OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching) caches prefixes automatically starting at 1,024 tokens, tool definitions included.

![Monthly bill falls from $28,674 to $1,433.70 with caching, while the 23,895 tokens read per call stay the same](/images/blog/mcp-bill-vs-menu.svg "Monthly overhead for the ten-server stack at 20,000 calls a day on Sonnet 5.5, uncached against fully cached. Fully cached is the optimistic floor: every call hits the cache, with no write fees.")

There is also [tool search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), where you mark tools `defer_loading: true` so only the ones the model asks for enter its context. Anthropic's [engineering post](https://www.anthropic.com/engineering/advanced-tool-use) showed a five-server setup dropping from roughly 77,000 tokens to 8,700 (an 85% cut), while Opus 4 accuracy jumped from 49% to 74%. Apply that same 85% cut to my ten-server stack and 23,895 tokens shrinks to about 3,600. (That's just my back-of-the-envelope math, not a live run.)

Both are real wins. Neither removes the tax:

- **Caches expire fast and break easily.** Anthropic's default cache TTL is 5 minutes, and [tweaking a single tool definition](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) busts the whole prefix. Any server that returns user-specific tool lists throws caching out the window.
- **Caching cuts the invoice, not the context.** The model still reads all 143 tool schemas on every turn.
- **Tool search still ships the payload.** Anthropic's docs note that you still send every definition in the `tools` array on each request; deferral controls what enters the model's attention, not what goes over the wire.
- **It isn't automatic everywhere.** Plenty of desktop chat apps that let you toggle on ten MCP servers do neither.

## Where I'd stop trusting this post

**Prompt caching might already be saving you.** If you have steady traffic and a stable tool list, your real bill looks like the cached column, not the scary uncached one. And if you only connect one or two tiny servers, or your prompts are already 30k tokens long, this is noise.

**My tokenizer is a proxy.** `o200k_base` is OpenAI's tokenizer, not Claude's. Trust the relative ranking and order of magnitude, then check your own provider's `usage` field before putting numbers in a budget.

**I only picked eleven credential-free servers.** That biases my sample toward simpler tools. Enterprise servers sitting behind OAuth logins usually ship *more* tools, not fewer. Also, the `github` server I measured is the older reference one, not the newer official release.

**I didn't run a live model.** I measured tokens and did the pricing arithmetic, not end-to-end latency or tool-calling accuracy. The accuracy numbers come straight from Anthropic's own write-up.

## The takeaway

Before you plug a new MCP server into your agent, run its `tools/list` and count the tokens first. It takes ten lines of code (feel free to grab [my script](https://github.com/0xadityaa/Portfolio/blob/main/content/research/every-mcp-server-taxes-every-prompt/list-tools.mjs) from the repo). My personal rule of thumb: if a server eats more than a quarter of my typical prompt and only gets used on a fraction of turns, I defer it or keep it turned off until I actually need it.

If someone shows me a real production workload holding 90%+ cache hits with zero accuracy dip past 100 tools, I'll happily eat my words. Until then, check the menu size before you hand it to your model.
