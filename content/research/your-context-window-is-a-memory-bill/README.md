# KV cache calculator

The artifact behind the post "Your Context Window Is a Memory Bill". It reads real Hugging Face `config.json` files and computes KV cache size and how many full-length sequences fit on an 80 GB GPU.

Python 3 standard library only, so there is no virtualenv to create. Run from this folder (written on Python 3.12.8):

```bash
python3 fetch.py                                   # optional: re-download configs (pinned by commit)
python3 kv_cache.py > output-1gpu.txt              # one 80 GB GPU, fp16 cache
python3 kv_cache.py --gpus 4 > output-4gpu.txt     # four GPUs pooled (idealised)
python3 kv_cache.py --bytes 1 > output-fp8-kv-1gpu.txt   # one byte per cached value (fp8 KV)
```

## Files

- `configs/*.json`: the exact `config.json` files, fetched 2026-11-14 at the commits below.
- `configs/params.json`: repo, commit, config URL, and parameter count (Hugging Face API `safetensors.total` for that commit).
- `fetch.py`, `kv_cache.py`: the scripts.
- `output-*.txt`: raw output of the three runs above.
- `social.md`: social cuts for the post.

## Config sources

| Name | Config at pinned commit |
| --- | --- |
| Llama-2-7B | https://huggingface.co/NousResearch/Llama-2-7b-hf/blob/8efe6c9b93655b934e27bd9981e3ec13e55aee9d/config.json |
| Mistral-7B-v0.3 | https://huggingface.co/mistralai/Mistral-7B-v0.3/blob/caa1feb0e54d415e2df31207e5f4e273e33509b1/config.json |
| Qwen2.5-7B | https://huggingface.co/Qwen/Qwen2.5-7B/blob/d149729398750b98c0af14eb82c78cfe92750796/config.json |
| Llama-3.1-8B | https://huggingface.co/unsloth/Meta-Llama-3.1-8B/blob/e9a141a2091ea561b96483212645a2a05e6f99fc/config.json |
| Llama-3.1-70B | https://huggingface.co/unsloth/Llama-3.1-70B/blob/99f146c778e0de3b687d83191faf41e49198f2ca/config.json |
| Qwen2.5-72B | https://huggingface.co/Qwen/Qwen2.5-72B/blob/efba10c8e54e91e0d9570ab5f7b51a958474d4cb/config.json |

The Llama repos are the `NousResearch` and `unsloth` mirrors, because Meta's own repos are gated. Their configs are the same architecture fields; the mirrors are not Meta's files.

## KV cache per user, all six models

One full-length user, fp16 cache, in GiB. "vs weights" is the 128k cache divided by the weights. Llama 2 7B was trained for 4,096 tokens and Mistral 7B v0.3's config says 32,768, so their longer rows are what-ifs.

| Model (kv heads) | KV per token | 4k | 32k | 128k | 128k vs weights |
| --- | --- | --- | --- | --- | --- |
| Llama 2 7B (32) | 512 KiB | 2.00 | 16.00 | 64.00 | 510% |
| Mistral 7B v0.3 (8) | 128 KiB | 0.50 | 4.00 | 16.00 | 119% |
| Qwen2.5 7B (4) | 56 KiB | 0.22 | 1.75 | 7.00 | 49% |
| Llama 3.1 8B (8) | 128 KiB | 0.50 | 4.00 | 16.00 | 107% |
| Llama 3.1 70B (8) | 320 KiB | 1.25 | 10.00 | 40.00 | 30% |
| Qwen2.5 72B (8) | 320 KiB | 1.25 | 10.00 | 40.00 | 30% |

## Method and what it leaves out

- KV bytes per token = 2 x `num_hidden_layers` x `num_key_value_heads` x `head_dim` x bytes per value. `head_dim` is the config field if present, else `hidden_size / num_attention_heads`. A missing `num_key_value_heads` means multi-head attention.
- Weights = parameters x 2 bytes (fp16/bf16).
- Budget = GPUs x 80 GB (decimal, as NVIDIA lists it); sizes are printed in GiB (2^30). "Seqs fit" = floor((budget - weights) / KV for one sequence).
- Not counted: activations, CUDA context, framework overhead, fragmentation, prefix sharing, offloading. Multi-GPU runs pool memory and ignore tensor-parallel replication costs.
- It computes sizes. It does not run any model.
