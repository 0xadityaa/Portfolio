"""Chunk-size sweep: BM25 and bge-small over SQuAD v1.1 dev.

Usage: python run.py DATA_DIR CACHE_DIR OUT_DIR

DATA_DIR  holds dev-v1.1.json
CACHE_DIR gets chunk embeddings (not committed)
OUT_DIR   gets ranks.npz, stats.json (committed) and run.log lines on stdout

For every (chunk size, overlap) it chunks each article by o200k_base tokens,
retrieves over the whole corpus with each retriever, and records, per question,
the rank of the first chunk that is a hit (1..100, 101 = not in the top 100).
Two definitions of a hit:
  span   a chunk whose character range fully contains a gold answer span
  string a chunk whose text contains a gold answer string anywhere
"""
import json
import re
import sys
import time
from pathlib import Path

import numpy as np
import scipy.sparse as sp
import tiktoken

SEED = 20261114
SIZES = [64, 128, 256, 512, 1024]
OVERLAPS = [0.0, 0.15]
TOPN = 100
EMBED_MODEL = "BAAI/bge-small-en-v1.5"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
K1, B = 1.2, 0.75

data_dir, cache_dir, out_dir = (Path(a) for a in sys.argv[1:4])
cache_dir.mkdir(parents=True, exist_ok=True)
out_dir.mkdir(parents=True, exist_ok=True)
enc = tiktoken.get_encoding("o200k_base")


def log(*a):
    print(*a, flush=True)


# ---------- dataset ----------
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
            spans, strings = set(), set()
            for a in qa["answers"]:
                s = off + a["answer_start"]
                assert text[s : s + len(a["text"])] == a["text"]
                spans.add((s, s + len(a["text"])))
                strings.add(a["text"])
            questions.append({"doc": d, "q": qa["question"], "spans": sorted(spans), "strings": sorted(strings)})
log(f"articles={len(docs)} questions={len(questions)}")

# ---------- tokenise once ----------
doc_tok = []
for d in docs:
    toks = enc.encode(d["text"])
    text, offs = enc.decode_with_offsets(toks)
    assert text == d["text"], "o200k round trip changed the text"
    doc_tok.append((toks, offs))
log("doc tokens:", sum(len(t) for t, _ in doc_tok), "mean per doc:", round(np.mean([len(t) for t, _ in doc_tok])))


def chunk_corpus(size, overlap):
    ov = int(round(size * overlap))
    stride = size - ov
    chunks = []  # (doc, char_start, char_end, n_tokens)
    for di, (toks, offs) in enumerate(doc_tok):
        n = len(toks)
        for a in range(0, n, stride):
            b = min(a + size, n)
            cs = offs[a]
            ce = offs[b] if b < n else len(docs[di]["text"])
            chunks.append((di, cs, ce, b - a))
            if b >= n:
                break
    return chunks


# ---------- gold ----------
_occ = {}


def occurrences(string):
    """All (doc, start) where the answer string occurs in any article (cached across configs)."""
    if string not in _occ:
        found = []
        for di, d in enumerate(docs):
            p = d["text"].find(string)
            while p != -1:
                found.append((di, p))
                p = d["text"].find(string, p + 1)
        _occ[string] = found
    return _occ[string]


def gold_sets(chunks, texts):
    by_doc = {}
    for ci, (di, cs, ce, _) in enumerate(chunks):
        by_doc.setdefault(di, []).append((ci, cs, ce))
    arr = {di: (np.array([x[0] for x in v]), np.array([x[1] for x in v]), np.array([x[2] for x in v])) for di, v in by_doc.items()}
    span_gold, string_gold = [], []
    for q in questions:
        g = [ci for ci, cs, ce in by_doc[q["doc"]] if any(cs <= s and e <= ce for s, e in q["spans"])]
        span_gold.append(np.array(g, dtype=np.int64))
        sg = set()
        for string in q["strings"]:
            L = len(string)
            for di, p in occurrences(string):
                ids, cs, ce = arr[di]
                j = int(np.searchsorted(cs, p, side="right")) - 1
                while j >= 0 and ce[j] > p:
                    if ce[j] >= p + L:
                        sg.add(int(ids[j]))
                    j -= 1
        string_gold.append(np.array(sorted(sg), dtype=np.int64))
    return span_gold, string_gold


def first_rank(topk, gold_lists):
    """topk: (Q, TOPN) chunk ids. Returns uint8 rank (1..TOPN, TOPN+1 = miss)."""
    out = np.full(len(gold_lists), TOPN + 1, dtype=np.uint8)
    for i, g in enumerate(gold_lists):
        if len(g) == 0:
            continue
        hit = np.isin(topk[i], g)
        if hit.any():
            out[i] = int(np.argmax(hit)) + 1
    return out


# ---------- BM25 (Lucene-style idf, k1=1.2, b=0.75, lowercase \w tokens, no stemming) ----------
WORD = re.compile(r"[a-z0-9]+")


def bm25_scores_builder(texts):
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
    w = sp.csr_matrix((tf.data * (K1 + 1) / denom * idf[tf.col], (tf.row, tf.col)), shape=tf.shape)

    def score(query_texts):
        qr, qc = [], []
        for i, q in enumerate(query_texts):
            for w_ in set(WORD.findall(q.lower())):
                j = vocab.get(w_)
                if j is not None:
                    qr.append(i)
                    qc.append(j)
        Q = sp.csr_matrix((np.ones(len(qr), dtype=np.float32), (qr, qc)), shape=(len(query_texts), len(vocab)))
        return Q, w

    return score


