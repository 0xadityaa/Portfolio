"""Fusion and reranking on SQuAD v1.1 dev, at an equal token budget.

Usage: python run.py DATA_DIR CACHE_DIR OUT_DIR [N_QUESTIONS] [MINUTES]

Reuses the chunking, gold definition, BM25 and bge-small setup from the chunk-size post
(content/research/chunk-size-is-a-hyperparameter-you-never-tuned/run.py), copied here.

First stages (all sampled questions, sizes 128 and 256, no overlap): BM25, bge-small, RRF (k = 60).
At 256 tokens a cross-encoder (ms-marco-MiniLM-L-6-v2) then reorders the top POOL chunks of BM25, of RRF
and of bge-small. Every (question, chunk) score is cached on disk, so a pool of 10 or 20 is read out of
the pool-20 scores for free, and the run can be stopped and resumed.

Order of work (questions are processed in a seeded random order, so any prefix is a random sample):
  1. pool-20 scores for the first 300 questions, 2. pool-50 scores for those same 300,
  3. pool-20 scores for further 100-question batches until N_QUESTIONS or the MINUTES budget runs out.
Ranks are saved for the questions that were completed. Latency is measured by latency.py.
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
POOL = 50           # deepest pool handed to the cross-encoder (first SUB questions only)
POOL_MAIN = 20      # pool used for every question
SUB = 300           # questions that also get bge-small candidates scored (pool 20)
SUB50 = 150         # size of the pool-50 subsample (BM25 and RRF candidates only)
BATCH = 100
RRF_K = 60
EMBED_MODEL = "BAAI/bge-small-en-v1.5"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
CE_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
K1, B = 1.2, 0.75
THREADS = 4
RERANK_SIZE = 256   # the cross-encoder only runs at this size (time budget on a shared CPU)

data_dir, cache_dir, out_dir = (Path(a) for a in sys.argv[1:4])
N_SAMPLE = int(sys.argv[4]) if len(sys.argv) > 4 else 2000
MINUTES = float(sys.argv[5]) if len(sys.argv) > 5 else 45.0
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
sample = rng.permutation(len(questions))[: min(N_SAMPLE, len(questions))]   # not sorted: any prefix is a random sample
log(f"sample of {len(sample)} questions, seed {SEED}, time budget {MINUTES} min")

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

qfile = cache_dir / f"queries_{len(sample)}_{SEED}.npy"
qtexts = [questions[i]["q"] for i in sample]
if qfile.exists():
    Qe = np.load(qfile)
else:
    Qe = embedder.encode([QUERY_PREFIX + q for q in qtexts], batch_size=128, normalize_embeddings=True, show_progress_bar=False)
    np.save(qfile, Qe)
docs_of_sample = np.array([questions[i]["doc"] for i in sample], dtype=np.int16)

T_START = time.time()
DEADLINE = T_START + MINUTES * 60
ranks, pool_recall, meta = {}, {}, {}
n_done = 0
pairs_scored = 0
ce_time = 0.0
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
    firsts = {"bm25": top_bm, "embed": top_em, "rrf": top_rrf}
    for name, top in firsts.items():
        ranks[f"{name}_{size}"] = first_rank(top, gold, TOPN)
        for depth in (10, 20, 50):
            pool_recall[f"{name}_{size}_{depth}"] = float((first_rank(top, gold, depth) <= depth).mean())
    meta[str(size)] = {
        "chunks": len(chunks), "mean_chunk_tokens": float(ntok.mean()),
        "span_gold_ceiling": float(np.mean([len(g) > 0 for g in gold])),
        **{f"mean_cum_tokens_{n}": [round(float(x), 1) for x in np.cumsum(ntok[o_], axis=1).mean(axis=0)[:50]] for n, o_ in firsts.items()},
    }
    k = int(round(2000 / size))
    for name in firsts:
        r = ranks[f"{name}_{size}"]
        log(f"[{size}] first stage {name:6s} recall@{k} = {(r <= k).mean():.4f}   recall@1 = {(r <= 1).mean():.4f}   (all {len(sample)} questions)")

    if size != RERANK_SIZE:
        continue

    # ---------- cross-encoder scores, cached on disk per (question position in sample, chunk id) ----------
    cfile = cache_dir / f"ce_{size}_{len(sample)}_{SEED}.npz"
    ce_cache = {}
    if cfile.exists():
        z = np.load(cfile)
        ce_cache = {(int(a), int(b)): float(c) for a, b, c in zip(z["q"], z["c"], z["s"])}
        log(f"loaded {len(ce_cache)} cached pair scores")

    def save_cache():
        ks = list(ce_cache)
        np.savez(cfile, q=np.array([a for a, _ in ks], dtype=np.int32), c=np.array([b for _, b in ks], dtype=np.int32),
                 s=np.array([ce_cache[k_] for k_ in ks], dtype=np.float32))

    def tops_for(qi, depth):
        # BM25 and RRF candidates for every question; bge-small candidates (pool 20 only) for the first SUB questions
        return (top_bm, top_rrf, top_em) if (qi < SUB and depth <= POOL_MAIN) else (top_bm, top_rrf)

    def score(q_lo, q_hi, depth):
        """Score the top `depth` chunks of every first stage for questions q_lo..q_hi-1. Returns False if out of time."""
        global pairs_scored, ce_time
        need = sorted({(qi, int(c)) for qi in range(q_lo, q_hi) for top in tops_for(qi, depth) for c in top[qi, :depth]
                       if (qi, int(c)) not in ce_cache})
        t0 = time.time()
        step = 512
        for s in range(0, len(need), step):
            if time.time() > DEADLINE:
                save_cache()
                return False
            part = need[s : s + step]
            sc = ce.predict([(qtexts[qi], texts[c]) for qi, c in part], batch_size=64, show_progress_bar=False)
            for key, v in zip(part, sc):
                ce_cache[key] = float(v)
            pairs_scored += len(part)
        dt = time.time() - t0
        ce_time += dt
        save_cache()
        log(f"[{size}] questions {q_lo}-{q_hi - 1}, depth {depth}: scored {len(need)} new pairs in {dt:.0f}s ({len(need) / max(dt, 1e-9):.1f} pairs/s), "
            f"cache {len(ce_cache)}, elapsed {(time.time() - T_START) / 60:.1f} min")
        return True

    def have_all(q_lo, q_hi, depth):
        return all((qi, int(c)) in ce_cache for qi in range(q_lo, q_hi) for top in tops_for(qi, depth) for c in top[qi, :depth])

    nq = len(sample)
    ok = score(0, min(SUB, nq), POOL_MAIN) and score(0, min(SUB50, nq), POOL)
    q = min(SUB, nq)
    while ok and q < nq:
        ok = score(q, min(q + BATCH, nq), POOL_MAIN)
        if ok:
            q = min(q + BATCH, nq)
    # questions fully scored at pool 20, in order
    n_done = 0
    while n_done < nq and have_all(n_done, n_done + 1, POOL_MAIN):
        n_done += 1
    sub_done = min(SUB50, n_done) if have_all(0, min(SUB50, nq), POOL) else 0
    emb_done = min(SUB, n_done)
    log(f"complete: {n_done} questions at pool {POOL_MAIN}, {sub_done} at pool {POOL}, {emb_done} with the bge-small arm; stopped on time budget: {not ok}")

    def rerank(top, qi, depth):
        cand = [int(c) for c in top[qi, :depth]]
        sc = np.array([ce_cache[(qi, c)] for c in cand])
        return np.array(cand)[np.argsort(-sc, kind="stable")]

    for name, top in firsts.items():
        for depth in (10, POOL_MAIN, POOL):
            n_ = sub_done if depth == POOL else (emb_done if name == "embed" else n_done)
            if name == "embed" and depth == POOL:
                n_ = 0
            n_ = min(n_, n_done)
            out = np.zeros((nq, depth), dtype=np.int64)
            for qi in range(n_):
                out[qi] = rerank(top, qi, depth)
            r = first_rank(out, gold, depth)
            r[n_:] = -1
            ranks[f"{name}_rr{depth}_{size}"] = r
        m_ = emb_done if name == "embed" else n_done
        d = ranks[f"{name}_rr{POOL_MAIN}_{size}"][:m_]
        log(f"[{size}] {name}+rerank pool {POOL_MAIN}: recall@{k} = {(d <= k).mean():.4f} on {m_} questions "
            f"(first stage on the same questions: {(ranks[f'{name}_{size}'][:m_] <= k).mean():.4f})")

np.savez_compressed(out_dir / "ranks.npz", **ranks, doc=docs_of_sample, sample=sample, n_done=n_done, sub_done=sub_done, emb_done=emb_done)
meta["meta"] = {
    "articles": len(docs), "questions_total": len(questions), "sample": len(sample), "n_done": n_done, "sub_done": sub_done, "emb_done": emb_done, "sub50": SUB50, "seed": SEED,
    "pool": POOL, "pool_main": POOL_MAIN, "topn": TOPN, "rrf_k": RRF_K, "embed_model": EMBED_MODEL, "ce_model": CE_MODEL, "threads": THREADS,
    "pool_recall": pool_recall, "pairs_scored_this_run": pairs_scored, "minutes": (time.time() - T_START) / 60,
}
(out_dir / "stats.json").write_text(json.dumps(meta))
log("done")
