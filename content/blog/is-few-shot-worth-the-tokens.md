---
title: Is Few-Shot Worth the Tokens?
publishedAt: '2027-01-21'
summary: >-
  Eight examples added 3 points, inside the noise, for 418 extra tokens a query on a 0.5B model. A mismatched chat template broke where the answer is read.
tags:
  - ai
  - llm
  - prompting
draft: true
---

Eight examples made my prompt 5.5 times longer and raised Qwen2.5-0.5B's accuracy on AG News from 66% to 69%, a gain I can't tell from noise on 100 articles. A mismatched chat template did something louder: it broke the spot where I read the answer, and accuracy fell to 25%.

Examples in a prompt are billed on every request. And if you hand-build prompts for an open-weight model, a template slip can wreck the measurement before the examples get a say.

**On this 0.5B model and task, eight shots added no measurable gain. A mismatched template scored 25% and 31% because the answer position broke, which says nothing about whether the model can classify. The prompt with no chat template scored highest, and I'd call that a hint, not a finding.**

I ran Qwen2.5-0.5B-Instruct on CPU with four template variants and four shot counts. The scripts, predictions and logs are in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-few-shot-worth-the-tokens).

## The short version

- Qwen2.5-0.5B-Instruct scored 66% with no examples and 69% with eight, on 100 AG News articles. That is +3 points for +418 prompt tokens, or 139 tokens per point if the points are real. A 100-article score carries a 95% interval about 18 points wide.
- One example made it worse: 58.3% across three example sets, and every set lost to zero shots. The sets spread 6 points at one shot and 7 at eight.
- A chat template missing its assistant header scored 25%. Qwen's own format swapped for Llama-2's scored 31% with no examples and 58% with eight. At 25% and 31%, label mass was 0.000: I read the logits where the model wanted to open a new turn, so the scoring position broke, not the model.
- The prompt with no chat template, just text and a "Category:" cue, scored 70% with no examples and 77% with eight, ahead of the model's own template in all three sets at eight shots. Only one set reaches p < 0.05, so it's a hint.

## How do you score a small model without letting it write?

