# Every MCP Server You Add Taxes Every Prompt

- Topic issue: none (series topic assigned in chat; syllabus loosely follows llmdojo.dev/curriculum, used only as a topic list)
- Format: essay (about 1,400 words, with an artifact)
- Thesis: tool definitions are a fixed per-request token cost that most people never measure, and past a handful of servers they are most of what a request carries.
- Reader: an engineer who has connected an MCP server or two to an AI app, and has read `what-exactly-is-mcp`.

## What this adds

The strongest existing writing: Anthropic's [Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use) (one five-server setup at about 55K to 77K tokens), the [tool search tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) (a typical multiserver setup at about 55k), and the earlier post `content/blog/what-exactly-is-mcp.md`, which only asserted the cost. This post adds a per-server count of eleven open-source servers, measured by running them, with a cost grid at three volumes on two providers and the cached and deferred cases priced next to it.

## Artifact

Folder: `content/research/every-mcp-server-taxes-every-prompt/` (README has the exact commands).

**Expectation, written before running** (also in `EXPECTATION.txt`): 500 to 3,000 tokens per server, a few heavy ones (browsers, GitHub, everything) at 5,000 to 15,000, ten servers at 25,000 to 40,000, total dominated by two or three heavy ones.

**Did it hold?** Partly. Six of eleven fell in the 500 to 3,000 range, two were below it (`fetch` 296, `sequential-thinking` 489) and three above (`github`, `playwright`, `chrome-devtools`). Only one server passed 5,000 (`chrome-devtools`, 6,751), and nothing reached 15,000. Ten servers landed at 23,895, below my 25,000 floor. "Dominated by a few heavy ones" was half right: the top two are 44% of the 24,395 total.

**Commands**

```bash
node list-tools.mjs servers.json raw > raw/run-log.txt
mkdir -p /tmp/mcp-sandbox
python3 -m venv /tmp/mcp-venv && /tmp/mcp-venv/bin/pip install tiktoken==0.14.0
/tmp/mcp-venv/bin/python count-tokens.py
```

**Environment**: macOS (Darwin 25.5.0), Node v22.23.1, Python 3.12.8, tiktoken 0.14.0, `uv`/`uvx` from miniconda, 2026-11-14. Servers via `npx -y` with pinned versions (filesystem 2.3.0, memory 2.1.1, sequential-thinking 2.1.1, everything 2.3.0, github 2025.4.8 reporting 0.6.2, playwright 0.0.85 reporting 1.66.0-alpha-2026-11-09, context7 4.7.0, chrome-devtools 1.13.0) and unpinned `uvx` for fetch, git, time (all reported 2026.11.11).

**Raw output summary**: all 11 servers started and answered `tools/list` (run log in `raw/run-log.txt`); none were skipped. 146 tools, 24,395 tokens total. Per server: chrome-devtools 6,751; playwright 3,934; github 3,546; filesystem 2,925; memory 1,736; everything 1,721; git 1,435; context7 1,062; time 500; sequential-thinking 489; fetch 296. Cumulative in listed order: 1 = 2,925; 3 = 5,150; 5 = 10,417; 10 = 23,895. Mean over every possible pick: 2,218 / 6,653 / 11,089 / 22,177. Raw JSON in `raw/`, computed tables in `results.md` and `results.json`.

