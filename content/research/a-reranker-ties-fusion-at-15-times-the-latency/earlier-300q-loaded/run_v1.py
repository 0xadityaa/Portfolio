"""Fusion and reranking on SQuAD v1.1 dev, at an equal token budget.

Usage: python run.py DATA_DIR CACHE_DIR OUT_DIR [N_QUESTIONS]

Reuses the chunking, gold definition, BM25 and bge-small setup from the chunk-size post
(content/research/chunk-size-is-a-hyperparameter-you-never-tuned/run.py), copied here.

For chunk sizes 128 and 256 (no overlap) it builds six rankings per question:
  bm25, embed (bge-small), rrf (BM25 + bge-small, k=60),
  bm25_rr, rrf_rr, embed_rr  (the first stage's top POOL chunks, reordered by a cross-encoder)
Cross-encoder scores are cached per (question, chunk) pair, so overlapping pools are scored once.
It records the rank of the first strict span hit (1..POOL, POOL+1 = miss) for every question,
plus the pool recall, plus the reranker latency per query.
"""
import json
import re
import sys
import time
from pathlib import Path

import numpy as np
import scipy.sparse as sp
import tiktoken
import torch

SEED = 20261115
SIZES = [128, 256]
TOPN = 100          # depth of each first-stage list that RRF fuses
POOL = 50           # candidates handed to the cross-encoder
RRF_K = 60
EMBED_MODEL = "BAAI/bge-small-en-v1.5"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
CE_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
K1, B = 1.2, 0.75
THREADS = 4
LAT_QUERIES = 40
RERANK_SIZES = [256]   # the cross-encoder only runs at these sizes (time budget on a shared CPU)
DO_EMBED_RR = len(sys.argv) > 5 and sys.argv[5] == 'embed_rr'

data_dir, cache_dir, out_dir = (Path(a) for a in sys.argv[1:4])
N_SAMPLE = int(sys.argv[4]) if len(sys.argv) > 4 else 2000
cache_dir.mkdir(parents=True, exist_ok=True)
out_dir.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(THREADS)
enc = tiktoken.get_encoding("o200k_base")


def log(*a):
    print(*a, flush=True)


# ---------- dataset (same as the chunk-size post) ----------
squad = json.loads((data_dir / "dev-v1.1.json").read_text())
docs, questions = [], []
for art in squad["data"]:
    parts, pos, para_off = [], 0, []
    for p in art["paragraphs"]:
        para_off.append(pos)
        parts.append(p["context"])
        pos += len(p["context"]) + 2
    text = "\n\n".join(parts)
    d = len(docs)
    docs.append({"title": art["title"], "text": text})
    for p, off in zip(art["paragraphs"], para_off):
        assert text[off : off + len(p["context"])] == p["context"]
        for qa in p["qas"]:
            spans = set()
            for a in qa["answers"]:
                s = off + a["answer_start"]
                assert text[s : s + len(a["text"])] == a["text"]
                spans.add((s, s + len(a["text"])))
            questions.append({"doc": d, "q": qa["question"], "spans": sorted(spans)})
log(f"articles={len(docs)} questions={len(questions)}")

rng = np.random.default_rng(SEED)
sample = np.sort(rng.choice(len(questions), size=min(N_SAMPLE, len(questions)), replace=False))
log(f"sample of {len(sample)} questions, seed {SEED}")

doc_tok = []
for d in docs:
    toks = enc.encode(d["text"])
    text, offs = enc.decode_with_offsets(toks)
    assert text == d["text"]
    doc_tok.append((toks, offs))


def chunk_corpus(size):
    chunks = []  # (doc, char_start, char_end, n_tokens)
    for di, (toks, offs) in enumerate(doc_tok):
        n = len(toks)
        for a in range(0, n, size):
            b = min(a + size, n)
            cs = offs[a]
            ce = offs[b] if b < n else len(docs[di]["text"])
            chunks.append((di, cs, ce, b - a))
            if b >= n:
                break
    return chunks


