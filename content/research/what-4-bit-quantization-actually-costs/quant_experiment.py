"""Round-to-nearest (RTN) quantization of Qwen2.5-0.5B on CPU: how much error, where it lands, what it costs in perplexity.

Run from this folder (needs torch, safetensors, transformers, pandas, pyarrow; see README):

    python3 -I quant_experiment.py weights      > output-weights.txt
    python3 -I quant_experiment.py activations  > output-activations.txt
    python3 -I quant_experiment.py ppl          > output-ppl.txt

Every subcommand also writes a JSON file next to this script (results-<name>.json).
Weights and data are read from DATA_DIR (see fetch.py); nothing here is committed except the outputs.

What "quantize" means here
- Plain round-to-nearest, asymmetric, min/max range. No calibration, no error feedback, no
  rescaling: this is the naive baseline that GPTQ and AWQ are written against.
- Only the seven linear weights in each of the 24 transformer blocks are quantized
  (q, k, v, o, gate, up, down: 168 matrices, 358M of the model's 494M parameters). Token
  embeddings, norms and biases stay as they are.
- Weights are "fake quantized": rounded to the integer grid and immediately dequantized to
  fp32, so every number below is the error the integer grid causes, not the speed of a
  real int4 kernel.
- Scales and zero points are kept in fp32 here (a real checkpoint stores them in fp16, which
  adds a little more error that I did not measure).
- Granularity: "tensor" = one scale per matrix; "channel" = one scale per output row;
  "g128" = one scale per 128 consecutive input weights in a row.
"""
import argparse
import json
import math
import pathlib
import re
import sys
import time

import torch

HERE = pathlib.Path(__file__).parent
DATA_DIR = pathlib.Path("/private/tmp/claude-501/quant")
MODEL_DIR = DATA_DIR / "qwen"
GROUP = 128
LINEAR_RE = re.compile(r"model\.layers\.(\d+)\.(self_attn\.(q|k|v|o)_proj|mlp\.(gate|up|down)_proj)\.weight$")
TYPES = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
TOP_FRAC = 0.01

torch.set_num_threads(8)


# ---------------------------------------------------------------- quantizer
def _ranges(W, scheme, keep=None):
    """Return view of W shaped (n_groups, group_size), and the matching keep mask view."""
    if scheme == "tensor":
        shape = (1, -1)
    elif scheme == "channel":
        shape = (W.shape[0], -1)
    elif scheme == "g128":
        assert W.shape[1] % GROUP == 0, W.shape
        shape = (-1, GROUP)
    else:
        raise ValueError(scheme)
    Wv = W.reshape(shape)
    kv = None if keep is None else keep.reshape(shape)
    return Wv, kv


def rtn(W, bits, scheme, keep=None):
    """Asymmetric min/max round-to-nearest. `keep` (bool, same shape as W) marks entries that
    stay exact and are ignored when the range is chosen. Returns the dequantized matrix."""
    levels = 2**bits - 1
    Wv, kv = _ranges(W, scheme, keep)
    if kv is None:
        mn = Wv.amin(1, keepdim=True)
        mx = Wv.amax(1, keepdim=True)
    else:
        mn = torch.where(kv, torch.full_like(Wv, float("inf")), Wv).amin(1, keepdim=True)
        mx = torch.where(kv, torch.full_like(Wv, float("-inf")), Wv).amax(1, keepdim=True)
        mn = torch.where(torch.isinf(mn), torch.zeros_like(mn), mn)
        mx = torch.where(torch.isinf(mx), torch.zeros_like(mx), mx)
    scale = ((mx - mn) / levels).clamp_min(1e-12)
    zero = torch.round(-mn / scale)
    q = torch.clamp(torch.round(Wv / scale) + zero, 0, levels)
    deq = ((q - zero) * scale).reshape(W.shape)
    if keep is not None:
        deq = torch.where(keep, W, deq)
    return deq


