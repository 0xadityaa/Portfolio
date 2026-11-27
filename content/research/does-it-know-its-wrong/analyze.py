"""Grade the answers and measure how well the model's own probability predicts correctness.

usage: python analyze.py RESULTS_DIR   (reads RESULTS_DIR/gen_<tag>.jsonl for each tag in TAGS)
Writes RESULTS_DIR/analysis.json and RESULTS_DIR/analysis.txt.

Grading: an answer is correct when, after SQuAD-style normalisation, it equals an alias
(strict), or its token F1 against any alias is at least 0.5 (the rule from the exact-match post).
Confidence signals are computed from the answer-token log probabilities, higher = more confident.
Intervals are percentile bootstraps over questions (2,000 resamples, fixed seed).
"""
import json
import math
import os
import random
import re
import string
import sys
from collections import Counter

import numpy as np

RES = "."
TAGS = ["qwen2.5-1.5b", "qwen2.5-0.5b"]
F1_THRESHOLD = 0.5
B = 2000
SEED = 7


def normalize(s):
    s = s.lower()
    s = "".join(ch for ch in s if ch not in set(string.punctuation))
    s = re.sub(r"\b(a|an|the)\b", " ", s)
    return " ".join(s.split())


def f1(pred, gold):
    p, g = pred.split(), gold.split()
    same = sum((Counter(p) & Counter(g)).values())
    if same == 0:
        return 0.0
    pr, rc = same / len(p), same / len(g)
    return 2 * pr * rc / (pr + rc)


def grade(answer, aliases):
    a = normalize(answer)
    al = {normalize(x) for x in aliases} - {""}
    if not a or not al:
        return False, False, 0.0
    strict = a in al
    best = max(f1(a, x) for x in al)
    return strict, strict or best >= F1_THRESHOLD, best


def wilson(k, n, z=1.96):
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (c - h, c + h)


def auroc(score, y):
    """P(score of a random right answer > score of a random wrong one), ties count half."""
    score, y = np.asarray(score, float), np.asarray(y, bool)
    pos, neg = score[y], score[~y]
    if len(pos) == 0 or len(neg) == 0:
        return float("nan")
    order = np.argsort(score, kind="mergesort")
    ranks = np.empty(len(score))
    s_sorted = score[order]
    i = 0
    while i < len(score):
        j = i
        while j + 1 < len(score) and s_sorted[j + 1] == s_sorted[i]:
            j += 1
        ranks[order[i : j + 1]] = (i + j) / 2 + 1
        i = j + 1
    return (ranks[y].sum() - len(pos) * (len(pos) + 1) / 2) / (len(pos) * len(neg))


def ece(conf, y, bins=10):
    conf, y = np.asarray(conf, float), np.asarray(y, float)
    idx = np.minimum((conf * bins).astype(int), bins - 1)
    tot, rows = 0.0, []
    for b in range(bins):
        m = idx == b
        if m.sum():
            gap = abs(conf[m].mean() - y[m].mean())
            tot += m.sum() / len(conf) * gap
            rows.append({"bin": f"{b / bins:.1f}-{(b + 1) / bins:.1f}", "n": int(m.sum()),
                         "mean_conf": float(conf[m].mean()), "accuracy": float(y[m].mean())})
        else:
            rows.append({"bin": f"{b / bins:.1f}-{(b + 1) / bins:.1f}", "n": 0, "mean_conf": None, "accuracy": None})
    return tot, rows


def halve_point(conf, y, frac=0.5):
    """Answer the most confident questions first. Stop once the wrong answers still answered are
    at most `frac` of all wrong answers. Return (right kept share, coverage, accuracy of answered)."""
    conf, y = np.asarray(conf, float), np.asarray(y, bool)
    order = np.argsort(-conf, kind="mergesort")
    ys = y[order]
    cs = conf[order]
    n_wrong = (~y).sum()
    n_right = y.sum()
    if n_wrong == 0 or n_right == 0:
        return float("nan"), float("nan"), float("nan"), float("nan")
    wrong_cum = np.cumsum(~ys)
    right_cum = np.cumsum(ys)
    # answer all questions with conf >= cutoff, ties included
    best = 0
    for k in range(1, len(ys) + 1):
        if k < len(ys) and cs[k] == cs[k - 1]:
            continue  # do not split ties
        if wrong_cum[k - 1] <= frac * n_wrong:
            best = k
    if best == 0:
        return 0.0, 0.0, float("nan"), float("nan")
    cutoff = cs[best - 1]
    return (right_cum[best - 1] / n_right, best / len(ys),
            right_cum[best - 1] / best, float(cutoff))


