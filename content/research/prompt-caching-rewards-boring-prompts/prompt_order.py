"""Where a per-request value sits decides how much of the prompt can be cached.

Caches match on an exact prefix. This renders the sample prompt (tools, then
system prompt, then user message: the order Anthropic documents) for two
different requests, tokenizes both with tiktoken o200k_base (a proxy: Claude and
Gemini tokenizers differ), and counts the longest run of identical leading
tokens. That run is the most any prefix cache could reuse.

Needs: tiktoken, numpy. The o200k_base vocabulary is downloaded and cached by
tiktoken on first use. Seeded.
"""
import json
import pathlib
import random

import numpy as np
import tiktoken

HERE = pathlib.Path(__file__).parent
ENC = tiktoken.get_encoding("o200k_base")
SYSTEM = (HERE / "sample" / "system_prompt.txt").read_text().rstrip("\n")
TOOLS = json.loads((HERE / "sample" / "tools.json").read_text())

NAMES = ["Priya Raman", "Tom Becker", "Aiko Tanaka", "Lena Fischer", "Marcus Webb", "Sofia Rossi",
         "Daniel Okafor", "Hannah Lindgren", "Carlos Mendes", "Mei Zhang"]
QUESTIONS = ["Where is my order 48213?", "Can I return a tent I opened?", "Which stove for winter trips?",
             "Do you ship to Norway?", "My boots arrived damaged.", "Is the 3-season tent OK in October?"]
MIN_ANTHROPIC = 512   # Claude Sonnet 5.5 minimum cacheable prompt (prompt caching docs, 2026-11-14)
MIN_OPENAI = 1024     # GPT-5.6 and later (prompt caching guide, 2026-11-14)
BASE, WRITE_UNUSED, READ = 2.0, 2.5, 0.10  # Sonnet 5.5, USD per MTok


def request_values(rng):
    h, m, s = rng.randrange(24), rng.randrange(60), rng.randrange(60)
    d = rng.randrange(1, 29)
    return {
        "block": f"Current time: 2026-11-{d:02d}T{h:02d}:{m:02d}:{s:02d}-05:00\nCustomer name: {rng.choice(NAMES)}",
        "question": rng.choice(QUESTIONS),
    }


def tools_text(shuffle_rng=None):
    tools = list(TOOLS)
    if shuffle_rng is not None:
        shuffle_rng.shuffle(tools)
    return json.dumps(tools, separators=(",", ":"))


def render(variant, v, rng):
    system, user = SYSTEM, v["question"]
    block = v["block"]
    shuffle = rng if variant == "tools_shuffled" else None
    if variant == "top_of_system":
        system = block + "\n\n" + SYSTEM
    elif variant == "middle_of_system":
        i = SYSTEM.index("# Return policy")
        system = SYSTEM[:i] + block + "\n\n" + SYSTEM[i:]
    elif variant in ("bottom_of_system", "tools_shuffled"):
        system = SYSTEM + "\n\n" + block
    elif variant == "in_user_message":
        user = block + "\n\n" + v["question"]
    return f"TOOLS:\n{tools_text(shuffle)}\n\nSYSTEM:\n{system}\n\nUSER:\n{user}"


def common_prefix(a, b):
    n = 0
    for x, y in zip(a, b):
        if x != y:
            break
        n += 1
    return n


def main():
    rng = random.Random(20261114)
    variants = ["top_of_system", "middle_of_system", "bottom_of_system", "in_user_message", "tools_shuffled"]
    tools_tokens = len(ENC.encode(f"TOOLS:\n{tools_text()}"))
    sys_tokens = len(ENC.encode(SYSTEM))
    print(f"sample prompt: tools {tools_tokens} tokens, system prompt {sys_tokens} tokens (o200k_base)")
    print(f"static content total: about {tools_tokens + sys_tokens} tokens\n")
    print(f"{'placement of the per-request block':<36}{'total':>7}{'mean prefix':>13}{'min':>6}{'max':>6}"
          f"{'% of total':>12}{'cached @512':>13}{'cached @1024':>14}{'$/MTok-prompt':>15}")
    pairs = 200
    for variant in variants:
        prefixes, totals = [], []
        for _ in range(pairs):
            ra, rb = rng.random(), rng.random()
            a = ENC.encode(render(variant, request_values(rng), random.Random(ra)))
            b = ENC.encode(render(variant, request_values(rng), random.Random(rb)))
            prefixes.append(common_prefix(a, b))
            totals.append((len(a) + len(b)) / 2)
        p, t = np.array(prefixes), float(np.mean(totals))
        eff512 = np.where(p >= MIN_ANTHROPIC, p, 0).mean()
        eff1024 = np.where(p >= MIN_OPENAI, p, 0).mean()
        cost = (eff512 * READ + (t - eff512) * BASE) / t  # USD per MTok of prompt, steady state, every request a read
        print(f"{variant:<36}{t:>7.0f}{p.mean():>13.0f}{p.min():>6d}{p.max():>6d}{p.mean() / t * 100:>11.1f}%"
              f"{eff512:>13.0f}{eff1024:>14.0f}{cost:>15.3f}")
    print("\n'mean prefix' is the longest identical run of leading tokens between two requests, averaged over "
          f"{pairs} random pairs.\n'cached @512' and '@1024' zero the prefix when it is shorter than the minimum "
          "cacheable length.\n'$/MTok-prompt' is the blended input price per million prompt tokens on Sonnet 5.5 "
          "($2.00 base, $0.10 read) if every request reads the cached prefix and pays base for the rest.")


if __name__ == "__main__":
    main()
