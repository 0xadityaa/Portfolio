## Thread

I priced an agent loop. 10x the steps meant 55x the input tokens: 0.18M at 10 steps, 10.1M at 100. Then I priced the three common fixes. One of them quietly undoes another.

[image: /images/blog/agent-input-tokens-by-strategy.svg]
---
Every step resends the whole history, so step n carries everything from steps 1 to n-1 and the total grows with the square.

Caching off, nothing cleared, simulated on Sonnet 5.5:
→ 10 steps: 0.18M
→ 100 steps: 10.1M
---
Caching removes no tokens. It changes their price.

100-step bill: $20.43 to $1.72, cache assumed always warm. Even at 10 steps: $0.39 to $0.10. A read costs 0.05x fresh input, a write 1.25x.
---
Clearing one old tool result per step, on top of caching: $7.20 against $1.72 for doing nothing.

Each step edits the middle of the history, so the cache rewrites everything after the edit.
---
Turn caching on first. If you clear, clear in big batches, never one result per step.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/double-an-agents-steps-and-its-input-nearly-quadruples

## Singles

$20.43 to $1.72.

That's my simulated 100-step agent run on Sonnet 5.5, caching off against on, cache assumed always warm. I guessed caching would barely help short runs. At 10 steps it still cuts $0.39 to $0.10.
---
Clearing old tool results cuts 100-step agent input from 10.1M tokens to 3.7M.

Until caching is on. Then clearing one result per step costs $7.20 and doing nothing costs $1.72.

A clear that fires every step, under caching, is a regression.
---
3.4x, then 3.7x.

That's how much agent input grew when steps doubled (25 to 50, then 50 to 100). Pure squaring gives 4.
---
A cached 100-step run pays 2.9x the input cost it paid at 50 steps, and ends at 190,730 tokens of context.

The price flattens. The window doesn't.
---
Compacting every 25 steps with caching on: $1.21 for a 100-step run. Caching alone: $1.72. No management, no caching: $20.43.

The largest context drops from 190,730 tokens to 57,889.

## Link post

Caching cut a simulated 100-step agent bill from $20.43 to $1.72. Clearing one tool result per step on top of it pushed the bill back to $7.20.

<BLOG_URL>
[image: /images/blog/agent-input-tokens-by-strategy.svg]

## Question

When your agent loop clears or compacts context, do you do it every step or in batches, and did you check your cache reads afterwards?

## Substack Note

Ten times the agent steps meant 55 times the input tokens in my model: 0.18 million at 10 steps, 10.1 million at 100.

I simulated a 100-step agent loop on Claude Sonnet 5.5 and priced the usual fixes, with the cache assumed always warm. Caching cut the bill from $20.43 to $1.72. Add the obvious cleanup on top, clearing one old tool result per step, and it climbs back to $7.20.

The reason: a per-step clear edits the middle of the history, so the cache rewrites everything after the edit. Clearing in big batches avoids most of that.

My model has no quality term, and a cached run still fills the context window.

<BLOG_URL>
