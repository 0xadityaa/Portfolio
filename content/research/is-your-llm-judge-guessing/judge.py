"""Score MT-Bench human-labelled pairs with a small instruct model as judge.

For every pair the model sees both answers twice, once per order, and the
verdict is read from the logits of the next token ("A" or "B"). Nothing is
generated.

Usage:
  python judge.py --model Qwen/Qwen2.5-0.5B-Instruct --out raw-0.5b.jsonl
  python judge.py --model Qwen/Qwen2.5-1.5B-Instruct --out raw-1.5b.jsonl --subset 100
"""
import argparse
import json
import os
import random
import time
from collections import defaultdict

import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer

DATASET = "lmsys/mt_bench_human_judgments"
SEED = 20261126
MAX_PROMPT_TOKENS = 1000  # pairs whose judge prompt is longer are dropped, not truncated

SYSTEM = (
    "Please act as an impartial judge and evaluate the quality of the responses "
    "provided by two AI assistants to the user question displayed below. You should "
    "choose the assistant that follows the user's instructions and answers the user's "
    "question better. Your evaluation should consider factors such as the helpfulness, "
    "relevance, accuracy, depth, creativity, and level of detail of their responses. "
    "Avoid any position biases and ensure that the order in which the responses were "
    "presented does not influence your decision. Do not allow the length of the "
    "responses to influence your evaluation. Do not favor certain names of the "
    "assistants. Be as objective as possible."
)

USER = (
    "[User Question]\n{question}\n\n"
    "[The Start of Assistant A's Answer]\n{a}\n[The End of Assistant A's Answer]\n\n"
    "[The Start of Assistant B's Answer]\n{b}\n[The End of Assistant B's Answer]\n\n"
    'Which assistant answered better? Reply with a single letter: "A" or "B".'
)


def load_pairs():
    """Unique turn-1 pairs with at least one non-tie human vote."""
    ds = load_dataset(DATASET, split="human")
    votes = defaultdict(list)
    first = {}
    for r in ds:
        if r["turn"] != 1:
            continue
        key = (r["question_id"], r["model_a"], r["model_b"])
        votes[key].append(r["winner"])
        first[key] = r
    pairs = []
    for key in sorted(votes):
        if all(v == "tie" for v in votes[key]):
            continue
        r = first[key]
        # turn-1 rows carry the whole two-turn chat; only the first exchange was judged
        pairs.append(
            {
                "key": "|".join(map(str, key)),
                "question": r["conversation_a"][0]["content"],
                "a": r["conversation_a"][1]["content"],
                "b": r["conversation_b"][1]["content"],
                "votes": votes[key],
            }
        )
    return pairs


def build_prompt(tok, question, x, y):
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": USER.format(question=question, a=x, b=y)},
    ]
    return tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--subset", type=int, default=0, help="random subset size (seeded)")
    ap.add_argument("--limit", type=int, default=0, help="stop after N pairs (benchmarking)")
    ap.add_argument("--threads", type=int, default=4)
    args = ap.parse_args()

    torch.set_num_threads(min(args.threads, 4))
    tok = AutoTokenizer.from_pretrained(args.model)
    id_a = tok.encode("A", add_special_tokens=False)
    id_b = tok.encode("B", add_special_tokens=False)
    assert len(id_a) == 1 and len(id_b) == 1, (id_a, id_b)
    id_a, id_b = id_a[0], id_b[0]

    pairs = load_pairs()
    for p in pairs:
        p["n_tokens"] = len(tok(build_prompt(tok, p["question"], p["a"], p["b"])).input_ids)
    kept = [p for p in pairs if p["n_tokens"] <= MAX_PROMPT_TOKENS]
    print(f"pairs with a non-tie vote: {len(pairs)}; within {MAX_PROMPT_TOKENS} tokens: {len(kept)}", flush=True)
    if args.subset:
        rng = random.Random(SEED)
        kept = sorted(rng.sample(kept, args.subset), key=lambda p: p["key"])
        print(f"seeded subset: {len(kept)}", flush=True)
    if args.limit:
        kept = kept[: args.limit]

    done = set()
    if os.path.exists(args.out):
        with open(args.out) as f:
            done = {json.loads(line)["key"] for line in f}
    todo = [p for p in kept if p["key"] not in done]
    print(f"already scored: {len(done)}; to score: {len(todo)}", flush=True)

    model = AutoModelForCausalLM.from_pretrained(args.model, torch_dtype=torch.float32)
    model.eval()

    t0 = time.time()
    with open(args.out, "a") as out, torch.inference_mode():
        for i, p in enumerate(todo):
            rec = {"key": p["key"], "n_tokens": p["n_tokens"], "votes": p["votes"]}
            for order, (x, y) in enumerate([(p["a"], p["b"]), (p["b"], p["a"])]):
                ids = tok(build_prompt(tok, p["question"], x, y), return_tensors="pt")
                logits = model(**ids, logits_to_keep=1).logits[0, -1].float()
                logp = torch.log_softmax(logits, dim=-1)
                rec[f"margin{order + 1}"] = (logits[id_a] - logits[id_b]).item()
                rec[f"mass{order + 1}"] = (logp[id_a].exp() + logp[id_b].exp()).item()
            out.write(json.dumps(rec) + "\n")
            out.flush()
            if (i + 1) % 10 == 0 or i + 1 == len(todo):
                el = time.time() - t0
                print(f"{i + 1}/{len(todo)} pairs, {el:.0f}s elapsed, load {os.getloadavg()[0]:.1f}", flush=True)


if __name__ == "__main__":
    main()
