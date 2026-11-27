---
title: Is Temperature Zero Deterministic?
publishedAt: '2026-11-27'
summary: >-
  Greedy repeated itself 20 of 20 times on one machine. Batched in bf16, 75 of 200 prompts changed text (fp32: 0), and T=0.7 scored within 3.3 points of greedy.
tags:
  - llm
  - sampling
  - determinism
  - ai
draft: true
---

I asked a small model for the capital of Australia at temperature 0, a hundred times. It said Sydney a hundred times. Perfectly consistent, perfectly wrong.

Then I raised the temperature to 0.7 and asked a hundred more. It said Canberra 54 times ([raw output](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/output-sample.txt)).

So is temperature zero the safe setting? Is it even repeatable? I ran [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) on my Mac's CPU, four threads, to find out.

**Temperature zero makes the final pick deterministic, not the answer: the logits underneath can still move, and the top one isn't always right.** If your evals, regression tests or caches assume `temperature=0` returns identical text, this is the post where that assumption gets checked.

## The short version

- On 50 factual questions, greedy scored 74.0% and T=0.7 scored 70.7%. The 3.3-point gap has a 95% interval of -8.3 to +1.6, so it could be zero.
- Greedy was wrong on 13 of the 50. Sampling at T=0.7 got 16.7% of those right, and lost 10.4 points on the 37 that greedy got right.
- Same prompt, same machine, greedy run 20 times: one distinct output, on all three prompts.
- Batched with other prompts, fp32 changed 0 of 200 outputs and bf16 changed 75 (37.5%). In 43 of those 75 the top two tokens were exactly tied.

## What does temperature actually do?

It divides every logit by $$T$$ before the softmax. A model emits one score $$z_i$$ per vocabulary token, and the probability of token $$i$$ is

$$
p_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}
$$

