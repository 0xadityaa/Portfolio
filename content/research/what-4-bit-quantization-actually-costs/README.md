# 4-bit quantization: memory arithmetic and a rounding experiment

The artifact behind the post "What 4-Bit Quantization Actually Costs You". Two parts:

1. `memory.py`: weight memory at fp16, int8 and int4 (group size 128) for four real model configs, against 24, 48 and 80 GB cards. Standard library only.
2. `quant_experiment.py`: plain round-to-nearest (RTN) quantization of every transformer-block linear weight in Qwen2.5-0.5B on CPU: reconstruction error, where the error lands, output error on real activations, and WikiText-2 perplexity.

Written and run on 2026-11-14: Python 3.12.8, torch 2.7.1, transformers 4.52.4, safetensors 0.5.3, numpy 2.3.1, pandas 2.2.3, pyarrow 19.0.1, Apple M2 (8 cores, 16 GB), CPU only.

## Commands

```bash
python3 fetch.py --configs-only        # optional: re-download the four configs (pinned)
python3 -I memory.py > output-memory.txt
python3 -I memory.py --json > memory.json

python3 fetch.py                       # downloads ~1 GB of weights and WikiText-2 to /private/tmp/claude-501/quant (not committed)
python3 -I quant_experiment.py weights     > output-weights.txt       # about 2.5 minutes
python3 -I quant_experiment.py activations > output-activations.txt   # about 10 minutes
python3 -I quant_experiment.py ppl         > output-ppl.txt           # see output for time
```

`-I` is Python's isolated mode; it keeps the interpreter from importing anything from the current directory or environment while it reads downloaded files. Each subcommand also writes `results-*.json`.

## Pinned inputs

| What | Where |
| --- | --- |
| Model weights | https://huggingface.co/Qwen/Qwen2.5-0.5B at commit `060db6499f32faf8b98477b0a26969ef7d8b9987` (`model.safetensors`, sha256 `88c142557820ccad55bb59756bfcfcf891de9cc6202816bd346445188a0ed342`, 988,097,824 bytes) |
| WikiText-2 | https://huggingface.co/datasets/Salesforce/wikitext, `wikitext-2-raw-v1`, dataset commit `b08601e04326c79dfdd32d625aee71d232d685c3`. Test split for perplexity, train split for the activation calibration |
| Memory configs | `configs/params.json` holds the repo, commit, config URL and parameter count of each model. The two Llama repos are the `unsloth` mirrors (Meta's are gated) |

## Method and what it leaves out

- RTN, asymmetric, min/max range, no calibration and no error correction. This is the naive baseline GPTQ and AWQ are written against. I did not run GPTQ or AWQ.
- Fake quantization: weights are rounded to the integer grid and dequantized to fp32. The numbers are the error the grid causes, not the behaviour of a real int4 kernel. Scales and zero points stay fp32 (checkpoints store fp16).
- Quantized: the 168 linear matrices inside the 24 blocks (357.8M of 494M parameters). Embeddings, norms and biases are untouched.
- "tensor" is one scale per matrix, "channel" one per output row, "g128" one per 128 consecutive input weights. "keep 1%" leaves the top 1% of entries (by weight magnitude, or by input-channel activation) exact and picks the range from the rest. Its storage cost (values plus indices) is not counted in the memory table.
- The activation experiment feeds each matrix the clean fp32 input the unquantized model produces. Errors do not propagate between layers, so it understates what a whole quantized model does.
- Perplexity: non-overlapping 1,024-token windows of the WikiText-2 test text (joined with blank lines), first N windows only. The baseline is the bf16 checkpoint upcast to fp32.
- Memory arithmetic: see the docstring of `memory.py`. The 2 GiB reserve for activations and overhead is my assumption, not a measurement.

## Files

- `EXPECTATION.txt`: written before running anything.
- `fetch.py`, `memory.py`, `quant_experiment.py`: the code.
- `configs/`: pinned configs and parameter counts.
- `output-*.txt`, `results-*.json`, `memory.json`: raw outputs.
- `social.md`: social cuts for the post.
