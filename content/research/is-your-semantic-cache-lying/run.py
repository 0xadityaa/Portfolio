"""Semantic-cache false hits on Quora Question Pairs (GLUE validation split).

Embeds a seeded sample of QQP validation pairs with three small embedding
models, then reports (1) the cosine of random unrelated pairs and (2) the hit
rate and false-hit share of a threshold cache. At most 4 threads. Seed 20261127.

Usage: python run.py [n_pairs]   (default 5000)
"""
import json
import sys
import time

import numpy as np
import pandas as pd
import torch
from transformers import AutoModel, AutoTokenizer

torch.set_num_threads(4)
SEED = 20261127
N_PAIRS = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
DATA = "/private/tmp/claude-501/cone/data/qqp_val.parquet"
# name: (repo, pooling, prefix)
MODELS = {
    "MiniLM-L6": ("sentence-transformers/all-MiniLM-L6-v2", "mean", ""),
    "bge-small": ("BAAI/bge-small-en-v1.5", "cls", ""),
    "e5-small": ("intfloat/e5-small-v2", "mean", "query: "),
}
THRESHOLDS = [0.50, 0.60, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95]

d = pd.read_parquet(DATA)
rng = np.random.default_rng(SEED)
idx = rng.choice(len(d), size=N_PAIRS, replace=False)
d = d.iloc[idx].reset_index(drop=True)
q1, q2, y = d.question1.tolist(), d.question2.tolist(), d.label.to_numpy()
print(f"pairs {N_PAIRS}, duplicates {y.sum()} ({y.mean():.1%})")

# random unrelated pairs: question1 of one pair with question2 of another pair
perm = rng.permutation(N_PAIRS)
perm = np.where(perm == np.arange(N_PAIRS), (perm + 1) % N_PAIRS, perm)


def embed(tok, model, texts, pool, prefix, bs=64):
    out = []
    order = np.argsort([len(t) for t in texts])
    for i in range(0, len(texts), bs):
        batch = [prefix + texts[j] for j in order[i:i + bs]]
        enc = tok(batch, padding=True, truncation=True, max_length=128, return_tensors="pt")
        with torch.no_grad():
            h = model(**enc).last_hidden_state
        if pool == "cls":
            v = h[:, 0]
        else:
            m = enc["attention_mask"].unsqueeze(-1).float()
            v = (h * m).sum(1) / m.sum(1)
        out.append(torch.nn.functional.normalize(v, dim=-1).numpy())
    e = np.concatenate(out)
    res = np.empty_like(e)
    res[order] = e
    return res


def boot_ci(fn, n, B=1000, seed=1):
    r = np.random.default_rng(seed)
    vals = [fn(r.integers(0, n, n)) for _ in range(B)]
    return np.nanpercentile(vals, [2.5, 97.5])


