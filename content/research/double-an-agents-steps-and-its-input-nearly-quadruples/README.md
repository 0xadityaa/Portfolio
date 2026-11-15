# Agent-loop input model

A model of an agent loop that resends its history on every step, priced on Claude Sonnet 5.5 for five context strategies, with and without prompt caching. It backs the post `content/blog/double-an-agents-steps-and-its-input-nearly-quadruples.md`. No live API calls: every number is arithmetic on the inputs below.

## Set up

Python 3.12 (written and checked on 3.12.8) and `tiktoken` 0.8.0. From the repository root:

```
python3 -m venv .venv && source .venv/bin/activate
pip install tiktoken==0.8.0
cd content/research/double-an-agents-steps-and-its-input-nearly-quadruples
```

## Fetch data

No model weights and no API key. The tool outputs are already in `samples/`, and the prices are in `prices.json`. `tiktoken` downloads the `o200k_base` vocabulary on first use, so the first run needs internet access. After that it works offline.

## Run it

From this folder:

```
python3 model.py > results/model.txt   # also writes results/series.json
python3 make_diagram.py                # writes public/images/blog/agent-input-tokens-by-strategy.svg
xmllint --noout ../../../public/images/blog/agent-input-tokens-by-strategy.svg
```

The model is deterministic: rerunning it on 2026-11-15 reproduced `results/model.txt` byte for byte.

## How long it takes

About 25 seconds for `model.py` on a laptop CPU (the first run also downloads the vocabulary). `make_diagram.py` takes under a second.

## Inputs

| Input | Value | Why |
| --- | --- | --- |
| Prefix (system prompt + tool definitions) | 8,000 tokens | About 2k of instructions plus 6k of tools. Ten MCP servers measured 23,895 tokens in the MCP post, so this is small. Swept at 2k, 8k and 24k in `results/model.txt`. |
| First user message | 500 tokens | Rounded. |
| Assistant reply per step | 250 tokens | A sentence of narration plus one tool call. |
| Tool results | `samples/*.txt`, tokenised | Real outputs captured from this repository: three `cat -n` file reads (3,825 to 12,585 bytes), a `grep -rn`, an `ls -la`, a commit log with `--stat`, and a `check-posts` run. 8 to 3,559 tokens. |
| Tool call mix | fixed 10-step cycle, see `CYCLE` in `model.py` | Agents read and search far more than they run checks. Mean 1,587 tokens per result. This choice sets the slope; the sensitivity section reruns at 0.5x and 2x. |
| Cleared result | 20 tokens | A short placeholder, as in the docs' description of context editing. |
| Compaction summary | 4,000 tokens | The threshold-compaction docs show a 3,500-output-token example. |
| Window | 200,000 | The brief's yardstick. Sonnet 5.5's own window is 1M. |
| Prices | `prices.json` | Sonnet 5.5, $/MTok: input 2, 5-minute write 2.50, read 0.10, output 10. Copied from the pricing page on 2026-11-14. |
| Tokeniser | `o200k_base` | A proxy. The pricing page says Claude 4.7 and later models produce about 30% more tokens for the same text, so real counts are probably higher. |

## Strategies

- `none`: keep everything.
- `clear-sliding (keep 10)`: from step i, tool results older than 10 steps become a 20-token placeholder, one more each step.
- `clear-trigger (50k, keep 5)`: the shape of Anthropic's `clear_tool_uses` edit. When the next request would reach 50k tokens, replace every tool result except the latest 5. Once cleared, stays cleared.
- `compact every 25 steps`: before step 26, 51, 76 an extra call sends the whole current context and returns a 4,000-token summary. Context restarts as prefix + summary. The extra call's input and output are billed.
- `compact at 100k`: same, when the next request would reach 100,000 tokens.

Compaction keeps no recent turns word for word, and the summary is assumed lossless. Neither is true of real summaries.

## How caching is modelled

Automatic caching: a breakpoint at the end of every request, plus one after the prefix (the docs recommend a breakpoint at the end of the system prompt so compaction keeps it cached). A request reads the longest prefix of its context that matches an earlier request's full context (or the prefix block) and writes the rest at the 5-minute write price. In `none` that means each step reads the whole previous context and writes only the new reply and tool result. Reading costs 0.05x of input on Sonnet 5.5, per the pricing page footnote.

Assumptions that are mine: every step starts within 5 minutes of the last, so the cache is always warm; the 20-block lookback window in the docs is ignored; the summarisation call is billed as an ordinary request that reads the previous context from cache. Sliding clearing looks bad with caching because it changes a result in the middle of the history on every step, so the match stops there. A movable breakpoint just before the edit would help it, and I did not model one.

## Where the output goes

`results/model.txt` holds, in order: the tokenised samples; cumulative input and cost per strategy at 10, 25, 50 and 100 steps (input only, and input plus output); per-step context size and the step where 200k is crossed; a check of the closed-form quadratic; where the cached bill goes (reads against writes); the doubling ratios; the cost of the summarisation calls; the 200k crossing over 300 steps; and sensitivity runs. `results/series.json` is what the diagram reads.

Volumes quoted in the post (100-step runs, 30 days, input plus output): runs a day times 30 times the per-run total.

| Runs a day | None, no cache | None, cached | Compact every 25, cached |
| ---: | ---: | ---: | ---: |
| 10 | $6,129 | $515 | $364 |
| 100 | $61,293 | $5,151 | $3,636 |
| 1,000 | $612,930 | $51,510 | $36,360 |
