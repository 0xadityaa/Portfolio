# What 4-Bit Quantization Actually Costs You

- Topic issue: none (assigned in chat as post 6 of the AI-engineering series; syllabus topic only, no lesson content used)
- Format: essay
- Thesis: 4-bit weight quantization is close to a free lunch on memory, but the quality bill isn't zero and isn't spread evenly. Rounding damage concentrates in a few input channels, which is why naive rounding hurts and why GPTQ and AWQ exist. Size the model to the card first, then check quality on your own task.
- Reader: an engineer who runs or plans to run open-weight models on their own GPU, has seen "int4" and "GPTQ" in model names, and has read the KV cache post in this series.

## What this adds

Prior art on the same subject:

- GPTQ, https://arxiv.org/abs/2210.17323 (Table 3: OPT perplexity under 4-bit RTN and GPTQ across sizes).
- AWQ, https://arxiv.org/abs/2306.00978 (Table 1: keep 1% of weights in fp16, chosen by activation, by weight, or at random).
- LLM.int8(), https://arxiv.org/abs/2208.07339 (emergent outlier feature dimensions from about 6.7B parameters).
- An empirical study of Llama 3 quantization, https://arxiv.org/abs/2404.14047 (RTN, GPTQ, AWQ at 4 bits on Llama 3 8B and 70B).

What this post adds: the memory arithmetic with scale and zero-point overhead and the unquantized embeddings counted, for four real configs against three card sizes with KV room; and a laptop-CPU rerun of the AWQ-style question (where does the error go?) on a model small enough for the reader to repeat, including the result that the largest weights carry only about 1% to 2% of the rounding error.

## Artifact

`content/research/what-4-bit-quantization-actually-costs/`: `fetch.py`, `memory.py`, `quant_experiment.py`, `make_diagram.py`, pinned `configs/`, raw outputs, `EXPECTATION.txt`, README with commands.

Expectation, written before running (full text in `EXPECTATION.txt`): 8-bit to 4-bit multiplies relative weight error by roughly 16; per-tensor worse than per-channel worse than group-128; the top 1% of weights by magnitude carry 5% to 15% of the squared error under per-tensor rounding; fp32 perplexity on WikiText-2 around 13 to 15; int8 within 1% of baseline; int4 g128 10% to 40% worse; per-tensor int4 catastrophic (hundreds or more); 70B at int4 fits a 48 GB card with a few GB spare and 32B at int4 fits 24 GB.

Environment: Python 3.12.8, torch 2.7.1, transformers 4.52.4, safetensors 0.5.3, numpy 2.3.1, pandas 2.2.3, pyarrow 19.0.1, Apple M2 (8 cores, 16 GB), CPU only, run 2026-11-14. Model: Qwen/Qwen2.5-0.5B at commit 060db6499f32faf8b98477b0a26969ef7d8b9987 (sha256 of `model.safetensors` in the artifact README). Data: Salesforce/wikitext `wikitext-2-raw-v1` at commit b08601e04326c79dfdd32d625aee71d232d685c3.

Commands (from the artifact folder; details in its README):

```bash
python3 fetch.py
python3 -I memory.py > output-memory.txt
python3 -I quant_experiment.py weights     > output-weights.txt       # 2.5 min
python3 -I quant_experiment.py activations > output-activations.txt   # 8 min
python3 -I quant_experiment.py ppl         > output-ppl.txt           # about 10 min
```

Raw output, abridged to what the post uses (full files in the folder):

```text
# output-weights.txt
scheme            rel. error  mean per-matrix   top 1% weights: share of error
int8 tensor            4.73%            3.61%                            1.02%
int8 channel           0.91%            0.91%                            1.96%
int8 g128              0.64%            0.65%                            2.21%
int4 tensor           69.40%           54.49%                            1.07%
int4 channel          15.35%           15.34%                            1.95%
int4 g128             10.79%           11.02%                            2.19%
int4 tensor+keep1%      10.84%           11.21%                            0.00%
weights max|w|/rms by type (median of 24 layers): 6.5 (v_proj) to 23.8 (down_proj); top 1% hold 10.7% to 16.3% of sum w^2

# output-activations.txt (output error ||X dW^T|| / ||X W^T||, 2,048 train tokens)
scheme          none    keep 1% weights  keep 1% channels (act)  keep 1% channels (random)
int4 tensor   50.68%        8.21%              39.88%                  50.38%
int4 channel  10.79%        7.73%               8.39%                  10.73%
int4 g128      8.21%        6.82%               6.42%                   8.16%
int8 tensor    3.51%   int8 channel 0.64%   int8 g128 0.49%
share of activation-weighted error in top 1% channels (by mean x^2): int4 tensor 30.4%, channel 38.6%, g128 38.4%

# output-ppl.txt (8 windows x 1,024 tokens, 8,184 scored tokens)
fp32 (bf16 upcast)      17.17
int8 tensor             17.75  (+3.4%)
int8 channel            17.19  (+0.1%)
int8 g128               17.18  (+0.1%)
int4 tensor             10,816,107.81
int4 channel            31.76  (+85.0%)
int4 g128               20.49  (+19.4%)
int4 tensor + keep 1%   20.89  (+21.7%)

# output-memory.txt (GiB of weights; 2 GiB reserve assumed)
Llama-3.1-8B  15.0 / 8.6 / 5.3     Qwen2.5-14B  27.5 / 15.5 / 9.3
Qwen2.5-32B   61.0 / 32.6 / 18.0   Llama-3.1-70B 131.4 / 69.2 / 37.0   (fp16 / int8 g128 / int4 g128)
70B int4: 48 GB card 5.7 GiB room (0 users at 32k, about 18k tokens for one); 80 GB card 35.5 GiB (3 users)
32B int4: 24 GB card 2.4 GiB room (0 users at 32k, about 10k tokens for one)
```

