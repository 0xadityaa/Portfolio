## Hook

10x the agent steps, 55x the tokens.

Simulated 100-step run, cache assumed always warm:
$20.43 without caching, $1.72 with it
$7.20 once you clear one old tool result per step

Does your cleanup break your cache reads?

## Thread

10x the agent steps, 55x the tokens.

I modelled a 100-step agent on Sonnet 5.5 and priced three common fixes. A simulation, not a live run. One fix quietly undoes another ↓
---
Why there's anything to fix: every step resends the whole history.

→ 10 steps: 0.18M input tokens
→ 100 steps: 10.1M

Caching off, nothing cleared. Step n carries everything from steps 1 to n-1, so the total grows with the square.
---
Fix 1 is caching. It removes no tokens, it changes their price.

100-step bill: $20.43 to $1.72. Even at 10 steps: $0.39 to $0.10.

Simulation, cache assumed always warm. A cache read costs 0.05x fresh input, a write 1.25x. I guessed it wouldn't help at 10 steps.
---
Fix 2 is the obvious cleanup: clear one old tool result per step.

With caching on, 100 steps: $7.20, against $1.72 for doing nothing.

Simulation, cache assumed always warm. Each step edits the middle of the history, so the cache rewrites everything after the edit.
---
The strongest objection: with caching, the quadratic barely matters.

Cached: $0.10 at 10 steps, $1.72 at 100 (simulated, cache always warm). Nothing I ran contradicts that.

But cached tokens still fill the window: 190,730 at step 100. Accuracy can degrade.
---
Want the model, the tokenised tool outputs and the raw results?

Reply CACHE and I'll DM it.
---
Rule of thumb: if your loop resends a stable history, turn caching on first. If you clear, clear in big batches, never one result per step.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/double-an-agents-steps-and-its-input-nearly-quadruples

## Singles

I guessed caching would barely help a 10-step agent run.

Simulated on Sonnet 5.5, cache assumed always warm: $0.39 to $0.10.

A cache read costs 0.05x fresh input and a write 1.25x. The read price wins even on a short run.
---
Simulated 100-step agent run, Sonnet 5.5, no context management, cache assumed always warm.

100 runs a day for 30 days:
→ caching off: $61,293
→ caching on: $5,151

Same loop. The setting is the whole difference.
---
Clearing old tool results cuts 100-step agent input from 10.1M tokens to 3.7M.

Until caching is on. Then clearing one result per step costs $7.20 and doing nothing costs $1.72.

Simulated, cache assumed always warm. Under caching, a clear that fires every step is a regression.
---
Common advice: with caching on, the quadratic doesn't matter.

What I modelled: a cached 100-step run still pays 2.9x the input cost it paid at 50 steps, and ends at 190,730 tokens of context.

The price flattens. The window doesn't.
---
Most agent loops resend the whole history every step. I modelled what that does to input:

→ 10 steps: 0.18M tokens
→ 25 steps: 0.80M
→ 50 steps: 2.75M
→ 100 steps: 10.09M

Caching off, nothing cleared. The curve turns quadratic long before the window fills.

## CTA

CACHE | the agent-loop cost model, tokenised tool outputs and raw results | https://github.com/0xadityaa/Portfolio/tree/main/content/research/double-an-agents-steps-and-its-input-nearly-quadruples

## Reply prompts

Modelled this: a 100-step agent loop on Sonnet 5.5 with caching on costs $1.72, but clearing one old tool result per step pushes it to $7.20 (simulation, cache assumed always warm). Do you clear in batches or per step?
Modelled a 100-step loop with roughly 1.6k-token tool results: 10.1M input tokens, 55x a 10-step run, caching off. The bill goes quadratic well before the context window fills.
In my simulation caching helped even a 10-step agent run on Sonnet 5.5, $0.39 to $0.10, with the cache assumed always warm. Where does it stop helping in your loops: short runs, or slow tool calls?

## Substack Note

Ten times the agent steps, 55 times the input tokens: 0.18 million at 10 steps, 10.1 million at 100.

I built a simulation of a 100-step agent loop on Claude Sonnet 5.5 (not a live API run) to price the usual fixes, with the cache assumed always warm. Caching cut the bill from $20.43 to $1.72. Then I added the obvious cleanup on top, clearing one old tool result per step, and it went back up to $7.20.

The reason is that a per-step clear edits the middle of the history, so the cache rewrites everything after the edit. Clearing in big batches avoids most of that.

The model has no quality term, and a cached run still fills the context window. The tokenised tool outputs and the arithmetic are in the post: https://www.0xadityaa.dev/blog/double-an-agents-steps-and-its-input-nearly-quadruples
