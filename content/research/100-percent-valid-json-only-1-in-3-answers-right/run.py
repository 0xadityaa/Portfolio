"""Four-arm structured-output run on Qwen2.5-0.5B-Instruct, CPU, greedy decoding.

usage: python run.py ARM [--limit N] [--shots a|b] [--out PATH]
ARM: instr      instruction only, plain decoding
     fewshot    instruction + 3 worked examples, plain decoding
     instr_o    instruction only, constrained to the JSON schema with the outlines library
     fewshot_o  3 examples + constrained

Constrained decoding masks the logits of every token that cannot continue a schema-valid object,
then renormalises over what is left (the library does this per step from a compiled index).
"""
import json, sys, time, os, argparse
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

torch.set_num_threads(4)
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
MAX_NEW = 160
PRIORITIES = ["low", "medium", "high"]

SCHEMA = {
    "type": "object",
    "properties": {
        "customer": {"type": "string"},
        "product": {"type": "string"},
        "quantity": {"type": "integer"},
        "priority": {"enum": PRIORITIES},
        "refund": {"type": "boolean"},
    },
    "required": ["customer", "product", "quantity", "priority", "refund"],
    "additionalProperties": False,
}

INSTRUCTION = (
    "Extract these fields from the customer message and answer with JSON only.\n"
    "Fields:\n"
    "- customer: string, full name of the person who wrote the message\n"
    "- product: string, the product they are writing about (singular)\n"
    "- quantity: integer, how many units they ordered\n"
    "- priority: one of low, medium, high\n"
    "- refund: true if they want their money back, false if they want a replacement\n\n"
    "Message:\n"
)
SYSTEM = "You extract structured data from customer messages."


def compact(gold):
    return json.dumps(gold, separators=(",", ":"))


# ---------------------------------------------------------------- main
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("arm", choices=["instr", "fewshot", "instr_o", "fewshot_o"])
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--shots", default="a", choices=["a", "b"])
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    cases = [json.loads(l) for l in open(os.path.join(HERE, "cases.jsonl"))]
    shots = [c for c in cases if c["split"] == ("shots" if args.shots == "a" else "shots_b")]
    evals = [c for c in cases if c["split"] == "eval"]
    if args.limit:
        evals = evals[: args.limit]

    tok = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForCausalLM.from_pretrained(MODEL, torch_dtype=torch.float32).eval()
    vocab_size = model.config.vocab_size
    use_shots = args.arm.startswith("fewshot")
    library = args.arm.endswith("_o")
    if library:
        import outlines
        from outlines.types import JsonSchema
        gen_lib = outlines.Generator(outlines.from_transformers(model, tok), JsonSchema(json.dumps(SCHEMA)))

    def messages(text):
        m = [{"role": "system", "content": SYSTEM}]
        if use_shots:
            for s in shots:
                m += [{"role": "user", "content": INSTRUCTION + s["text"]},
                      {"role": "assistant", "content": compact(s["gold"])}]
        m.append({"role": "user", "content": INSTRUCTION + text})
        return m

    out_path = args.out or os.path.join(HERE, "results", f"raw_{args.arm}{'_b' if args.shots == 'b' else ''}.jsonl")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        for n, c in enumerate(evals):
            prompt = tok.apply_chat_template(messages(c["text"]), tokenize=False, add_generation_prompt=True)
            ids = tok(prompt, return_tensors="pt")
            plen = ids["input_ids"].shape[1]
            if library:
                if n == 0:  # build the library's index once, outside the timing
                    gen_lib(prompt, max_new_tokens=4, do_sample=False)
                t0 = time.time()
                text = gen_lib(prompt, max_new_tokens=MAX_NEW, do_sample=False)
                dt = time.time() - t0
                rec = {"id": c["id"], "gold": c["gold"], "output": text, "prompt_tokens": plen,
                       "new_tokens": len(tok(text)["input_ids"]), "seconds": round(dt, 3), "hit_max_tokens": False}
                f.write(json.dumps(rec) + "\n"); f.flush()
                if n % 10 == 0:
                    print(n, round(dt, 2), plen, rec["new_tokens"], repr(text[:90]), flush=True)
                continue
            t0 = time.time()
            with torch.no_grad():
                gen = model.generate(**ids, max_new_tokens=MAX_NEW, do_sample=False, temperature=None, top_p=None, top_k=None)
            dt = time.time() - t0
            new = gen[0, plen:]
            text = tok.decode(new, skip_special_tokens=True)
            rec = {"id": c["id"], "gold": c["gold"], "output": text, "prompt_tokens": plen,
                   "new_tokens": int(new.shape[0]), "seconds": round(dt, 3),
                   "hit_max_tokens": int(new.shape[0]) >= MAX_NEW}
            f.write(json.dumps(rec) + "\n"); f.flush()
            if n % 10 == 0:
                print(n, round(dt, 2), plen, int(new.shape[0]), repr(text[:90]), flush=True)
