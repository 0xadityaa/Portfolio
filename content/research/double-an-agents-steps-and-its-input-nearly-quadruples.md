# Double an Agent's Steps and Its Input Nearly Quadruples

- Topic issue: none (series post 19, planned for Tue 30 March 2027)
- Format: essay
- Thesis: Because an agent resends its whole history on every step, total input tokens grow roughly quadratically with the number of steps. Clearing old tool results, compaction and prompt caching change the curve in different ways, so pick by what your loop repeats.
- Reader: an engineer building or paying for an agent loop who has seen "context management" in the docs and hasn't priced the strategies against each other.

Title note: the planned title said the bill "grows with the square of its steps". The arithmetic doesn't support that for the bill. Tokens are close to quadratic (doubling steps gives 3.43x then 3.67x, not 4x, because of the fixed prefix), and with caching the dollar curve is 2.86x per doubling at 50 to 100 steps. The title now states the measured token ratio.

## What this adds

The strongest existing writing is Anthropic's own: [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (why context is scarce, compaction, tool result clearing), the [context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) and [compaction](https://platform.claude.com/docs/en/build-with-claude/compaction) docs (the mechanics and parameters), and the [prompt caching docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching). They describe each tool and warn that clearing invalidates the cache. None prices the strategies against each other over a run. This post adds a deterministic model that counts cumulative input tokens and dollars for 10, 25, 50 and 100 steps under five strategies, with and without caching, and shows where clearing and caching interact badly. It builds on the MCP post (`post/every-mcp-server-taxes-every-prompt`, tool definitions as the fixed prefix) and the caching post (`post/prompt-caching-rewards-boring-prompts`) without re-deriving them.

## Artifact

Folder: `content/research/double-an-agents-steps-and-its-input-nearly-quadruples/`. Model, tokenised samples, prices, results, diagram script, README and `EXPECTATION.txt`.

Expectation, written before running (also in `EXPECTATION.txt`): about 1,500 tokens per tool result; cumulative input around 9M tokens at 100 steps, 70 to 90x the 10-step figure; 200k crossed near step 110; clearing cuts 75 to 85%; compaction cuts 50 to 60%; caching cuts 75 to 85% but might barely help at 10 steps; sliding clearing with caching worse than caching alone.

Commands (from the artifact folder; Python 3.12.8, tiktoken 0.8.0, macOS 26.5.1, 2026-11-14):

```
python3 model.py > results/model.txt
python3 make_diagram.py
```

Raw output, abridged (full file in `results/model.txt`):

```
tokenised samples (o200k_base): file_read_large 3559, grep 1435, file_read_medium 1887, vcs_log 1784, ls 1359, file_read_small 1260, check 8
mean tool result 1,587; reply 250; growth per step 1,837; prefix 8,000; task 500; summary 4,000

cumulative input (M tokens)           10     25     50     100
none                                0.182  0.800  2.748  10.090
clear-sliding (keep 10)             0.182  0.614  1.468   3.682
clear-trigger (50k, keep 5)         0.182  0.716  1.650   3.768
compact every 25 steps              0.182  0.800  1.704   3.556
compact at 100k                     0.182  0.800  2.748   5.694

100 steps, total $ (input+output) uncached | cached
none 20.431 | 1.717   clear-sliding 7.614 | 7.203   clear-trigger 7.787 | 1.603
compact25 7.483 | 1.212   compact100k 11.718 | 1.376
largest context: none 190,730; sliding 50,904; trigger 49,978; compact25 57,889; compact100k 99,965
200k first crossed (300 steps run): none at step 105 (step 57 with 2x tool results); no other strategy
doubling ratio (input $, uncached): none 3.43 (25->50), 3.67 (50->100); cached none 2.43, 2.86
cached none, 100 steps: reads $0.990, writes $0.477
summarisation calls (compact25, 100 steps): 3 calls, $0.344 input + $0.120 output of $7.483 uncached
2x tool results, 100 steps cached input $: none 2.65, clear-trigger 3.89, compact100k 1.42
```