results = {"n_pairs": N_PAIRS, "dup_share": float(y.mean()), "models": {}}
for name, (repo, pool, prefix) in MODELS.items():
    tok = AutoTokenizer.from_pretrained(repo)
    model = AutoModel.from_pretrained(repo).eval()
    t0 = time.time()
    e1 = embed(tok, model, q1, pool, prefix)
    e2 = embed(tok, model, q2, pool, prefix)
    bulk = time.time() - t0
    lat = []  # one query at a time, the way a cache sees them
    for t in q1[:100]:
        s = time.perf_counter()
        embed(tok, model, [t], pool, prefix)
        lat.append((time.perf_counter() - s) * 1000)
    cos = (e1 * e2).sum(1)
    rnd = (e1 * e2[perm]).sum(1)
    r = {
        "random": {"mean": float(rnd.mean()), "std": float(rnd.std()),
                   "p01": float(np.percentile(rnd, 1)), "p50": float(np.percentile(rnd, 50)),
                   "p99": float(np.percentile(rnd, 99)), "max": float(rnd.max())},
        "dup_cos_mean": float(cos[y == 1].mean()), "nondup_cos_mean": float(cos[y == 0].mean()),
        "latency_ms_median": float(np.median(lat)), "latency_ms_p95": float(np.percentile(lat, 95)),
        "bulk_seconds": bulk, "sweep": [],
        "hist_random": np.histogram(rnd, bins=40, range=(-0.2, 1.0))[0].tolist(),
        "hist_dup": np.histogram(cos[y == 1], bins=40, range=(-0.2, 1.0))[0].tolist(),
        "hist_nondup": np.histogram(cos[y == 0], bins=40, range=(-0.2, 1.0))[0].tolist(),
    }

    def stats(t, ix=None):
        c, yy = (cos, y) if ix is None else (cos[ix], y[ix])
        hit = c >= t
        h = hit.sum()
        fh = (hit & (yy == 0)).sum()
        return hit.mean(), (fh / h if h else float("nan")), (hit & (yy == 1)).sum() / max((yy == 1).sum(), 1)

    for t in THRESHOLDS:
        hr, fr, rec = stats(t)
        lo, hi = boot_ci(lambda ix: stats(t, ix)[1], N_PAIRS)
        r["sweep"].append({"t": t, "hit_rate": float(hr), "false_hit_share": float(fr),
                           "false_ci": [float(lo), float(hi)], "dup_recall": float(rec),
                           "nondup_hit_rate": float((cos[y == 0] >= t).mean()),
                           "random_above": float((rnd >= t).mean())})
    # lowest threshold whose false-hit share is at most 5% / 10%
    grid = np.linspace(0.3, 0.99, 700)
    for target in (0.05, 0.10):
        best = None
        for t in grid:
            hr, fr, rec = stats(t)
            if fr == fr and fr <= target:
                best = {"t": float(t), "hit_rate": float(hr), "dup_recall": float(rec)}
                break
        r[f"t_for_{int(target * 100)}pct"] = best
    # a few false hits (labelled non-duplicate, cosine >= 0.90), seeded, for reading
    bad = np.where((y == 0) & (cos >= 0.90))[0]
    pick = np.random.default_rng(SEED + 1).choice(bad, size=min(8, len(bad)), replace=False)
    r["false_hit_examples"] = [{"cos": float(cos[i]), "q1": q1[i], "q2": q2[i]} for i in sorted(pick)]
    results["models"][name] = r
    print(name, "done", f"bulk {bulk:.0f}s", flush=True)

json.dump(results, open("results.json", "w"), indent=1)
for name, r in results["models"].items():
    print(f"\n== {name}  random pairs: mean {r['random']['mean']:.3f} sd {r['random']['std']:.3f} "
          f"p1 {r['random']['p01']:.3f} p99 {r['random']['p99']:.3f} max {r['random']['max']:.3f}")
    print(f"   duplicate pairs mean cos {r['dup_cos_mean']:.3f}, non-duplicate {r['nondup_cos_mean']:.3f}")
    print(f"   embed latency batch 1: median {r['latency_ms_median']:.1f} ms, p95 {r['latency_ms_p95']:.1f} ms")
    print("   thr   hit%   dupRecall  falseHit%[95% CI]   nonDupHit%  randomAbove%")
    for s in r["sweep"]:
        print(f"   {s['t']:.2f}  {s['hit_rate']:6.1%}  {s['dup_recall']:6.1%}   {s['false_hit_share']:6.1%} "
              f"[{s['false_ci'][0]:.1%}, {s['false_ci'][1]:.1%}]   {s['nondup_hit_rate']:6.1%}   {s['random_above']:.2%}")
    print("   5% false-hit threshold:", r["t_for_5pct"])
    print("   10% false-hit threshold:", r["t_for_10pct"])
    print("   false hits at cosine >= 0.90 (seeded pick):")
    for ex in r["false_hit_examples"]:
        print(f"     {ex['cos']:.3f}  {ex['q1']!r}  |  {ex['q2']!r}")
