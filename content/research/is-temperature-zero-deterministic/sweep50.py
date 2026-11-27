"""Part 4: 50 short-answer questions x settings, N samples each. Greedy is one run per question
(its repeatability is checked in determinism.py). Writes results-sweep50.json."""
import json, os, re, time, random, unicodedata
import numpy as np, torch
from common import load, chat, gen_kwargs
from questions import Q

N = 30
NEW = 8
SETTINGS = [("greedy", None, 1.0), ("T=0.2", 0.2, 1.0), ("T=0.7", 0.7, 1.0), ("T=1.0", 1.0, 1.0),
            ("T=1.5", 1.5, 1.0)]


def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()  # Brasília -> brasilia
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", s.lower())).strip()


def hit(ans, golds):
    a = f" {norm(ans)} "
    return any(f" {norm(g)} " in a for g in golds)


tok, model = load(torch.float32)
t0 = time.time()
# REDO="2,20,21,44" (0-based question indices): rerun just those with NEW_REDO tokens, same seeds,
# keeping every other question from results-sweep50.json. Used once, after the first pass showed an
# accent bug in the grader (Brasilia) and three greedy answers cut off at 8 tokens.
REDO = {int(i) for i in os.environ.get("REDO", "").split(",") if i}
NEW_REDO = int(os.environ.get("NEW_REDO", "24"))
if REDO:
    res = json.load(open("results-sweep50.json"))
    for i in REDO:
        res.pop(Q[i][0], None)
else:
    res = json.load(open("results-sweep50.partial.json")) if os.path.exists("results-sweep50.partial.json") else {}
for qi, (prompt, golds) in enumerate(Q):
    if prompt in res:
        continue
    ids = tok(chat(tok, prompt), return_tensors="pt")
    res[prompt] = {}
    for si, (name, T, top_p) in enumerate(SETTINGS):
        torch.manual_seed(5000 + 10 * qi + si)
        if T is None:
            kw = gen_kwargs(NEW_REDO if qi in REDO else NEW, do_sample=False, temperature=None, top_p=None, top_k=None)
            with torch.no_grad():
                g = model.generate(**ids, **kw, pad_token_id=tok.eos_token_id)
            texts = [tok.decode(g[0, ids.input_ids.shape[1]:], skip_special_tokens=True)]
        else:
            kw = gen_kwargs(NEW_REDO if qi in REDO else NEW, do_sample=True, temperature=T, top_p=top_p, num_return_sequences=N)
            with torch.no_grad():
                g = model.generate(**ids, **kw, pad_token_id=tok.eos_token_id)
            texts = [tok.decode(r[ids.input_ids.shape[1]:], skip_special_tokens=True) for r in g]
        k = sum(hit(t, golds) for t in texts)
        res[prompt][name] = {"n": len(texts), "correct": k, "acc": k / len(texts),
                             "distinct": len({norm(t) for t in texts}), "sample": texts[0]}
    r = res[prompt]
    print(f"{qi+1:2d}/50 {prompt[:48]:48s} greedy {r['greedy']['sample'].strip()[:14]!r:16s} "
          f"greedy={r['greedy']['correct']} T0.2={r['T=0.2']['acc']:.2f} T0.7={r['T=0.7']['acc']:.2f} "
          f"T1={r['T=1.0']['acc']:.2f} T1.5={r['T=1.5']['acc']:.2f}  [{time.time()-t0:.0f}s]", flush=True)
    json.dump(res, open("results-sweep50.partial.json", "w"), indent=1)
json.dump(res, open("results-sweep50.json", "w"), indent=1)

# ---- summary: mean accuracy over questions, paired bootstrap over questions vs greedy
rng = np.random.default_rng(20261126)
names = [s[0] for s in SETTINGS]
A = np.array([[res[p][n]["acc"] for n in names] for p, _ in Q])  # [50, settings]
print("\nmean accuracy over 50 questions, with 95% bootstrap interval over questions (10,000 resamples)")
for j, n in enumerate(names):
    bs = [A[rng.integers(0, 50, 50), j].mean() for _ in range(10000)]
    print(f"  {n:16s} {A[:, j].mean():.3f}  [{np.percentile(bs, 2.5):.3f}, {np.percentile(bs, 97.5):.3f}]")
print("\ndifference from greedy (setting minus greedy), paired over questions")
for j, n in enumerate(names[1:], 1):
    d = A[:, j] - A[:, 0]
    bs = [d[rng.integers(0, 50, 50)].mean() for _ in range(10000)]
    print(f"  {n:16s} {d.mean():+.3f}  [{np.percentile(bs, 2.5):+.3f}, {np.percentile(bs, 97.5):+.3f}]  "
          f"questions better {int((d > 0).sum())}, worse {int((d < 0).sum())}, same {int((d == 0).sum())}")
gw = A[:, 0] == 0
print(f"\nquestions greedy gets wrong: {int(gw.sum())} of 50")
for j, n in enumerate(names[1:], 1):
    print(f"  {n:16s} mean accuracy on those: {A[gw, j].mean() if gw.any() else float('nan'):.3f}; "
          f"questions where sampling got >=20% right: {int((A[gw, j] >= 0.2).sum())}")
gr = A[:, 0] == 1
print(f"questions greedy gets right: {int(gr.sum())} of 50")
for j, n in enumerate(names[1:], 1):
    print(f"  {n:16s} mean accuracy on those: {A[gr, j].mean():.3f}")
print("\nwrong-for-greedy questions:")
for (p, g), a in zip(Q, A):
    if a[0] == 0:
        print("  ", p[:60], "| greedy said", repr(res[p]["greedy"]["sample"].strip()), "| T=0.7 acc", a[2])
print(f"\nseconds {time.time()-t0:.0f}; torch {torch.__version__}; threads {torch.get_num_threads()}")
