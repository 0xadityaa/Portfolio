"""Breakdowns quoted in the post: why outputs were schema-invalid, what priority/refund values each arm produced, truncation."""
import json, collections, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "analyze.py")).read().split("def main")[0]
exec(src)
for arm in ["instr", "fewshot", "instr_o", "fewshot_o"]:
    recs = [json.loads(l) for l in open(os.path.join(HERE, "results", f"raw_{arm}.jsonl"))]
    pri, ref, why = collections.Counter(), collections.Counter(), collections.Counter()
    trunc = sum(r["hit_max_tokens"] for r in recs)
    for r in recs:
        o = parse(repair(r["output"]))
        if isinstance(o, dict):
            pri[o.get("priority")] += 1
            ref[o.get("refund")] += 1
            if not valid(o):
                why[("extra keys", tuple(sorted(set(o) - set(KEYS))), "missing", tuple(sorted(set(KEYS) - set(o))))] += 1
        else:
            why["unparseable"] += 1
    print(arm, "hit the token cap:", trunc, "| priority values:", dict(pri), "| refund values:", dict(ref))
    print("   invalid after fence stripping:", dict(why))
recs = [json.loads(l) for l in open(os.path.join(HERE, "results", "raw_instr.jsonl"))]
print("gold priority:", dict(collections.Counter(r["gold"]["priority"] for r in recs)))
print("gold refund:", dict(collections.Counter(r["gold"]["refund"] for r in recs)))