def cutoff_row(conf, y, cut):
    conf, y = np.asarray(conf, float), np.asarray(y, bool)
    m = conf >= cut
    return {
        "cutoff": cut,
        "coverage": float(m.mean()),
        "accuracy_answered": float(y[m].mean()) if m.sum() else None,
        "right_kept": float(y[m].sum() / y.sum()),
        "wrong_kept": float((~y)[m].sum() / (~y).sum()),
    }


def boot(fn, n, rng, b=B):
    vals = []
    for _ in range(b):
        idx = np.array([rng.randrange(n) for _ in range(n)])
        v = fn(idx)
        if v is not None and not (isinstance(v, float) and math.isnan(v)):
            vals.append(v)
    vals = np.array(vals)
    return [float(np.percentile(vals, 2.5)), float(np.percentile(vals, 97.5))]


def analyse(rows, tag):
    rng = random.Random(SEED)
    n = len(rows)
    strict, ok, best_f1 = [], [], []
    for r in rows:
        s, c, b = grade(r["answer"], r["aliases"])
        strict.append(s), ok.append(c), best_f1.append(b)
    strict, y, best_f1 = np.array(strict), np.array(ok), np.array(best_f1)
    sig = {}
    lp = [np.array(r["logprobs"]) for r in rows]
    sig["p_seq"] = np.array([math.exp(x.sum()) if len(x) else 0.0 for x in lp])
    sig["p_seq_stop"] = np.array([math.exp(x.sum() + (r["lp_eos"] if r["lp_eos"] is not None else -5.0))
                                  if len(x) else 0.0 for x, r in zip(lp, rows)])
    sig["mean_token_p"] = np.array([math.exp(x.mean()) if len(x) else 0.0 for x in lp])
    sig["min_token_p"] = np.array([math.exp(x.min()) if len(x) else 0.0 for x in lp])
    sig["first_token_p"] = np.array([math.exp(x[0]) if len(x) else 0.0 for x in lp])
    sig["shortness"] = -np.array([len(x) for x in lp], float)
    sig["question_length"] = -np.array([len(r["question"].split()) for r in rows], float)

    out = {"tag": tag, "n": n, "truncated": int(sum(r["truncated"] for r in rows)),
           "empty_answers": int(sum(1 for r in rows if not r["answer"].strip()))}
    k = int(y.sum())
    out["accuracy"] = {"correct": k, "rate": k / n, "wilson95": wilson(k, n)}
    ks = int(strict.sum())
    out["accuracy_strict"] = {"correct": ks, "rate": ks / n, "wilson95": wilson(ks, n)}
    out["f1_only_passes"] = int((y & ~strict).sum())

    ov = set()
    ovp = os.path.join(RES, "overrides.json")
    if os.path.exists(ovp):
        o_ = json.load(open(ovp)).get(tag, {})
        ov = set(o_.get("wrong", []))
        ovr = set(o_.get("right", []))
    else:
        ovr = set()
    yh = (y & np.array([r["id"] not in ov for r in rows])) | np.array([r["id"] in ovr for r in rows])
    kh = int(yh.sum())
    out["hand_corrected"] = {
        "overridden_to_wrong": int((y & ~yh).sum()), "overridden_to_right": int((~y & yh).sum()), "correct": kh, "rate": kh / n, "wilson95": wilson(kh, n),
        "auroc_p_seq": auroc(sig["p_seq"], yh),
        "auroc_p_seq_ci95": boot(lambda idx: auroc(sig["p_seq"][idx], yh[idx]), n, rng),
        "halve_wrong_right_kept": halve_point(sig["p_seq"], yh)[0],
        "halve_wrong_coverage": halve_point(sig["p_seq"], yh)[1],
    }
    out["auroc"] = {}
    for name, s in sig.items():
        a = auroc(s, y)
        ci = boot(lambda idx, s=s: auroc(s[idx], y[idx]), n, rng)
        out["auroc"][name] = {"value": a, "ci95": ci}
        a2 = auroc(s, strict)
        out["auroc"][name]["strict_grader"] = a2
    # paired: p_seq vs shortness
    out["auroc_diff_pseq_minus_shortness"] = {
        "value": out["auroc"]["p_seq"]["value"] - out["auroc"]["shortness"]["value"],
        "ci95": boot(lambda idx: auroc(sig["p_seq"][idx], y[idx]) - auroc(sig["shortness"][idx], y[idx]), n, rng),
    }

    e, bins = ece(sig["p_seq"], y)
    out["ece_p_seq"] = {"value": e, "ci95": boot(lambda idx: ece(sig["p_seq"][idx], y[idx])[0], n, rng), "bins": bins}
    e2, bins2 = ece(sig["mean_token_p"], y)
    out["ece_mean_token_p"] = {"value": e2, "bins": bins2}
    out["mean_p_seq"] = float(sig["p_seq"].mean())
    out["brier_p_seq"] = float(np.mean((sig["p_seq"] - y) ** 2))
    out["brier_constant"] = float(np.mean((y.mean() - y) ** 2))

    for name in ["p_seq", "mean_token_p"]:
        hp = halve_point(sig[name], y)
        out[f"halve_wrong_{name}"] = {
            "right_kept": hp[0], "coverage": hp[1], "accuracy_answered": hp[2], "cutoff": hp[3],
            "right_kept_ci95": boot(lambda idx, s=sig[name]: halve_point(s[idx], y[idx])[0], n, rng),
        }

    # cutoff rows on p_seq
    out["cutoffs_p_seq"] = [cutoff_row(sig["p_seq"], y, c) for c in (0.9, 0.7, 0.5, 0.3, 0.1)]
    # accuracy when answering the most confident half
    order = np.argsort(-sig["p_seq"], kind="mergesort")
    top = order[: n // 2]
    out["top_half_accuracy"] = float(y[top].mean())
    out["bottom_half_accuracy"] = float(y[order[n // 2:]].mean())

    # split-half: pick the halve-wrong cutoff on one half, apply on the other
    sr = random.Random(SEED + 1)
    rk, rw, cov = [], [], []
    for _ in range(500):
        perm = list(range(n))
        sr.shuffle(perm)
        a, b = np.array(perm[: n // 2]), np.array(perm[n // 2:])
        cut = halve_point(sig["p_seq"][a], y[a])[3]
        if cut is None or (isinstance(cut, float) and math.isnan(cut)):
            continue
        row = cutoff_row(sig["p_seq"][b], y[b], cut)
        rk.append(row["right_kept"]), rw.append(row["wrong_kept"]), cov.append(row["coverage"])
    out["split_half_halve_wrong"] = {
        "right_kept_mean": float(np.nanmean(rk)), "wrong_kept_mean": float(np.mean(rw)),
        "wrong_kept_sd": float(np.std(rw)), "coverage_mean": float(np.mean(cov)), "splits": len(rk)}

    # risk-coverage curve for the chart (p_seq)
    ys = y[order]
    cum_right = np.cumsum(ys)
    pts = []
    for k in range(10, n + 1, max(1, n // 100)):
        pts.append((k / n, float(cum_right[k - 1] / k)))
    out["risk_coverage"] = pts
    out["_y"] = y.tolist()
    out["_p_seq"] = sig["p_seq"].tolist()
    return out, y, sig


def main(res):
    global RES
    RES = res
    results = {}
    lines = []
    for tag in TAGS:
        path = os.path.join(res, f"gen_{tag}.jsonl")
        if not os.path.exists(path):
            continue
        rows = [json.loads(l) for l in open(path) if l.strip()]
        o, y, sig = analyse(rows, tag)
        with open(os.path.join(res, f"graded_{tag}.jsonl"), "w") as gf:
            for r, yy in zip(rows, y):
                s_, c_, b_ = grade(r["answer"], r["aliases"])
                gf.write(json.dumps({"id": r["id"], "question": r["question"], "answer": r["answer"],
                                     "aliases_head": r["aliases"][:6], "strict": bool(s_), "correct": bool(c_),
                                     "best_f1": round(b_, 3), "p_seq": round(math.exp(sum(r["logprobs"])), 4)}) + "\n")
        results[tag] = o
        lines.append(f"=== {tag}: n={o['n']} (truncated at 16 tokens: {o['truncated']}, empty: {o['empty_answers']})")
        a = o["accuracy"]
        lines.append(f"accuracy (alias or F1>=0.5): {100*a['rate']:.1f}%  ({a['correct']}/{o['n']}), 95% Wilson {100*a['wilson95'][0]:.1f} to {100*a['wilson95'][1]:.1f}")
        a = o["accuracy_strict"]
        lines.append(f"accuracy (strict alias match): {100*a['rate']:.1f}%  ({a['correct']}/{o['n']}); F1-only passes: {o['f1_only_passes']}")
        lines.append("AUROC (right vs wrong), 95% bootstrap [strict grader]:")
        for name, v in o["auroc"].items():
            lines.append(f"  {name:16s} {v['value']:.3f} [{v['ci95'][0]:.3f}, {v['ci95'][1]:.3f}]   [{v['strict_grader']:.3f}]")
        d = o["auroc_diff_pseq_minus_shortness"]
        lines.append(f"  p_seq minus shortness: {d['value']:.3f} [{d['ci95'][0]:.3f}, {d['ci95'][1]:.3f}]")
        e = o["ece_p_seq"]
        h = o["hand_corrected"]
        lines.append(f"hand-corrected grader ({h['overridden_to_wrong']} passes read as wrong, {h['overridden_to_right']} failures read as right): accuracy {100*h['rate']:.1f}% ({h['correct']}/{o['n']}), AUROC p_seq {h['auroc_p_seq']:.3f} [{h['auroc_p_seq_ci95'][0]:.3f}, {h['auroc_p_seq_ci95'][1]:.3f}], halving wrong keeps {100*h['halve_wrong_right_kept']:.1f}% of right")
        lines.append(f"ECE of p_seq (10 bins): {e['value']:.3f} [{e['ci95'][0]:.3f}, {e['ci95'][1]:.3f}]; mean p_seq {o['mean_p_seq']:.3f} vs accuracy {o['accuracy']['rate']:.3f}")
        lines.append(f"ECE of mean_token_p: {o['ece_mean_token_p']['value']:.3f}")
        lines.append(f"Brier p_seq {o['brier_p_seq']:.3f} vs constant {o['brier_constant']:.3f}")
        lines.append("reliability bins (p_seq): bin, n, mean conf, accuracy")
        for b in e["bins"]:
            if b["n"]:
                lines.append(f"  {b['bin']}  n={b['n']:4d}  conf {b['mean_conf']:.3f}  acc {b['accuracy']:.3f}")
        for name in ("p_seq", "mean_token_p"):
            h = o[f"halve_wrong_{name}"]
            lines.append(f"halve the wrong answers using {name}: cutoff {h['cutoff']:.3f}, keeps {100*h['right_kept']:.1f}% of right [{100*h['right_kept_ci95'][0]:.1f}, {100*h['right_kept_ci95'][1]:.1f}], coverage {100*h['coverage']:.1f}%, accuracy of answered {100*h['accuracy_answered']:.1f}%")
        s = o["split_half_halve_wrong"]
        lines.append(f"split-half (cutoff chosen on one half, applied to the other, {s['splits']} splits): keeps {100*s['right_kept_mean']:.1f}% of right, lets {100*s['wrong_kept_mean']:.1f}% (sd {100*s['wrong_kept_sd']:.1f}) of wrong through, coverage {100*s['coverage_mean']:.1f}%")
        lines.append(f"accuracy of the most confident half: {100*o['top_half_accuracy']:.1f}%, of the least confident half: {100*o['bottom_half_accuracy']:.1f}%")
        lines.append("cutoffs on p_seq: cutoff, coverage, accuracy answered, right kept, wrong kept")
        for c in o["cutoffs_p_seq"]:
            aa = "n/a" if c["accuracy_answered"] is None else f"{100*c['accuracy_answered']:.1f}%"
            lines.append(f"  {c['cutoff']:.1f}  cov {100*c['coverage']:.1f}%  acc {aa}  right kept {100*c['right_kept']:.1f}%  wrong kept {100*c['wrong_kept']:.1f}%")
        lines.append("")
    # dump a table of F1-only passes for hand reading
    with open(os.path.join(res, "analysis.json"), "w") as f:
        json.dump(results, f)
    with open(os.path.join(res, "analysis.txt"), "w") as f:
        f.write("\n".join(lines))
    print("\n".join(lines))


if __name__ == "__main__":
    main(sys.argv[1])
