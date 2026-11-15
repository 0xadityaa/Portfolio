## Hook

Your MCP servers are eating tokens before you type a word.

I counted 11 popular ones. Ten add 23,895 tokens to every request. chrome-devtools alone: 6,751. fetch: 296.

How many servers are you running, and have you ever counted?

[image: public/images/blog/tool-definitions-per-request.svg]

## Thread

Your MCP servers are eating tokens before you type a word.

Ten popular ones add 23,895 tokens to every single request. I counted them, priced them, and checked what caching actually fixes:
---
Against a short 2,000-token prompt (my assumption), ten servers are 92% of what the model reads. Five are 84%.

You're mostly sending the menu, not the order.
---
Server count tells you little. Tool count and schema size tell you a lot.

chrome-devtools: 6,751 tokens. fetch: 296. Same protocol, 23x apart.
---
In dollars: ten servers at 20,000 model calls a day on Sonnet 5.5 is $28,674 a month. Overhead only, at $2 per million input tokens (Anthropic's pricing page, 14 Nov 2026).

The model never has to touch a tool for you to pay it.
---
That ten-server setup exposes 143 tools. Anthropic's tool search docs say tool selection accuracy degrades past 30 to 50.

The token bill is visible. The wrong tool pick isn't. I didn't test that against a live model.
---
The strongest objection: caching. A hit is $0.10 per million, so the bill drops from $28,674 to $1,433.70.

True, if every call hits. The cache lives 5 minutes by default, changing any tool definition kills it, and the model still reads every token.
---
Rule of thumb: count a server's tokens before you connect it. If it costs more than about a quarter of your typical prompt and you rarely use it, defer it or leave it off.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/every-mcp-server-taxes-every-prompt

## Singles

I guessed ten MCP servers would cost 25,000 to 40,000 tokens of tool definitions per request. Measured: 23,895.

Lower than I expected. Still 92% of a short prompt.
---
20,000 model calls a day, ten MCP servers, Sonnet 5.5: $28,674 a month to describe tools the model mostly won't call.

That's the overhead alone, before a single useful token.
---
Prompt caching on tool definitions: 95% cheaper per token. It's still 23,895 tokens the model reads on every call, and one edited tool description resets the cache.
---
Common advice: connect every server you might need. What I measured: chrome-devtools is 6,751 tokens, fetch is 296, and ten servers together are 143 tools. Anthropic's docs say tool selection degrades past 30 to 50.
---
If an MCP server costs more than a quarter of your usual prompt and you use it in a few requests, defer it or leave it off by default. If it's small or you hit the cache every time, don't bother.

## Reply prompts

We counted this: ten popular MCP servers are 23,895 tokens of tool definitions on every request. chrome-devtools is 6,751 of those by itself, fetch is 296. Worth checking `tools/list` before adding the next one.

Caching helps with price, not length. I priced it: ten servers at 20,000 calls a day on Sonnet 5.5 is $28,674 a month uncached and $1,433.70 with every call a cache hit. The model reads the same 23,895 tokens either way.

On tool selection: the ten servers I measured expose 143 tools, and Anthropic's tool search docs put the accuracy drop at 30 to 50. Has anyone measured where it bites with real servers?

## Substack Note

Ten popular MCP servers add 23,895 tokens to every request you send, before you type a word.

I started eleven open-source servers on my laptop, asked each one for its tool list and counted: 146 tools, 24,395 tokens. chrome-devtools alone is 6,751. fetch is 296. Against a short 2,000-token prompt (my assumption), ten servers are 92% of the input.

At 20,000 model calls a day on Sonnet 5.5, that overhead is $28,674 a month. Prompt caching cuts it to $1,433.70 if every call hits the cache, and tool search can shrink what enters the context. Neither makes the tokens free: the model still reads them, and a cache breaks the moment a tool definition changes.

I used OpenAI's tokenizer as a proxy and didn't test any of this against a live model. My rule: count a server's tool definitions before you connect it. The client, raw JSON and cost grid are in the post.

https://www.0xadityaa.dev/blog/every-mcp-server-taxes-every-prompt