The task is [AG News](https://huggingface.co/datasets/fancyzhx/ag_news): a headline and blurb, four labels (World, Sports, Business, Technology). I took 100 test articles, 25 per label, seeded, each cut to 300 characters. The Hub lists the licence as unknown, so I committed no data.

I never let the model write. At the answer position I read the next-token logits and pick whichever of the four label words has the highest score:

$$
\hat{y} = \arg\max_{c \in \{\text{World},\ \text{Sports},\ \text{Business},\ \text{Technology}\}} z_c
$$

I also log label mass, the probability the whole vocabulary puts on those four tokens. Near zero means the model wanted to say something else and I'm reading the wrong place.

The examples are short training articles, two per label, shuffled. Seeds 1, 2 and 3 give three example sets, and k shots means the first k of each, so the sets are nested. [Zhao et al.](https://arxiv.org/abs/2102.09690) found GPT-3's few-shot accuracy swung with the examples and their order, so I report the spread across sets, not one lucky draw. Every arm scores the same 100 articles, so arms compare paired, as in [Is Your Eval Too Small?](/blog/your-eval-set-is-too-small-to-tell).

The four templates:

- **Own template.** Qwen's [chat template](https://huggingface.co/docs/transformers/en/chat_templating): a system turn with the instruction, each example as a user and assistant turn, then the new article with the assistant header open.
- **No assistant header.** The same, minus the final assistant header, so the prompt ends on the user's closing token. The Hugging Face docs warn the model "may get confused" without it.
- **Llama-2 template.** The same prompt in Llama-2's `[INST]` format, what you get by copying a template from the wrong model card.
- **No template.** Plain text: the instruction, then "Article: ..." and "Category: ..." pairs, ending on "Category:".

The shared prefix runs once and its cache serves all 100 articles; a cached run matches a full forward pass to within 6e-5 in logit, per [`run-0.5b.part2.log`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/run-0.5b.part2.log). The code is [`run.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/run.py), the summaries are [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/output.txt), and the predictions are in [`raw-0.5b.jsonl`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/raw-0.5b.jsonl).

| Prompt | Shots | Tokens per query | Accuracy | Per example set | Label mass |
| --- | --- | --- | --- | --- | --- |
| Own template | 0 | 92 | 66.0% | 66 | 0.98 |
| Own template | 1 | 139 | 58.3% | 61, 55, 59 | 0.95 |
| Own template | 3 | 236 | 65.3% | 65, 66, 65 | 0.96 |
| Own template | 8 | 510 | 69.0% | 66, 68, 73 | 0.97 |
| No assistant header | 0 | 89 | 25.0% | 25 | 0.00 |
| Llama-2 template | 0 | 93 | 31.0% | 31 | 0.00 |
| Llama-2 template | 8 | 511 | 58.0% | 66, 50, 58 | 0.88 |
| No template | 0 | 82 | 70.0% | 70 | 0.89 |
| No template | 8 | 443 | 77.0% | 76, 75, 80 | 0.90 |

Zero shots has one set. Tokens are Qwen tokens for the full prompt. The mismatched templates ran at 0 and 8 shots only, to fit the budget.

## Do more examples help?

Barely, and not smoothly. One shot dropped accuracy in all three sets, by 5, 11 and 7 points; the sign test against zero shots gives p = 0.125, 0.001 and 0.039 ([`paired.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/paired.txt)). At one shot the model calls 61% of articles Business, its worst skew of any count.

Three shots put it back at 65%. Eight reached 69%, but the sets disagree (66, 68 and 73) and none clears p = 0.05 against zero shots (best: set 3, p = 0.065). That's no detectable gain, not a small one: 69% on 100 articles is anywhere from 59% to 77%.

What the examples did change is the shape of the errors. With no examples the model calls 55% of articles Business, against 25% that are. Eight shots pull that to 48% and lift World from 10% to 20%. That fits [Min et al.](https://arxiv.org/abs/2202.12837), who found that randomly replacing the labels in the examples barely hurts, crediting the label space, input distribution and format. The examples corrected part of a prior, nothing more.

## What breaks when the template is wrong?

Not the model: the place I read the answer. Drop the assistant header and the model scores 25%, exactly chance on a balanced set. It predicts Business for all 100 articles, because label mass is 0.000: at that position the model wants to open a new turn, so the four label tokens sit far down the vocabulary and the argmax among them is noise. Read that 25% as "not trying to answer", not as ability: my measurement broke, so I can't say what the model would have generated.

Llama-2's format has the same problem with no examples: label mass 0.000, accuracy 31%. Eight examples show the model how an answer starts, repairing most of it, to 58%. That's 11 points under the right template on average, the one mismatch gap where the model is mostly answering (label mass 0.88). The sets range from 50 to 66, a spread no other arm matches. With a slightly wrong template, example choice matters.

One result I didn't expect, and would call a hint: the prompt with no template at all beat the model's own, by 4 points at zero shots (one set) and by 7 to 10 points at eight, in all three sets. Paired on the same articles at eight shots, no template got 13 right that the own template missed, against 3 the other way (p = 0.021), then 10 against 3 (p = 0.092) and 13 against 6 (p = 0.167). Only the first set clears p = 0.05, so three sets pointing the same way is a hint, not proof. I expected the opposite (I wrote down beforehand that it would cost a few points), and I can't say from this run why the plain cue works.

![Accuracy against prompt tokens for Qwen2.5-0.5B on 100 AG News articles. The model's own template scores 66% at 0 shots and 69% at 8. No template scores 70% and 77%. A Llama-2 template scores 31% at 0 shots and 58% at 8, and a chat template missing its assistant header scores 25%, both because the answer position broke.](/images/blog/few-shot-vs-template.svg "Accuracy against prompt tokens, Qwen2.5-0.5B-Instruct, 100 AG News articles. The 25% and 31% points have label mass 0.000: the answer position broke, so they say nothing about ability. From [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/output.txt). Bars run from the lowest to the highest of three example sets. The figure is drawn by [`make_figure.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/make_figure.py).")

## What do the tokens cost?

Each shot adds about 52 Qwen tokens, so eight shots turn 92 tokens into 510. Extra tokens divided by the points they bought:

$$
\frac{510 - 92}{69.0 - 66.0} = 139\ \text{tokens per point}
$$

For dollars I use [Claude Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing), checked 2026-11-27: $2.00 per million input tokens, $0.10 for a cache read. Claude's tokenizer counts differently from Qwen's, so read the dollars as a shape. Eight shots' extra 418 tokens cost:

| Queries | Extra, uncached | Extra, cached |
| --- | --- | --- |
| 1,000 | $0.84 | $0.04 |
| 100,000 | $83.53 | $4.18 |
| 10,000,000 | $8,353.33 | $417.67 |

Fixed examples at the front of a prompt are what a cache rewards, as in [Does Prompt Caching Always Save?](/blog/prompt-caching-rewards-boring-prompts). Caching fixes the bill, not the length: the 418 tokens still fill the context window. The script is [`cost.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/cost.py), with its output in [`cost.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/cost.txt).

## Where I'd stop trusting this post

**I tested a 0.5B model on one task.** Eight shots might buy far more on a 70B model, or a model that doesn't already know AG News's categories. [Min et al.](https://arxiv.org/abs/2202.12837) tested 12 models including GPT-3, and I tested one small one, so I have no result for larger models, in either direction. Don't carry "shots barely help" to a frontier model.

**The sample is 100 articles.** One score carries a 95% interval of about plus or minus 9 points, so differences of a few points are unresolved. The 25% and 31% are real readings of a broken answer position, and the 1-shot dip is significant in two sets of three. The no-template edge reaches p < 0.05 in one set of three, and the 8-shot gain in none.

**Template format isn't one thing.** [Sclar et al.](https://arxiv.org/abs/2310.11324) report accuracy differences of up to 76 points from meaning-preserving formatting changes, so four variants sample a far bigger space. And a model that would generate the right label after a wrong template looks dead in the 25% and 31% rows, because I only scored label logits. 

**I didn't run the 1.5B model.** I planned Qwen2.5-1.5B-Instruct, but the shared machine stalled one set for an hour. Load readings are in the [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/README.md).

## The takeaway

Check the template before you add an example. Print the exact string your model sees, confirm it ends where the model expects its answer to start, and measure label mass or parse rate before accuracy. Then run zero, three and eight shots with three example sets, and keep the cheapest count whose worst set beats zero.

If someone shows me a task where eight shots beat zero in every example set by more than the noise on a model this size, I'll happily eat my words. Until then I'm counting the whole prompt.
