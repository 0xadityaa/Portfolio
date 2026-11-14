"""KV cache size per model, from each model's real config.json.

bytes per token = 2 (K and V) * layers * kv_heads * head_dim * bytes_per_value
Reads configs/*.json written by fetch.py. Standard library only.
Run: python3 kv_cache.py [--gpus 1] [--gpu-gb 80] [--bytes 2]
"""
import argparse
import json
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--gpus", type=int, default=1)
ap.add_argument("--gpu-gb", type=float, default=80, help="decimal GB per GPU (NVIDIA lists 80 GB)")
ap.add_argument("--bytes", type=int, default=2, help="bytes per cached value (fp16 = 2, fp8 = 1)")
args = ap.parse_args()

CTX = [4_096, 32_768, 131_072]
GB = 1e9
GiB = 2**30
here = Path(__file__).parent / "configs"
params = json.loads((here / "params.json").read_text())
budget = args.gpus * args.gpu_gb * GB


def per_token(layers, kv_heads, head_dim):
    return 2 * layers * kv_heads * head_dim * args.bytes


print(f"GPUs: {args.gpus} x {args.gpu_gb:g} GB = {budget / GB:g} GB; cache values: {args.bytes} byte(s); "
      f"weights: fp16, params x 2 bytes; sizes in GiB (2^30), budget in GB (10^9)")
print()
for name, meta in params.items():
    cfg = json.loads((here / f"{name}.json").read_text())
    layers = cfg["num_hidden_layers"]
    heads = cfg["num_attention_heads"]
    kv = cfg.get("num_key_value_heads", heads)  # absent means multi-head attention
    head_dim = cfg.get("head_dim") or cfg["hidden_size"] // heads
    weights = meta["parameters"] * 2
    gqa = per_token(layers, kv, head_dim)
    mha = per_token(layers, heads, head_dim)
    print(f"{name}  ({meta['parameters'] / 1e9:.2f}B params, weights {weights / GiB:.1f} GiB)")
    print(f"  layers={layers} attention_heads={heads} kv_heads={kv} head_dim={head_dim} "
          f"hidden_size={cfg['hidden_size']} max_position_embeddings={cfg.get('max_position_embeddings')}")
    print(f"  KV per token: {gqa / 1024:.1f} KiB with {kv} kv heads; {mha / 1024:.1f} KiB if kv_heads = {heads} "
          f"({mha / gqa:.0f}x)")
    room = budget - weights
    print(f"  {'context':>8} | {'KV one seq':>11} | {'vs weights':>10} | {'seqs fit (as shipped)':>21} | "
          f"{'KV one seq, no GQA':>18} | {'seqs fit (no GQA)':>17}")
    for c in CTX:
        one, one_mha = gqa * c, mha * c
        fit = max(0, int(room // one)) if room > 0 else "no room"
        fit_mha = max(0, int(room // one_mha)) if room > 0 else "no room"
        print(f"  {c:>8,} | {one / GiB:>8.2f} GiB | {one / weights:>9.0%} | {fit!s:>21} | "
              f"{one_mha / GiB:>14.2f} GiB | {fit_mha!s:>17}")
    if room > 0:
        for u in (4, 8):
            parts = ", ".join(f"{c // 1024}k: {u * gqa * c / GiB:.1f} GiB" for c in CTX)
            print(f"  {u} concurrent full-length users, KV only: {parts}")
    else:
        print("  weights alone exceed the memory budget")
    print()
