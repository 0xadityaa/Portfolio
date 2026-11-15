## Hook

Your MCP servers eat 24,000 tokens before you type.

Ten popular servers: 23,895 tokens on every request.
chrome-devtools alone: 6,751. fetch: 296.
Against a 2,000-token prompt (my assumption): 92% overhead.

How many servers are you running?

[image: public/images/blog/tool-definitions-per-request.svg]

## Thread

Your MCP servers eat 24,000 tokens before you type.

I started 11 popular ones, asked each for its tool list and counted. Here's what ten of them cost on every request ↓
---
Ten servers, 143 tools, 23,895 tokens of definitions.

Against a short 2,000-token prompt (my assumption, not measured):

→ 3 servers: 72% of the input
→ 5 servers: 84%
→ 10 servers: 92%

You're mostly sending the menu, not the order.
---
Server count tells you little. Schema size tells you a lot.

chrome-devtools: 33 tools, 6,751 tokens
playwright: 25 tools, 3,934
fetch: 1 tool, 296

The two browser servers alone are 10,685.
---
In dollars: ten servers, 20,000 model calls a day, Sonnet 5.5, overhead only.

$28,674 a month at $2 per million input tokens.

The model never has to call a tool for you to pay it.
---
The strongest objection: prompt caching.

Same setup, every call a cache hit at $0.10 per million: $1,433.70 a month. That's 95% off, and it's real.

But the cache lives 5 minutes by default, one edited tool definition resets it, and the model still reads all 23,895 tokens.
---
Want the script that counts your servers' tokens? Reply MCP and I'll DM it.

It starts each server over stdio, saves the raw tools/list reply and counts it. I didn't run any of this against a live model, so the cost is overhead only.
---
Rule of thumb: count a server's tokens before you connect it. If it costs more than about a quarter of your typical prompt and you rarely use it, defer it or leave it off.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/every-mcp-server-taxes-every-prompt

## Singles

I guessed ten MCP servers would cost 25,000 to 40,000 tokens of tool definitions per request.

Measured: 23,895.

Lower than I expected, and still 92% of a short prompt (2,000 tokens, my assumption).
---
Your MCP client sends every connected tool definition on every request. I measured what that adds, stacking servers in one fixed order:

- 1 server: 2,925 tokens
- 3 servers: 5,150
- 5 servers: 10,417
- 10 servers: 23,895

Each new server raises the cost of every call.
---
20,000 model calls a day, ten MCP servers, Sonnet 5.5:

$28,674 a month to describe tools the model mostly won't call.

That's input overhead alone, priced at $2 per million tokens, before one useful token.
---
Caching saves 95% on tool definitions: $28,674 to $1,433.70 a month in my setup. Until one tool description changes and the cache resets.

It cuts the price, not the length. The model still reads 23,895 tokens either way.
---
Rule of thumb: if an MCP server costs more than a quarter of your usual prompt and you use it in a few requests, defer it or leave it off by default.

If it's small, or you hit the cache every time, don't bother.

## CTA

MCP | the script that counts your MCP servers' tool-definition tokens | https://github.com/0xadityaa/Portfolio/tree/main/content/research/every-mcp-server-taxes-every-prompt

## Reply prompts

We counted this: ten popular MCP servers are 23,895 tokens of tool definitions on every request. chrome-devtools is 6,751 of those by itself, fetch is 296. Worth running tools/list before adding the next one.

Caching helps the price, not the length. Ten servers at 20,000 calls a day on Sonnet 5.5: $28,674 a month uncached, $1,433.70 if every call hits the cache. The model reads the same 23,895 tokens either way.

The ten servers I measured expose 143 tools, and Anthropic's tool search docs put the accuracy drop at 30 to 50. Has anyone measured where it bites with real servers? I priced the tokens but didn't test a live model.

## Substack Note

Ten popular MCP servers add 23,895 tokens to every request, before you type a word.

I started eleven open-source servers on my laptop, asked each for its tool list and counted: 146 tools, 24,395 tokens. chrome-devtools alone is 6,751. fetch is 296. Against a short 2,000-token prompt (my assumption), ten servers are 92% of the input.

At 20,000 model calls a day on Sonnet 5.5, that overhead is $28,674 a month. Prompt caching cuts it to $1,433.70 if every call hits the cache, and tool search can shrink what enters the context. Neither makes the tokens free: the model still reads them, and a cache resets the moment a tool definition changes.

I used OpenAI's tokenizer as a proxy and didn't test any of this against a live model. My rule: count a server's tool definitions before you connect it. The client, raw JSON and cost grid are in the post.

https://www.0xadityaa.dev/blog/every-mcp-server-taxes-every-prompt
