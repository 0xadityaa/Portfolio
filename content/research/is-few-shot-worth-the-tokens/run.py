"""Few-shot count x chat-template mismatch on AG News, Qwen2.5 on CPU.

usage: python run.py --model Qwen/Qwen2.5-0.5B-Instruct --out raw-0.5b.jsonl [--n 300] [--templates a,b] [--limit-sets N]

No text is generated. For every prompt the script reads the next-token logits at the answer position and picks the
label (World, Sports, Business, Technology) whose first token scores highest. It also records how much probability the
whole vocabulary puts on those four tokens ("label mass") and whether the single most likely token is one of them.

The shared part of each prompt (instruction plus shots) is run once per (template, shots, set) and its key/value cache
is reused for the 300 articles; check_cache() proves the cached run matches a full pass over the same tokens.
"""
import argparse, json, os, random, time
import numpy as np
import pandas as pd
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, DynamicCache

torch.set_num_threads(4)
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get("AG_DIR", HERE)
LABELS = ["World", "Sports", "Business", "Technology"]  # AG News label ids 0..3
INSTRUCTION = ("Classify the news article into one of these categories: World, Sports, Business, Technology. "
               "Answer with the category name only.")
SHOTS = [0, 1, 3, 8]
SEEDS = [1, 2, 3]
TEMPLATES = ["chat", "no_header", "llama", "raw"]
MAX_CHARS = 300  # articles are cut at a word boundary so every prompt stays near 500 tokens


def clip(text):
    text = " ".join(text.replace("\\", " ").split())
    if len(text) <= MAX_CHARS:
        return text
    return text[:MAX_CHARS].rsplit(" ", 1)[0]


def load_items(n):
    test = pd.read_parquet(os.path.join(DATA, "ag_test.parquet"))
    per = n // 4
    rows = []
    for lab in range(4):
        sub = test[test.label == lab].sample(per, random_state=0)
        rows += [(clip(t), lab) for t in sub.text]
    random.Random(0).shuffle(rows)
    return rows


def shot_sets():
    """Per seed, 8 examples (2 per class, short ones) in a random order. k shots = the first k, so sets are nested."""
    train = pd.read_parquet(os.path.join(DATA, "ag_train.parquet"))
    train = train[train.text.str.len() <= 220]
    out = {}
    for s in SEEDS:
        rng = random.Random(s)
        ex = []
        for lab in range(4):
            sub = train[train.label == lab].sample(2, random_state=s * 10 + lab)
            ex += [(clip(t), lab) for t in sub.text]
        rng.shuffle(ex)
        out[s] = ex
    return out


# --- templates. Each returns (prefix_text, suffix_text, lead) ------------------------------------------------------
# prefix = instruction + shots, identical for every article. suffix = the article and the answer cue.
# lead = the string put before a label word to get its first token (a leading space after a "Category:" cue).
def build(template, tok, shots, text):
    user = lambda t: f"Article: {t}"
    if template in ("chat", "no_header"):
        msgs = [{"role": "system", "content": INSTRUCTION}]
        for t, lab in shots:
            msgs += [{"role": "user", "content": user(t)}, {"role": "assistant", "content": LABELS[lab]}]
        pre = tok.apply_chat_template(msgs, tokenize=False)
        full = tok.apply_chat_template(msgs + [{"role": "user", "content": user(text)}], tokenize=False,
                                       add_generation_prompt=(template == "chat"))
        assert full.startswith(pre)
        return pre, full[len(pre):], ""
    if template == "llama":  # Llama-2 chat format, which is not Qwen's
        pre = f"<s>[INST] <<SYS>>\n{INSTRUCTION}\n<</SYS>>\n\n"
        first = True
        parts = []
        for t, lab in shots:
            parts.append(("" if first else "<s>[INST] ") + f"{user(t)} [/INST] {LABELS[lab]} </s>\n")
            first = False
        pre += "".join(parts)
        suf = ("" if first else "<s>[INST] ") + f"{user(text)} [/INST]"
        return pre, suf, " "
    if template == "raw":  # no chat template: plain few-shot text, answer after "Category:"
        pre = f"{INSTRUCTION}\n\n" + "".join(f"{user(t)}\nCategory: {LABELS[lab]}\n\n" for t, lab in shots)
        return pre, f"{user(text)}\nCategory:", " "
    raise ValueError(template)


def label_ids(tok, lead):
    ids = [tok(lead + w, add_special_tokens=False).input_ids[0] for w in LABELS]
    assert len(set(ids)) == 4
    return ids