**Method choices to review**: `o200k_base` counter (a proxy, stated in the post); counting compact JSON of name, description, input schema only; ten-server figure is the first ten in listed order (excludes `time`); the GitHub server is the deprecated reference one with a placeholder token; a 2,000-token prompt is an assumption used only for the share-of-input percentages; volumes of 1,000, 20,000 and 500,000 calls a day are my picks.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Servers advertise tools via `tools/list` with name, description, JSON Schema | https://modelcontextprotocol.io/specification/latest/server/tools | 1 | 2026-11-14 |
| Per-server and cumulative token counts | Artifact: `results.md`, `results.json` | mine | 2026-11-14 |
| Claude Sonnet 5.5 input $2 / MTok, cache hit $0.10 / MTok; Opus 5.5 $4 / $0.20 | https://platform.claude.com/docs/en/about-claude/pricing | 1 | 2026-11-14 |
| Tool use is billed as input tokens including `tools`; hidden tool-use system prompt 286 tokens on Sonnet 5.5 and Opus 5.5 | https://platform.claude.com/docs/en/about-claude/pricing (Tool use pricing) | 1 | 2026-11-14 |
| gpt-5.5 input $5.00, cached $0.50; gpt-6.1-sol $2.00 / $0.10 (page summarised by a fetch tool; the platform pricing URL returned 403) | https://developers.openai.com/api/docs/pricing | 1 | 2026-11-14 |
| Cache prefix order tools, system, messages; changing tool definitions invalidates all; default 5-minute TTL; hit multiplier 0.05x on Sonnet 5.5 and Opus 5.5 | https://platform.claude.com/docs/en/build-with-claude/prompt-caching | 1 | 2026-11-14 |
| OpenAI caching automatic, tool definitions in cached prefix, 1,024-token minimum on GPT-5.6 and later | https://developers.openai.com/api/docs/guides/prompt-caching | 1 | 2026-11-14 |
| Tool search: `defer_loading`, every definition still sent each request, deferred tools cannot carry `cache_control`, accuracy degrades beyond 30 to 50 tools, typical multiserver setup about 55k tokens, over 85% reduction | https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool | 1 | 2026-11-14 |
| About 77K to about 8.7K tokens (85%), Opus 4 accuracy 49% to 74% with tool search | https://www.anthropic.com/engineering/advanced-tool-use | 1 (vendor engineering blog) | 2026-11-14 |
| Models use the middle of long contexts worse | https://arxiv.org/abs/2307.03172 | 1 | 2026-11-14 |
| Counter: caching and tool search shrink the cost | the three Anthropic and OpenAI docs above | 1 | 2026-11-14 |
| tiktoken `o200k_base` tokenizer | https://github.com/openai/tiktoken | 1 | 2026-11-14 |
| Reference servers list | https://github.com/modelcontextprotocol/servers | 1 | 2026-11-14 |
| Tool search "85% off 23,895 is about 3,600" | arithmetic on the docs' over-85% figure; not measured | mine | 2026-11-14 |

Primary share: 12 of 14 rows are tier 1.

## From Aditya

Nothing yet. The post makes no first-person claim beyond running the artifact.

## Outline

Hook (number, then a question), a stakes sentence for anyone running ten servers, thesis, "The short version" bullets. Sections: How do you count a tool menu? (method, proxy caveat, expectation) / Which server is the fat one? (per-server table, cumulative numbers, the SVG) / Why does it matter more than it looks? (ratio against an assumed prompt, lost in the middle, tool-search accuracy limit) / What does it cost in dollars? (grid at three volumes) / Doesn't caching fix this? (steelman, quantified at the cached price and the 85% cut, where it breaks) / Where does this post stop being true? / What should you do tomorrow? (rule, what would change my mind).

Diagram: `public/images/blog/tool-definitions-per-request.svg`, bars of cumulative tokens for 1, 3, 5 and 10 servers with a 2,000-token prompt for scale; the accent marks the ten-server bar. Carries the "fixed cost versus prompt" claim.

## Self-check against style.md

1. Thesis in the first 150 words: "My claim: ..." paragraph, fourth block of the post.
2. Artifact: the `tools/list` client, raw JSON, counter, and cost grid in the folder, linked in "How do you count a tool menu?".
3. Numbers with papers: prices linked with dates in "What does it cost in dollars?", arithmetic at 1,000 / 20,000 / 500,000 calls a day.
4. Links as evidence trail: 16 links in about 1,400 words.
5. Limits: "Doesn't caching fix this?" holds the objection, linked to Anthropic and OpenAI docs; "Where does this post stop being true?" repeats it first, then covers the proxy tokenizer, the server selection and the untested live model.
6. Ending that adds: "What should you do tomorrow?" gives the rule of thumb (marked as mine) and what would change my mind.

## Open questions

- Has Aditya connected several MCP servers to a tool he uses daily, and did he notice the cost or slowdown? (Would make a real opening; the post currently opens on the experiment.)
- Does he want to name any servers he actually uses, or keep to the eleven measured?
- Is the 1,000 / 20,000 / 500,000 calls-per-day volume spread right for his readers?
- Should the follow-up (live-model latency and tool-choice accuracy) be scheduled, and does he have API credits for it?
- Number of calls per user session in his own agent workflows, if he wants the "calls, not sessions" point backed by his data.

## Left out

The full Opus 5.5 and gpt-6.1-sol cost grid (in `results.md`), the current GitHub MCP server (not measured), the `outputSchema` and annotation overhead by client, MCP's own proposals for lazy tool listing, and a per-tool breakdown of the fattest tools.
