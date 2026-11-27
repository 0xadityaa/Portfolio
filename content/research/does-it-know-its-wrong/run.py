"""Closed-book TriviaQA with a small Qwen model, recording the probability of every answer token.

usage: python run.py MODEL OUT_JSONL --data validation.parquet [--ids ids.json] [--minutes 30] [--n 2000]

Questions are shuffled with a fixed seed and processed in that order, so any prefix of the output
file is a uniform random sample of the validation set. Greedy decoding, batch of 8, left padded,
4 threads. Probabilities come from the raw logits (no repetition penalty, no sampling filters).
Resumes if OUT_JSONL already has rows.
"""
import argparse
import json
import os
import random
import subprocess
import time

import pyarrow.parquet as pq
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

torch.set_num_threads(4)

SEED = 20261126
SYSTEM = "Answer the trivia question. Reply with only the answer, a few words, no explanation."
MAX_NEW = 16


def load_questions(path):
    t = pq.read_table(path).to_pylist()
    rows = []
    for r in t:
        a = r["answer"]
        aliases = sorted(set(a["aliases"]) | {a["value"]})
        rows.append({"id": r["question_id"], "question": r["question"], "aliases": aliases})
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("model")
    ap.add_argument("out")
    ap.add_argument("--data", required=True)
    ap.add_argument("--ids", help="json list of question ids to run, in order (reuses another run's set)")
    ap.add_argument("--minutes", type=float, default=30)
    ap.add_argument("--n", type=int, default=2000)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--dtype", default="float32", choices=["float32", "bfloat16"])
    args = ap.parse_args()

    rows = load_questions(args.data)
    by_id = {r["id"]: r for r in rows}
    if args.ids:
        order = [by_id[i] for i in json.load(open(args.ids))]
    else:
        order = list(rows)
        random.Random(SEED).shuffle(order)
    order = order[: args.n]

    done = set()
    if os.path.exists(args.out):
        done = {json.loads(l)["id"] for l in open(args.out) if l.strip()}
    todo = [r for r in order if r["id"] not in done]
    print(f"model {args.model}: {len(done)} done, {len(todo)} to go, budget {args.minutes} min", flush=True)

    tok = AutoTokenizer.from_pretrained(args.model)
    tok.padding_side = "left"
    model = AutoModelForCausalLM.from_pretrained(args.model, torch_dtype=getattr(torch, args.dtype))
    model.eval()
    eos_ids = {tok.convert_tokens_to_ids("<|im_end|>"), tok.convert_tokens_to_ids("<|endoftext|>")}

    t_start = time.time()
    with open(args.out, "a") as fh:
        for b in range(0, len(todo), args.batch):
            if time.time() - t_start > args.minutes * 60:
                print("time budget reached", flush=True)
                break
            batch = todo[b : b + args.batch]
            prompts = [
                tok.apply_chat_template(
                    [{"role": "system", "content": SYSTEM}, {"role": "user", "content": r["question"]}],
                    tokenize=False,
                    add_generation_prompt=True,
                )
                for r in batch
            ]
            enc = tok(prompts, return_tensors="pt", padding=True)
            t0 = time.time()
            with torch.no_grad():
                out = model.generate(
                    **enc,
                    max_new_tokens=MAX_NEW,
                    do_sample=False,
                    temperature=None,
                    top_p=None,
                    top_k=None,
                    repetition_penalty=1.0,
                    return_dict_in_generate=True,
                    output_logits=True,
                    pad_token_id=tok.pad_token_id,
                )
            gen = out.sequences[:, enc["input_ids"].shape[1] :]
            logp = [torch.log_softmax(l.float(), dim=-1) for l in out.logits]  # per step: (batch, vocab)
            for i, r in enumerate(batch):
                toks, lps, lp_eos = [], [], None
                for s in range(gen.shape[1]):
                    t = int(gen[i, s])
                    lp = float(logp[s][i, t])
                    if t in eos_ids:
                        lp_eos = lp
                        break
                    toks.append(t)
                    lps.append(lp)
                text = tok.decode(toks, skip_special_tokens=True).strip().split("\n")[0].strip()
                fh.write(json.dumps({
                    "id": r["id"], "question": r["question"], "aliases": r["aliases"],
                    "answer": text, "tokens": [tok.decode([t]) for t in toks], "logprobs": lps,
                    "lp_eos": lp_eos, "truncated": lp_eos is None,
                }) + "\n")
            fh.flush()
            n_done = len(done) + b + len(batch)
            la = subprocess.run(["uptime"], capture_output=True, text=True).stdout.split("load averages:")[-1].strip()
            print(f"{n_done} done, batch {time.time() - t0:.1f}s, elapsed {(time.time() - t_start) / 60:.1f} min, load {la}", flush=True)


if __name__ == "__main__":
    main()
