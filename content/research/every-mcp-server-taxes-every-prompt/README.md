# Tool-definition tax: artifact

Measures how many tokens the tool definitions of 11 open-source MCP servers cost, and what that costs per month at three request volumes. Run on 2026-11-14. Write-up: `content/blog/every-mcp-server-taxes-every-prompt.md`.

## Files

- `EXPECTATION.txt`: the expected range, written before running anything.
- `servers.json`: the 11 servers, with pinned versions where npm gave one (the three `uvx` servers were not pinned; versions are in the raw files).
- `list-tools.mjs`: dependency-free Node client. Spawns each server over stdio, sends `initialize`, `notifications/initialized`, then pages through `tools/list`. Saves the raw result.
- `raw/*.tools.json`: the raw `tools/list` results. `raw/run-log.txt`: the run log.
- `count-tokens.py`: counts tokens with tiktoken `o200k_base` and prices the overhead. Writes `results.json` and `results.md`.
- `social.md`: social cuts for the post (X hook, thread, singles, reply prompts, Substack Note).

## Reproduce

**1. Set up.** Node 22 (v22.23.1 was used), `uv` for `uvx`, Python 3.12 (3.12.8 was used) and `tiktoken==0.14.0`. Keep the virtualenv outside the repo.

```bash
mkdir -p /tmp/mcp-sandbox            # the filesystem server needs a directory to expose; servers.json points here
python3 -m venv /tmp/mcp-venv && /tmp/mcp-venv/bin/pip install tiktoken==0.14.0
cd content/research/every-mcp-server-taxes-every-prompt
```

**2. Fetch the data.** There are no weights or datasets. The next step downloads the 11 MCP servers itself: `npx -y` pulls the npm ones at the versions pinned in `servers.json`, and `uvx` pulls `mcp-server-fetch`, `mcp-server-git` and `mcp-server-time` unpinned (all three reported 2026.11.11 on 2026-11-14). It needs network access.

**3. Run.**

```bash
node list-tools.mjs servers.json raw > raw/run-log.txt
/tmp/mcp-venv/bin/python count-tokens.py
```

The first command writes `raw/*.tools.json`. The second reads them and writes `results.json` and `results.md`. If you use a different sandbox directory, change its path in `servers.json`.

**4. How long.** About 70 seconds for the Node step on a laptop (each server takes 4 to 28 seconds to start, mostly downloading). Slow networks take longer, because the client waits up to 180 seconds per server. The counting step takes about 3 seconds. No GPU and no API key. Both steps were rerun on 2026-11-15: `results.md` and `results.json` came out byte-identical, and every raw file matched except `filesystem`, which echoes back the sandbox path.

## What is counted

For each tool, compact JSON of `{name, description, input_schema}`: the three fields every provider's function-calling format carries. The "Full raw objects" column counts the whole tool object as the server sent it (adds `title`, `annotations`, `outputSchema`, `_meta`). Not counted: the provider's own tool-use system prompt (286 tokens on Claude Sonnet 5.5 and Opus 5.5 per Anthropic's pricing page) and any wrapper a client adds.

## Caveats

- `o200k_base` is an OpenAI tokenizer. Claude and others tokenize differently, so treat counts as a proxy. The ranking of servers should hold; the absolute numbers will not match a vendor's meter.
- The GitHub server is the deprecated `@modelcontextprotocol/server-github` (reports version 0.6.2), run with a placeholder token because it only lists tools. The current GitHub MCP server is a different, larger product and was not measured.
- Tool lists can depend on config. `filesystem` exposes the tools it exposes with one allowed directory. `chrome-devtools` and `playwright` expose their default sets.
- Prices were copied on 2026-11-14 from the pages named in `results.json`. Check them again before relying on them.
- Cost = overhead tokens x model calls per day x 30 x price per million. "Fully cached" assumes every call is a cache read and ignores cache-write charges.
