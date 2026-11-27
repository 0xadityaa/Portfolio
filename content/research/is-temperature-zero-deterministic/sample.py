"""Part 2: 100 sampled completions per setting on short-answer prompts with known answers."""
import json, math, re, torch
from collections import Counter
from common import load, chat, gen_kwargs

N = 100
CASES = [  # (prompt, gold substring)
    ("What is the capital of Australia? Answer with just the city name.", "canberra"),
    ("What is 17 * 24? Answer with just the number.", "408"),
    ("Which planet is closest to the Sun? Answer with just the planet name.", "mercury"),
]
SETTINGS = [("greedy", None, 1.0), ("T=0.2", 0.2, 1.0), ("T=0.7", 0.7, 1.0), ("T=1.0", 1.0, 1.0),
            ("T=1.5", 1.5, 1.0), ("T=1.0 top-p 0.9", 1.0, 0.9)]


def norm(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def wilson(k, n, z=1.96):
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - h, c + h


tok, model = load(torch.float32)
results = {}
for prompt, gold in CASES:
    ids = tok(chat(tok, prompt), return_tensors="pt")
    print(f"\n=== {prompt}  (gold: {gold})")
    print(f"{'setting':16s} {'distinct':>8s} {'accuracy':>9s}  95% Wilson     most common answers")
    results[prompt] = {}
    for si, (name, T, top_p) in enumerate(SETTINGS):
        torch.manual_seed(1000 + si)
        if T is None:
            kw = gen_kwargs(12, do_sample=False, temperature=None, top_p=None, top_k=None)
            with torch.no_grad():
                g = model.generate(**ids, **kw, pad_token_id=tok.eos_token_id)
            # greedy is one run; repeated runs are checked in determinism.py
            texts = [tok.decode(g[0, ids.input_ids.shape[1]:], skip_special_tokens=True)] * N
        else:
            kw = gen_kwargs(12, do_sample=True, temperature=T, top_p=top_p, num_return_sequences=N)
            with torch.no_grad():
                g = model.generate(**ids, **kw, pad_token_id=tok.eos_token_id)
            texts = [tok.decode(r[ids.input_ids.shape[1]:], skip_special_tokens=True) for r in g]
        answers = [norm(t) for t in texts]
        correct = sum(gold in a for a in answers)
        lo, hi = wilson(correct, N)
        c = Counter(answers)
        results[prompt][name] = {"distinct": len(c), "correct": correct, "n": N,
                                 "wilson": [lo, hi], "top_answers": c.most_common(5)}
        print(f"{name:16s} {len(c):8d} {correct:6d}/{N}  [{lo:.2f}, {hi:.2f}]   "
              + ", ".join(f"{a!r}x{n}" for a, n in c.most_common(4)))
json.dump(results, open("results-sample.json", "w"), indent=1)
