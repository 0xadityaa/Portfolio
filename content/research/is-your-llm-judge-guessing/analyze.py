"""Agreement with humans, position bias and flip rate from judge.py output.

Usage: python analyze.py raw-0.5b.jsonl [raw-1.5b.jsonl]
Writes results.json next to the script and prints the tables.

Conventions
- Order 1 shows (model_a, model_b) as (A, B). Order 2 shows (model_b, model_a).
- margin = logit("A") - logit("B"). Order 1 picks model_a when margin1 > 0.
  Order 2 picks model_b when margin2 > 0.
- A human vote is one non-tie row of the human split. A pair can have several.
  Agreement is counted per vote. Intervals are 95% percentile bootstraps that
  resample whole matchups (10,000 resamples, seed 7). A matchup is a question
  plus the two models, in either order: the dataset lists many matchups twice,
  once per model order, with different human voters, so those pairs are kept together.
- Flip: the verdict, read as a model, changes when only the order changes.
  That is the same as picking the same position (A or B) in both orders.
"""
import json
import os
import sys

import numpy as np

RNG_SEED = 7
N_BOOT = 10_000


def load(path):
    rows = []
    with open(path) as f:
        for line in f:
            rows.append(json.loads(line))
    return rows


def arrays(rows):
    m1 = np.array([r["margin1"] for r in rows])
    m2 = np.array([r["margin2"] for r in rows])
    # verdict as "model_a wins": order 1 picks model_a if m1 > 0; order 2 picks model_a if m2 < 0
    v1 = m1 > 0
    v2 = m2 < 0
    avg = (m1 - m2) > 0  # margin for model_a, averaged over the two orders
    votes_a = np.array([sum(v == "model_a" for v in r["votes"]) for r in rows])
    votes_b = np.array([sum(v == "model_b" for v in r["votes"]) for r in rows])
    return m1, m2, v1, v2, avg, votes_a, votes_b


def agree_votes(verdict_a, votes_a, votes_b):
    """Per-pair counts of (agreeing votes, total votes) for a boolean 'model_a wins' verdict."""
    agree = np.where(verdict_a, votes_a, votes_b)
    return agree, votes_a + votes_b


def cluster_ids(keys):
    """Same question and same two models, in either order, share a cluster."""
    ids = {}
    out = []
    for k in keys:
        q, a, b = k.split("|")
        out.append(ids.setdefault((q, *sorted((a, b))), len(ids)))
    return np.array(out)


def boot_ratio(num, den, cl, rng):
    k = cl.max() + 1
    cn = np.bincount(cl, weights=num, minlength=k)
    cd = np.bincount(cl, weights=den, minlength=k)
    idx = rng.integers(0, k, size=(N_BOOT, k))
    return cn[idx].sum(axis=1) / cd[idx].sum(axis=1)


def ci(stat_samples):
    lo, hi = np.percentile(stat_samples, [2.5, 97.5])
    return float(lo), float(hi)


def fmt(p, lo, hi):
    if p != p:
        return "n/a (no pairs)"
    return f"{100 * p:.1f}% [{100 * lo:.1f}, {100 * hi:.1f}]"


