"""Position of the relevant paragraph vs answer accuracy, Qwen2.5-0.5B-Instruct on CPU.

Usage: python run.py DATA_DIR OUT_DIR [N_PER_ARTICLE] [SLOTS] [TIME_LIMIT_SECONDS]

For each chosen SQuAD v1.1 dev question the context is 7 paragraphs from one article:
the gold paragraph plus 6 distractors. Distractors and their order are fixed per
question; only the slot of the gold paragraph changes (SLOTS are 0-based, default
0,1,3,5,6 = slots 1, 2, 4, 6, 7 of 7). Also runs "gold_only" (just the gold paragraph)
and, on every third question, "no_gold" (7 distractors, a floor). Greedy decoding, up to 16 new tokens.
Writes one JSON line per (question, condition) to OUT_DIR/records.jsonl; resumable.
"""
import copy
import json
import random
import re
import string
import sys
import time
from collections import Counter
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

torch.set_num_threads(4)
SEED = 20261127
MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
N_PARAS = 7  # gold + 6 distractors
TOK_MIN, TOK_MAX = 1000, 1500
MAX_NEW = 16

data_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
per_article = int(sys.argv[3]) if len(sys.argv) > 3 else 3
slots = [int(s) for s in (sys.argv[4] if len(sys.argv) > 4 else "0,1,3,5,6").split(",")]
out_dir.mkdir(parents=True, exist_ok=True)

PUNCT = set(string.punctuation)


def norm(s):
    s = s.lower()
    s = "".join(c for c in s if c not in PUNCT)
    s = re.sub(r"\b(a|an|the)\b", " ", s)
    return " ".join(s.split())


def f1(pred, gold):
    p, g = norm(pred).split(), norm(gold).split()
    n = sum((Counter(p) & Counter(g)).values())
    if n == 0:
        return 0.0
    pr, rc = n / len(p), n / len(g)
    return 2 * pr * rc / (pr + rc)


tok = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForCausalLM.from_pretrained(MODEL, torch_dtype=torch.float32).eval()
END_IDS = {tok.eos_token_id, tok.convert_tokens_to_ids("<|im_end|>")}


def ntok(t):
    return len(tok(t, add_special_tokens=False).input_ids)


# ---------- choose questions and contexts ----------
squad = json.loads((data_dir / "dev-v1.1.json").read_text())["data"]
rng = random.Random(SEED)
items = []
for ai, art in enumerate(squad):
    paras = [p["context"] for p in art["paragraphs"]]
    ptoks = [ntok(p) for p in paras]
    cands = [(pi, q) for pi, p in enumerate(art["paragraphs"]) for q in p["qas"]]
    rng.shuffle(cands)
    used, got = set(), 0
    for pi, q in cands:
        if got >= per_article:
            break
        if pi in used:
            continue
        golds = sorted({a["text"] for a in q["answers"]})
        ng = [norm(g) for g in golds if norm(g)]
        # distractors: other paragraphs that contain none of the gold answer strings
        pool = [j for j in range(len(paras)) if j != pi and not any(g in norm(paras[j]) for g in ng)]
        if len(pool) < N_PARAS:
            continue
        for _ in range(200):
            d = rng.sample(pool, N_PARAS)  # 7th is only used by no_gold
            if TOK_MIN <= ptoks[pi] + sum(ptoks[j] for j in d[:6]) <= TOK_MAX:
                break
        else:
            continue
        used.add(pi)
        got += 1
        items.append({"id": q["id"], "article": ai, "title": art["title"], "question": q["question"],
                      "golds": golds, "gold_para": paras[pi], "distractors": [paras[j] for j in d]})
# interleave articles (1st question of every article, then the 2nd, ...) so a run cut short by
# the time limit still holds complete paired blocks spread over all articles
rank_in_article = Counter()
for it in items:
    it["rank"] = rank_in_article[it["article"]]
    rank_in_article[it["article"]] += 1
items.sort(key=lambda it: (it["rank"], it["article"]))
print(f"{len(items)} questions from {len(set(i['article'] for i in items))} articles", flush=True)


def build(item, cond):
    ds = item["distractors"]
    if cond == "gold_only":
        ps = [item["gold_para"]]
    elif cond == "no_gold":
        ps = ds[:7]
    else:
        ps = ds[:6][:cond] + [item["gold_para"]] + ds[:6][cond:]
    ctx = "\n\n".join(f"[{i + 1}] {p}" for i, p in enumerate(ps))
    user = ("Answer the question using the passages below. Reply with only the answer, "
            "as a short phrase copied from the passages.\n\n" + ctx + "\n\nQuestion: " + item["question"])
    return tok.apply_chat_template([{"role": "user", "content": user}], tokenize=False, add_generation_prompt=True)


@torch.no_grad()
def run(prompt, gold):
    ids = tok(prompt, return_tensors="pt").input_ids
    out = model(ids, use_cache=True)
    past, logits = out.past_key_values, out.logits[:, -1]
    # teacher-forced log-prob of the first gold answer, from a copy of the cache
    gids = tok(gold, add_special_tokens=False, return_tensors="pt").input_ids
    lp = torch.log_softmax(logits, -1)[0, gids[0, 0]].item()
    if gids.shape[1] > 1:
        o2 = model(gids[:, :-1], past_key_values=copy.deepcopy(past), use_cache=True)
        l2 = torch.log_softmax(o2.logits[0], -1)
        lp += sum(l2[i, gids[0, i + 1]].item() for i in range(gids.shape[1] - 1))
    gen, nxt = [], logits.argmax(-1, keepdim=True)
    for _ in range(MAX_NEW):
        t = nxt.item()
        if t in END_IDS:
            break
        gen.append(t)
        o = model(nxt, past_key_values=past, use_cache=True)
        past = o.past_key_values
        nxt = o.logits[:, -1].argmax(-1, keepdim=True)
    return tok.decode(gen, skip_special_tokens=True).strip(), lp, ids.shape[1]


rec_path = out_dir / "records.jsonl"
done = set()
if rec_path.exists():
    for line in rec_path.read_text().splitlines():
        r = json.loads(line)
        done.add((r["id"], r["cond"]))
t0 = time.time()
LIMIT = float(sys.argv[5]) if len(sys.argv) > 5 else 1e9  # seconds; stop between questions
with rec_path.open("a") as fh:
    for n, item in enumerate(items):
        if time.time() - t0 > LIMIT:
            print("time limit reached", flush=True)
            break
        # no_gold (a floor) on every third question only, to save time
        conds = ["gold_only"] + slots + (["no_gold"] if n % 3 == 0 else [])
        for c in conds:
            if (item["id"], str(c)) in done:
                continue
            ans, lp, plen = run(build(item, c), item["golds"][0])
            na = norm(ans)
            rec = {"id": item["id"], "article": item["article"], "cond": str(c), "answer": ans,
                   "prompt_tokens": plen,
                   "contains": int(any(norm(g) and norm(g) in na for g in item["golds"])),
                   "em": int(any(norm(g) == na for g in item["golds"])),
                   "f1": max(f1(ans, g) for g in item["golds"]), "gold_logprob": lp}
            fh.write(json.dumps(rec) + "\n")
            fh.flush()
        print(f"q {n + 1}/{len(items)}  elapsed {time.time() - t0:.0f}s", flush=True)
(out_dir / "questions.json").write_text(json.dumps(
    [{k: v for k, v in i.items() if k not in ("gold_para", "distractors")} for i in items], indent=1))