Did the expectation hold?

- Held: 8-bit to 4-bit multiplied g128 error by 17 (0.64% to 10.79%). Granularity order per-tensor > per-channel > g128 at both widths. int8 channel and g128 within 0.1% of baseline perplexity. int4 g128 at +19.4% (inside my 10% to 40% band). Per-tensor int4 catastrophic. 70B int4 on 48 GB and 32B int4 on 24 GB fit as weights.
- Wrong, and the post says so: the top 1% of weights carry 1.07% to 2.19% of the squared error, not 5% to 15%. Rounding error per weight is about the same size whatever the weight's value, so large weights do not collect error; they cause it indirectly by stretching the range (the keep-1% row shows this). The concentration shows up instead in input channels weighted by activation (38%).
- Wrong in magnitude: per-tensor int4 weight error was 69.4%, not 10% to 20%; int8 per-tensor was 4.7%, not 0.5% to 1%; the fp32 baseline perplexity is 17.17, not 13 to 15 (non-overlapping 1,024-token windows, no stride, so each window starts with no context); per-tensor int4 perplexity is 10.8 million, not hundreds.
- Memory: left a few GB on 70B at int4 (5.7 GiB) as expected, but that is only about 18k tokens of cache for one user, which I had not worked out beforehand.

Limits of the artifact: round-to-nearest only (no GPTQ or AWQ run); fake quantization with fp32 scales; layers measured independently on clean inputs; one perplexity run on 8,184 scored tokens, no error bars; one small model of one family; the channel-share figure ignores cross terms; the 2 GiB reserve is an assumption; keep-1% rows do not count index storage.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| OPT perplexity table: fp16 27.65 / 14.63 / 9.34 / 8.34, RTN-4bit 37.28 / 48.17 / 110 / 10.54, GPTQ-4bit 31.12 / 15.47 / 9.55 / 8.37 (125M / 1.3B / 66B / 175B) | https://arxiv.org/abs/2210.17323 Table 3 (read from the PDF text) | 1 | 2026-11-14 |
| GPTQ's RTN baseline is per-row asymmetric min-max; RTN-4bit 175B is worse than fp16 13B | https://arxiv.org/abs/2210.17323 (experiments section) | 1 | 2026-11-14 |
| Group-128 layout is fp16 scale plus a zero point at the weight width | https://arxiv.org/abs/2210.17323 (extreme quantization paragraph, stated for 2-bit; I extend it to 4 and 8 bits) | 1 | 2026-11-14 |
| AWQ Table 1 (INT3 g128, OPT-6.7B): fp16 10.86, RTN 23.54, 1% by activation 11.39, 1% by weight 22.37, 1% random 24.23 | https://arxiv.org/abs/2306.00978 Table 1 | 1 | 2026-11-14 |
| LLM.int8(): outlier feature dimensions emerge from about 6.7B parameters, about 0.1% of dimensions, kept in 16-bit | https://arxiv.org/abs/2208.07339 | 1 | 2026-11-14 |
| Llama 3 8B WikiText-2 4-bit g128: fp16 6.1, RTN 8.5, GPTQ 6.5, AWQ 6.6; 70B: 2.9, 3.6, 3.3, 3.3 | https://arxiv.org/abs/2404.14047 Tables 1 and 2 | 1 | 2026-11-14 |
| Same study: 4-bit drop described as slight (about 2% across its metrics); 70B robust; abstract says non-negligible degradation, especially at ultra-low bit widths | https://arxiv.org/abs/2404.14047 | 1 | 2026-11-14 |
| NF4 is an information-theoretically optimal type for normally distributed weights (per its authors) | https://arxiv.org/abs/2305.14314 abstract | 1 | 2026-11-14 |
| Card memory: RTX 4090 24 GB GDDR6X; L40S 48GB GDDR6; H100 80GB | https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/ , https://www.nvidia.com/en-us/data-center/l40s/ , https://www.nvidia.com/en-us/data-center/h100/ | 1 | 2026-11-14 |
| Layers, kv heads, head_dim, hidden and intermediate size; parameter counts | pinned config.json URLs and `configs/params.json` (HF API at the same commits) | 1 | 2026-11-14 |
| KV bytes per token = 2 x layers x kv_heads x head_dim x bytes | post/your-context-window-is-a-memory-bill (derived there, checked against the PagedAttention paper) | 1 | 2026-11-14 |
| Qwen2.5-0.5B weights, WikiText-2 | https://huggingface.co/Qwen/Qwen2.5-0.5B , https://huggingface.co/datasets/Salesforce/wikitext (pinned commits in the artifact README) | 1 | 2026-11-14 |
| Weight error by top-1% share, output error, perplexity, memory table | my artifact output | derived | 2026-11-14 |
| The Llama mirrors (unsloth) carry Meta's architecture fields | my reading of the config files; Meta's repos are gated | 3 | 2026-11-14 |
| That unquantized embeddings and head stay fp16 in typical quantized checkpoints | my modelling assumption, stated in the post; not sourced | n/a | |

