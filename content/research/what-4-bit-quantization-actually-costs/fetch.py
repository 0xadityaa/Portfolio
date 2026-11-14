"""Download everything the experiment needs, pinned by commit.

Small files (the four model configs) go into ./configs and are committed.
The model weights and the WikiText-2 files go to DATA_DIR and are NOT committed.

    python3 fetch.py                 # configs + weights + data
    python3 fetch.py --configs-only  # just the configs (a few KB)

Standard library only.
"""
import argparse
import json
import pathlib
import urllib.request

HERE = pathlib.Path(__file__).parent
DATA_DIR = pathlib.Path("/private/tmp/claude-501/quant")

# Models used for the memory arithmetic. Configs are fetched at the commit the
# Hugging Face API reports for the repo today, then written to configs/params.json.
# The two Llama repos are mirrors (Meta's own repos are gated); the commits are the
# same ones the KV cache post pins.
MEMORY_MODELS = {
    "Llama-3.1-8B": ("unsloth/Meta-Llama-3.1-8B", "e9a141a2091ea561b96483212645a2a05e6f99fc"),
    "Qwen2.5-14B": ("Qwen/Qwen2.5-14B", None),
    "Qwen2.5-32B": ("Qwen/Qwen2.5-32B", None),
    "Llama-3.1-70B": ("unsloth/Llama-3.1-70B", "99f146c778e0de3b687d83191faf41e49198f2ca"),
}

# The model that is actually quantized.
QWEN_REPO = "Qwen/Qwen2.5-0.5B"
QWEN_COMMIT = "060db6499f32faf8b98477b0a26969ef7d8b9987"
QWEN_FILES = [
    "model.safetensors", "config.json", "tokenizer.json", "tokenizer_config.json",
    "vocab.json", "merges.txt", "generation_config.json",
]
WIKITEXT = "https://huggingface.co/datasets/Salesforce/wikitext/resolve/main/wikitext-2-raw-v1/"


def get(url):
    with urllib.request.urlopen(url) as r:
        return r.read()


def save(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        print("have", dest)
        return
    print("get ", url)
    dest.write_bytes(get(url))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--configs-only", action="store_true")
    args = ap.parse_args()

    (HERE / "configs").mkdir(exist_ok=True)
    params = {}
    for name, (repo, commit) in MEMORY_MODELS.items():
        info = json.loads(get(f"https://huggingface.co/api/models/{repo}"))
        commit = commit or info["sha"]
        info = json.loads(get(f"https://huggingface.co/api/models/{repo}/revision/{commit}"))
        cfg_url = f"https://huggingface.co/{repo}/resolve/{commit}/config.json"
        (HERE / "configs" / f"{name}.json").write_bytes(get(cfg_url))
        params[name] = {
            "repo": repo,
            "commit": commit,
            "config_url": f"https://huggingface.co/{repo}/blob/{commit}/config.json",
            "parameters": info["safetensors"]["total"],
        }
        print(name, commit, params[name]["parameters"])
    (HERE / "configs" / "params.json").write_text(json.dumps(params, indent=2) + "\n")

    if args.configs_only:
        return
    for f in QWEN_FILES:
        save(f"https://huggingface.co/{QWEN_REPO}/resolve/{QWEN_COMMIT}/{f}", DATA_DIR / "qwen" / f)
    for split in ("train", "test"):
        save(f"{WIKITEXT}{split}-00000-of-00001.parquet", DATA_DIR / "data" / f"wt2-{split}.parquet")


if __name__ == "__main__":
    main()