def analyse(rows, label, rng, lens):
    n = len(rows)
    cl = cluster_ids([r["key"] for r in rows])
    m1, m2, v1, v2, avg, va, vb = arrays(rows)
    tot = va + vb
    res = {"label": label, "pairs": n, "matchups": int(cl.max() + 1), "votes": int(tot.sum())}

    def ratio(num_per_pair, den_per_pair):
        if den_per_pair.sum() == 0:
            return (float("nan"),) * 3
        p = num_per_pair.sum() / den_per_pair.sum()
        lo, hi = ci(boot_ratio(num_per_pair, den_per_pair, cl, rng))
        return float(p), lo, hi

    # Agreement with humans
    out = {}
    for name, v in (("order1", v1), ("order2", v2), ("avg", avg)):
        a, t = agree_votes(v, va, vb)
        out[name] = ratio(a, t)
    # Order 1 and order 2 re-centred on their own median margin (a one-pass fix for a constant verdict)
    a, t = agree_votes(m1 > np.median(m1), va, vb)
    out["order1_recentred"] = ratio(a, t)
    a, t = agree_votes(m2 < np.median(m2), va, vb)
    out["order2_recentred"] = ratio(a, t)
    res["agreement"] = out
    # Length baseline: pick the longer answer
    longer_a = np.array([lens[r["key"]][0] > lens[r["key"]][1] for r in rows])
    a, t = agree_votes(longer_a, va, vb)
    res["longer_answer_agreement"] = ratio(a, t)
    res["avg_verdict_equals_longer"] = float((avg == longer_a).mean())
    res["avg_margin_vs_log_length_ratio_corr"] = float(
        np.corrcoef(m1 - m2, [np.log((lens[r["key"]][0] + 1) / (lens[r["key"]][1] + 1)) for r in rows])[0, 1]
    )

    # Position preference: share of all verdicts that pick position A
    pickA1 = (m1 > 0).astype(float)
    pickA2 = (m2 > 0).astype(float)
    res["pick_A_order1"] = ratio(pickA1, np.ones(n))
    res["pick_A_order2"] = ratio(pickA2, np.ones(n))
    res["pick_A_all"] = ratio(pickA1 + pickA2, 2 * np.ones(n))

    # Flip rate: same position in both orders
    same_pos = ((m1 > 0) == (m2 > 0)).astype(float)
    res["flip"] = ratio(same_pos, np.ones(n))
    p1, p2 = pickA1.mean(), pickA2.mean()
    res["flip_if_independent"] = float(p1 * p2 + (1 - p1) * (1 - p2))
    res["flip_toward_A"] = float(((m1 > 0) & (m2 > 0)).mean())
    res["flip_toward_B"] = float(((m1 <= 0) & (m2 <= 0)).mean())

    # Consistent-only agreement and what it drops
    cons = (~(same_pos.astype(bool))).astype(float)
    a_cons, t_cons = agree_votes(v1, va, vb)
    res["consistent_share"] = ratio(cons, np.ones(n))
    res["agreement_consistent_only"] = ratio(a_cons * cons, t_cons * cons)
    a_inc, t_inc = a_cons * (1 - cons), t_cons * (1 - cons)
    res["agreement_flipped_only_order1"] = ratio(a_inc, t_inc)

    # Margin size: confident pairs flip less?
    mag = np.minimum(np.abs(m1), np.abs(m2))
    res["median_abs_margin"] = float(np.median(np.abs(np.concatenate([m1, m2]))))
    q = np.quantile(mag, [1 / 3, 2 / 3])
    terciles = []
    for lo_, hi_ in ((-1, q[0]), (q[0], q[1]), (q[1], 1e9)):
        sel = (mag > lo_) & (mag <= hi_)
        terciles.append({"pairs": int(sel.sum()), "flip": float(same_pos[sel].mean())})
    res["flip_by_min_margin_tercile"] = terciles

    # Does the model follow the format at all?
    res["mean_AB_mass"] = float(np.mean([r["mass1"] for r in rows] + [r["mass2"] for r in rows]))
    return res