def topk_from_sparse(Q, W, block=500):
    out = np.zeros((Q.shape[0], TOPN), dtype=np.int64)
    for s in range(0, Q.shape[0], block):
        S = (Q[s : s + block] @ W.T).toarray()
        idx = np.argpartition(-S, TOPN, axis=1)[:, :TOPN]
        part = np.take_along_axis(S, idx, axis=1)
        order = np.argsort(-part, axis=1, kind="stable")
        out[s : s + block] = np.take_along_axis(idx, order, axis=1)
    return out


def topk_from_dense(Qe, De, block=500):
    out = np.zeros((Qe.shape[0], TOPN), dtype=np.int64)
    for s in range(0, Qe.shape[0], block):
        S = Qe[s : s + block] @ De.T
        idx = np.argpartition(-S, TOPN, axis=1)[:, :TOPN]
        part = np.take_along_axis(S, idx, axis=1)
        order = np.argsort(-part, axis=1, kind="stable")
        out[s : s + block] = np.take_along_axis(idx, order, axis=1)
    return out


# ---------- embeddings ----------
import torch  # noqa: E402
from sentence_transformers import SentenceTransformer  # noqa: E402

torch.manual_seed(SEED)
model = SentenceTransformer(EMBED_MODEL, device="cpu")
model.max_seq_length = 512
tok = model.tokenizer
log("embedding model:", EMBED_MODEL, "max_seq_length", model.max_seq_length, "device cpu torch threads", torch.get_num_threads())

qfile = cache_dir / "queries.npy"
if qfile.exists():
    Qe = np.load(qfile)
else:
    t0 = time.time()
    Qe = model.encode([QUERY_PREFIX + q["q"] for q in questions], batch_size=128, normalize_embeddings=True, show_progress_bar=False)
    np.save(qfile, Qe)
    log(f"embedded queries in {time.time() - t0:.0f}s")

ranks, stats = {}, {}
qtexts = [q["q"] for q in questions]
for size in SIZES:
    for ov in OVERLAPS:
        name = f"{size}_{int(ov * 100)}"
        chunks = chunk_corpus(size, ov)
        texts = [docs[di]["text"][cs:ce] for di, cs, ce, _ in chunks]
        ntok = np.array([c[3] for c in chunks])
        span_gold, string_gold = gold_sets(chunks, texts)
        has_span = np.array([len(g) > 0 for g in span_gold])
        has_str = np.array([len(g) > 0 for g in string_gold])
        log(f"[{name}] chunks={len(chunks)} mean_tokens={ntok.mean():.1f} questions with a span-gold chunk={has_span.mean():.4f} string-gold={has_str.mean():.4f}")

        # truncation by the embedding model
        lens = np.array([len(x) for x in tok(texts, add_special_tokens=True, truncation=False)["input_ids"]])
        trunc = float((lens > 512).mean())
        log(f"[{name}] embedder tokens per chunk: mean {lens.mean():.0f}, share over 512: {trunc:.3f}")

        # BM25
        t0 = time.time()
        build = bm25_scores_builder(texts)
        Qs, W = build(qtexts)
        top_bm = topk_from_sparse(Qs, W)
        t_bm = time.time() - t0

        # embeddings
        efile = cache_dir / f"emb_{name}.npy"
        t0 = time.time()
        if efile.exists():
            De = np.load(efile)
            t_emb = None
        else:
            De = model.encode(texts, batch_size=32, normalize_embeddings=True, show_progress_bar=False)
            np.save(efile, De)
            t_emb = time.time() - t0
        top_em = topk_from_dense(Qe, De)

        for rname, top in (("bm25", top_bm), ("embed", top_em)):
            cum = np.cumsum(ntok[top], axis=1).mean(axis=0)  # mean tokens handed over for top-k, k=1..TOPN
            ranks[f"{rname}_{name}_span"] = first_rank(top, span_gold)
            ranks[f"{rname}_{name}_string"] = first_rank(top, string_gold)
            stats[f"{rname}_{name}"] = {"mean_cum_tokens": [round(float(x), 1) for x in cum]}
        stats[f"cfg_{name}"] = {
            "size": size, "overlap": ov, "chunks": len(chunks), "mean_chunk_tokens": float(ntok.mean()),
            "span_gold_coverage": float(has_span.mean()), "string_gold_coverage": float(has_str.mean()),
            "embedder_mean_tokens": float(lens.mean()), "embedder_share_truncated": trunc,
            "seconds_bm25": round(t_bm, 1), "seconds_embed": None if t_emb is None else round(t_emb, 1),
        }
        log(f"[{name}] bm25 {t_bm:.0f}s embed {t_emb if t_emb is None else round(t_emb)}s")
        for rname in ("bm25", "embed"):
            r = ranks[f"{rname}_{name}_span"]
            log(f"[{name}] {rname} span recall@1/5/10: " + "/".join(f"{(r <= k).mean():.3f}" for k in (1, 5, 10)))

np.savez_compressed(out_dir / "ranks.npz", **ranks, doc=np.array([q["doc"] for q in questions], dtype=np.int16))
stats["meta"] = {"articles": len(docs), "questions": len(questions), "embed_model": EMBED_MODEL, "k1": K1, "b": B, "seed": SEED, "topn": TOPN}
(out_dir / "stats.json").write_text(json.dumps(stats))
log("done")
