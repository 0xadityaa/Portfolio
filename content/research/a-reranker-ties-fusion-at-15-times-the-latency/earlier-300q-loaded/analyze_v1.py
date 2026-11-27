"""Tables and 95% article-cluster bootstrap intervals from results/ranks.npz and results/stats.json.

Usage: python analyze.py RESULTS_DIR
Writes RESULTS_DIR/analysis.txt and RESULTS_DIR/analysis.json.

Intervals resample the 48 articles with replacement (2,000 resamples, seed 20261115), because
questions from one article are not independent draws. The sample is a seeded random subset of the
10,570 dev questions; the intervals cover that sampling and the article clustering.
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
ND = 48
SIZES = [128, 256]
BUDGETS = [500, 1000, 2000]
rng = np.random.default_rng(20261115)
BOOT = 2000
counts = rng.multinomial(ND, np.ones(ND) / ND, size=BOOT)
W = counts[:, doc].astype(np.float64)
Wn = W / W.sum(axis=1, keepdims=True)

PIPES = ["bm25", "embed", "rrf", "bm25_rr", "embed_rr", "rrf_rr"]
LABEL = {"bm25": "BM25", "embed": "bge-small", "rrf": "RRF", "bm25_rr": "BM25 + rerank", "embed_rr": "bge-small + rerank", "rrf_rr": "RRF + rerank"}
out = []


def P(s=""):
    out.append(s)
    print(s)


def have(name, size):
    return f"{name}_{size}" in R.files


def k_for(size, budget):
    return max(1, int(budget / size + 0.5))


def hit(name, size, k):
    return (R[f"{name}_{size}"] <= k).astype(np.float64)


def ci(h):
    lo, hi = np.percentile(Wn @ h, [2.5, 97.5])
    return h.mean(), lo, hi


def pct(x):
    return f"{100 * x:.1f}"


def tokens(name, size, k):
    key = {"bm25": "bm25", "embed": "embed", "rrf": "rrf", "bm25_rr": "bm25_rr", "embed_rr": "embed_rr", "rrf_rr": "rrf_rr"}[name]
    return S[str(size)][f"mean_cum_tokens_{key}"][k - 1]


js = {"recall": {}, "diff": {}, "latency": {}, "pool": {}}
m_ = S["meta"]
P(f"== Setup == sample={m_['sample']} of {m_['questions_total']} questions, seed={m_['seed']}, pool={m_['pool']}, rrf_k={m_['rrf_k']}, threads={m_['threads']}")
P(f"embedder={m_['embed_model']} cross-encoder={m_['ce_model']}")
for size in SIZES:
    s = S[str(size)]
    P(f"size {size}: chunks={s['chunks']} mean_tokens={s['mean_chunk_tokens']:.1f} span_gold_ceiling={pct(s['span_gold_ceiling'])}%")

P()
P("== Recall at an equal token budget (k = round(budget / size)), strict span hit, 95% CI ==")
P("budget | size | k | pipeline | recall % [CI] | mean tokens handed over")
for B in BUDGETS:
    for size in SIZES:
        k = k_for(size, B)
        for p in PIPES:
            if not have(p, size):
                continue
            m, lo, hi = ci(hit(p, size, k))
            t = tokens(p, size, k)
            P(f"{B} | {size} | {k} | {LABEL[p]} | {pct(m)} [{pct(lo)}, {pct(hi)}] | {t:.0f}")
            js["recall"][f"{p}_{size}_{B}"] = {"k": k, "recall": m, "lo": lo, "hi": hi, "tokens": t}

P()
P("== Paired differences (percentage points, 95% CI), budget 2000 and 1000 ==")
pairs = [
    ("rrf", "bm25", "RRF minus BM25"),
    ("rrf", "embed", "RRF minus bge-small"),
    ("bm25_rr", "bm25", "reranker lift on BM25"),
    ("embed_rr", "embed", "reranker lift on bge-small"),
    ("rrf_rr", "rrf", "reranker lift on RRF"),
    ("rrf_rr", "bm25", "RRF + rerank minus BM25 alone"),
    ("rrf_rr", "bm25_rr", "RRF + rerank minus BM25 + rerank"),
    ("embed_rr", "bm25_rr", "bge-small + rerank minus BM25 + rerank"),
]
for B in BUDGETS:
    for size in SIZES:
        k = k_for(size, B)
        for a, b, label in pairs:
            if not (have(a, size) and have(b, size)):
                continue
            d = hit(a, size, k) - hit(b, size, k)
            m, lo, hi = ci(d)
            P(f"budget {B} size {size} (k={k}): {label} = {pct(m)} [{pct(lo)}, {pct(hi)}]")
            js["diff"][f"{a}_minus_{b}_{size}_{B}"] = {"d": m, "lo": lo, "hi": hi}

P()
P("== Rescued and broken by the reranker (budget 2000): questions that go miss -> hit and hit -> miss ==")
for size in SIZES:
    k = k_for(size, 2000)
    for first, rr in (("bm25", "bm25_rr"), ("embed", "embed_rr"), ("rrf", "rrf_rr")):
        if not have(rr, size):
            continue
        a, b = hit(first, size, k), hit(rr, size, k)
        P(f"size {size} {LABEL[first]} -> rerank: rescued {int(((a == 0) & (b == 1)).sum())}, broken {int(((a == 1) & (b == 0)).sum())}, "
          f"still missed {int(((a == 0) & (b == 0)).sum())} of {N}; first-stage misses {int((a == 0).sum())}")

P()
P("== Recall@1 (the best single chunk) ==")
for size in SIZES:
    for p in PIPES:
        if not have(p, size):
            continue
        m, lo, hi = ci(hit(p, size, 1))
        P(f"size {size} | {LABEL[p]} | {pct(m)} [{pct(lo)}, {pct(hi)}]")

P()
P("== Pool depth: gold chunk anywhere in the first stage's top n (the most a reranker could reach) ==")
for size in SIZES:
    for p in ("bm25", "embed", "rrf"):
        P(f"size {size} | {LABEL[p]} | " + " | ".join(f"top{d}: {pct(S['meta']['pool_recall'][f'{p}_{size}_{d}'])}" for d in (10, 20, 50)))

P()
P("== Rerank a shallower pool (budget 2000): recall with the pool cut to 10, 20, 50 ==")
for size in SIZES:
    k = k_for(size, 2000)
    for p in ("bm25", "embed", "rrf"):
        if not have(f"{p}_rr", size):
            continue
        row = []
        for depth in (10, 20, 50):
            key = f"{p}_rr{depth}" if depth < 50 else f"{p}_rr"
            row.append(f"pool {depth}: {pct(hit(key, size, k).mean())}")
        P(f"size {size} k={k} | {LABEL[p]} first stage {pct(hit(p, size, k).mean())} | " + " | ".join(row))
        for depth in (10, 20, 50):
            key = f"{p}_rr{depth}" if depth < 50 else f"{p}_rr"
            js["pool"][f"{p}_{size}_{depth}"] = hit(key, size, k).mean()

P()
P("== Latency per query, one query at a time, 4 CPU threads, machine shared with other jobs (ms) ==")
for size in SIZES:
    if "latency_ms" not in S[str(size)]:
        continue
    L = S[str(size)]["latency_ms"]
    for key, label in (("bm25_query", "BM25 query (sparse matmul, my code)"), ("embed_query", "bge-small query embedding"), ("rrf", "RRF fusion"),
                       ("ce20", "cross-encoder, 20 chunks"), ("ce50", "cross-encoder, 50 chunks")):
        P(f"size {size} | {label} | median {L[key]['median']:.1f} | p95 {L[key]['p95']:.1f} | mean {L[key]['mean']:.1f}")
    js["latency"][str(size)] = L

(res / "analysis.txt").write_text("\n".join(out) + "\n")
(res / "analysis.json").write_text(json.dumps(js))