def main():
    paths = sys.argv[1:]
    data = {p: load(p) for p in paths}
    big = data[paths[0]]
    keys_big = [r["key"] for r in big]
    rng = np.random.default_rng(RNG_SEED)

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from judge import load_pairs

    lens = {p["key"]: (len(p["a"]), len(p["b"])) for p in load_pairs()}
    all_res = []
    base = analyse(big, f"{paths[0]} (all pairs)", rng, lens)
    all_res.append(base)
    # Human-human reference and the 50% / always-first baselines, from the same pairs
    va = np.array([sum(v == "model_a" for v in r["votes"]) for r in big])
    vb = np.array([sum(v == "model_b" for v in r["votes"]) for r in big])
    tot = va + vb
    share_a = va.sum() / tot.sum()
    # human-human agreement: over ordered vote pairs within a pair with >= 2 non-tie votes
    num = va * (va - 1) + vb * (vb - 1)
    den = tot * (tot - 1)
    hh = {"pairs_with_2plus_votes": int((tot >= 2).sum()), "agreement": float(num.sum() / den.sum())}
    keep = den > 0
    cl_big = cluster_ids(keys_big)[keep]
    hh["ci"] = ci(boot_ratio(num[keep], den[keep], cl_big, rng))
    base["human_first_answer_share"] = float(share_a)
    base["human_human"] = hh
    for p in paths[1:]:
        small = data[p]
        keyset = {r["key"] for r in small}
        sub_big = [r for r in big if r["key"] in keyset]
        all_res.append(analyse(sub_big, f"{paths[0]} (same {len(sub_big)} pairs as {p})", rng, lens))
        all_res.append(analyse(small, f"{p} (all pairs scored)", rng, lens))

    for r in all_res:
        print_result(r)
    json.dump(all_res, open("results.json", "w"), indent=2)


def print_result(r):
    print("=" * 78)
    print(r["label"], f"| {r['pairs']} pairs in {r['matchups']} matchups, {r['votes']} non-tie human votes")
    a = r["agreement"]
    print("Agreement with humans (per vote, 95% CI, matchup bootstrap)")
    print("  order 1 (original)      ", fmt(*a["order1"]))
    print("  order 2 (swapped)       ", fmt(*a["order2"]))
    print("  margin averaged         ", fmt(*a["avg"]))
    print("  consistent pairs only   ", fmt(*r["agreement_consistent_only"]))
    print("  flipped pairs only (o1) ", fmt(*r["agreement_flipped_only_order1"]))
    if "human_human" in r:
        h = r["human_human"]
        print(f"  human vs human          {100 * h['agreement']:.1f}% [{100 * h['ci'][0]:.1f}, {100 * h['ci'][1]:.1f}] ({h['pairs_with_2plus_votes']} pairs with 2+ votes)")
        print(f"  humans pick first answer {100 * r['human_first_answer_share']:.1f}% of votes")
    print("  order 1 re-centred      ", fmt(*a["order1_recentred"]))
    print("  order 2 re-centred      ", fmt(*a["order2_recentred"]))
    print("  'pick the longer answer'", fmt(*r["longer_answer_agreement"]))
    print(f"  averaged verdict = longer answer in {100 * r['avg_verdict_equals_longer']:.1f}% of pairs; corr(margin, log length ratio) {r['avg_margin_vs_log_length_ratio_corr']:.2f}")
    print("Position bias")
    print("  picks A, order 1        ", fmt(*r["pick_A_order1"]))
    print("  picks A, order 2        ", fmt(*r["pick_A_order2"]))
    print("  picks A, both orders    ", fmt(*r["pick_A_all"]))
    print("Flip rate (same position both orders)")
    print("  observed                ", fmt(*r["flip"]))
    print(f"  if orders independent   {100 * r['flip_if_independent']:.1f}%")
    print(f"  of which both-A / both-B {100 * r['flip_toward_A']:.1f}% / {100 * r['flip_toward_B']:.1f}%")
    print("  consistent share        ", fmt(*r["consistent_share"]))
    print("  flip rate by confidence tercile (min |margin| over both orders, low to high):",
          ", ".join(f"{100 * t['flip']:.0f}% (n={t['pairs']})" for t in r["flip_by_min_margin_tercile"]))
    print(f"  median |margin| {r['median_abs_margin']:.2f}; mean A+B probability mass {r['mean_AB_mass']:.4f}")


if __name__ == "__main__":
    main()
