"""Weight memory at fp16, int8 and int4 for four real model configs, against three card sizes.

    python3 memory.py > output-memory.txt
    python3 memory.py --json > memory.json      # same numbers, machine-readable

Standard library only. It reads ./configs/*.json and ./configs/params.json.

Method
- Total parameters come from the Hugging Face API (safetensors.total) for the pinned commit.
- Quantized parameters are the linear layers inside the transformer blocks (q, k, v, o,
  gate, up, down), counted from the config. Everything else (token embeddings, the output
  head, norms, biases) is treated as staying in fp16. For an 8B Llama that "everything
  else" is 13% of the parameters, so skipping it would flatter 4-bit.
- Bits per quantized weight for group size 128 = bits + (scale + zero point) / 128.
  Scale is fp16 (16 bits). Zero point is stored at the weight width (4 or 8 bits), the
  layout GPTQ and AWQ checkpoints use. So int4 = 4 + 20/128 = 4.15625 bits and
  int8 = 8 + 24/128 = 8.1875 bits. (An fp16 zero point would make int4 4.25 bits.)
- KV cache per token = 2 x layers x kv_heads x head_dim x 2 bytes (fp16). See the KV cache
  post for the derivation. Weight-only quantization does not change it.
- Cards are decimal GB as NVIDIA lists them; sizes are printed in GiB (2^30 bytes).
- RESERVE_GIB is my assumption for activations, CUDA context and framework overhead. It is
  not measured. Change it and rerun.
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).parent
CARDS_GB = [24, 48, 80]
RESERVE_GIB = 2.0
CONTEXT = 32768  # tokens per user for the "users" column
GROUP = 128
GIB = 2**30

PRECISIONS = {
    "fp16": 16.0,
    "int8 g128": 8 + (16 + 8) / GROUP,
    "int4 g128": 4 + (16 + 4) / GROUP,
}


def load(name):
    cfg = json.loads((HERE / "configs" / f"{name}.json").read_text())
    params = json.loads((HERE / "configs" / "params.json").read_text())[name]["parameters"]
    return cfg, params


def block_linear_params(cfg):
    h = cfg["hidden_size"]
    inter = cfg["intermediate_size"]
    nh = cfg["num_attention_heads"]
    kv = cfg.get("num_key_value_heads", nh)
    hd = cfg.get("head_dim") or h // nh
    attn = h * nh * hd + 2 * h * kv * hd + nh * hd * h
    mlp = 3 * h * inter
    return cfg["num_hidden_layers"] * (attn + mlp)


def kv_bytes_per_token(cfg):
    nh = cfg["num_attention_heads"]
    kv = cfg.get("num_key_value_heads", nh)
    hd = cfg.get("head_dim") or cfg["hidden_size"] // nh
    return 2 * cfg["num_hidden_layers"] * kv * hd * 2


def main():
    as_json = "--json" in sys.argv
    names = ["Llama-3.1-8B", "Qwen2.5-14B", "Qwen2.5-32B", "Llama-3.1-70B"]
    result = {}
    lines = []
    out = lines.append
    out(f"Reserve for activations/CUDA/framework (assumed): {RESERVE_GIB} GiB. Context per user: {CONTEXT:,} tokens, fp16 KV cache.")
    out(f"Bits per weight (group {GROUP}): " + ", ".join(f"{k} = {v:.5f}" for k, v in PRECISIONS.items()))
    out("")
    for name in names:
        cfg, total = load(name)
        lin = block_linear_params(cfg)
        other = total - lin
        kvtok = kv_bytes_per_token(cfg)
        kv_ctx = kvtok * CONTEXT / GIB
        out(f"{name}: {total/1e9:.2f}B params; block linear {lin/1e9:.2f}B ({100*lin/total:.1f}%); "
            f"kept fp16 (embeddings, head, norms, biases) {other/1e9:.2f}B ({100*other/total:.1f}%)")
        out(f"  KV per token {kvtok/1024:.0f} KiB; one user at {CONTEXT:,} tokens = {kv_ctx:.2f} GiB")
        result[name] = {"params": total, "linear_params": lin, "other_params": other,
                        "kv_bytes_per_token": kvtok, "precisions": {}}
        header = f"  {'precision':10} {'weights GiB':>11} {'saved vs fp16':>14}"
        for c in CARDS_GB:
            header += f" | {c} GB: room GiB, users@{CONTEXT//1024}k"
        out(header)
        base = None
        for pname, bits in PRECISIONS.items():
            if pname == "fp16":
                wbytes = total * 2
            else:
                wbytes = lin * bits / 8 + other * 2
            wgib = wbytes / GIB
            base = base or wgib
            row = f"  {pname:10} {wgib:11.1f} {100*(1-wgib/base):13.0f}%"
            result[name]["precisions"][pname] = {"weights_gib": wgib, "cards": {}}
            for c in CARDS_GB:
                room = c * 1e9 / GIB - wgib - RESERVE_GIB
                users = int(room // kv_ctx) if room > 0 else None
                fits = room > 0
                row += f" | {room:7.1f}  {('%3d' % users) if fits else ' no'}      "
                result[name]["precisions"][pname]["cards"][str(c)] = {
                    "room_gib": room, "users": users if fits else 0, "fits": fits}
            out(row)
        out("")
    if as_json:
        print(json.dumps(result, indent=2))
    else:
        print("\n".join(lines))


if __name__ == "__main__":
    main()
