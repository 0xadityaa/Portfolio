# Is Few-Shot Worth the Tokens?

- Topic issue: none (series post #17, backlog order 9, topics M3 L1 chat template, template mismatch, token cost, and M3 L2 choosing examples)
- Format: essay
- Thesis: on a small model the shape of the prompt moves accuracy more than the number of examples in it; few-shot added a result inside the noise for 5.5 times the tokens, while a wrong chat template cost up to 41 points
- Reader: an engineer who builds prompts for open-weight models, pastes examples in by habit, and has never printed the string the model actually sees

## What this adds

- Zhao et al., [Calibrate Before Use](https://arxiv.org/abs/2102.09690): few-shot accuracy swings with format, example choice and order.
- Min et al., [Rethinking the Role of Demonstrations](https://arxiv.org/abs/2202.12837): demonstrations mostly supply label space, input distribution and format.
- Sclar et al., [Quantifying Language Models' Sensitivity to Spurious Features in Prompt Design](https://arxiv.org/abs/2310.11324): meaning-preserving format changes move accuracy by tens of points.
- Hugging Face, [Chat templates](https://huggingface.co/docs/transformers/en/chat_templating): what the template and the generation prompt are.

They study accuracy on larger models and many formats. This post prices the shots in tokens and dollars on one task and puts four template conditions, including the common wrong-model-card mistake, next to the shot counts in one table, reading the label logits so a broken template shows up as zero label mass instead of a silent wrong answer.

## Artifact

`content/research/is-few-shot-worth-the-tokens/`: `run.py` scores, `analyze.py`, `paired.py` and `cost.py` summarise, `make_figure.py` draws the figure. README has commands, versions, runtime and load readings.

**Expectation (written 2026-11-27, `EXPECTATION.txt`) against the result:**

| Expectation | Result |
| --- | --- |
| 0.5B about 65% at 0 shots, 75% at 3, 77% at 8 | 66.0% at 0, 65.3% at 3, 69.0% at 8. Gain at 8 shots not detectable (best set p = 0.065) |
| Spread across example sets 5+ points at 1 shot, shrinking at 8 | 6 points at 1 shot (61, 55, 59), 7 at 8 shots (66, 68, 73), 1 at 3 shots. It did not shrink |
| One shot should help a little | Wrong. 58.3%, all three sets below zero shots (p = 0.125, 0.001, 0.039) |
| Mismatch costs 2 to 8 points at 0 shots, mostly gone at 8 | Wrong. 41 points (no assistant header, 25.0%) and 35 points (Llama-2, 31.0%) at 0 shots. Llama-2 at 8 shots still 11 below on average, sets 66, 50, 58 |
| Llama-style and missing header hurt more than no template | Held, but no template did not hurt: it beat the own template, 70.0% vs 66.0% at 0 shots, 77.0% vs 69.0% at 8 |
| Cost: about 55 to 60 tokens a shot, 8 to 10x at 8 shots | About 52 tokens a shot, 5.5x (92 to 510 tokens) |
| Risk: 0.5B near the floor without a template | Held only for the two broken templates, where label mass is 0.000 |

**Command and environment.** See the README. Python 3.12, torch 2.7.1, transformers 4.52.4, pandas 2.2.3, fp32, 4 threads, shared machine (load 14 to 158 during the run). Qwen2.5-1.5B-Instruct was planned and not run.

**Raw output:** `output.txt`, `results.json`, `paired.txt`, `cost.txt`, `raw-0.5b.jsonl`.

**Design choices the post states:** 100 test articles, 25 per label, seeded; articles cut at 300 characters; examples from the training split at most 220 characters, 2 per label, nested; three example sets; mismatched templates at 0 and 8 shots only; label-logit scoring with label mass reported; Qwen token counts.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| AG News is `fancyzhx/ag_news`, ungated, licence listed `unknown`, revision eb185aad | https://huggingface.co/api/datasets/fancyzhx/ag_news | 1 | 2026-11-27 |
| Without the generation prompt "the model may get confused" and continue the user's message | https://huggingface.co/docs/transformers/en/chat_templating | 1 | 2026-11-27 |
| Few-shot GPT-3 accuracy swings with format, training examples and their order (abstract summary) | https://arxiv.org/abs/2102.09690 | 1 | 2026-11-27 |
| Randomly replacing labels barely hurts, across 12 models including GPT-3; performance tied to label space, input distribution and format (abstract summary) | https://arxiv.org/abs/2202.12837 | 1 | 2026-11-27 |
| Formatting changes shift accuracy by up to 76 points on LLaMA-2-13B (abstract summary) | https://arxiv.org/abs/2310.11324 | 1 | 2026-11-27 |
| Claude Sonnet 5.5: $2 per million input tokens, $0.10 per million cache hits | https://platform.claude.com/docs/en/about-claude/pricing | 1 | 2026-11-27 |
| All accuracy, token, label-mass, spread, paired and dollar numbers | `content/research/is-few-shot-worth-the-tokens/output.txt`, `paired.txt`, `cost.txt` | artifact | 2026-11-27 |
| Counter: few-shot matters more on larger models and harder tasks, so a null at 0.5B on AG News says little | https://arxiv.org/abs/2202.12837 (12 models including GPT-3) | 1 | 2026-11-27 |

Only the abstracts or summaries of the three papers were read, so the post attributes nothing beyond them.

## From Aditya

Nothing used. First-person statements in the post describe the artifact (what was run and measured).

## Outline

1. Opening: 66% to 69% for 5.5x the tokens, template bigger than shots. Bold thesis. Short version.
2. How the model was scored without generating (task, sets, formula, four templates, artifact links, results table).
3. Do more examples help (one shot hurts, 8 shots undetectable, label bias).
4. What a wrong template costs (25%, 31% to 58%, no template wins). Figure: accuracy against tokens.
5. What the tokens cost (formula, dollars at three volumes, cache link).
6. Where I'd stop trusting this post, the takeaway.

## Where each required thing is

1. Thesis in the first 150 words: the bold sentence in the third paragraph.
2. Artifact: `content/research/is-few-shot-worth-the-tokens/`, linked in the second paragraph, the method section and the figure caption.
3. Numbers with sources: artifact numbers link their files; prices link the pricing page with the checked date; papers link their abstracts.
4. Links: 18 distinct links including two earlier posts.
5. Limits: "Where I'd stop trusting this post".
6. Ending that adds: "The takeaway" gives the decision rule and what would change it.

## Open questions

None for drafting. For review: Qwen2.5-1.5B was not run (machine load); the post says so in its limits. The strongest claim, no template beating the own template, rests on one nominally significant set of three.

## Left out

- Per-label confusion matrices, and margin between top two labels (in the raw file).
- Qwen2.5-1.5B-Instruct and the 3-shot rows for the mismatched templates.
- Example ordering effects within a set, and balanced versus unbalanced example labels.