def span_gold(chunks):
    by_doc = {}
    for ci, (di, cs, ce, _) in enumerate(chunks):
        by_doc.setdefault(di, []).append((ci, cs, ce))
    out = []
    for q in questions:
        g = [ci for ci, cs, ce in by_doc[q["doc"]] if any(cs <= s and e <= ce for s, e in q["spans"])]
        out.append(np.array(g, dtype=np.int64))
    return out


def first_rank(order, gold_lists, depth):
    """order: (Q, >=depth) chunk ids, best first. Rank of first hit within depth, depth+1 = miss."""
    out = np.full(len(gold_lists), depth + 1, dtype=np.int16)
    for i, g in enumerate(gold_lists):
        if len(g) == 0:
            continue
        hit = np.isin(order[i, :depth], g)
        if hit.any():
            out[i] = int(np.argmax(hit)) + 1
    return out


# ---------- BM25 (identical to the chunk-size post) ----------
WORD = re.compile(r"[a-z0-9]+")


def bm25_matrix(texts):
    vocab, rows, cols, vals, dl = {}, [], [], [], []
    for r, t in enumerate(texts):
        words = WORD.findall(t.lower())
        dl.append(len(words))
        cnt = {}
        for w in words:
            cnt[w] = cnt.get(w, 0) + 1
        for w, c in cnt.items():
            j = vocab.setdefault(w, len(vocab))
            rows.append(r)
            cols.append(j)
            vals.append(c)
    n = len(texts)
    tf = sp.csr_matrix((vals, (rows, cols)), shape=(n, len(vocab)), dtype=np.float32)
    dl = np.array(dl, dtype=np.float32)
    avgdl = dl.mean()
    df = np.asarray((tf > 0).sum(axis=0)).ravel()
    idf = np.log(1 + (n - df + 0.5) / (df + 0.5)).astype(np.float32)
    tf = tf.tocoo()
    denom = tf.data + K1 * (1 - B + B * dl[tf.row] / avgdl)
    W = sp.csr_matrix((tf.data * (K1 + 1) / denom * idf[tf.col], (tf.row, tf.col)), shape=tf.shape)
    return vocab, W


def bm25_query_matrix(vocab, query_texts):
    qr, qc = [], []
    for i, q in enumerate(query_texts):
        for w_ in set(WORD.findall(q.lower())):
            j = vocab.get(w_)
            if j is not None:
                qr.append(i)
                qc.append(j)
    return sp.csr_matrix((np.ones(len(qr), dtype=np.float32), (qr, qc)), shape=(len(query_texts), len(vocab)))


def topn_rows(S, n):
    idx = np.argpartition(-S, n, axis=1)[:, :n]
    part = np.take_along_axis(S, idx, axis=1)
    order = np.argsort(-part, axis=1, kind="stable")
    return np.take_along_axis(idx, order, axis=1)


def topk_sparse(Q, W, block=500):
    out = np.zeros((Q.shape[0], TOPN), dtype=np.int64)
    for s in range(0, Q.shape[0], block):
        out[s : s + block] = topn_rows((Q[s : s + block] @ W.T).toarray(), TOPN)
    return out


def topk_dense(Qe, De, block=500):
    out = np.zeros((Qe.shape[0], TOPN), dtype=np.int64)
    for s in range(0, Qe.shape[0], block):
        out[s : s + block] = topn_rows(Qe[s : s + block] @ De.T, TOPN)
    return out


def rrf(list_a, list_b, k=RRF_K):
    """Reciprocal rank fusion (Cormack et al. 2009): score = sum 1 / (k + rank), ranks start at 1."""
    out = np.zeros((list_a.shape[0], TOPN), dtype=np.int64)
    for i in range(list_a.shape[0]):
        score = {}
        for lst in (list_a[i], list_b[i]):
            for r, c in enumerate(lst, start=1):
                score[c] = score.get(c, 0.0) + 1.0 / (k + r)
        # ties broken by chunk id so the result is deterministic
        best = sorted(score.items(), key=lambda kv: (-kv[1], kv[0]))[:TOPN]
        out[i] = [c for c, _ in best]
    return out


