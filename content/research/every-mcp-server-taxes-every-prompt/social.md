## Thread

I started 11 open-source MCP servers on my laptop, asked each for its tool list, and counted the tokens. Together: 146 tools, 24,395 tokens. That is sent on every request, before you type a word.
---
The spread is huge. chrome-devtools is 6,751 tokens. fetch is 296. Server count tells you little. Tool count and schema size tell you a lot.
---
Take ten of them: 23,895 tokens per request. Against a short 2,000-token prompt (my assumption), that is 92% of the input. Five servers is 84%.
---
Money: ten servers at 20,000 model calls a day on Sonnet 5.5 is $28,674 a month in overhead alone, at $2 per million input tokens (Anthropic's page, 14 Nov 2026).
---
Caching helps a lot. A cache hit on Sonnet 5.5 is $0.10 per million, so that same bill drops to $1,433.70. It does not shorten the context, and changing any tool definition throws the cache away.
---
Full table, the client, and the raw JSON are in the post. My rule: count a server's tools before you connect it. https://www.0xadityaa.dev/blog/every-mcp-server-taxes-every-prompt

## Singles

I counted the tool definitions of ten MCP servers with tiktoken. 23,895 tokens, sent on every request. A short 2,000-token prompt next to that is 8% of what the model reads.
---
Two MCP servers, same job class, very different tax. chrome-devtools: 6,751 tokens of tool definitions. fetch: 296. Check the number before you add one.
---
Ten MCP servers on Sonnet 5.5 at 20,000 calls a day: $28,674 a month just to describe the tools. With prompt cache hits at $0.10 per million, $1,433.70. Caching is a 95% discount, not a zero.
---
Anthropic's tool search reports an 85% cut in tool-definition tokens, about 77K down to 8.7K in their example. Apply that to my ten servers and 23,895 becomes roughly 3,600. That is arithmetic, not a measurement.
---
My ten-server setup exposes 143 tools. Anthropic's tool search docs say selection accuracy degrades past 30 to 50. The token bill is the part you can see. The wrong tool pick is the part you won't.

## Substack Note

I started eleven popular open-source MCP servers on my laptop, asked each one for its tool list, and counted the tokens. Together they came to 146 tools and 24,395 tokens. Ten of them: 23,895.

That is what gets sent with every request, before you type anything. chrome-devtools alone is 6,751 tokens. fetch is 296. Against a short 2,000-token prompt (my assumption), ten servers are 92% of the input.

At 20,000 model calls a day on Sonnet 5.5, that overhead is $28,674 a month at the $2 per million input price. Prompt caching cuts it to $1,433.70. Tool search can cut the context further. Neither one makes the definitions free, and a cache breaks when a tool changes.

I used OpenAI's o200k_base tokenizer, which is a proxy for other models, and I did not test any of this against a live model. The client, the raw JSON, and the cost grid are all in the post.

My rule: count a server's tool definitions before you connect it.

https://www.0xadityaa.dev/blog/every-mcp-server-taxes-every-prompt
