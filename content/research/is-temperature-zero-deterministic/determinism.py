"""Part 3: what is and isn't deterministic on one CPU.

a) greedy decoding repeated 20 times (same machine, same batch)
b) float addition is not associative: same numbers, different order
c) same prompt, batch size 1 vs larger batch: max logit difference
d) greedy text for 200 prompts, alone vs inside a batch of 8: how many change,
   and how close the top two tokens were where the text first diverged
"""
import hashlib, random, sys
import numpy as np
import torch
from common import load, chat, gen_kwargs

REPEATS = 20
NEW = 64
PROMPTS = [
    "Explain what a hash map is in two sentences.",
    "Write a haiku about debugging.",
    "Give me three tips for a first marathon.",
    "Why is the sky blue? Keep it short.",
    "Summarize the plot of Romeo and Juliet in two sentences.",
    "What are the pros and cons of microservices?",
    "Describe a cat to someone who has never seen one.",
    "Write a one-line product description for a reusable water bottle.",
    "What does a load balancer do?",
    "Suggest a name for a coffee shop and say why.",
    "Explain recursion to a ten-year-old.",
    "List four uses for a paperclip.",
    "What is the difference between TCP and UDP?",
    "Write a short apology email for missing a meeting.",
    "How do vaccines work, in plain words?",
    "Give me a mnemonic for the planets.",
    "What should I check before buying a used car?",
    "Explain compound interest with an example.",
    "Write a tweet announcing a new open-source library.",
    "Why do we sleep?",
    "What is a race condition?",
    "Describe the taste of coffee to someone who dislikes it.",
    "Give two reasons to write tests before code.",
    "Explain what DNS does in one paragraph.",
]


TOPICS = [
    "password managers", "index funds", "sourdough bread", "unit tests", "code review",
    "remote work", "git branching", "cold emailing", "learning to swim", "container orchestration",
    "public speaking", "database indexes", "composting", "sleep schedules", "rate limiting",
    "budgeting", "caching", "learning a second language", "home networking", "feature flags",
    "running a meeting", "backups", "photography basics", "debugging production issues", "recycling",
    "onboarding a new hire", "time zones", "reading research papers", "bike maintenance", "API versioning",
    "cooking rice", "technical writing", "houseplants", "two-factor authentication", "stand-up comedy",
    "load testing", "chess openings", "monitoring and alerts", "learning guitar", "pair programming",
    "travel packing", "writing a changelog", "cleaning a laptop", "negotiating salary",
]
TEMPLATES = [
    "Explain {t} in two sentences.",
    "Give me three practical tips about {t}.",
    "What are the most common mistakes people make with {t}?",
    "Write a short, friendly note to a colleague about {t}.",
]
PROMPTS += [tpl.format(t=t) for t in TOPICS for tpl in TEMPLATES]
assert len(PROMPTS) == 200, len(PROMPTS)