Did the expectation hold? Partly. Right: the quadratic shape, near-linear clearing and the sliding-clear plus caching clash. Wrong or off: 10 to 100 steps gave 55x, not 70 to 90x, because the fixed prefix and a front-loaded cycle matter at 10 steps; the 200k crossing came at step 105, close to my 110; clearing cut 63% not 75 to 85%; caching cut 93% at 100 steps, better than my 75 to 85%; and caching helped even at 10 steps (78% on input), where I'd guessed it might not.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Sonnet 5.5: input $2, 5m write $2.50, 1h write $4, read $0.10 (0.05x), output $10 per MTok | https://platform.claude.com/docs/en/about-claude/pricing | 1 | 2026-11-14 |
| Claude 4.7+ tokenizer produces about 30% more tokens for the same text | same | 1 | 2026-11-14 |
| Sonnet 5.5 context window 1M, standard pricing across it; 200k on older models such as Sonnet 4.5 (deprecated) | https://platform.claude.com/docs/en/build-with-claude/context-windows ; pricing page "Long context pricing" | 1 | 2026-11-14 |
| Cached tokens still count toward the window; caching changes price, not whether they count | context-windows page | 1 | 2026-11-14 |
| Accuracy and recall degrade as token count grows (context rot) | context-windows page | 1 | 2026-11-14 |
| Context editing: `clear_tool_uses_20250919`, trigger default 100,000, keep default 3, `clear_at_least`, placeholder text; clearing invalidates cached prefixes; beta header `context-management-2025-06-27` | https://platform.claude.com/docs/en/build-with-claude/context-editing | 1 | 2026-11-14 |
| Threshold compaction: trigger default 150,000, minimum 50,000; summarisation is an extra sampling step billed via `usage.iterations`; example 3,500-token compaction output; breakpoint after the system prompt keeps it cached | https://platform.claude.com/docs/en/build-with-claude/compaction-threshold | 1 | 2026-11-14 |
| On-demand compaction: summarisation call is billed like any other request and sees the full conversation | https://platform.claude.com/docs/en/build-with-claude/compaction-on-demand | 1 | 2026-11-14 |
| Automatic caching: breakpoint moves to the last block, each request reads the prefix and writes the new suffix; 20-position lookback; 5-minute TTL refreshed on use | https://platform.claude.com/docs/en/build-with-claude/prompt-caching | 1 | 2026-11-14 |
| n tokens give n² pairwise attention relationships; context rot; clearing is "one of the safest lightest touch forms of compaction"; tune compaction for recall first | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | 1 | 2026-11-14 |
| Lost in the Middle abstract: performance can degrade significantly when the position of relevant information changes | https://arxiv.org/abs/2307.03172 (abstract only read) | 1 | 2026-11-14 |
| Chroma Context Rot: 18 models; performance varies significantly with input length even on simple tasks | https://www.trychroma.com/research/context-rot | 1 | 2026-11-14 |
| Token counts, cumulative input, costs, crossing steps, doubling ratios | artifact output, `results/model.txt` | his artifact | 2026-11-14 |
| tiktoken o200k_base as a tokenizer proxy | https://github.com/openai/tiktoken | 1 | 2026-11-14 |
| Counter: with caching, resending history is cheap | the artifact's own cached rows ($1.72 at 100 steps against $20.43) | his artifact | 2026-11-14 |

Notes on reading: WebFetch summarises pages with a small model. The Sonnet 5.5 prices and the 30% tokenizer sentence were confirmed by grepping the saved pricing page text. The statement "tune compaction for recall first" and the quote from the context-engineering post came through the summary, so they are worth one human look. The Lost in the Middle claim comes from the abstract only, and the post paraphrases only that. Chroma's headline was read through the summary. Pages longer than 100,000 characters (pricing, compaction-threshold, context-editing) had their tails unread.

## Counter-argument

With caching, re-sending history is cheap, so the quadratic curve matters little in dollars. The post steelmans it with the artifact's cached numbers (a cached 100-step run is $1.72, a 10-step run $0.10, 93% below uncached) and then says what caching leaves alone: the window (cached tokens still count, per the docs), quality (Anthropic's context-rot statement, Chroma, Lost in the Middle) and latency (not measured). Gap: I did not find a named practitioner arguing the "caching makes it irrelevant" side in so many words; the objection is built from the pricing page.

## From Aditya

Nothing. The post claims no personal experience. Every "I" is "I ran", "I modelled", "I'd guessed".

## Outline

Thesis: input tokens are quadratic in steps; clearing, compaction and caching bend it differently; pick by what the loop repeats.
1. Opening and thesis: 0.18M at 10 steps, 10.1M at 100, 55x.
2. The short version.
3. Why does the bill grow with the square? Formula, sizes with justification, table 1 (tokens by strategy and steps), modelling-choice flag.
4. What does each fix do to the curve? Diagram; clearing, compaction, caching mechanics.
5. Which one actually pays? Table 2 (cost at 100 steps, caching off and on, largest context), clearing against caching, three volumes.
6. Where does the 200k window come in? Crossing steps; 1M on Sonnet 5.5.
7. Where I'd stop trusting this post: caching steelman first, then no quality term, one repo's sizes and a proxy tokeniser, always-warm cache.
8. The takeaway: decision rule and what would change his mind.

Diagram: `public/images/blog/agent-input-tokens-by-strategy.svg`, cumulative input tokens against step for the five strategies, with the no-management line in the accent colour. It carries the claim that the curve is quadratic and that clearing and compaction flatten it.

## Style.md's six things, where they are

1. Thesis in the first 150 words: the bold sentence in the second paragraph.
2. Artifact: model, samples and results in the artifact folder, linked in the third paragraph.
3. Numbers with their papers: pricing, caching, context-editing and compaction docs linked at first mention, dated 2026-11-14 here; cost arithmetic at three volumes (10, 100, 1,000 runs a day) in section 5.
4. Links as evidence: 14 external links.
5. Limits: "Where I'd stop trusting this post", the caching steelman first.
6. Ending that adds: the decision rule and the real-usage-fields check he'd like to run.

## Open questions

- Does he have a real agent trace (usage fields from a long run) he's happy to cite? That would turn the "no live API" limit into a result.
- Does he want the 200k yardstick kept, given Sonnet 5.5 has a 1M window? The post says so in section 6.
- The tool outputs are from this repo (his code). Fine to publish the samples, or swap in something else?

## Left out

Thinking-block clearing and preserved thinking; the memory tool; keeping recent turns word for word during compaction; background compaction; a 1-hour TTL variant; Haiku and Opus prices; a cold-cache (slow tool) variant; latency; summaries that lose information and a quality benchmark for them.
