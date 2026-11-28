"""Accuracy vs position, with paired article-cluster bootstrap and a permutation test.

Usage: python analyze.py RESULTS_DIR   (reads records.jsonl, writes analysis.txt and analysis.json)

Only questions that have all three slot runs are used. Every comparison is paired
(same question, same distractors, only the gold slot differs). Intervals resample
whole articles (clusters), 10,000 resamples, seed 20261127.
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

res = Path(sys.argv[1])
SLOT_KEYS = ["0", "3", "6"]
LABEL = {"0": "slot 1 (start)", "3": "slot 4 (middle)", "6": "slot 7 (end)"}
B, SEED = 10000, 20261127

rows = defaultdict(dict)
for line in (res / "records.jsonl").read_text().splitlines():
    r = json.loads(line)
    rows[r["id"]][r["cond"]] = r
ids = [i for i, d in rows.items() if all(k in d for k in SLOT_KEYS) and "gold_only" in d]
ids.sort()
art = np.array([rows[i]["0"]["article"] for i in ids])
uniq = np.unique(art)
n = len(ids)


def mat(metric, keys):
    return np.array([[rows[i][k][metric] for k in keys] for i in ids], dtype=float)


out, txt = {"n_questions": n, "n_articles": int(len(uniq))}, []
P = lambda s="": txt.append(s)
P(f"questions with all three slots: {n} from {len(uniq)} articles")

rng = np.random.default_rng(SEED)
cl = [np.where(art == a)[0] for a in uniq]
boot_idx = [np.concatenate([cl[j] for j in rng.integers(0, len(cl), len(cl))]) for _ in range(B)]


def ci(v):  # v: per-question values of the statistic (mean over questions is the estimate)
    est = v.mean()
    bs = np.array([v[ix].mean() for ix in boot_idx])
    return est, np.percentile(bs, 2.5), np.percentile(bs, 97.5), bs.std()


def pct(x):
    return f"{100 * x:5.1f}"


for metric, scale, unit in [("contains", 100, "%"), ("f1", 100, " F1 pts"), ("gold_logprob", 1, " nats")]:
    M = mat(metric, SLOT_KEYS)
    g = np.array([rows[i]["gold_only"][metric] for i in ids], dtype=float)
    P(f"\n== {metric} ==")
    out[metric] = {}
    est, lo, hi, _ = ci(g)
    P(f"gold paragraph alone     : {scale * est:7.2f}  [{scale * lo:7.2f}, {scale * hi:7.2f}]")
    out[metric]["gold_only"] = [scale * est, scale * lo, scale * hi]
    for j, k in enumerate(SLOT_KEYS):
        est, lo, hi, _ = ci(M[:, j])
        P(f"{LABEL[k]:<25}: {scale * est:7.2f}  [{scale * lo:7.2f}, {scale * hi:7.2f}]")
        out[metric][LABEL[k]] = [scale * est, scale * lo, scale * hi]
    d = M.mean(1) - g
    est, lo, hi, se = ci(d)
    P(f"  mean of the three slots minus gold alone: {scale * est:7.2f}  [{scale * lo:7.2f}, {scale * hi:7.2f}]")
    out[metric]["distraction_cost"] = [scale * est, scale * lo, scale * hi]
    ng = [i for i in ids if "no_gold" in rows[i]]
    if ng:
        v = np.array([rows[i]["no_gold"][metric] for i in ng], dtype=float)
        P(f"no gold paragraph (n={len(ng)}): {scale * v.mean():7.2f}")
        out[metric]["no_gold"] = [scale * v.mean(), len(ng)]
    P("paired differences (A minus B), 95% article-cluster bootstrap")
    pairs = [("3", "0", "middle minus start"), ("3", "6", "middle minus end"), ("6", "0", "end minus start")]
    out[metric]["diffs"] = {}
    for a, b, name in pairs:
        d = M[:, SLOT_KEYS.index(a)] - M[:, SLOT_KEYS.index(b)]
        est, lo, hi, se = ci(d)
        P(f"  {name:<20}: {scale * est:7.2f}  [{scale * lo:7.2f}, {scale * hi:7.2f}]  se {scale * se:5.2f}")
        out[metric]["diffs"][name] = [scale * est, scale * lo, scale * hi, scale * se]
    # permutation test: within a question, shuffle which slot each result belongs to
    stat = lambda X: (X.mean(0).max() - X.mean(0).min())
    obs = stat(M)
    prng = np.random.default_rng(SEED + 1)
    cnt = 0
    for _ in range(B):
        X = np.array([prng.permutation(r) for r in M])
        cnt += stat(X) >= obs
    p = (cnt + 1) / (B + 1)
    P(f"max minus min of slot means: {scale * obs:.2f}; permutation p = {p:.3f}")
    out[metric]["range"] = scale * obs
    out[metric]["perm_p"] = p
    # linear trend in slot position (least squares slope per slot step, slots 1..7)
    xs = np.array([0, 3, 6], dtype=float)
    xs = xs - xs.mean()
    slope = (M * xs).sum(1) / (xs ** 2).sum()
    est, lo, hi, _ = ci(slope)
    P(f"linear slope per slot step: {scale * est:6.3f}  [{scale * lo:6.3f}, {scale * hi:6.3f}]")
    out[metric]["slope"] = [scale * est, scale * lo, scale * hi]

# how often does the answer change with position? (flips)
C = mat("contains", SLOT_KEYS)
anyc, allc = (C.max(1) == 1), (C.min(1) == 1)
P(f"\nquestions right at every slot: {int(allc.sum())} ({pct(allc.mean())}%), right at some slots only: "
  f"{int((anyc & ~allc).sum())} ({pct((anyc & ~allc).mean())}%), right at none: {int((~anyc).sum())} ({pct((~anyc).mean())}%)")
out["flips"] = {"all": int(allc.sum()), "some": int((anyc & ~allc).sum()), "none": int((~anyc).sum())}

# minimum detectable paired difference at 80% power, two-sided 5%: 2.8 x se
se_mid_start = out["contains"]["diffs"]["middle minus start"][3]
P(f"\nsmallest paired difference this sample can reliably detect (2.8 x se, 80% power): {2.8 * se_mid_start:.1f} points")
out["mde"] = 2.8 * se_mid_start
pt = np.array([rows[i]["0"]["prompt_tokens"] for i in ids])
P(f"prompt tokens: min {pt.min()}, median {int(np.median(pt))}, max {pt.max()}")
out["prompt_tokens"] = [int(pt.min()), int(np.median(pt)), int(pt.max())]

(res / "analysis.txt").write_text("\n".join(txt) + "\n")
(res / "analysis.json").write_text(json.dumps(out, indent=1))
print("\n".join(txt))