Small $$T$$ widens the gaps between scores, so the leader takes more of the mass. As $$T \to 0$$, all of it lands on $$\arg\max_i z_i$$. That is greedy decoding, and "temperature 0" is shorthand for it (a real API special-cases 0, since you can't divide by it).

For "Pick a number between 1 and 10", the model gives 7 a 98.2% share at T=0.2 and 39.7% at T=1.0 ([`output-dist.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/output-dist.txt)). For "What is the capital of France?" Paris keeps 98.7% even at T=1.0. Temperature only matters where the model is torn. Temperature is the volume knob on the runner-up, and on an easy question there isn't one.

One trap for anyone reproducing this: Qwen's shipped generation config applies temperature 0.7, top-p 0.8, top-k 20 and a repetition penalty. [`common.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/common.py) overrides all four so the sweeps below are plain sampling.

## Does temperature zero give the best answer?

Not reliably, and not by much either way. I wrote [50 short-answer questions](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/questions.py) (capitals, science, arithmetic, a few programming facts) and ran each at five settings, 30 samples per sampled setting. The intervals are a bootstrap over questions, 10,000 resamples ([`sweep50.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/sweep50.py), [`output-sweep50-redo.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/output-sweep50-redo.txt)).

| Setting | Mean accuracy | Difference from greedy (95% interval) |
| --- | ---: | ---: |
| greedy | 74.0% | n/a |
| T = 0.2 | 74.7% | +0.7 (-1.3, +2.9) |
| T = 0.7 | 70.7% | -3.3 (-8.3, +1.6) |
| T = 1.0 | 64.7% | -9.3 (-15.8, -3.1) |
| T = 1.5 | 38.3% | -35.7 (-45.5, -26.1) |

![Horizontal bars of mean accuracy over 50 questions: greedy 74.0 percent, temperature 0.2 74.7, 0.7 70.7, 1.0 64.7 and 1.5 38.3 percent.](/images/blog/temperature-accuracy-by-setting.svg "Mean accuracy over 50 questions, 30 samples per sampled setting, Qwen2.5-0.5B-Instruct on CPU. Raw numbers in [`results-sweep50.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/results-sweep50.json).")

Up to 0.7, I can't separate sampling from greedy. That matches [Renze and Guven](https://arxiv.org/abs/2402.05201), who found no significant effect on problem-solving accuracy for temperatures from 0.0 to 1.0. I had predicted T=0.7 would land five to ten points under greedy. It landed 3.3 under, inside the noise. I was wrong.

The split underneath is more interesting than the average. Greedy was right on 37 questions and wrong on 13. On the 37, sampling at T=0.7 kept 89.6%, so it broke about one answer in ten that greedy had right. On the 13, it got 16.7%. Back to Australia: the model's top token is Sydney, so greedy says Sydney forever, while Canberra is a real runner-up that sampling occasionally lets through. For "Who was the first person to walk on the Moon?" greedy said Yuan Longping and T=0.7 never got it right either. Sampling only rescues questions where the right answer already has real probability.

Taking one sample at T=0.7 is a lottery. Taking many and voting is the method that pays: [self-consistency](https://arxiv.org/abs/2203.11171) reports a +17.9% gain over greedy chain-of-thought on GSM8K in its abstract. I didn't test voting.

## Is temperature zero at least repeatable?

On one machine, yes. I ran greedy 20 times on each of three prompts and got one distinct output every time. The surprise comes when something else changes.

Floating-point addition isn't associative: $$(a + b) + c \ne a + (b + c)$$ in general. I summed the same 1,000,000 float32 numbers in eight orders and got six different totals, with a spread of 0.031 between ascending and descending sort (the shuffled orders stayed within 0.00018 of each other). A matmul picks its summation order from the shape of the work, so if the batch shape changes, the order might change.

I checked that directly. The same prompt at batch size 1, then copied 2, 8 and 32 times: the logits were identical to the last bit, in fp32 and in bf16 (max difference 0.000e+00, [`output-determinism.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/output-determinism.txt)). I had predicted differences near 1e-5 and 1e-1. Wrong again: on this CPU, identical rows don't disturb each other.

A real batch has different prompts, so it needs padding. I took 200 prompts, generated 64 tokens greedily for each one alone, then again inside a left-padded batch of 8 ([`determinism.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/determinism.py)).

![Two bars: no prompt out of 200 changed its greedy text in fp32 when batched, and 75 out of 200 changed in bf16.](/images/blog/greedy-flips-fp32-vs-bf16.svg "Prompts whose 64-token greedy text changed between batch size 1 and a left-padded batch of 8, 200 prompts. fp32: 0 (95% interval 0.0 to 1.9%). bf16: 75 (31.1% to 44.4%).")

fp32 changed nothing. bf16 changed 37.5% of the outputs, and the median flip started at token 22 of 64, so most of those prompts diverged within the first sentence or two.

## Why does bf16 flip and fp32 doesn't?

Because bf16 is coarse. It keeps eight significant bits, and the top logits here run from 15.6 to 26.1 ([`output-logit-scale.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/output-logit-scale.txt)). Between 16 and 32 the spacing is $$2^{4} \times 2^{-7} = 0.125$$, so two competing tokens often land on the same value or one step apart. When a different batch shape nudges one of them by a rounding error, argmax picks the other token.

![Bar chart of the 75 bf16 flips by the gap between the top two logits where the text first split: 43 at 0.000, 30 at 0.125 and 2 at 0.250.](/images/blog/greedy-flip-logit-gap.svg "Gap between the top two logits at the first differing token, for the 75 bf16 flips. Same run as the previous figure.")

All 75 flips began at a gap of 0, 0.125 or 0.25. Forty-three began at an exact tie. Once one token differs, the rest of the text follows a different path, which is why the damage shows up as a different paragraph instead of a different letter.

## Does this happen on real APIs?

Thinking Machines measured it on a much bigger model. They sampled 1,000 completions of "Tell me about Richard Feynman" from Qwen3-235B at temperature 0 and got [80 unique completions](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/). The first 102 tokens matched, then 992 said "Queens, New York" and 8 said "New York City". Their diagnosis is the one above: a server's load changes the batch size, and the kernels aren't batch-invariant. With batch-invariant kernels, all 1,000 came out identical.

The vendors say it plainly. Anthropic's [glossary](https://platform.claude.com/docs/en/about-claude/glossary) says that even at temperature 0 "the results will not be fully deterministic". The [Opus 5.5 migration guide](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide) tells you to remove `temperature`, `top_p` and `top_k` altogether, and notes that temperature 0 never guaranteed identical outputs. [vLLM](https://docs.vllm.ai/en/latest/usage/reproducibility.html) doesn't guarantee reproducibility by default "for the sake of performance".

## Where I'd stop trusting this post

**It's fixable.** Thinking Machines got 1,000 of 1,000 with batch-invariant kernels, so repeatability is an engineering choice, not a law. My claim is about defaults on the stack you probably call.

**One small model on one CPU.** A 0.5B model's mistakes aren't a frontier model's mistakes, and a GPU kernel has its own summation order. I'd expect the shape of the result to travel, not the rates.

**50 questions and 30 samples.** The T=0.7 gap includes zero. The first pass also had two grading bugs: my normaliser stripped the accent from "Brasília", so a correct greedy answer scored zero, and three answers were cut off at 8 tokens. I fixed both and reran those four questions at 24 tokens, all five settings, same seeds, so greedy and every sampled setting were rescored the same way. The other 46 keep their first-pass results (none of their accepted answers has an accent). The first-pass output is still in [`output-sweep50.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-temperature-zero-deterministic/output-sweep50.txt) (greedy 68.0%, T=0.7 67.2%).

**Padding and shape are tangled.** Identical rows gave bit-identical logits, and padded batches flipped. I can't say which of padding or batch shape does the damage. I also didn't test top-p or a hosted model.

## The takeaway

Treat `temperature=0` as low variance, not a contract. Don't assert exact string equality on LLM output in tests: compare with a tolerance or a judge, or store the response and replay it. If a temperature-0 eval moves between runs, suspect batching before the model, and check the gap against [Is Your Eval Too Small?](/blog/your-eval-set-is-too-small-to-tell) before you call it a regression. If you need byte-for-byte repeatability, you need a fixed batch or batch-invariant kernels, which means self-hosting, not a parameter.

The experiment costs ten lines: run your prompt set alone, then inside a batch, and diff the text. If a vendor shows byte-identical output for 1,000 production calls at temperature 0, I'll update this post.
