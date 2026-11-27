import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

torch.set_num_threads(int(os.environ.get("THREADS", "4")))
MODEL_DIR = os.environ.get("MODEL_DIR", "/private/tmp/claude-501/tempzero/model")


def load(dtype=torch.float32):
    tok = AutoTokenizer.from_pretrained(MODEL_DIR)
    tok.padding_side = "left"
    model = AutoModelForCausalLM.from_pretrained(MODEL_DIR, torch_dtype=dtype)
    model.eval()
    return tok, model


def chat(tok, user):
    msgs = [{"role": "user", "content": user}]
    return tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)


def entropy_bits(p):
    p = p[p > 0]
    return max(0.0, float(-(p * p.log2()).sum()))


def gen_kwargs(max_new_tokens, **extra):
    # Qwen's generation_config ships top_k=20, top_p=0.8, temperature=0.7,
    # repetition_penalty=1.1. Override all of them so we test plain sampling.
    kw = dict(max_new_tokens=max_new_tokens, top_k=0, top_p=1.0,
              repetition_penalty=1.0, temperature=1.0)
    kw.update(extra)
    return kw
