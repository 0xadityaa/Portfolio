"""Part 1: top-10 next-token probabilities under temperature and top-p."""
import json, torch
from common import load, chat, entropy_bits

PROMPTS = [
    "What is the capital of France? Answer with one word.",
    "Name a color. Answer with one word.",
    "Pick a number between 1 and 10. Answer with just the number.",
    "Give me one word that describes the ocean.",
]
SETTINGS = [("T=0.2", 0.2, 1.0), ("T=0.7", 0.7, 1.0), ("T=1.0", 1.0, 1.0),
            ("T=1.5", 1.5, 1.0), ("T=1.0, top-p 0.9", 1.0, 0.9)]

tok, model = load(torch.float32)
out = {}
for prompt in PROMPTS:
    ids = tok(chat(tok, prompt), return_tensors="pt")
    with torch.no_grad():
        logits = model(**ids).logits[0, -1].float()
    print(f"\n=== {prompt}")
    print(f"greedy (T=0) picks: {tok.decode(logits.argmax())!r}")
    res = {}
    for name, T, top_p in SETTINGS:
        p = torch.softmax(logits / T, -1)
        if top_p < 1.0:
            sp, si = p.sort(descending=True)
            keep = (sp.cumsum(0) - sp) < top_p   # smallest set whose mass reaches top_p
            nucleus = int(keep.sum())
            q = torch.zeros_like(p)
            q[si[keep]] = sp[keep]
            p = q / q.sum()
        else:
            nucleus = None
        top = p.topk(10)
        res[name] = {
            "entropy_bits": entropy_bits(p),
            "top1": float(top.values[0]),
            "top10_mass": float(top.values.sum()),
            "nucleus_size": nucleus,
            "top10": [(tok.decode(i), float(v)) for v, i in zip(top.values, top.indices)],
        }
        print(f"{name:18s} entropy {res[name]['entropy_bits']:5.2f} bits  top1 {res[name]['top1']:.3f}  "
              f"top10 mass {res[name]['top10_mass']:.3f}" + (f"  nucleus {nucleus} tokens" if nucleus else ""))
        print("   " + "  ".join(f"{t!r}:{v:.3f}" for t, v in res[name]["top10"][:6]))
    out[prompt] = res
json.dump(out, open("results-dist.json", "w"), indent=1)
