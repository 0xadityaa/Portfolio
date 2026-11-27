"""Query latency, one query at a time, repeated, reported as medians.

Usage: python latency.py DATA_DIR CACHE_DIR OUT_DIR [N_QUESTIONS]   (same arguments as run.py; run it on its own, not alongside run.py)

For the first NQ questions of run.py's seeded sample it times, at 256-token chunks and 4 threads:
BM25 retrieval, the bge-small query embedding plus dense search, RRF, and the cross-encoder scoring the top 10, 20
and 50 RRF candidates. The whole pass runs PASSES times; the table is the median of the per-pass medians, and
it records `uptime` before and after so the load on the machine is part of the result.
It reuses run.py's setup code (everything above its "models" section), so chunks and rankings are identical.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

src = (Path(__file__).parent / "run.py").read_text()
exec(compile(src[: src.index("# ---------- models ----------")], "run.py(setup)", "exec"))

from sentence_transformers import CrossEncoder, SentenceTransformer  # noqa: E402

SIZE, NQ, PASSES = 256, 30, 3
embedder = SentenceTransformer(EMBED_MODEL, device="cpu")
embedder.max_seq_length = 512
ce = CrossEncoder(CE_MODEL, device="cpu", max_length=512)
qtexts = [questions[i]["q"] for i in sample[:NQ]]

chunks = chunk_corpus(SIZE)
texts = [docs[di]["text"][cs:ce_] for di, cs, ce_, _ in chunks]
vocab, Wm = bm25_matrix(texts)
efile = cache_dir / f"emb_{SIZE}_0.npy"
if efile.exists():
    De = np.load(efile)
else:
    De = embedder.encode(texts, batch_size=32, normalize_embeddings=True, show_progress_bar=False)
    np.save(efile, De)
assert De.shape[0] == len(chunks)


def uptime():
    return subprocess.run(["uptime"], capture_output=True, text=True).stdout.strip()


up_before = uptime()
log("uptime before: " + up_before)
ce.predict([(qtexts[0], texts[0])] * 4, batch_size=64, show_progress_bar=False)
embedder.encode([QUERY_PREFIX + qtexts[0]], normalize_embeddings=True, show_progress_bar=False)

passes = []
for p in range(PASSES):
    row = {"bm25": [], "dense": [], "rrf": [], "ce10": [], "ce20": [], "ce50": []}
    for qi in range(NQ):
        t0 = time.perf_counter()
        S = (bm25_query_matrix(vocab, [qtexts[qi]]) @ Wm.T).toarray()
        bm = topn_rows(S, TOPN)
        row["bm25"].append(time.perf_counter() - t0)
        t0 = time.perf_counter()
        qv = embedder.encode([QUERY_PREFIX + qtexts[qi]], normalize_embeddings=True, show_progress_bar=False)
        em = topn_rows(qv @ De.T, TOPN)
        row["dense"].append(time.perf_counter() - t0)
        t0 = time.perf_counter()
        fused = rrf(bm, em)
        row["rrf"].append(time.perf_counter() - t0)
        cand = [int(c) for c in fused[0, :50]]
        for depth in (10, 20, 50):
            t0 = time.perf_counter()
            ce.predict([(qtexts[qi], texts[c]) for c in cand[:depth]], batch_size=64, show_progress_bar=False)
            row[f"ce{depth}"].append(time.perf_counter() - t0)
    passes.append({k: float(np.median(v) * 1000) for k, v in row.items()} | {"ce50_p95": float(np.percentile(row["ce50"], 95) * 1000)})
    log(f"pass {p + 1}: " + ", ".join(f"{k} {v:.1f} ms" for k, v in passes[-1].items()))

up_after = uptime()
log("uptime after: " + up_after)
keys = [k for k in passes[0]]
med = {k: float(np.median([ps[k] for ps in passes])) for k in keys}
first_stage = med["bm25"] + med["dense"] + med["rrf"]
res = {"queries": NQ, "passes": PASSES, "threads": THREADS, "uptime_before": up_before, "uptime_after": up_after, "pass_medians_ms": passes,
       "median_of_passes_ms": med, "first_stage_ms": first_stage, "ce50_over_first_stage": med["ce50"] / first_stage,
       "ce20_over_first_stage": med["ce20"] / first_stage, "ce50_over_dense_query": med["ce50"] / med["dense"]}
(out_dir / "latency.json").write_text(json.dumps(res, indent=1))
log(json.dumps(res))
