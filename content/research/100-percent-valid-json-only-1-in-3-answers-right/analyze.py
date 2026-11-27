"""Score the raw outputs: parse failure, schema validity, field accuracy, cost. Prints tables; writes results.json."""
import json, os, math, random, statistics, sys
HERE = os.path.dirname(os.path.abspath(__file__))
PRIORITIES = ["low", "medium", "high"]
KEYS = ["customer", "product", "quantity", "priority", "refund"]
ARMS = [("instr", "A instruction only"), ("fewshot", "B 3-shot"), ("instr_o", "C constrained"), ("fewshot_o", "D 3-shot + constrained")]


def repair(text):
    t = text.strip()
    if t.startswith("```"):
        t = t.strip("`")
        if t.lower().startswith("json"):
            t = t[4:]
    a, b = t.find("{"), t.rfind("}")
    return t[a:b + 1] if a != -1 and b > a else t


def parse(text):
    try:
        return json.loads(text)
    except Exception:
        return None


def valid(o):
    return (isinstance(o, dict) and set(o) == set(KEYS) and isinstance(o["customer"], str) and isinstance(o["product"], str)
            and isinstance(o["quantity"], int) and not isinstance(o["quantity"], bool)
            and o["priority"] in PRIORITIES and isinstance(o["refund"], bool))


def nm(k, v):
    if isinstance(v, str):
        v = v.strip().lower()
        if k == "product" and v.endswith("s"):
            v = v[:-1]
    return v


def hits(o, gold):
    if not isinstance(o, dict):
        return {k: False for k in KEYS}
    return {k: (k in o and nm(k, o[k]) == nm(k, gold[k]) and type(o[k]) == type(gold[k])) for k in KEYS}


def wilson(k, n, z=1.96):
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return 100 * (c - h), 100 * (c + h)


def fmt(k, n):
    lo, hi = wilson(k, n)
    return f"{100 * k / n:5.1f}% [{lo:4.1f}, {hi:4.1f}]"


def load(arm):
    p = os.path.join(HERE, "results", f"raw_{arm}.jsonl")
    return [json.loads(l) for l in open(p)] if os.path.exists(p) else None


def score(recs):
    rows = []
    for r in recs:
        raw = r["output"]
        strict = parse(raw)
        rep = parse(repair(raw))
        rows.append({
            "id": r["id"],
            "parse_strict": strict is not None, "parse_rep": rep is not None,
            "valid_strict": valid(strict), "valid_rep": valid(rep),
            "hit_strict": hits(strict, r["gold"]), "hit_rep": hits(rep, r["gold"]),
            "prompt_tokens": r["prompt_tokens"], "new_tokens": r["new_tokens"], "seconds": r["seconds"],
            "fence": raw.strip().startswith("```"),
        })
    return rows


def boot_diff(a, b, reps=5000, seed=7):
    """Paired bootstrap of mean(a) - mean(b) in points; a, b are 0/1 lists over the same cases."""
    rng = random.Random(seed)
    n = len(a)
    diffs = []
    for _ in range(reps):
        idx = [rng.randrange(n) for _ in range(n)]
        diffs.append(100 * sum(a[i] - b[i] for i in idx) / n)
    diffs.sort()
    return 100 * (sum(a) - sum(b)) / n, diffs[int(.025 * reps)], diffs[int(.975 * reps)]