def top_mask(W, frac=TOP_FRAC):
    """Mask of the largest `frac` of entries by magnitude."""
    a = W.abs().flatten()
    k = max(1, int(math.ceil(frac * a.numel())))
    thresh = torch.kthvalue(a, a.numel() - k + 1).values
    return W.abs() >= thresh


# ---------------------------------------------------------------- data
def load_weights():
    from safetensors.torch import load_file
    sd = load_file(str(MODEL_DIR / "model.safetensors"))
    return {k: v.float() for k, v in sd.items() if LINEAR_RE.search(k)}


def type_of(name):
    return re.search(r"(q_proj|k_proj|v_proj|o_proj|gate_proj|up_proj|down_proj)", name).group(1)


SCHEMES = [(8, "tensor"), (8, "channel"), (8, "g128"), (4, "tensor"), (4, "channel"), (4, "g128")]


def label(bits, scheme):
    return f"int{bits} {scheme}"


# ---------------------------------------------------------------- 1. weights
def cmd_weights(_):
    W = load_weights()
    n_params = sum(w.numel() for w in W.values())
    print(f"model: Qwen/Qwen2.5-0.5B  matrices: {len(W)}  quantized parameters: {n_params/1e6:.1f}M")

    # weight statistics (this is the outlier picture before any rounding)
    stats = {t: [] for t in TYPES}
    for name, w in W.items():
        rms = w.pow(2).mean().sqrt()
        m = top_mask(w)
        stats[type_of(name)].append((w.abs().max() / rms, w[m].pow(2).sum() / w.pow(2).sum()))
    print("\nWeight outliers before rounding (median over the 24 layers)")
    print(f"{'type':10} {'max|w| / rms':>13} {'top 1% share of sum w^2':>25}")
    out_stats = {}
    for t in TYPES:
        r = torch.stack([torch.stack(s) for s in stats[t]])
        med = r.median(0).values
        out_stats[t] = {"max_over_rms": med[0].item(), "top1pct_energy_share": med[1].item()}
        print(f"{t:10} {med[0].item():13.1f} {100*med[1].item():24.1f}%")

    results = {}
    print("\nReconstruction error of RTN on all 168 matrices")
    print(f"{'scheme':16} {'rel. error':>11} {'mean per-matrix':>16} {'top 1% weights: share of error':>32}")
    for bits, scheme in SCHEMES + [(4, "tensor+keep1%")]:
        err2 = w2 = err2_top = 0.0
        per_matrix = []
        by_type = {t: [0.0, 0.0] for t in TYPES}
        for name, w in W.items():
            keep = top_mask(w) if scheme.endswith("keep1%") else None
            sch = scheme.split("+")[0]
            q = rtn(w, bits, sch, keep)
            e = (w - q).pow(2)
            m = top_mask(w)
            err2 += e.sum().item()
            w2 += w.pow(2).sum().item()
            err2_top += e[m].sum().item()
            per_matrix.append(math.sqrt(e.sum().item() / w.pow(2).sum().item()))
            by_type[type_of(name)][0] += e.sum().item()
            by_type[type_of(name)][1] += w.pow(2).sum().item()
        key = label(bits, scheme)
        results[key] = {
            "rel_error": math.sqrt(err2 / w2),
            "mean_per_matrix_rel_error": sum(per_matrix) / len(per_matrix),
            "top1pct_weights_error_share": err2_top / err2 if err2 else 0.0,
            "rel_error_by_type": {t: math.sqrt(a / b) for t, (a, b) in by_type.items()},
        }
        r = results[key]
        print(f"{key:16} {100*r['rel_error']:10.2f}% {100*r['mean_per_matrix_rel_error']:15.2f}% "
              f"{100*r['top1pct_weights_error_share']:31.2f}%")
    print("\nRelative error by matrix type")
    print(f"{'scheme':16}" + "".join(f"{t:>11}" for t in TYPES))
    for key, r in results.items():
        print(f"{key:16}" + "".join(f"{100*r['rel_error_by_type'][t]:10.2f}%" for t in TYPES))
    (HERE / "results-weights.json").write_text(json.dumps({"stats": out_stats, "results": results}, indent=2) + "\n")


