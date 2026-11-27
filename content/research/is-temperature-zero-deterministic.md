# Is Temperature Zero Deterministic?

- Topic issue: none (series post #11 from the AI-engineering syllabus; the syllabus site was used as a topic list only)
- Format: essay
- Thesis: Temperature zero makes the final pick deterministic, not the answer. The logits underneath can move with batch shape, and the top token isn't always right.
- Reader: an engineer who sets `temperature=0` and assumes identical, best-available output from an LLM, in tests, evals or caches.

## What this adds

Prior art is strong. Thinking Machines' [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/) explains the batch-invariance cause and measures 80 unique completions in 1,000 at temperature 0. Renze and Guven's [paper](https://arxiv.org/abs/2402.05201) finds no significant accuracy effect from temperature 0.0 to 1.0. The [self-consistency paper](https://arxiv.org/abs/2203.11171) shows sampling plus voting beating greedy chain-of-thought.

What this post adds: both questions answered on one small model you can rerun, with the numbers side by side. Accuracy across 50 questions against greedy with paired intervals, and 200 prompts alone against a padded batch in fp32 and bf16, including how close the top two logits were at the first divergence, and the bf16 spacing that explains it.

## Artifact

`content/research/is-temperature-zero-deterministic/`: see its `README.md` for the file list and commands.

### Expectation, written before running

Saved in `EXPECTATION.txt`. Items 1 to 3 were written on 2026-11-15 and items 4 and 5 on 2026-11-26, before the 50-question and 200-prompt runs. In short: greedy within a point or two of the best on 50 questions with T=0.7 five to ten points lower; fp32 flips 0 to 5 of 200 prompts and bf16 20 to 80; max logit difference about 1e-5 (fp32) and 1e-1 (bf16) between batch sizes.

### Commands

See `README.md` step 3. The final accuracy numbers come from the first pass plus a rerun of four questions (`REDO=2,20,21,43 NEW_REDO=24`).

### Environment

Apple silicon CPU, macOS (Darwin 25.5.0), Python 3.12.8, torch 2.7.1, transformers 4.52.4, numpy 2.5.5, Qwen2.5-0.5B-Instruct, 4 threads. Load average at the start 19.7 to 20.4, up to 96 to 110 during one hand-off; every before and after reading is in `run-load.txt`.

### Raw output

`output-sweep50-redo.txt` (final accuracy summary), `output-sweep50.txt` (first pass), `output-determinism.txt`, `output-logit-scale.txt`, `output-sample.txt`, `output-dist.txt`. Headline excerpts:

```text
mean accuracy over 50 questions, 95% bootstrap interval over questions
  greedy           0.740  [0.620, 0.860]
  T=0.7            0.707  [0.607, 0.801]
difference from greedy: T=0.7 -0.033 [-0.083, +0.016]; T=1.0 -0.093 [-0.158, -0.031]
=== d) fp32: 0 of 200 changed (95% Wilson 0.000 to 0.019)
=== d) bf16: 75 of 200 changed (95% Wilson 0.311 to 0.444)
gap at first differing token, bf16: 0.0 x43, 0.125 x30, 0.25 x2
```

### Did the expectation hold?

Partly. Wrong: T=0.7 was predicted five to ten points under greedy and landed 3.3 under (interval -8.3 to +1.6), and the logit difference between batch sizes was predicted near 1e-5 and 1e-1 but was exactly 0 for identical rows in both precisions. Right: fp32 flipped 0 of 200 (predicted 0 to 5), bf16 flipped 75 (predicted 20 to 80), flips began at near ties, T=1.5 collapsed accuracy. The prediction that 3 to 8 questions were greedy-wrong but sampling-right at 20% or better was close: 5.

Known flaws in the run: the first 50-question pass scored the correct answer "Brasília" as wrong (accent stripping in the normaliser) and cut three greedy answers off at 8 tokens. After the fix, those four questions were rerun at 24 tokens with the same seeds, and the other 46 were left as they were. The first pass was also restarted once, from 50 samples per setting to 30, because load made it about 190 s per question.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Qwen3-235B at temperature 0, 1,000 completions: 80 unique; first 102 tokens match, then 992 "Queens, New York" and 8 "New York City"; cause is lack of batch invariance; batch-invariant kernels give 1,000 identical | https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/ (10 Sept 2025, Horace He and others) | 1 | 2026-11-26 |
| Even at temperature 0 results are not fully deterministic, first-party and third-party | https://platform.claude.com/docs/en/about-claude/glossary | 1 | 2026-11-26 |
| Claude Opus 5.5: omit `temperature`, `top_p`, `top_k`; temperature 0 never guaranteed identical outputs | https://platform.claude.com/docs/en/models/opus-5-5/migration-guide | 1 | 2026-11-27 |
| vLLM does not guarantee reproducibility by default, "for the sake of performance"; batch invariance is the route for online serving | https://docs.vllm.ai/en/latest/usage/reproducibility.html | 1 | 2026-11-26 |
| No significant accuracy effect for temperature 0.0 to 1.0 (abstract) | https://arxiv.org/abs/2402.05201 (Renze and Guven, 2024) | 1 | 2026-11-26 |
| Self-consistency: +17.9% on GSM8K over greedy chain-of-thought (abstract) | https://arxiv.org/abs/2203.11171 (Wang et al., ICLR 2023) | 1 | 2026-11-26 |
| Qwen2.5-0.5B-Instruct ships temperature 0.7, top-p 0.8, top-k 20, repetition penalty 1.1 | `generation_config.json` of the downloaded model; model page https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct | 1 | 2026-11-27 |
| Accuracy table, 13 greedy-wrong questions, batch flips, gap histogram, bf16 spacing, summation-order spread | artifact outputs | artifact | 2026-11-27 |
| bf16 spacing is 0.125 for values in 16 to 32 (8 significant bits) | `output-logit-scale.txt`, and $$2^4 \times 2^{-7}$$ | artifact | 2026-11-27 |
| Counter: determinism is fixable with batch-invariant kernels | Thinking Machines, as above | 1 | 2026-11-26 |
| Earlier post linked: Is Your Eval Too Small? | `content/blog/your-eval-set-is-too-small-to-tell.md` on main | repo | 2026-11-27 |

I did not read the Thinking Machines post's performance numbers, so the post makes no claim about the speed cost. The OpenAI reproducible-outputs page returned 404 on the URLs tried and is not cited. The Holtzman et al. abstract (likelihood decoding gives bland, repetitive text) was read but is not used in the post.

## From Aditya

Nothing needed beyond the artifact. First-person statements in the post are about the experiment ("I ran", "I predicted", "I was wrong").

## Outline

Thesis. Short version (4 bullets). What temperature does (softmax formula, numbers). Does temperature zero give the best answer (table, figure 1, 13 against 37 split). Is it repeatable (summation order, identical rows, padded batch, figure 2). Why bf16 flips (spacing, figure 3). Real APIs (Thinking Machines, Anthropic, vLLM). Where I'd stop trusting this post. The takeaway.

Where the six things from `style.md` are: thesis in the bold sentence after the opening; artifact is the folder linked throughout; numbers with sources are linked inline and in the table above; links are the evidence trail (18 external); limits are the "Where I'd stop trusting" section; the ending is "The takeaway".

## Open questions

None.

## Left out

Top-p and voting arms at 50 questions, a padding-versus-shape isolation run (fixed-length prompts in a batch), and the Holtzman repetition angle for long greedy text.
