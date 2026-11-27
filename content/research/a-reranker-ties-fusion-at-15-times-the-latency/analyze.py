"""Tables and paired bootstrap intervals from results/ranks.npz, results/stats.json and results/latency.json.

Usage: python analyze.py RESULTS_DIR
Writes RESULTS_DIR/analysis.txt and RESULTS_DIR/analysis.json.

Two paired bootstraps, both 5,000 resamples, seed 20261115, on per-question hit differences:
  * article-cluster: resample the 48 articles with replacement and keep each question with its article
    (questions from one article are not independent draws). This is the interval the post reports.
  * question-level: resample questions with replacement, ignoring articles (narrower; shown for comparison).
Hit = a retrieved chunk fully contains a gold answer span. k = round(budget / 256) chunks of 256 tokens.
Reranked pipelines are scored on the first N_DONE questions of the seeded random order (all of them were
fully scored); the pool-50 comparison uses the first SUB_DONE of those.
"""
import json
import sys
from pathlib import Path

import numpy as np

res = Path(sys.argv[1])
R = np.load(res / "ranks.npz")
S = json.loads((res / "stats.json").read_text())
LAT = json.loads((res / "latency.json").read_text()) if (res / "latency.json").exists() else None
doc_all = R["doc"].astype(int)
N = int(R["n_done"])
SUBN = int(R["sub_done"])
EMBN = int(R["emb_done"])
ND = 48
BOOT = 5000
rng = np.random.default_rng(20261115)
counts = rng.multinomial(ND, np.ones(ND) / ND, size=BOOT)
QI = None  # question-level resample indices, built per sample size
SIZE = 256
BUDGETS = [500, 1000, 2000]
LABEL = {"bm25": "BM25", "embed": "bge-small", "rrf": "RRF"}
out, js = [], {"recall": {}, "diff": {}, "pool": {}, "n": N, "sub": SUBN}


def P(s=""):
    out.append(s)
    print(s)


def pct(x):
    return f"{100 * x:.1f}"


def key(first, size, pool=None):
    return f"{first}_{size}" if pool is None else f"{first}_rr{pool}_{size}"


def hit(first, k, n, pool=None, size=SIZE):
    return (R[key(first, size, pool)][:n] <= k).astype(np.float64)


def ci_cluster(h):
    d = doc_all[: len(h)]
    Wn = counts[:, d].astype(np.float64)
    Wn /= Wn.sum(axis=1, keepdims=True)
    lo, hi = np.percentile(Wn @ h, [2.5, 97.5])
    return h.mean(), lo, hi


def ci_question(h):
    r = np.random.default_rng(20261116)
    idx = r.integers(0, len(h), size=(BOOT, len(h)))
    lo, hi = np.percentile(h[idx].mean(axis=1), [2.5, 97.5])
    return lo, hi


def fmt(h, q=False):
    m, lo, hi = ci_cluster(h)
    s = f"{pct(m)} [{pct(lo)}, {pct(hi)}]"
    if q:
        qlo, qhi = ci_question(h)
        s += f"  (question-level [{pct(qlo)}, {pct(qhi)}])"
    return s


def k_for(size, budget):
    return max(1, int(budget / size + 0.5))


m_ = S["meta"]
P(f"== Setup == sample drawn={m_['sample']} of {m_['questions_total']} questions, seed={m_['seed']}; fully scored at pool {m_['pool_main']}: {N}; pool-{m_['pool']} subsample: {SUBN}")
P(f"first stages: BM25 (own code), bge-small; rrf_k={m_['rrf_k']}; cross-encoder={m_['ce_model']}; threads={m_['threads']}; run took {m_['minutes']:.1f} min, {m_['pairs_scored_this_run']} pairs scored in this run")
for size in (128, 256):
    s = S[str(size)]
    P(f"size {size}: chunks={s['chunks']} mean_tokens={s['mean_chunk_tokens']:.1f} span_gold_ceiling={pct(s['span_gold_ceiling'])}%")

P()
P(f"== Recall at an equal token budget, 256-token chunks, first {N} questions, strict span hit, 95% article-cluster CI ==")
P("budget | k | pipeline | recall % [CI] | mean tokens handed over")
for B in BUDGETS:
    k = k_for(SIZE, B)
    for first in ("bm25", "embed", "rrf"):
        P(f"{B} | {k} | {LABEL[first]} | {fmt(hit(first, k, N))} | {S[str(SIZE)][f'mean_cum_tokens_{first}'][k - 1]:.0f}")
    for first in ("bm25", "rrf"):
        P(f"{B} | {k} | {LABEL[first]} + rerank (pool 20) | {fmt(hit(first, k, N, 20))} | -")

P()
P(f"== Same, 128-token first stages (no reranker at 128), first {N} questions ==")
for B in BUDGETS:
    k = k_for(128, B)
    for first in ("bm25", "embed", "rrf"):
        P(f"{B} | {k} | {LABEL[first]} | {fmt(hit(first, k, N, size=128))}")

P()
P(f"== Paired differences in percentage points (95% CI), first {N} questions, pool 20 ==")
pairs = [
    ("rrf", None, "bm25", None, "RRF minus BM25"),
    ("bm25", 20, "bm25", None, "reranker lift on BM25"),
    ("rrf", 20, "rrf", None, "reranker lift on RRF"),
    ("rrf", 20, "bm25", None, "RRF + rerank minus BM25 alone"),
    ("rrf", 20, "bm25", 20, "RRF + rerank minus BM25 + rerank"),
    ("bm25", 20, "rrf", None, "BM25 + rerank minus RRF alone"),
]
for B in BUDGETS:
    k = k_for(SIZE, B)
    for a, pa, b, pb, label in pairs:
        d = hit(a, k, N, pa) - hit(b, k, N, pb)
        P(f"budget {B} (k={k}): {label} = {fmt(d, q=True)}")
        m, lo, hi = ci_cluster(d)
        js["diff"][f"{label}|{B}"] = {"d": m, "lo": lo, "hi": hi, "k": k, "n": N}
