"""Tables and intervals from results/scores.npz.

usage: python analyze.py ADVERSARIAL_JSONL RESULTS_DIR
"""
import json
import math
import os
import sys
from collections import defaultdict

import numpy as np

SEED = 20261115
CONFIGS = [  # (label, metric, threshold); a score passes when it is >= threshold
    ("EM", "em", 1.0),
    ("F1 >= 0.5", "f1", 0.5),
    ("F1 >= 0.8", "f1", 0.8),
    ("cos >= 0.80", "cos", 0.80),
    ("cos >= 0.85", "cos", 0.85),
    ("cos >= 0.90", "cos", 0.90),
    ("cos >= 0.95", "cos", 0.95),
]
EPS = 1e-9  # float slack so F1 == 0.8 and cos == 0.9 count as passing


def passes(scores, thr):
    return scores >= thr - EPS


def wilson(k, n, z=1.96):
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - h, c + h


def cluster_boot(fail_by_cfg, article, n_boot=2000):
    """95% interval over articles for the share of items failing, per config."""
    arts = np.unique(article)
    idx = {a: np.where(article == a)[0] for a in arts}
    n_items = np.array([len(idx[a]) for a in arts])
    counts = {k: np.array([v[idx[a]].sum() for a in arts]) for k, v in fail_by_cfg.items()}
    rng = np.random.default_rng(SEED)
    res = {k: [] for k in fail_by_cfg}
    for _ in range(n_boot):
        pick = rng.integers(0, len(arts), len(arts))
        tot = n_items[pick].sum()
        for k in fail_by_cfg:
            res[k].append(counts[k][pick].sum() / tot)
    return {k: (float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))) for k, v in res.items()}


def auc(pos, neg):
    """P(random pos scores higher than random neg), ties count half."""
    allv = np.concatenate([pos, neg])
    order = allv.argsort(kind="mergesort")
    ranks = np.empty(len(allv))
    sv = allv[order]
    i = 0
    while i < len(sv):
        j = i
        while j + 1 < len(sv) and sv[j + 1] == sv[i]:
            j += 1
        ranks[order[i:j + 1]] = (i + j) / 2 + 1
        i = j + 1
    r_pos = ranks[: len(pos)].sum()
    return (r_pos - len(pos) * (len(pos) + 1) / 2) / (len(pos) * len(neg))


