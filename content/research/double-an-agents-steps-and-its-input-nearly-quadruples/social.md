## Thread

A 10-step agent run sends 0.18M input tokens. A 100-step run sends 10.1M.

Ten times the steps, 55 times the tokens. I modelled five ways to cut that on Claude Sonnet 5.5, and one of them fights prompt caching.
---
Every step is a fresh request carrying the whole history so far. Doubling the steps in my model multiplied input by 3.4 (25 to 50 steps) and 3.7 (50 to 100).

Pure squaring would be 4. The fixed system prompt is what keeps it under.
---
Clearing old tool results, or compacting every 25 steps, cut 100-step input from 10.1M tokens to about 3.6M.

The summarisation calls aren't free. Compaction's three calls cost $0.46 of a $7.48 bill, and I counted them.
---
Prompt caching cut the 100-step bill from $20.43 to $1.72. At 10 steps it went from $0.39 to $0.10, and I'd guessed it wouldn't help there.

Reads cost 0.05x of normal input on Sonnet 5.5. That swamps the 1.25x write premium.
---
The catch: clearing a sliding window of old results edits the middle of the history on every step, so the cache rewrites everything after the edit.

With caching on, that run cost $7.20. Caching alone cost $1.72.
---
Caching fixes the price, not the window or the model's attention over a long context. Model, tokenised tool outputs and arithmetic: https://www.0xadityaa.dev/blog/double-an-agents-steps-and-its-input-nearly-quadruples

## Singles

Ten times the steps, 55 times the input tokens.

That's a simulated agent loop on Claude Sonnet 5.5: 0.18M tokens at 10 steps, 10.1M at 100. Every step resends the whole history, and the history keeps growing.
---
Does prompt caching fix an agent's quadratic bill?

It cut my simulated 100-step run from $20.43 to $1.72, 93% less. The curve is still superlinear, 2.7x the cost for 2x the steps, and the window and attention are untouched.
---
Same 100-step agent run, caching on. Clear a sliding window of old tool results: $7.20. Do nothing: $1.72.

Editing the middle of the history forces the cache to rewrite everything after it.
---
Rule of thumb from my agent-loop model: turn caching on before you clear or compact anything.

It cut the 100-step bill 12x. The best uncached fix cut it 2.7x.
---
A 100-step agent run with no context management ends at 190,730 tokens and crosses 200k at step 105. With tool results twice as big, step 57.

Clearing or compacting kept every run under 106k, even at 300 steps.

## Substack Note

A 10-step agent run sends 0.18 million input tokens. A 100-step run sends 10.1 million. That's 55 times the tokens for ten times the steps.

I modelled it on Claude Sonnet 5.5 because every step of an agent loop resends the whole history. Doubling the steps multiplied input by 3.4, then 3.7. Clearing old tool results or compacting every 25 steps cut the 100-step total to about 3.6 million. Prompt caching cut the bill from $20.43 to $1.72.

The part that surprised me: clearing and caching fight. Clearing a sliding window edits the middle of the history on every step, so the cache rewrites everything after it, and that run cost $7.20 with caching on. Caching alone cost $1.72.

It's a model, not a live API run, and it has no term for answer quality. The arithmetic and the tool outputs I tokenised are in the post: https://www.0xadityaa.dev/blog/double-an-agents-steps-and-its-input-nearly-quadruples
