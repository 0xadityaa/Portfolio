"""Summarise raw-*.jsonl from run.py: accuracy per example set, spread across sets, token cost, mismatch cost.

usage: python analyze.py raw-0.5b.jsonl [raw-1.5b.jsonl ...] > output.txt   (also writes results.json)
"""
import json, math, sys
from collections import defaultdict
import numpy as np

TEMPLATES = ["chat", "no_header", "llama", "raw"]
NAMES = {"chat": "own chat template", "no_header": "chat, no assistant header", "llama": "Llama-2 [INST] template", "raw": "no template"}


def wilson(p, n, z=1.96):
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - h, c + h


rows = [json.loads(l) for path in sys.argv[1:] for l in open(path)]
by = defaultdict(list)
for r in rows:
    by[(r["model"], r["template"], r["k"], r["set"])].append(r)

res = {}
for model in sorted({r["model"] for r in rows}):
    print(f"=== {model} ===")
    cell = {}
    for t in TEMPLATES:
        for k in (0, 1, 3, 8):
            sets = sorted(s for (m, tt, kk, s) in by if m == model and tt == t and kk == k)
            if not sets:
                continue
            accs = [np.mean([x["pred"] == x["gold"] for x in by[(model, t, k, s)]]) for s in sets]
            toks = np.mean([x["tokens"] for s in sets for x in by[(model, t, k, s)]])
            mass = np.mean([x["mass"] for s in sets for x in by[(model, t, k, s)]])
            top1 = np.mean([x["top1_is_label"] for s in sets for x in by[(model, t, k, s)]])
            n = len(by[(model, t, k, sets[0])])
            cell[(t, k)] = dict(accs=accs, mean=float(np.mean(accs)), lo=float(min(accs)), hi=float(max(accs)),
                                tokens=float(toks), mass=float(mass), top1=float(top1), n=n)
    print(f"{'template':28s} {'k':>2s} {'tokens':>7s} {'mean acc':>9s} {'per set (acc %)':>22s} {'range':>6s} {'label mass':>10s} {'top1=label':>10s}")
    for t in TEMPLATES:
        for k in (0, 1, 3, 8):
            c = cell.get((t, k))
            if not c:
                continue
            per = " ".join(f"{100*a:5.1f}" for a in c["accs"])
            print(f"{NAMES[t]:28s} {k:2d} {c['tokens']:7.0f} {100*c['mean']:8.1f}% {per:>22s} {100*(c['hi']-c['lo']):6.1f} {c['mass']:10.3f} {c['top1']:10.3f}")
    print("\nShare of predictions per label (World, Sports, Business, Technology), all sets pooled; gold is 25% each:")
    for t in TEMPLATES:
        for k in (0, 1, 3, 8):
            ps = [x["pred"] for (m, tt, kk, s), v in by.items() if m == model and tt == t and kk == k for x in v]
            if ps:
                sh = [100 * np.mean([p == c for p in ps]) for c in range(4)]
                print(f"  {NAMES[t]:28s} k={k}: " + "  ".join(f"{x:5.1f}%" for x in sh))
    n = next(iter(cell.values()))["n"]
    lo, hi = wilson(0.8, n)
    print(f"\nOne set of {n} articles at 80% accuracy: 95% Wilson interval {100*lo:.1f} to {100*hi:.1f} (about +/-{50*(hi-lo):.1f} points).")

    print("\nToken cost per accuracy point gained over 0 shots (own chat template):")
    base = cell[("chat", 0)]
    for k in (1, 3, 8):
        c = cell.get(("chat", k))
        if not c:
            continue
        dt, dp = c["tokens"] - base["tokens"], 100 * (c["mean"] - base["mean"])
        per = f"{dt/dp:7.0f} extra tokens per point" if dp > 0 else "   no gain"
        per_set = [100 * (a - base["mean"]) for a in c["accs"]]
        print(f"  {k} shots: +{dt:4.0f} tokens per query, {dp:+5.1f} points (per set {', '.join(f'{x:+.1f}' for x in per_set)}), {per}")

    print("\nTemplate mismatch cost (own chat template minus mismatched, points, per set; positive = mismatch hurts):")
    for t in TEMPLATES[1:]:
        for k in (0, 1, 3, 8):
            a, b = cell.get(("chat", k)), cell.get((t, k))
            if not a or not b:
                continue
            diffs = [100 * (x - y) for x, y in zip(a["accs"], b["accs"])]
            print(f"  {NAMES[t]:28s} k={k}: mean {np.mean(diffs):+5.1f}  per set {', '.join(f'{d:+.1f}' for d in diffs)}")
    print()
    res[model] = {f"{t}|{k}": c for (t, k), c in cell.items()}

json.dump(res, open("results.json", "w"), indent=1)
