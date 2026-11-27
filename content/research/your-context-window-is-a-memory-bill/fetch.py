"""Download the exact config.json files (pinned by commit) and parameter counts.

Standard library only. Writes configs/<name>.json and configs/params.json.
Run: python3 fetch.py
"""
import json
import urllib.request
from pathlib import Path

# name -> (repo, commit sha, pinned on 2026-11-14)
MODELS = {
    "Llama-2-7B": ("NousResearch/Llama-2-7b-hf", "8efe6c9b93655b934e27bd9981e3ec13e55aee9d"),
    "Mistral-7B-v0.3": ("mistralai/Mistral-7B-v0.3", "caa1feb0e54d415e2df31207e5f4e273e33509b1"),
    "Qwen2.5-7B": ("Qwen/Qwen2.5-7B", "d149729398750b98c0af14eb82c78cfe92750796"),
    "Llama-3.1-8B": ("unsloth/Meta-Llama-3.1-8B", "e9a141a2091ea561b96483212645a2a05e6f99fc"),
    "Llama-3.1-70B": ("unsloth/Llama-3.1-70B", "99f146c778e0de3b687d83191faf41e49198f2ca"),
    "Qwen2.5-72B": ("Qwen/Qwen2.5-72B", "efba10c8e54e91e0d9570ab5f7b51a958474d4cb"),
}

out = Path(__file__).parent / "configs"
out.mkdir(exist_ok=True)
params = {}
for name, (repo, sha) in MODELS.items():
    url = f"https://huggingface.co/{repo}/raw/{sha}/config.json"
    with urllib.request.urlopen(url) as r:
        (out / f"{name}.json").write_bytes(r.read())
    with urllib.request.urlopen(f"https://huggingface.co/api/models/{repo}/revision/{sha}") as r:
        meta = json.load(r)
    params[name] = {
        "repo": repo,
        "commit": sha,
        "config_url": url,
        "parameters": meta["safetensors"]["total"],
    }
    print(name, params[name]["parameters"])
(out / "params.json").write_text(json.dumps(params, indent=2) + "\n")
