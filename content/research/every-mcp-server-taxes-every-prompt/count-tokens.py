"""Count the tokens of each server's tool definitions and price the overhead.

Usage: python count-tokens.py   (run from this folder; needs `pip install tiktoken`)
Reads servers.json (order) and raw/*.tools.json. Writes results.json and results.md.

Counter: tiktoken o200k_base. A proxy: each vendor tokenizes differently.
What is counted: for each tool, compact JSON of {name, description, input_schema},
the three fields every provider's function-calling format carries. The sensitivity
column counts the whole raw tool object (adds title, annotations, outputSchema, _meta).
"""
import json
import statistics
from itertools import combinations
from pathlib import Path

import tiktoken

HERE = Path(__file__).parent
enc = tiktoken.get_encoding("o200k_base")


def n(text: str) -> int:
    return len(enc.encode(text))


def compact(obj) -> str:
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False)


order = [s["id"] for s in json.loads((HERE / "servers.json").read_text())]
rows = []
for sid in order:
    p = HERE / "raw" / f"{sid}.tools.json"
    if not p.exists():
        continue
    d = json.loads(p.read_text())
    tools = d["tools"]
    defs = [
        {"name": t["name"], "description": t.get("description", ""), "input_schema": t.get("inputSchema", {})}
        for t in tools
    ]
    per_tool = [n(compact(x)) for x in defs]
    rows.append(
        {
            "id": sid,
            "version": d["serverInfo"].get("version"),
            "tools": len(tools),
            "tokens": sum(per_tool),
            "tokens_full_raw": sum(n(compact(t)) for t in tools),
            "avg_per_tool": round(sum(per_tool) / len(tools), 1),
            "biggest_tool": max(zip(per_tool, [t["name"] for t in tools])),
        }
    )

tok = [r["tokens"] for r in rows]
cumulative = {}
subset_stats = {}
for k in (1, 3, 5, 10, len(rows)):
    cumulative[k] = sum(tok[:k])
    sums = [sum(c) for c in combinations(tok, k)]
    subset_stats[k] = {"mean": round(statistics.mean(sums)), "min": min(sums), "max": max(sums)}

PRICES = {  # USD per million input tokens, copied from live pricing pages on 2026-11-14
    "Claude Sonnet 5.5": {"input": 2.00, "cached": 0.10, "src": "platform.claude.com/docs/en/about-claude/pricing"},
    "Claude Opus 5.5": {"input": 4.00, "cached": 0.20, "src": "platform.claude.com/docs/en/about-claude/pricing"},
    "gpt-6.1-sol": {"input": 2.00, "cached": 0.10, "src": "developers.openai.com/api/docs/pricing"},
    "gpt-5.5": {"input": 5.00, "cached": 0.50, "src": "developers.openai.com/api/docs/pricing"},
}
VOLUMES = {"small": 1_000, "medium": 20_000, "large": 500_000}  # model calls per day
DAYS = 30

costs = []
for label, overhead in (
    ("1 server (filesystem)", cumulative[1]),
    ("3 servers", cumulative[3]),
    ("5 servers", cumulative[5]),
    ("10 servers", cumulative[10]),
):
    for model, pr in PRICES.items():
        for vname, calls in VOLUMES.items():
            full = overhead * calls * DAYS * pr["input"] / 1e6
            cached = overhead * calls * DAYS * pr["cached"] / 1e6
            costs.append(
                {"setup": label, "overhead_tokens": overhead, "model": model, "volume": vname,
                 "calls_per_day": calls, "monthly_uncached_usd": round(full, 2),
                 "monthly_cached_usd": round(cached, 2)}
            )

out = {
    "tokenizer": "tiktoken o200k_base",
    "tiktoken_version": tiktoken.__version__,
    "servers": rows,
    "cumulative_in_listed_order": cumulative,
    "subset_stats_all_combinations": subset_stats,
    "prices_per_mtok": PRICES,
    "volumes_calls_per_day": VOLUMES,
    "days_per_month": DAYS,
    "costs": costs,
}
(HERE / "results.json").write_text(json.dumps(out, indent=2))

md = ["## Tokens per server (o200k_base)", "", "| Server | Version | Tools | Tokens | Avg per tool | Largest tool | Full raw objects |", "| --- | --- | ---: | ---: | ---: | --- | ---: |"]
for r in rows:
    md.append(f"| {r['id']} | {r['version']} | {r['tools']} | {r['tokens']:,} | {r['avg_per_tool']} | {r['biggest_tool'][1]} ({r['biggest_tool'][0]}) | {r['tokens_full_raw']:,} |")
md += ["", f"Total, all {len(rows)}: {sum(tok):,} tokens, {sum(r['tools'] for r in rows)} tools.", "", "## Cumulative, in the order listed above", "", "| Servers | Tools | Cumulative tokens | Mean over every possible pick | Min | Max |", "| ---: | ---: | ---: | ---: | ---: | ---: |"]
for k in (1, 3, 5, 10, len(rows)):
    md.append(f"| {k} | {sum(r['tools'] for r in rows[:k])} | {cumulative[k]:,} | {subset_stats[k]['mean']:,} | {subset_stats[k]['min']:,} | {subset_stats[k]['max']:,} |")
md += ["", f"## Monthly cost of the overhead alone ({DAYS} days), uncached / fully cached", ""]
md.append("| Setup | Tokens | Model | " + " | ".join(f"{v} ({c:,}/day)" for v, c in VOLUMES.items()) + " |")
md.append("| --- | ---: | --- | " + " | ".join("---:" for _ in VOLUMES) + " |")
for label in dict.fromkeys(c["setup"] for c in costs):
    for model in PRICES:
        sel = [c for c in costs if c["setup"] == label and c["model"] == model]
        md.append(f"| {label} | {sel[0]['overhead_tokens']:,} | {model} | " + " | ".join(f"${c['monthly_uncached_usd']:,.2f} / ${c['monthly_cached_usd']:,.2f}" for c in sel) + " |")
(HERE / "results.md").write_text("\n".join(md) + "\n")
print("\n".join(md))