def main():
    data = {}
    for arm, _ in ARMS:
        recs = load(arm)
        if recs:
            data[arm] = score(recs)
    out = {}
    names = dict(ARMS)
    print("n cases per arm:", {a: len(v) for a, v in data.items()})
    print("\n=== Format outcomes (95% Wilson intervals) ===")
    print(f"{'arm':26s} {'raw JSON parse fails':>24s} {'schema-valid (raw)':>26s} {'schema-valid (fences stripped)':>32s}")
    for arm, rows in data.items():
        n = len(rows)
        pf = sum(not r["parse_strict"] for r in rows); vs = sum(r["valid_strict"] for r in rows); vr = sum(r["valid_rep"] for r in rows)
        fence = sum(r["fence"] for r in rows)
        print(f"{names[arm]:26s} {fmt(pf, n):>24s} {fmt(vs, n):>26s} {fmt(vr, n):>32s}   fenced: {fence}")
        out[arm] = {"n": n, "parse_fail": pf, "valid_strict": vs, "valid_rep": vr, "fenced": fence}
    for mode, label in (("hit_strict", "raw output"), ("hit_rep", "fences stripped")):
        print(f"\n=== Field accuracy over all cases, a failed parse scores 0 ({label}) ===")
        print(f"{'arm':26s}" + "".join(f"{k:>22s}" for k in KEYS) + f"{'all five right':>22s}")
        for arm, rows in data.items():
            n = len(rows)
            cells = [fmt(sum(r[mode][k] for r in rows), n) for k in KEYS]
            allk = sum(all(r[mode].values()) for r in rows)
            print(f"{names[arm]:26s}" + "".join(f"{c:>22s}" for c in cells) + f"{fmt(allk, n):>22s}")
            out[arm][mode] = {k: sum(r[mode][k] for r in rows) for k in KEYS}
            out[arm][mode]["all_five"] = allk
            out[arm][mode]["mean_field_acc"] = 100 * sum(sum(r[mode].values()) for r in rows) / (5 * n)
    print("\n=== Mean field accuracy, raw output | fences stripped | among valid raw outputs only ===")
    for arm, rows in data.items():
        n = len(rows)
        raw_acc = 100 * sum(sum(r["hit_strict"].values()) for r in rows) / (5 * n)
        rep_acc = 100 * sum(sum(r["hit_rep"].values()) for r in rows) / (5 * n)
        vrows = [r for r in rows if r["valid_strict"]]
        cond = 100 * sum(sum(r["hit_strict"].values()) for r in vrows) / (5 * len(vrows)) if vrows else float("nan")
        print(f"{names[arm]:26s} {raw_acc:5.1f}  |  {rep_acc:5.1f}  |  {cond:5.1f} (n={len(vrows)})")
        out[arm]["cond_acc_valid_raw"] = cond
    print("\n=== Cost per request ===")
    for arm, rows in data.items():
        pt = statistics.mean(r["prompt_tokens"] for r in rows); nt = statistics.mean(r["new_tokens"] for r in rows)
        sec = statistics.mean(r["seconds"] for r in rows); med = statistics.median(r["seconds"] for r in rows)
        print(f"{names[arm]:26s} prompt tokens {pt:6.1f}   new tokens {nt:5.1f}   seconds mean {sec:5.2f} median {med:5.2f}")
        out[arm].update({"prompt_tokens": pt, "new_tokens": nt, "sec_mean": sec, "sec_median": med})
    print("\n=== Paired bootstrap on per-case mean field accuracy (A minus B, points, 95% interval, 5,000 resamples) ===")
    pairs = [("fewshot", "instr"), ("instr_o", "instr"), ("fewshot_o", "fewshot"), ("fewshot_o", "instr_o"), ("instr_o", "fewshot")]
    for a, b in pairs:
        if a in data and b in data:
            for mode, label in (("hit_strict", "raw"), ("hit_rep", "fences stripped")):
                xa = [sum(r[mode].values()) / 5 for r in data[a]]; xb = [sum(r[mode].values()) / 5 for r in data[b]]
                d, lo, hi = boot_diff(xa, xb)
                print(f"{names[a]:26s} minus {names[b]:26s} ({label:15s}) {d:+6.1f} [{lo:+6.1f}, {hi:+6.1f}]")
                out.setdefault("paired", {})[f"{a}-{b}-{label}"] = [d, lo, hi]
    json.dump(out, open(os.path.join(HERE, "results.json"), "w"), indent=1)


main()
