# Tool-definition tax: artifact

Measures how many tokens the tool definitions of 11 open-source MCP servers cost, and what that costs per month at three request volumes. Run on 2026-11-14. Write-up: `content/blog/every-mcp-server-taxes-every-prompt.md`.

## Files

- `EXPECTATION.txt`: what I expected, written before running anything.
- `servers.json`: the 11 servers, with pinned versions where npm gave one (the three `uvx` servers were not pinned; versions are in the raw files).
- `list-tools.mjs`: dependency-free Node client. Spawns each server over stdio, sends `initialize`, `notifications/initialized`, then pages through `tools/list`. Saves the raw result.
- `raw/*.tools.json`: the raw `tools/list` results. `raw/run-log.txt`: the run log.
- `count-tokens.py`: counts tokens with tiktoken `o200k_base` and prices the overhead. Writes `results.json` and `results.md`.
- `social.md`: social cuts for the post.

## Reproduce

Needs Node 22 and `uv`. Keep the virtualenv outside the repo.

```bash
mkdir -p /tmp/mcp-sandbox            # the filesystem server needs a directory to expose
cd content/research/every-mcp-server-taxes-every-prompt
node list-tools.mjs servers.json raw > raw/run-log.txt
python3 -m venv /tmp/mcp-venv && /tmp/mcp-venv/bin/pip install tiktoken==0.14.0
/tmp/mcp-venv/bin/python count-tokens.py
```

Edit the `/private/tmp/claude-501/mcp-sandbox` path in `servers.json` if you use another directory.

## What is counted

For each tool, compact JSON of `{name, description, input_schema}`: the three fields every provider's function-calling format carries. The "Full raw objects" column counts the whole tool object as the server sent it (adds `title`, `annotations`, `outputSchema`, `_meta`). Not counted: the provider's own tool-use system prompt (286 tokens on Claude Sonnet 5.5 and Opus 5.5 per Anthropic's pricing page) and any wrapper a client adds.

## Caveats

- `o200k_base` is an OpenAI tokenizer. Claude and others tokenize differently, so treat counts as a proxy. The ranking of servers should hold; the absolute numbers will not match a vendor's meter.
- The GitHub server is the deprecated `@modelcontextprotocol/server-github` (reports version 0.6.2), run with a placeholder token because it only lists tools. The current GitHub MCP server is a different, larger product and was not measured.
- Tool lists can depend on config. `filesystem` exposes the tools it exposes with one allowed directory. `chrome-devtools` and `playwright` expose their default sets.
- Prices were copied on 2026-11-14 from the pages named in `results.json`. Check them again before relying on them.
- Cost = overhead tokens x model calls per day x 30 x price per million. "Fully cached" assumes every call is a cache read and ignores cache-write charges.