# ---------- models ----------
from sentence_transformers import CrossEncoder, SentenceTransformer  # noqa: E402

embedder = SentenceTransformer(EMBED_MODEL, device="cpu")
embedder.max_seq_length = 512
ce = CrossEncoder(CE_MODEL, device="cpu", max_length=512)
log(f"embedder {EMBED_MODEL}; cross-encoder {CE_MODEL}; torch threads {torch.get_num_threads()}")

qfile = cache_dir / "queries.npy"
if qfile.exists():
    Qe_all = np.load(qfile)
else:
    Qe_all = embedder.encode([QUERY_PREFIX + q["q"] for q in questions], batch_size=128, normalize_embeddings=True, show_progress_bar=False)
    np.save(qfile, Qe_all)

qtexts_all = [q["q"] for q in questions]
Qe = Qe_all[sample]
qtexts = [qtexts_all[i] for i in sample]
docs_of_sample = np.array([questions[i]["doc"] for i in sample], dtype=np.int16)

ranks, pool_recall, meta = {}, {}, {}
for size in SIZES:
    chunks = chunk_corpus(size)
    texts = [docs[di]["text"][cs:ce_] for di, cs, ce_, _ in chunks]
    ntok = np.array([c[3] for c in chunks])
    gold_all = span_gold(chunks)
    gold = [gold_all[i] for i in sample]

    vocab, W = bm25_matrix(texts)
    top_bm = topk_sparse(bm25_query_matrix(vocab, qtexts), W)

    efile = cache_dir / f"emb_{size}_0.npy"
    if efile.exists():
        De = np.load(efile)
    else:
        De = embedder.encode(texts, batch_size=32, normalize_embeddings=True, show_progress_bar=False)
        np.save(efile, De)
    assert De.shape[0] == len(chunks), "cached embeddings do not match this chunking"
    top_em = topk_dense(Qe, De)
    top_rrf = rrf(top_bm, top_em)

    # cross-encoder scores, cached per (question index in the sample, chunk id)
    ce_cache = {}

    def ce_scores(top):
        need = [(qi, int(c)) for qi in range(len(sample)) for c in top[qi, :POOL] if (qi, int(c)) not in ce_cache]
        need = sorted(set(need))
        log(f"[{size}] scoring {len(need)} new pairs")
        t0 = time.time()
        B_ = 4096
        for s in range(0, len(need), B_):
            part = need[s : s + B_]
            pairs = [(qtexts[qi], texts[c]) for qi, c in part]
            sc = ce.predict(pairs, batch_size=64, show_progress_bar=False)
            for key, v in zip(part, sc):
                ce_cache[key] = float(v)
            log(f"[{size}] {s + len(part)}/{len(need)} pairs, {time.time() - t0:.0f}s")
        return top

    def rerank(top):
        ce_scores(top)
        out = np.zeros((len(sample), POOL), dtype=np.int64)
        for qi in range(len(sample)):
            cand = [int(c) for c in top[qi, :POOL]]
            sc = np.array([ce_cache[(qi, c)] for c in cand])
            out[qi] = np.array(cand)[np.argsort(-sc, kind="stable")]
        return out

    do_rr = size in RERANK_SIZES
    pipes = {"bm25": top_bm, "embed": top_em, "rrf": top_rrf}
    if do_rr:
        pipes["bm25_rr"] = rerank(top_bm)
        pipes["rrf_rr"] = rerank(top_rrf)
        if DO_EMBED_RR:
            pipes["embed_rr"] = rerank(top_em)
    for name, order in pipes.items():
        depth = POOL if name.endswith("_rr") else TOPN
        ranks[f"{name}_{size}"] = first_rank(order, gold, depth)
    for name, top in (("bm25", top_bm), ("embed", top_em), ("rrf", top_rrf)):
        for depth in (10, 20, 50):
            pool_recall[f"{name}_{size}_{depth}"] = float((first_rank(top, gold, depth) <= depth).mean())
    if do_rr:
        # reranking a shallower pool is free from the cache: reorder the first `depth` candidates only
        for name, top in (("bm25", top_bm), ("rrf", top_rrf)) + ((("embed", top_em),) if DO_EMBED_RR else ()):
            for depth in (10, 20):
                out = np.zeros((len(sample), depth), dtype=np.int64)
                for qi in range(len(sample)):
                    cand = [int(c) for c in top[qi, :depth]]
                    sc = np.array([ce_cache[(qi, c)] for c in cand])
                    out[qi] = np.array(cand)[np.argsort(-sc, kind="stable")]
                ranks[f"{name}_rr{depth}_{size}"] = first_rank(out, gold, depth)

    meta[str(size)] = {
        "chunks": len(chunks), "mean_chunk_tokens": float(ntok.mean()),
        "span_gold_ceiling": float(np.mean([len(g) > 0 for g in gold])),
        **{f"mean_cum_tokens_{n}": [round(float(x), 1) for x in np.cumsum(ntok[o_], axis=1).mean(axis=0)[:50]] for n, o_ in pipes.items()},
    }
    k = int(size and round(2000 / size))
    for name in pipes:
        r = ranks[f"{name}_{size}"]
        log(f"[{size}] {name:9s} recall@{k} = {(r <= k).mean():.4f}   recall@1 = {(r <= 1).mean():.4f}")

    # ---------- latency: one query at a time, as a server would see it ----------
    if not do_rr:
        continue
    lat_idx = np.random.default_rng(SEED + size).choice(len(sample), size=LAT_QUERIES, replace=False)
    ce.predict([(qtexts[0], texts[int(top_bm[0, 0])])] * 4, batch_size=64, show_progress_bar=False)  # warm up
    embedder.encode([QUERY_PREFIX + qtexts[0]], normalize_embeddings=True)
    lat = {"ce50": [], "ce20": [], "embed_query": [], "bm25_query": [], "rrf": []}
    for qi in lat_idx:
        qi = int(qi)
        cand = [int(c) for c in top_rrf[qi, :POOL]]
        for depth, key in ((50, "ce50"), (20, "ce20")):
            t0 = time.perf_counter()
            ce.predict([(qtexts[qi], texts[c]) for c in cand[:depth]], batch_size=64, show_progress_bar=False)
            lat[key].append(time.perf_counter() - t0)
        t0 = time.perf_counter()
        embedder.encode([QUERY_PREFIX + qtexts[qi]], normalize_embeddings=True, show_progress_bar=False)
        lat["embed_query"].append(time.perf_counter() - t0)
        t0 = time.perf_counter()
        S = (bm25_query_matrix(vocab, [qtexts[qi]]) @ W.T).toarray()
        topn_rows(S, TOPN)
        lat["bm25_query"].append(time.perf_counter() - t0)
        t0 = time.perf_counter()
        rrf(top_bm[qi : qi + 1], top_em[qi : qi + 1])
        lat["rrf"].append(time.perf_counter() - t0)
    meta[str(size)]["latency_ms"] = {
        k_: {"median": float(np.median(v) * 1000), "p95": float(np.percentile(v, 95) * 1000), "mean": float(np.mean(v) * 1000)}
        for k_, v in lat.items()
    }
    meta[str(size)]["ce_tokens_per_pair"] = None
    log(f"[{size}] latency ms (median / p95): " + ", ".join(f"{k_} {np.median(v) * 1000:.1f}/{np.percentile(v, 95) * 1000:.1f}" for k_, v in lat.items()))

np.savez_compressed(out_dir / "ranks.npz", **ranks, doc=docs_of_sample, sample=sample)
meta["meta"] = {
    "articles": len(docs), "questions_total": len(questions), "sample": len(sample), "seed": SEED, "pool": POOL, "topn": TOPN,
    "rrf_k": RRF_K, "embed_model": EMBED_MODEL, "ce_model": CE_MODEL, "threads": THREADS, "pool_recall": pool_recall,
}
(out_dir / "stats.json").write_text(json.dumps(meta))
log("done")
