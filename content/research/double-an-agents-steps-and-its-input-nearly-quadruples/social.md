## Hook

In my simulated 100-step agent run, caching cut the bill from $20.43 to $1.72. Then I added per-step clearing of old tool results, caching still on: $7.20. 4x worse than caching alone.

If you clear tool results, have you checked what it does to your cache reads?

## Thread

In my simulated 100-step agent run on Claude Sonnet 5.5, caching cut the bill from $20.43 to $1.72. Adding the obvious cleanup made it 4x worse.

Here's what moved the number and what didn't. It's a model, not a live API run, and the cache is assumed always warm.
---
The cleanup: clear one old tool result per step.

100 steps, caching on: $7.20 with clearing, $1.72 without.

Every step edits the middle of the history, so the cache rewrites everything after the edit.
---
Caching helped even a 10-step run: $0.39 to $0.10, same steps, no context management.

On Sonnet 5.5 a cache read costs 0.05x fresh input and a write 1.25x. My pre-run guess was that it wouldn't help at 10 steps.
---
Why there's anything to fix: every step resends the whole history.

0.18M input tokens at 10 steps, 10.1M at 100. Ten times the steps, 55 times the tokens. Caching off, no management.
---
Caching off, clearing old tool results or compacting every 25 steps cut 100-step input from 10.1M tokens to about 3.6M.

Compaction's three summarisation calls cost $0.46 of a $7.48 bill. I counted them.
---
The strongest objection: with caching the quadratic barely matters, and nothing I ran contradicts that.

It leaves the window and attention alone, though. Cached tokens still count toward the context limit, and Anthropic says accuracy degrades as context grows.
---
Rule of thumb: if your loop resends a stable history, turn caching on first. If you clear, clear in big batches, never one result per step.

Full write-up, code and raw output:
https://www.0xadityaa.dev/blog/double-an-agents-steps-and-its-input-nearly-quadruples

## Singles

I expected caching to barely help a 10-step agent run. In my simulated run on Sonnet 5.5 it cut the bill from $0.39 to $0.10.

Cache reads cost 0.05x of fresh input. That swamps the 1.25x write premium, even on a short run.
---
Simulated 100-step agent run, Sonnet 5.5, no context management, cache assumed always warm.

Run it 100 times a day for 30 days: $61,293 with caching off, $5,151 with caching on.
---
Caching on, 100 steps, input cost only. Clear at a 50k trigger versus do nothing:

$1.35 against $1.47 at my measured tool-result size.
$3.89 against $2.65 with tool results doubled.

A clear that fires often keeps rewriting the cache.
---
If a loop resends a stable history, turn caching on before you clear or compact anything.

In my 100-step model it cut the bill about 12x, from $20.43 to $1.72. The best fix without caching cut it 2.7x, to $7.48.
---
Common advice: with caching on, the quadratic doesn't matter.

What I modelled: a cached run with no management still pays 2.9x the input cost going from 50 to 100 steps, and ends at 190,730 tokens of context.

## Reply prompts

Modelled this: a 100-step agent loop on Sonnet 5.5 with caching on costs $1.72, but clearing one old tool result per step pushes it to $7.20. Are you clearing in batches, or per step?
Modelled a 100-step loop with roughly 1.6k-token tool results: 10.1M input tokens, 55x a 10-step run, caching off. The bill gets quadratic well before the context window fills.
In my model caching helped even a 10-step agent run, $0.39 to $0.10 on Sonnet 5.5, with the cache assumed warm. Where does it stop helping in your loops: short runs, or slow tool calls?

## Substack Note

Caching cut my simulated 100-step agent run from $20.43 to $1.72. Then I added the obvious cleanup on top, clearing one old tool result per step, and the bill went back up to $7.20.

That's the surprise in a model I built on Claude Sonnet 5.5, not a live API run. Every step of an agent loop resends the whole history, so input grows with the square of the steps: 0.18 million tokens at 10 steps, 10.1 million at 100. Clearing or compacting cuts that to about 3.6 million. Caching changes the price instead. But a per-step clear edits the middle of the history, so the cache rewrites everything after it.

The model has no quality term, and it assumes the cache is always warm. The tokenised tool outputs and the arithmetic are in the post: https://www.0xadityaa.dev/blog/double-an-agents-steps-and-its-input-nearly-quadruples
