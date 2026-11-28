"""Dollar cost of the extra shot tokens, from the measured Qwen token counts in results.json.

usage: python cost.py > cost.txt

Assumptions, stated: the token counts are Qwen2.5 tokens (Claude's tokenizer counts differently), the price is
Claude Sonnet 5.5 input ($2.00 per million tokens) and its cache read ($0.10 per million), copied from
https://platform.claude.com/docs/en/about-claude/pricing on 2026-11-27. Cached means every shot token is a cache hit;
the first write ($2.50 per million for 5 minutes) is ignored because it amortises over the volume.
"""
import json

res = json.load(open("results.json"))["Qwen2.5-0.5B-Instruct"]
base = res["chat|0"]["tokens"]
IN, HIT = 2.00, 0.10
print(f"Prompt tokens per query (Qwen2.5 tokenizer), own chat template: 0 shots = {base:.0f}")
for k in (1, 3, 8):
    c = res.get(f"chat|{k}")
    if not c:
        continue
    extra = c["tokens"] - base
    print(f"\n{k} shots: {c['tokens']:.0f} tokens, +{extra:.0f} per query ({c['tokens']/base:.1f}x the 0-shot prompt)")
    print(f"{'queries':>12s} {'extra uncached':>15s} {'extra cached':>13s}")
    for q in (1_000, 100_000, 10_000_000):
        print(f"{q:12,d} {'$' + format(extra*q/1e6*IN, ',.2f'):>15s} {'$' + format(extra*q/1e6*HIT, ',.2f'):>13s}")