# ---------------------------------------------------------------- 2. activations
def get_text(split):
    import pandas as pd
    df = pd.read_parquet(DATA_DIR / "data" / f"wt2-{split}.parquet")
    return "\n\n".join(df["text"])


def load_model():
    from transformers import AutoModelForCausalLM, AutoTokenizer
    tok = AutoTokenizer.from_pretrained(str(MODEL_DIR))
    model = AutoModelForCausalLM.from_pretrained(str(MODEL_DIR), torch_dtype=torch.float32)
    model.eval()
    return tok, model


def cmd_activations(args):
    """Layer-by-layer *output* error on real activations. Each matrix gets the clean fp32
    input the unquantized model feeds it (errors do not propagate between layers here)."""
    tok, model = load_model()
    ids = tok(get_text("train"), return_tensors="pt").input_ids[:, : args.tokens]
    print(f"calibration: first {ids.shape[1]} tokens of WikiText-2 train")
    mods = {n: m for n, m in model.named_modules()
            if isinstance(m, torch.nn.Linear) and LINEAR_RE.search(n + ".weight")}
    gen = torch.Generator().manual_seed(0)

    configs = [(4, s) for s in ("tensor", "channel", "g128")] + [(8, s) for s in ("tensor", "channel", "g128")]
    # variants: none | keep top 1% weights by |w| | keep top 1% input channels by activation rms | keep random 1% channels
    variants = ["none", "keep 1% weights (by |w|)", "keep 1% channels (by activation)", "keep 1% channels (random)"]
    acc = {(b, s, v): [0.0, 0.0] for b, s in configs for v in variants}
    share_acc = {(b, s): [0.0, 0.0] for b, s in configs}

    def hook(name):
        def fn(module, inputs):
            X = inputs[0].reshape(-1, inputs[0].shape[-1])
            w = module.weight.data
            Y2 = (X @ w.T).pow(2).sum().item()
            a = X.pow(2).mean(0)  # mean square activation per input channel
            ncol = w.shape[1]
            k = max(1, int(math.ceil(TOP_FRAC * ncol)))
            top_cols = torch.topk(a, k).indices
            rand_cols = torch.randperm(ncol, generator=gen)[:k]
            col_mask = torch.zeros_like(w, dtype=torch.bool)
            col_mask[:, top_cols] = True
            rnd_mask = torch.zeros_like(w, dtype=torch.bool)
            rnd_mask[:, rand_cols] = True
            w_mask = top_mask(w)
            for bits, scheme in configs:
                masks = {"none": None, "keep 1% weights (by |w|)": w_mask,
                         "keep 1% channels (by activation)": col_mask, "keep 1% channels (random)": rnd_mask}
                for v, mk in masks.items():
                    if v != "none" and bits == 8:
                        continue
                    q = rtn(w, bits, scheme, mk)
                    E = X @ (w - q).T
                    acc[(bits, scheme, v)][0] += E.pow(2).sum().item()
                    acc[(bits, scheme, v)][1] += Y2
                    if v == "none":
                        # activation-weighted weight error, per input channel (cross terms ignored)
                        contrib = a * (w - q).pow(2).sum(0)
                        share_acc[(bits, scheme)][0] += contrib[top_cols].sum().item()
                        share_acc[(bits, scheme)][1] += contrib.sum().item()
        return fn

    handles = [m.register_forward_pre_hook(hook(n)) for n, m in mods.items()]
    t0 = time.time()
    with torch.no_grad():
        model(ids)
    for h in handles:
        h.remove()
    print(f"forward + analysis: {time.time()-t0:.0f}s over {len(mods)} matrices\n")

    print("Output error ||X (W - Wq)^T|| / ||X W^T||, summed over all 168 matrices")
    print(f"{'scheme':16}" + "".join(f"{v:>36}" for v in variants))
    res = {}
    for bits, scheme in configs:
        row = f"{label(bits, scheme):16}"
        res[label(bits, scheme)] = {}
        for v in variants:
            if (bits, scheme, v) in acc and acc[(bits, scheme, v)][1] > 0:
                e, y = acc[(bits, scheme, v)]
                r = math.sqrt(e / y)
                res[label(bits, scheme)][v] = r
                row += f"{100*r:35.2f}%"
            else:
                row += f"{'':>36}"
        print(row)
    print("\nShare of activation-weighted weight error (sum over channels of mean(x_j^2) * ||dW[:, j]||^2)")
    print("that comes from the 1% of input channels with the largest mean x_j^2")
    shares = {}
    for (bits, scheme), (a, b) in share_acc.items():
        shares[label(bits, scheme)] = a / b
        print(f"{label(bits, scheme):16} {100*a/b:6.1f}%")
    (HERE / "results-activations.json").write_text(
        json.dumps({"output_rel_error": res, "top1pct_channel_error_share": shares,
                    "tokens": int(ids.shape[1])}, indent=2) + "\n")


