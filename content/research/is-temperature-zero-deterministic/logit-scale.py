"""How big are the logits, and how coarse is bf16 at that size? One forward pass per prompt,
fp32, 200 prompts from determinism.py's list. Prints the range of the top-1 logit at the first
generated position and the bf16 spacing at that size."""
import numpy as np, torch
from common import load, chat
import determinism_prompts as dp

tok, model = load(torch.float32)
top1 = []
for p in dp.PROMPTS:
    enc = tok(chat(tok, p), return_tensors="pt")
    with torch.no_grad():
        top1.append(float(model(**enc).logits[0, -1].max()))
t = np.array(top1)
print(f"top-1 logit at the first generated position, {len(t)} prompts: min {t.min():.2f}, median {np.median(t):.2f}, max {t.max():.2f}")
for v in (float(np.percentile(t, 5)), float(np.median(t)), float(np.percentile(t, 95))):
    bf = torch.tensor(v).to(torch.bfloat16)
    nxt = torch.nextafter(bf, torch.tensor(1e9, dtype=torch.bfloat16))
    print(f"  logit {v:6.2f}: bf16 spacing {float(nxt) - float(bf):.4f}")