def wilson(k, n, z=1.96):
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * (p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5 / d
    return c - h, c + h


def digest(ids):
    return hashlib.sha1(",".join(map(str, ids)).encode()).hexdigest()[:10]


def greedy(model, tok, enc, new=NEW):
    kw = gen_kwargs(new, do_sample=False, temperature=None, top_p=None, top_k=None)
    with torch.no_grad():
        g = model.generate(**enc, **kw, pad_token_id=tok.eos_token_id)
    return [r[enc.input_ids.shape[1]:].tolist() for r in g]


def greedy_with_gaps(model, tok, enc, new=NEW):
    """Batch size 1 only: also return the top1-top2 logit gap at every step."""
    kw = gen_kwargs(new, do_sample=False, temperature=None, top_p=None, top_k=None)
    with torch.no_grad():
        g = model.generate(**enc, **kw, pad_token_id=tok.eos_token_id,
                           output_scores=True, return_dict_in_generate=True)
    gaps = []
    for sc in g.scores:
        t2 = sc[0].float().topk(2).values
        gaps.append(float(t2[0] - t2[1]))
    return g.sequences[0, enc.input_ids.shape[1]:].tolist(), gaps


# ---------------------------------------------------------------- b) summation order (no model needed)
print("=== b) float32 summation order")
print("0.1 + 0.2 + 0.3 =", repr(float(np.float32(0.1) + np.float32(0.2) + np.float32(0.3))),
      "; 0.3 + 0.2 + 0.1 =", repr(float(np.float32(0.3) + np.float32(0.2) + np.float32(0.1))))
rng = np.random.default_rng(0)
x = rng.standard_normal(1_000_000).astype(np.float32)
ref = float(x.astype(np.float64).sum())
vals = {"as generated": float(np.sum(x))}
for s in range(5):
    vals[f"shuffle {s}"] = float(np.sum(rng.permutation(x)))
vals["sorted ascending"] = float(np.sum(np.sort(x)))
vals["sorted descending"] = float(np.sum(np.sort(x)[::-1]))
print(f"float64 reference sum: {ref:.9f}")
for k, v in vals.items():
    print(f"  {k:18s} {v:.9f}   error vs float64 {abs(v - ref):.2e}")
spread = max(vals.values()) - min(vals.values())
print(f"  spread across orders: {spread:.2e}   distinct float32 results: {len(set(vals.values()))} of {len(vals)}")

tok, model = load(torch.float32)

# ---------------------------------------------------------------- a) greedy repeated
print("\n=== a) greedy decoding, same prompt repeated", REPEATS, "times (fp32, batch size 1)")
for prompt in PROMPTS[:3]:
    enc = tok(chat(tok, prompt), return_tensors="pt")
    hashes = [digest(greedy(model, tok, enc)[0]) for _ in range(REPEATS)]
    print(f"  {prompt[:50]:52s} distinct outputs: {len(set(hashes))} of {REPEATS}")


# ---------------------------------------------------------------- c) logits: batch 1 vs batch B
def logits_diff(model, tok, dtype):
    model = model.to(dtype)
    prompt = chat(tok, PROMPTS[5])
    enc1 = tok([prompt], return_tensors="pt")
    with torch.no_grad():
        l1 = model(**enc1).logits.float()[0]  # [T, V]
    rows = []
    for B in (2, 8, 32):
        encB = tok([prompt] * B, return_tensors="pt")  # identical rows, no padding
        with torch.no_grad():
            lB = model(**encB).logits.float()[0]
        d = (l1 - lB).abs()
        top2 = l1[-1].topk(2).values
        rows.append((B, float(d.max()), float(d[-1].max()),
                     bool(l1.argmax(-1).equal(lB.argmax(-1))), float(top2[0] - top2[1])))
    return rows


for name, dt in (("fp32", torch.float32), ("bf16", torch.bfloat16)):
    print(f"\n=== c) same prompt, batch size 1 vs B, {name}: max |logit difference|")
    print("  B   all positions   last position   argmax same at every position")
    for B, dmax, dlast, same, gap in logits_diff(model, tok, dt):
        print(f"  {B:<3d} {dmax:13.3e} {dlast:15.3e}   {same}")
model = model.to(torch.float32)

# ---------------------------------------------------------------- d) greedy text alone vs in a batch
import json, time
out = {}
for name, dt in (("fp32", torch.float32), ("bf16", torch.bfloat16)):
    t0 = time.time()
    model = model.to(dt)
    alone, gaps = [], []
    for p in PROMPTS:
        enc = tok(chat(tok, p), return_tensors="pt")
        ids, gp = greedy_with_gaps(model, tok, enc)
        alone.append(ids); gaps.append(gp)
    batched = []
    for i in range(0, len(PROMPTS), 8):
        enc = tok([chat(tok, p) for p in PROMPTS[i:i + 8]], return_tensors="pt", padding=True)
        for row in greedy(model, tok, enc):
            batched.append(row)

    def trim(r):
        r = list(r)
        return r[:r.index(tok.eos_token_id)] if tok.eos_token_id in r else r
    changed, firsts, gap_at_flip = [], [], []
    for k, (a, b) in enumerate(zip(alone, batched)):
        a, b = trim(a), trim(b)
        if a != b:
            f = next((i for i, (u, v) in enumerate(zip(a, b)) if u != v), min(len(a), len(b)))
            changed.append(k); firsts.append(f)
            if f < len(gaps[k]):
                gap_at_flip.append(gaps[k][f])
    allgaps = [g for gp in gaps for g in gp]
    n = len(PROMPTS); lo, hi = wilson(len(changed), n)
    print(f"\n=== d) {name}: greedy, {NEW} new tokens, {n} prompts, alone vs inside a batch of 8 (left padded)")
    print(f"  prompts whose text changed: {len(changed)} of {n}  (95% Wilson {lo:.3f} to {hi:.3f})")
    print(f"  first differing token index: {sorted(firsts)}")
    print(f"  top1-top2 logit gap where the text first diverged (alone run): {[round(x, 3) for x in sorted(gap_at_flip)]}")
    print(f"  share of ALL decode steps with gap < 0.1: {np.mean(np.array(allgaps) < 0.1):.4f}; < 0.5: {np.mean(np.array(allgaps) < 0.5):.4f}; steps: {len(allgaps)}")
    if changed:
        i = changed[0]
        print(f"  example (prompt {i}): alone  -> {tok.decode(trim(alone[i]))[:110]!r}")
        print(f"                       batched -> {tok.decode(trim(batched[i]))[:110]!r}")
    out[name] = dict(changed=len(changed), n=n, wilson=[lo, hi], first_idx=sorted(firsts),
                     gap_at_flip=sorted(gap_at_flip), share_gap_lt_0_1=float(np.mean(np.array(allgaps) < 0.1)),
                     share_gap_lt_0_5=float(np.mean(np.array(allgaps) < 0.5)), seconds=time.time() - t0)
    json.dump(out, open("results-determinism.json", "w"), indent=1)
model = model.to(torch.float32)
print("\ntorch", torch.__version__, "threads", torch.get_num_threads())
