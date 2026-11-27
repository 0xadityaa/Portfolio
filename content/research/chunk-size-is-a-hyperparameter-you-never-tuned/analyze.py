"""Turn results/ranks.npz + results/stats.json into tables with confidence intervals.

Usage: python analyze.py RESULTS_DIR
Writes RESULTS_DIR/analysis.txt and RESULTS_DIR/analysis.json.

Intervals are article-cluster bootstraps (resample the 48 articles with
replacement, 2,000 resamples, seed 20261114), because questions from one
article are not independent draws.
"""
import json
import sys
from pathlib import Path

import numpy as np

res = Path(sys.argv[1])
R = np.load(res / "ranks.npz")
S = json.loads((res / "stats.json").read_text())
doc = R["doc"].astype(int)
N = len(doc)
ND = doc.max() + 1
SIZES = [64, 128, 256, 512, 1024]
BUDGETS = [500, 1000, 2000, 4000]
RET = ["bm25", "embed"]
rng = np.random.default_rng(20261114)
BOOT = 2000
# cluster-bootstrap weights: counts of each article in each resample -> per-question weights
art_counts = rng.multinomial(ND, np.ones(ND) / ND, size=BOOT)  # (BOOT, ND)
W = art_counts[:, doc].astype(np.float64)  # (BOOT, N)
Wn = W / W.sum(axis=1, keepdims=True)

out = []


def P(s=""):
    out.append(s)
    print(s)


def hit(ret, size, ov, k, gold="span"):
    return (R[f"{ret}_{size}_{ov}_{gold}"] <= k).astype(np.float64)


def ci(h):
    m = h.mean()
    b = Wn @ h
    lo, hi = np.percentile(b, [2.5, 97.5])
    return m, lo, hi


def ci_diff(h1, h2):
    d = h1 - h2
    m = d.mean()
    b = Wn @ d
    lo, hi = np.percentile(b, [2.5, 97.5])
    return m, lo, hi


def pct(x):
    return f"{100 * x:.1f}"


def k_for(size, budget):
    return max(1, int(budget / size + 0.5))


def tokens_at(ret, size, ov, k):
    return S[f"{ret}_{size}_{ov}"]["mean_cum_tokens"][k - 1]


js = {"fixed_k": {}, "budget": {}, "overlap": {}}

P("== Corpus ==")
P(f"articles={S['meta']['articles']} questions={S['meta']['questions']} embed={S['meta']['embed_model']} k1={S['meta']['k1']} b={S['meta']['b']}")
for ov in (0, 15):
    for size in SIZES:
        c = S[f"cfg_{size}_{ov}"]
        P(f"size={size} overlap={ov}% chunks={c['chunks']} mean_tokens={c['mean_chunk_tokens']:.1f} span_gold_ceiling={pct(c['span_gold_coverage'])}% string_gold_ceiling={pct(c['string_gold_coverage'])}% "
          f"embedder_mean_tokens={c['embedder_mean_tokens']:.0f} share_truncated_at_512={pct(c['embedder_share_truncated'])}%")

P()
P("== Recall at fixed k, 0% overlap, span gold (95% article-cluster bootstrap CI) ==")
P("retriever | chunk | k | recall % [CI] | mean tokens handed over")
for ret in RET:
    for size in SIZES:
        for k in (1, 5, 10):
            m, lo, hi = ci(hit(ret, size, 0, k))
            t = tokens_at(ret, size, 0, k)
            P(f"{ret} | {size} | {k} | {pct(m)} [{pct(lo)}, {pct(hi)}] | {t:.0f}")
            js["fixed_k"][f"{ret}_{size}_{k}"] = {"recall": m, "lo": lo, "hi": hi, "tokens": t}

P()
P("== Recall at an equal token budget (k = round(budget / chunk size)), 0% overlap, span gold ==")
P("retriever | budget | chunk | k | recall % [CI] | actual mean tokens")
for ret in RET:
    for B in BUDGETS:
        for size in SIZES:
            k = k_for(size, B)
            m, lo, hi = ci(hit(ret, size, 0, k))
            t = tokens_at(ret, size, 0, k)
            P(f"{ret} | {B} | {size} | {k} | {pct(m)} [{pct(lo)}, {pct(hi)}] | {t:.0f}")
            js["budget"][f"{ret}_{B}_{size}"] = {"k": k, "recall": m, "lo": lo, "hi": hi, "tokens": t}