P()
P(f"-- same, 128-token chunks (k=16, 2,000 tokens): RRF minus BM25 = {fmt(hit('rrf', 16, N, size=128) - hit('bm25', 16, N, size=128), q=True)}")

P()
P(f"== Rescued and broken by the reranker (budget 2000, k=8, pool 20), first {N} questions ==")
k = 8
for first in ("bm25", "rrf"):
    a, b = hit(first, k, N), hit(first, k, N, 20)
    P(f"{LABEL[first]} -> rerank: rescued {int(((a == 0) & (b == 1)).sum())}, broken {int(((a == 1) & (b == 0)).sum())}, "
      f"still missed {int(((a == 0) & (b == 0)).sum())}; first-stage misses {int((a == 0).sum())} of {N}")
    js[f"flips_{first}"] = {"rescued": int(((a == 0) & (b == 1)).sum()), "broken": int(((a == 1) & (b == 0)).sum()), "first_stage_misses": int((a == 0).sum())}

P()
P(f"== Recall@1 (the best single chunk), first {N} questions ==")
for first in ("bm25", "rrf"):
    P(f"{LABEL[first]} | {fmt(hit(first, 1, N), q=False)} | + rerank (pool 20) | {fmt(hit(first, 1, N, 20))} | lift {fmt(hit(first, 1, N, 20) - hit(first, 1, N))}")

P()
P(f"== Pool depth on the first {SUBN} questions (budget 2000, k=8): the first stage, then reranking its top 10, 20 or 50 ==")
for first in ("bm25", "rrf"):
    n = SUBN
    row = [f"first stage {fmt(hit(first, 8, n))}"]
    for pool in (10, 20, 50):
        row.append(f"pool {pool}: {fmt(hit(first, 8, n, pool))}")
        js["pool"][f"{first}_{pool}"] = float(hit(first, 8, n, pool).mean())
    P(f"{LABEL[first]} | " + " | ".join(row))
    # gold chunk inside the pool at all
    ceil = [f"top{d}: {pct(float((R[key(first, SIZE)][:n] <= d).mean()))}" for d in (10, 20, 50)]
    P(f"   chance the gold chunk is in the pool at all: " + ", ".join(ceil))
P()
P(f"-- paired pool-50 vs pool-20 on the first {SUBN} questions (k=8):")
for first in ("bm25", "rrf"):
    d = hit(first, 8, SUBN, 50) - hit(first, 8, SUBN, 20)
    P(f"{LABEL[first]}: pool 50 minus pool 20 = {fmt(d)}")
    d = hit(first, 8, SUBN, 50) - hit(first, 8, SUBN)
    P(f"{LABEL[first]}: reranker (pool 50) lift over first stage = {fmt(d, q=True)}")
    js["diff"][f"pool50 lift {first}"] = dict(zip(("d", "lo", "hi"), ci_cluster(d)))
P(f"-- the same two lifts at pool 20 on those {SUBN} questions, for a like-for-like read:")
for first in ("bm25", "rrf"):
    d = hit(first, 8, SUBN, 20) - hit(first, 8, SUBN)
    P(f"{LABEL[first]}: reranker (pool 20) lift over first stage = {fmt(d, q=True)}")
P()
P(f"== Weak first stage (bge-small alone), first {EMBN} questions, budget 2000 ==")
d = hit("embed", 8, EMBN, 20) - hit("embed", 8, EMBN)
P(f"bge-small -> rerank (pool 20) lift = {fmt(d, q=True)}; first stage {fmt(hit('embed', 8, EMBN))}, reranked {fmt(hit('embed', 8, EMBN, 20))}")
d2 = hit("bm25", 8, EMBN, 20) - hit("bm25", 8, EMBN)
P(f"BM25 -> rerank (pool 20) lift on the same questions = {fmt(d2, q=True)}")
P(f"lift on bge-small minus lift on BM25 = {fmt(d - d2)}")

if LAT:
    P()
    P(f"== Latency per query, one query at a time, 256-token chunks, 4 CPU threads, median of {LAT['passes']} pass medians over {LAT['queries']} queries (ms) ==")
    P(f"uptime before: {LAT['uptime_before']}")
    P(f"uptime after:  {LAT['uptime_after']}")
    med = LAT["median_of_passes_ms"]
    for k_, label in (("bm25", "BM25 query"), ("dense", "bge-small query embedding + dense search"), ("rrf", "RRF fusion"),
                      ("ce10", "cross-encoder, 10 chunks"), ("ce20", "cross-encoder, 20 chunks"), ("ce50", "cross-encoder, 50 chunks")):
        P(f"{label} | {med[k_]:.1f}")
    P(f"BM25 + dense + RRF together: {LAT['first_stage_ms']:.1f} ms; cross-encoder (pool 20) is {LAT['ce20_over_first_stage']:.1f}x that, pool 50 is {LAT['ce50_over_first_stage']:.1f}x")
    P(f"BM25 alone: {med['bm25']:.1f} ms; cross-encoder pool 20 is {med['ce20'] / med['bm25']:.0f}x BM25 alone")
    js["latency"] = LAT

(res / "analysis.txt").write_text("\n".join(out) + "\n")
(res / "analysis.json").write_text(json.dumps(js))