Fourteen of the sixteen rows cite a primary source or derive from the artifact; one is tier 3 and one is a stated assumption.

## Counter-argument

Steelman: 4-bit is effectively free. GPTQ loses 0.03 perplexity on OPT-175B; the Llama 3 study calls the 4-bit drop slight (about 2% across its metrics) and the 70B robust; calibrated methods (GPTQ, AWQ) recover most of what round-to-nearest loses; practitioners run 4-bit models routinely. So "it isn't free" overstates.

The post says: fair on large models and on perplexity-style benchmarks, and the post quotes those results. It breaks for small models (GPTQ's own 125M row loses 3.5 points; my 0.5B model loses 19% under RTN), for long-context or reasoning tasks (not tested by me or cited), and for your own task distribution (calibration text is not your data). Weight-only quantization also leaves KV cache and activations at full size, which the memory table shows. The post also notes that in the Llama 3 tables 4-bit GPTQ still costs about 7% (8B) and 14% (70B) perplexity at one-decimal precision, which sits uneasily with "about 2%". I report both and do not reconcile them; the 2% is the authors' summary across metrics, and I did not read their accuracy tables.

## From Aditya

Nothing. The post uses no first-person past-tense experience beyond the artifact ("I ran", "I measured"). The opening is the experiment itself.

## Outline

1. Opening: the experiment (0.5B model rounded to 4 bits, per-tensor vs g128), the gap as the thesis, link to the KV cache post. Bold thesis sentence.
2. The short version (four bullets).
3. How much memory does 4-bit save? Bits-per-weight arithmetic, unquantized embeddings, table of four models. Diagram `public/images/blog/weight-memory-vs-cards.svg`: bars of weight memory by precision for four models against 24/48/80 GB lines, 70B int4 in accent (carries "one card instead of two").
4. Which of these fit on a card? Table of KV room and users at 32k; the zeros; modelling note on 32k.
5. Where does the rounding error go? Method, results table, three findings; the expectation that was wrong; the keep-1% row.
6. Which weights matter then? LLM.int8(), AWQ Table 1, my channel-share table, my own keep-1% numbers and where they differ from AWQ.
7. What does it cost in perplexity at real sizes? GPTQ Table 3 subset, Llama 3 table.
8. Where I'd stop trusting this post: steelman, four places it breaks, what I did not do.
9. The takeaway: decision rule and what would change my mind.

Self-check against `docs/blog/style.md`:

1. Thesis in the first 150 words: the bold "My claim" paragraph, after the experiment opening (about word 130 to 190; the first paragraph already states the 69% vs 19% result and "That gap is the post").
2. Artifact: `quant_experiment.py` and `memory.py`, linked in section 3, with tables and the SVG.
3. Numbers with sources and dates: paper numbers link arXiv; cards link NVIDIA (dated 14 November 2026 in the text); model sizes link pinned configs; the rest come from artifact output. The "three volumes" requirement is cost-oriented; here it is four model sizes against three card sizes.
4. Links as evidence trail: about 20 external links in about 2,200 words.
5. Limits: "Where I'd stop trusting this post" gives the strongest objection with links, four places it breaks, and what was not tested.
6. Ending that adds: decision rule (largest model at int4 g128 with KV room, prefer int8 if it fits, test on own prompts) plus what would change my mind and the next measurement.

## Open questions

- Does Aditya run quantized models himself (llama.cpp, vLLM, Ollama)? A real "what I saw" line or a measured memory figure would strengthen the post. None is invented.
- The closing says "Next I'll run both [GPTQ and AWQ] on this same model". That is a commitment in his name; keep or cut?
- The links to /blog/your-context-window-is-a-memory-bill and /blog/your-eval-set-is-too-small-to-tell resolve only once those posts are live.
- The Llama 3 "about 2%" summary is the paper's own phrase across PPL and CommonsenseQA; I did not read the accuracy tables. Worth a read before publishing.
- Scheduled publish date: `publishedAt: '2026-11-14'` is a placeholder; planned slot Tue 29 December.

## Left out

- Running GPTQ and AWQ on the same model (needs calibration code or the libraries; the obvious follow-up).
- NF4 and other non-uniform grids; fp8 and 6-bit weights.
- Activation quantization (W8A8, SmoothQuant) and KV cache quantization.
- Real int4 kernel speed (Marlin, AWQ kernels) and whether memory savings turn into decode speed.
- Mixed bit-width schemes and per-layer sensitivity.