def main(adv_path, out_dir):
    z = np.load(os.path.join(out_dir, "scores.npz"))
    adv = [json.loads(l) for l in open(adv_path) if l.strip()]
    lines, js = [], {}

    def P(s=""):
        lines.append(s)
        print(s)

    # ---- human vs human ----
    for name, title in [("loo", "Human vs human, leave-one-out (each answer predicts, the others are references)"),
                        ("pairs", "Human vs human, one reference at a time (every ordered pair of answers)")]:
        n = len(z[f"{name}_em"])
        P(f"## {title}: {n} items, {len(np.unique(z[f'{name}_qi']))} questions")
        fails = {lab: (~passes(z[f"{name}_{m}"], t)).astype(float) for lab, m, t in CONFIGS}
        ci = cluster_boot(fails, z[f"{name}_article"])
        js[name] = {}
        for lab, m, t in CONFIGS:
            r = fails[lab].mean()
            lo, hi = ci[lab]
            P(f"  {lab:<12} marks {100*r:5.1f}% of correct human answers wrong   95% CI [{100*lo:.1f}, {100*hi:.1f}]")
            js[name][lab] = {"fail": float(r), "ci": [lo, hi]}
        P(f"  mean EM {100*z[f'{name}_em'].mean():.1f}  mean F1 {100*z[f'{name}_f1'].mean():.1f}  mean cos {z[f'{name}_cos'].mean():.3f}")
        P()

    P("## Paper protocol (second answer predicts, the other answers are references), questions with >= 3 answers")
    P(f"  n={len(z['paper_em'])}  EM {100*z['paper_em'].mean():.1f}  F1 {100*z['paper_f1'].mean():.1f}"
      "   (SQuAD paper, Table 5, human on v1.0 dev: EM 80.3, F1 90.5)")
    js["paper"] = {"em": float(z["paper_em"].mean()), "f1": float(z["paper_f1"].mean())}
    P()

    # ---- adversarial ----
    n_adv = len(adv)
    P(f"## Adversarial wrong answers: {n_adv} items written by hand (see adversarial.jsonl)")
    js["adv"] = {}
    for lab, m, t in CONFIGS:
        k = int(passes(z[f"adv_{m}"], t).sum())
        lo, hi = wilson(k, n_adv)
        P(f"  {lab:<12} lets through {k:3d} of {n_adv} ({100*k/n_adv:5.1f}%)   Wilson 95% [{100*lo:.1f}, {100*hi:.1f}]")
        js["adv"][lab] = {"pass": k / n_adv, "k": k, "ci": [lo, hi]}
    P()
    cats = defaultdict(list)
    for i, a in enumerate(adv):
        cats[a["category"]].append(i)
    P("  Passed, by category (count out of 10):")
    P("  " + f"{'category':<13}" + "".join(f"{lab:>13}" for lab, _m, _t in CONFIGS))
    js["adv_by_category"] = {}
    for c, ids in cats.items():
        row = [int(passes(z[f"adv_{m}"][ids], t).sum()) for _lab, m, t in CONFIGS]
        P("  " + f"{c:<13}" + "".join(f"{v:>13}" for v in row))
        js["adv_by_category"][c] = dict(zip([l for l, _m, _t in CONFIGS], row))
    P()
    P("  Lowest adversarial scores and highest, for a feel of the range:")
    P(f"  adversarial cos: min {z['adv_cos'].min():.3f}  median {np.median(z['adv_cos']):.3f}  max {z['adv_cos'].max():.3f}")
    P(f"  human (leave-one-out) cos: 5th pct {np.percentile(z['loo_cos'], 5):.3f}  median {np.median(z['loo_cos']):.3f}")
    P(f"  adversarial F1: median {np.median(z['adv_f1']):.2f}; human F1 (leave-one-out) 5th pct {np.percentile(z['loo_f1'], 5):.2f}")
    P()

    # ---- control ----
    n_c = len(z["control_em"])
    P(f"## Control: each question paired with an answer from a random question in another article ({n_c} items; all obviously wrong)")
    js["control"] = {}
    for lab, m, t in CONFIGS:
        r = passes(z[f"control_{m}"], t).mean()
        P(f"  {lab:<12} lets through {100*r:5.1f}%")
        js["control"][lab] = float(r)
    P()

    # ---- threshold sweeps ----
    P("## Threshold sweeps (human = leave-one-out): share of correct human answers failed vs wrong answers passed")
    sweeps = {}
    for metric, grid in [("cos", np.arange(0.60, 1.0001, 0.02)), ("f1", np.arange(0.1, 1.0001, 0.1))]:
        P(f"  {metric}:  thr   human fail%   adversarial pass%   random-control pass%")
        rows = []
        for t in grid:
            hf = 100 * (~passes(z[f"loo_{metric}"], t)).mean()
            ap = 100 * passes(z[f"adv_{metric}"], t).mean()
            cp = 100 * passes(z[f"control_{metric}"], t).mean()
            rows.append((float(t), hf, ap, cp))
            P(f"       {t:5.2f}   {hf:8.1f}   {ap:12.1f}   {cp:14.1f}")
        best = min(rows, key=lambda r: max(r[1], r[2]))
        P(f"  best single threshold for {metric} (minimises the worse of the two error rates): "
          f"thr {best[0]:.2f}, human fail {best[1]:.1f}%, adversarial pass {best[2]:.1f}%")
        sweeps[metric] = {"rows": rows, "best": best}
        P()
    js["sweeps"] = sweeps

    P("## Separation (probability a random correct human answer scores above a random adversarial wrong answer)")
    js["auc"] = {}
    for m in ("f1", "cos"):
        a = auc(z[f"loo_{m}"], z[f"adv_{m}"])
        P(f"  {m}: {a:.3f}")
        js["auc"][m] = float(a)

    # ---- hand-check of 50 exact-match failures ----
    sample = json.load(open(os.path.join(out_dir, "handcheck_sample.json")))
    hc = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "handcheck.json")))["categories"]
    P()
    P("## Hand-check: 50 random exact-match failures, read by one person (handcheck.json)")
    js["handcheck"] = {}
    by_cat = defaultdict(list)
    for s in sample:
        by_cat[hc[str(s["n"])]].append(s)
    for c, ss in sorted(by_cat.items(), key=lambda kv: -len(kv[1])):
        lo, hi = wilson(len(ss), len(sample))
        P(f"  {c:<16} {len(ss):2d} of 50 ({100*len(ss)/50:4.0f}%, Wilson 95% [{100*lo:.0f}, {100*hi:.0f}])")
        js["handcheck"][c] = len(ss)
    P("  Would a lenient metric have passed them?")
    for lab, m, t in CONFIGS[1:]:
        k = sum(1 for s in sample if s[m] >= t - EPS)
        k_diff = sum(1 for s in by_cat["different"] if s[m] >= t - EPS)
        P(f"    {lab:<12} passes {k:2d} of 50 failures, {k_diff} of the {len(by_cat['different'])} 'different' ones")
    n_diff = len(by_cat["different"])
    P(f"  Implied share of ALL correct-looking human answers that disagree for real: {100*0.18*n_diff/50:.1f}% "
      f"(18.0% EM failures x {n_diff}/50), but that rests on {n_diff} items.")

    open(os.path.join(out_dir, "analysis.txt"), "w").write("\n".join(lines) + "\n")
    json.dump(js, open(os.path.join(out_dir, "analysis.json"), "w"), indent=1)


if __name__ == "__main__":
    main(*sys.argv[1:3])