@torch.no_grad()
def run_set(model, tok, template, shots, items, k, seed, f, tag):
    pre0, _, lead = build(template, tok, shots, "x")
    lids = label_ids(tok, lead)
    pre_ids = tok(pre0, add_special_tokens=False, return_tensors="pt").input_ids
    cache = DynamicCache()
    model(pre_ids, past_key_values=cache, use_cache=True)
    plen = pre_ids.shape[1]
    for i, (text, gold) in enumerate(items):
        pre, suf, _ = build(template, tok, shots, text)
        assert pre == pre0
        suf_ids = tok(suf, add_special_tokens=False, return_tensors="pt").input_ids
        # the split must not change tokenisation
        whole = tok(pre + suf, add_special_tokens=False).input_ids
        assert whole == pre_ids[0].tolist() + suf_ids[0].tolist(), "tokenisation changed at the prefix boundary"
        out = model(suf_ids, past_key_values=cache, use_cache=True)
        cache.crop(plen)
        logits = out.logits[0, -1].float()
        lp = torch.log_softmax(logits, -1)
        sub = logits[lids]
        pred = int(sub.argmax())
        rec = dict(model=tag, template=template, k=k, set=seed, i=i, gold=gold, pred=pred,
                   mass=float(lp[lids].exp().sum()), top1_is_label=int(logits.argmax()) in lids,
                   tokens=plen + suf_ids.shape[1], margin=float(sub.sort(descending=True).values[0] - sub.sort(descending=True).values[1]))
        f.write(json.dumps(rec) + "\n")
    f.flush()


@torch.no_grad()
def check_cache(model, tok, items, shots):
    """Cached run vs one full forward pass over the same tokens: largest logit difference over the 4 labels."""
    worst = 0.0
    for template in TEMPLATES:
        pre0, _, lead = build(template, tok, shots[:3], "x")
        lids = label_ids(tok, lead)
        pre_ids = tok(pre0, add_special_tokens=False, return_tensors="pt").input_ids
        cache = DynamicCache()
        model(pre_ids, past_key_values=cache, use_cache=True)
        for text, _ in items[:3]:
            pre, suf, _ = build(template, tok, shots[:3], text)
            suf_ids = tok(suf, add_special_tokens=False, return_tensors="pt").input_ids
            a = model(suf_ids, past_key_values=cache, use_cache=True).logits[0, -1][lids]
            cache.crop(pre_ids.shape[1])
            b = model(torch.cat([pre_ids, suf_ids], 1)).logits[0, -1][lids]
            worst = max(worst, float((a - b).abs().max()))
    return worst


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--n", type=int, default=300)
    ap.add_argument("--templates", default=",".join(TEMPLATES))
    ap.add_argument("--shots", default=",".join(map(str, SHOTS)))
    a = ap.parse_args()
    tok = AutoTokenizer.from_pretrained(a.model)
    model = AutoModelForCausalLM.from_pretrained(a.model, torch_dtype=torch.float32).eval()
    items, sets = load_items(a.n), shot_sets()
    print("cache check, max |logit diff| over labels:", round(check_cache(model, tok, items, sets[1]), 5), flush=True)
    done = set()
    if os.path.exists(a.out):
        for line in open(a.out):
            r = json.loads(line)
            done.add((r["template"], r["k"], r["set"]))
        # a set is only finished if all n items are present; drop partial sets so they are rerun
        cnt = {}
        for line in open(a.out):
            r = json.loads(line)
            key = (r["template"], r["k"], r["set"])
            cnt[key] = cnt.get(key, 0) + 1
        done = {k for k, v in cnt.items() if v == len(items)}
        keep = [l for l in open(a.out) if (lambda r: (r["template"], r["k"], r["set"]) in done)(json.loads(l))]
        open(a.out, "w").writelines(keep)
    tag = a.model.split("/")[-1]
    # Mismatched templates run at fewer shot counts to fit the time budget; --shots applies to the chat template.
    plan = {"chat": [int(x) for x in a.shots.split(",")], "raw": [0, 8], "llama": [0, 8], "no_header": [0]}
    with open(a.out, "a") as f:
        for template in a.templates.split(","):
            for k in plan[template]:
                for seed in ([SEEDS[0]] if k == 0 else SEEDS):
                    if (template, k, seed) in done:
                        continue
                    t0 = time.time()
                    run_set(model, tok, template, sets[seed][:k], items, k, seed, f, tag)
                    print(f"{tag} {template:9s} k={k} set={seed} {time.time()-t0:6.1f}s load={os.getloadavg()[0]:.1f}", flush=True)
