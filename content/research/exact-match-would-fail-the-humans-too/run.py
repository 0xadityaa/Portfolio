"""Score SQuAD v1.1 dev human answers against each other, plus an adversarial set.

usage: python run.py DEV_JSON ADVERSARIAL_JSONL CACHE_DIR RESULTS_DIR

Writes RESULTS_DIR/scores.npz (per-item scores), RESULTS_DIR/handcheck_sample.json
(50 random exact-match failures to read by hand) and RESULTS_DIR/run.log-style
output on stdout.
"""
import json
import os
import random
import re
import string
import sys
import time
from collections import Counter

import numpy as np
import torch

torch.set_num_threads(4)

MODEL = "BAAI/bge-small-en-v1.5"
REVISION = "5c38ec7c405ec4b44b94cc5a9bb96e735b38267a"
SEED = 20261115


# --- SQuAD v1.1 official normalisation and metrics (evaluate-v1.1.py), reimplemented ---
def normalize_answer(s):
    def remove_articles(text):
        return re.sub(r"\b(a|an|the)\b", " ", text)

    def white_space_fix(text):
        return " ".join(text.split())

    def remove_punc(text):
        exclude = set(string.punctuation)
        return "".join(ch for ch in text if ch not in exclude)

    return white_space_fix(remove_articles(remove_punc(s.lower())))


def f1_score(prediction, ground_truth):
    p = normalize_answer(prediction).split()
    g = normalize_answer(ground_truth).split()
    same = sum((Counter(p) & Counter(g)).values())
    if same == 0:
        return 0.0
    precision, recall = same / len(p), same / len(g)
    return 2 * precision * recall / (precision + recall)


def exact_match(prediction, ground_truth):
    return float(normalize_answer(prediction) == normalize_answer(ground_truth))


def main(dev_path, adv_path, cache_dir, out_dir):
    os.makedirs(cache_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    rng = random.Random(SEED)
    data = json.load(open(dev_path))["data"]

    qas = []  # (article_idx, qid, question, [answers])
    for ai, art in enumerate(data):
        for para in art["paragraphs"]:
            for qa in para["qas"]:
                qas.append((ai, qa["id"], qa["question"], [a["text"] for a in qa["answers"]]))
    print(f"questions: {len(qas)}, articles: {len(data)}")

    adv = [json.loads(l) for l in open(adv_path) if l.strip()]
    print(f"adversarial items: {len(adv)}")

    # --- build item lists: (pred, [refs]) ---
    loo = []  # leave-one-out: each human answer as prediction, others as references
    pairs = []  # every ordered pair of distinct human answer slots, one reference only
    paper = []  # SQuAD paper protocol: second answer as prediction, rest as references
    for qi, (ai, qid, q, ans) in enumerate(qas):
        if len(ans) < 2:
            continue
        for i in range(len(ans)):
            refs = ans[:i] + ans[i + 1:]
            loo.append((qi, ai, i, ans[i], refs))
            for r in refs:
                pairs.append((qi, ai, i, ans[i], [r]))
        if len(ans) >= 3:
            paper.append((qi, ai, 1, ans[1], ans[:1] + ans[2:]))

    # random-other-question control: first answer of a random question from another article
    by_article = {}
    for qi, (ai, *_r) in enumerate(qas):
        by_article.setdefault(ai, []).append(qi)
    control = []
    for qi, (ai, qid, q, ans) in enumerate(qas):
        while True:
            qj = rng.randrange(len(qas))
            if qas[qj][0] != ai:
                break
        control.append((qi, ai, 0, qas[qj][3][0], ans))
    adv_items = [(k, 0, 0, a["wrong"], [a["reference"]]) for k, a in enumerate(adv)]

    sets = {"loo": loo, "pairs": pairs, "paper": paper, "control": control, "adv": adv_items}
    for k, v in sets.items():
        print(f"{k}: {len(v)} items")

    # --- embeddings, once per unique string ---
    texts = set()
    for items in sets.values():
        for _qi, _ai, _i, pred, refs in items:
            texts.add(pred)
            texts.update(refs)
    texts = sorted(texts)
    print(f"unique strings to embed: {len(texts)}")
    cache_path = os.path.join(cache_dir, "emb.npz")
    emb = None
    if os.path.exists(cache_path):
        z = np.load(cache_path, allow_pickle=True)
        if list(z["texts"]) == texts:
            emb = z["emb"]
            print("loaded cached embeddings")
    if emb is None:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer(MODEL, revision=REVISION, device="cpu")
        t0 = time.time()
        emb = model.encode(texts, batch_size=128, normalize_embeddings=True,
                           show_progress_bar=False, convert_to_numpy=True)
        print(f"embedded in {time.time() - t0:.0f}s, shape {emb.shape}")
        np.savez(cache_path, texts=np.array(texts, dtype=object), emb=emb)
    index = {t: i for i, t in enumerate(texts)}

    def score(items):
        em, f1, cos = [], [], []
        for _qi, _ai, _i, pred, refs in items:
            em.append(max(exact_match(pred, r) for r in refs))
            f1.append(max(f1_score(pred, r) for r in refs))
            pv = emb[index[pred]]
            cos.append(max(float(pv @ emb[index[r]]) for r in refs))
        return np.array(em), np.array(f1), np.array(cos)

    out = {}
    for name, items in sets.items():
        em, f1, cos = score(items)
        out[f"{name}_em"], out[f"{name}_f1"], out[f"{name}_cos"] = em, f1, cos
        out[f"{name}_qi"] = np.array([it[0] for it in items])
        out[f"{name}_article"] = np.array([it[1] for it in items])
        print(f"[{name}] n={len(items)} mean EM {100*em.mean():.1f}  mean F1 {100*f1.mean():.1f}  mean cos {cos.mean():.3f}")
    np.savez_compressed(os.path.join(out_dir, "scores.npz"), **out)

    # --- 50 random exact-match failures (distinct questions) for reading by hand ---
    fail = [k for k, e in enumerate(out["loo_em"]) if e == 0]
    rng2 = random.Random(SEED)
    seen, sample = set(), []
    for k in rng2.sample(fail, len(fail)):
        qi = loo[k][0]
        if qi in seen:
            continue
        seen.add(qi)
        _qi, ai, i, pred, refs = loo[k]
        sample.append({
            "n": len(sample) + 1,
            "article": data[ai]["title"],
            "question": qas[qi][2],
            "prediction": pred,
            "references": refs,
            "f1": round(float(out["loo_f1"][k]), 3),
            "cos": round(float(out["loo_cos"][k]), 3),
        })
        if len(sample) == 50:
            break
    json.dump(sample, open(os.path.join(out_dir, "handcheck_sample.json"), "w"), indent=1, ensure_ascii=False)
    print(f"EM failures (leave-one-out items): {len(fail)} of {len(loo)}; wrote 50-item hand-check sample")


if __name__ == "__main__":
    main(*sys.argv[1:5])
