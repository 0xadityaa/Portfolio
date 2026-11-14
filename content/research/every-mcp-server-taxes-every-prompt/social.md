## Thread

Ten MCP servers add 23,895 tokens to every request, before you type a word. I counted the tool definitions on 11 popular servers. Here's what that costs, and what caching does and doesn't fix.
---
The spread is huge. chrome-devtools: 6,751 tokens. fetch: 296. Server count tells you little. Tool count and schema size tell you a lot.
---
Against a short 2,000-token prompt (my assumption), five servers are 84% of what the model reads. Ten are 92%. You're mostly paying for the menu, not the question.
---
In money: ten servers at 20,000 calls a day on Sonnet 5.5 is $28,674 a month, overhead only. That's $2 per million input tokens, Anthropic's page, 14 Nov 2026.
---
Prompt caching helps a lot. A hit is $0.10 per million, so that bill drops to $1,433.70. But the model still reads every token, and changing one tool definition throws the cache away.
---
My rule: count a server's tools before you connect it. The client, raw JSON and cost grid are in the post. https://www.0xadityaa.dev/blog/every-mcp-server-taxes-every-prompt

## Singles

23,895 tokens. That's what ten MCP servers send with every request, before your question. Next to a 2,000-token prompt, the tools are 92% of the input. So the menu outweighs the order.
---
Which costs more to describe, chrome-devtools or fetch? 6,751 tokens versus 296. Same protocol, 23x apart. So check the number before you add a server.
---
Ten MCP servers, 20,000 calls a day, Sonnet 5.5: $28,674 a month just to describe the tools. With cache hits, $1,433.70. A 95% discount, not a zero. So budget for it.
---
Anthropic's tool search reports 77K tokens of tools down to 8.7K. Same ratio on my ten servers: 23,895 down to about 3,600. That's arithmetic, not something I ran. So treat it as a promise.
---
My ten-server setup exposes 143 tools. Anthropic's docs say tool selection degrades past 30 to 50. The token bill you can see. The wrong tool pick you won't. So count both.

## Substack Note

Ten MCP servers add 23,895 tokens to every request you send. I started eleven popular open-source ones on my laptop, asked each for its tool list, and counted: 146 tools, 24,395 tokens in total.

That's before you type anything. chrome-devtools alone is 6,751 tokens. fetch is 296. Next to a short 2,000-token prompt (my assumption), ten servers are 92% of the input.

At 20,000 model calls a day on Sonnet 5.5, that overhead is $28,674 a month. Prompt caching cuts it to $1,433.70, and tool search can shrink the context further. Neither makes the definitions free: the model still reads them, and a cache breaks the moment a tool changes.

Caveats: I used OpenAI's tokenizer as a proxy, and I didn't test any of this against a live model.

My rule is simple. Count a server's tool definitions before you connect it. The client, raw JSON and cost grid are all in the post.

https://www.0xadityaa.dev/blog/every-mcp-server-taxes-every-prompt