P()
P("== Spread across chunk sizes vs gap between retrievers, budget 2000, span gold ==")
for B in (1000, 2000, 4000):
    best = {}
    for ret in RET:
        vals = {size: hit(ret, size, 0, k_for(size, B)) for size in SIZES}
        means = {s: v.mean() for s, v in vals.items()}
        bs = max(means, key=means.get)
        ws = min(means, key=means.get)
        m, lo, hi = ci_diff(vals[bs], vals[ws])
        best[ret] = (bs, vals[bs])
        P(f"budget {B} {ret}: best size {bs} ({pct(means[bs])}) minus worst size {ws} ({pct(means[ws])}) = {pct(m)} points [{pct(lo)}, {pct(hi)}]")
    for size in SIZES:
        k = k_for(size, B)
        m, lo, hi = ci_diff(hit("embed", size, 0, k), hit("bm25", size, 0, k))
        P(f"budget {B} chunk {size}: embeddings minus BM25 = {pct(m)} points [{pct(lo)}, {pct(hi)}]")
    m, lo, hi = ci_diff(best["embed"][1], best["bm25"][1])
    P(f"budget {B}: each retriever at its own best size, embeddings minus BM25 = {pct(m)} points [{pct(lo)}, {pct(hi)}]")

P()
P("== Same budget, same chunk size, k=5: size effect vs retriever effect ==")
for ret in RET:
    m, lo, hi = ci_diff(hit(ret, 1024, 0, 5), hit(ret, 64, 0, 5))
    P(f"{ret}: recall@5 at 1024 minus at 64 = {pct(m)} points [{pct(lo)}, {pct(hi)}]")

P()
P("== Overlap: 15% minus 0%, span gold ==")
P("retriever | chunk | metric | 0% | 15% | diff [CI] | tokens@k 0% -> 15%")
for ret in RET:
    for size in SIZES:
        for label, kf in (("recall@5", lambda s: 5), ("budget 2000", lambda s: k_for(s, 2000))):
            k = kf(size)
            h0, h15 = hit(ret, size, 0, k), hit(ret, size, 15, k)
            m, lo, hi = ci_diff(h15, h0)
            t0, t15 = tokens_at(ret, size, 0, k), tokens_at(ret, size, 15, k)
            P(f"{ret} | {size} | {label} (k={k}) | {pct(h0.mean())} | {pct(h15.mean())} | {pct(m)} [{pct(lo)}, {pct(hi)}] | {t0:.0f} -> {t15:.0f}")
            js["overlap"][f"{ret}_{size}_{label}"] = {"r0": h0.mean(), "r15": h15.mean(), "diff": m, "lo": lo, "hi": hi}

P()
P("== Gold definition: span vs 'answer string appears in a retrieved chunk', 0% overlap, k=5 ==")
for ret in RET:
    for size in SIZES:
        a = hit(ret, size, 0, 5, "span").mean()
        b = hit(ret, size, 0, 5, "string").mean()
        P(f"{ret} | {size} | span {pct(a)} | string {pct(b)} | diff {pct(b - a)}")

P()
P("== Not found in the top 100 (span gold, 0% overlap) ==")
for ret in RET:
    for size in SIZES:
        P(f"{ret} | {size} | {pct((R[f'{ret}_{size}_0_span'] > 100).mean())}% never in top 100")

P()
P("== Neighbouring sizes at budget 2000 (is the peak a peak?) ==")
for ret in RET:
    for a_, b_ in zip(SIZES[:-1], SIZES[1:]):
        m, lo, hi = ci_diff(hit(ret, b_, 0, k_for(b_, 2000)), hit(ret, a_, 0, k_for(a_, 2000)))
        P(f"{ret}: {b_} minus {a_} = {pct(m)} points [{pct(lo)}, {pct(hi)}]")
P()
P("== Default-style 512 against the best size, budget 2000 ==")
for ret in RET:
    vals = {s: hit(ret, s, 0, k_for(s, 2000)) for s in SIZES}
    bs = max(vals, key=lambda s: vals[s].mean())
    m, lo, hi = ci_diff(vals[512], vals[bs])
    P(f"{ret}: 512 minus best ({bs}) = {pct(m)} points [{pct(lo)}, {pct(hi)}]")

(res / "analysis.txt").write_text("\n".join(out) + "\n")
(res / "analysis.json").write_text(json.dumps(js))