# ---------------------------------------------------------------- 3. perplexity
def cmd_ppl(args):
    tok, model = load_model()
    ids = tok(get_text("test"), return_tensors="pt").input_ids
    n_win = min(args.windows, ids.shape[1] // args.window)
    ids = ids[:, : n_win * args.window]
    print(f"WikiText-2 test: {ids.shape[1]} tokens scored in {n_win} windows of {args.window}")
    orig = load_weights()
    mods = {n: m for n, m in model.named_modules()
            if isinstance(m, torch.nn.Linear) and LINEAR_RE.search(n + ".weight")}

    def ppl():
        nll = 0.0
        cnt = 0
        with torch.no_grad():
            for i in range(n_win):
                chunk = ids[:, i * args.window:(i + 1) * args.window]
                logits = model(chunk).logits[:, :-1]
                loss = torch.nn.functional.cross_entropy(
                    logits.reshape(-1, logits.shape[-1]), chunk[:, 1:].reshape(-1), reduction="sum")
                nll += loss.item()
                cnt += chunk.shape[1] - 1
        return math.exp(nll / cnt), cnt

    results = {}
    runs = [("fp32 (bf16 weights upcast)", None)] + [(label(b, s), (b, s)) for b, s in SCHEMES] + \
           [("int4 tensor + keep 1% weights", (4, "tensor+keep1%"))]
    base = None
    print(f"\n{'weights':32} {'perplexity':>11} {'vs fp32':>9}  seconds")
    for name, cfg in runs:
        t0 = time.time()
        for n, m in mods.items():
            w = orig[n + ".weight"]
            if cfg is None:
                m.weight.data.copy_(w)
            else:
                bits, scheme = cfg
                keep = top_mask(w) if scheme.endswith("keep1%") else None
                m.weight.data.copy_(rtn(w, bits, scheme.split("+")[0], keep))
        p, cnt = ppl()
        base = base or p
        results[name] = p
        print(f"{name:32} {p:11.2f} {100*(p/base-1):+8.1f}%  {time.time()-t0:.0f}", flush=True)
    (HERE / "results-ppl.json").write_text(
        json.dumps({"tokens_scored": cnt, "window": args.window, "perplexity": results}, indent=2) + "\n")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("weights").set_defaults(fn=cmd_weights)
    a = sub.add_parser("activations")
    a.add_argument("--tokens", type=int, default=2048)
    a.set_defaults(fn=cmd_activations)
    p = sub.add_parser("ppl")
    p.add_argument("--window", type=int, default=1024)
    p.add_argument("--windows", type=int, default=8)
    p.set_defaults(fn=cmd_ppl)
    args = ap.parse_args()
    torch.manual_seed(0)
    args.fn(args)


if __name__ == "__main__":
    main()
