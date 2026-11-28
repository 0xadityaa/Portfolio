---
title: Is Few-Shot Worth the Tokens?
publishedAt: '2027-01-21'
summary: >-
  Eight examples added 3 points for 418 extra tokens a query on a 0.5B model. A wrong chat template cost up to 41 points, and no template beat the real one.
tags:
  - ai
  - llm
  - prompting
draft: true
---

Eight examples made my prompt 5.5 times longer and raised Qwen2.5-0.5B's accuracy on AG News from 66% to 69%. Putting the model's own chat template back in was a bigger deal than that, and so was taking it out.

If you paste examples into a prompt, you pay for them on every request. If you hand-build prompts for an open-weight model, one template slip can cost more than examples could win back.

**On this task the shape of the prompt moved accuracy more than the number of examples in it: eight shots added 3 points (inside the noise), a wrong template cost up to 41, and a prompt with no chat template at all scored best.**

I ran it on Qwen2.5-0.5B-Instruct, on CPU, with four template variants and four shot counts. The scripts, raw predictions and logs are in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-few-shot-worth-the-tokens).

## The short version

- Qwen2.5-0.5B-Instruct scored 66% with no examples and 69% with eight, on 100 AG News articles. That is +3 points for +418 prompt tokens, or 139 tokens per point. A 100-article score carries a 95% interval about 18 points wide.
- One example made it worse: 58.3% across three example sets, and every set lost to zero shots. The spread between sets was 6 points at one shot and 7 at eight.
- A chat template missing its assistant header scored 25%. Qwen's own format swapped for Llama-2's scored 31% with no examples and 58% with eight.
- The prompt with no chat template, just text and a "Category:" cue, scored 70% with no examples and 77% with eight, ahead of the model's own template in every set.

## How do you score a small model without letting it write?

The task is [AG News](https://huggingface.co/datasets/fancyzhx/ag_news): a headline and blurb, four labels (World, Sports, Business, Technology). I took 100 test articles, 25 per label, seeded, each cut to 300 characters so every prompt stays near 500 tokens. The Hub lists the licence as unknown, so I committed no data.

I never let the model write. At the answer position I read the next-token logits and pick whichever of the four label words has the highest score:

$$
\hat{y} = \arg\max_{c \in \{\text{World},\ \text{Sports},\ \text{Business},\ \text{Technology}\}} z_c
$$

I also log label mass, the probability the whole vocabulary puts on those four tokens. Near zero means the model wanted to say something else and the accuracy number is reading the wrong place.

The examples come from the training split, short ones only, two per label, shuffled. Seeds 1, 2 and 3 give three example sets, and k shots means the first k of each set, so the sets are nested. That follows the point of [Zhao et al.](https://arxiv.org/abs/2102.09690): GPT-3's few-shot accuracy swung with the training examples and their order, so I report the spread across sets, not one lucky draw. Every arm scores the same 100 articles, which lets me compare arms paired, the trick from [Is Your Eval Too Small?](/blog/your-eval-set-is-too-small-to-tell).

The four templates:

- **Own template.** Qwen's [chat template](https://huggingface.co/docs/transformers/en/chat_templating): a system turn with the instruction, each example as a user turn and an assistant turn, then the new article with the assistant header open.
- **No assistant header.** The same, minus the final assistant header, so the prompt ends on the user's closing token. The Hugging Face docs warn the model "may get confused" without it.
- **Llama-2 template.** The same instruction and examples in Llama-2's `[INST]` format, the usual result of copying a template from the wrong model card.
- **No template.** Plain text: the instruction, then "Article: ..." and "Category: ..." pairs, ending on "Category:".

The shared prefix runs once and its cache serves all 100 articles. A cached run matches a full forward pass to within 6e-5 in logit, per the check at the top of [`run-0.5b.part2.log`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/run-0.5b.part2.log). The code is [`run.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/run.py), the summaries are [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/output.txt), and every prediction is in [`raw-0.5b.jsonl`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/raw-0.5b.jsonl).

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

Zero shots has one set. Tokens are Qwen tokens for the full prompt. The mismatched templates ran at 0 and 8 shots only, to fit the compute budget.

## Do more examples help?

Barely, and not smoothly. One shot dropped accuracy in all three sets, by 5, 11 and 7 points. The sign test against zero shots gives p = 0.125, 0.001 and 0.039 ([`paired.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/paired.txt)). One example is a bad deal. At one shot the model calls 61% of articles Business, its worst skew of any count.

Three shots put it back at 65%. Eight shots reached 69%, but the sets disagree (66, 68 and 73), and against zero shots no set clears p = 0.05 (the best is set 3, p = 0.065). That's no detectable gain, not a small one: 69% on 100 articles is anywhere from 59% to 77% at 95% confidence.

What the examples did change is the shape of the errors. The model with no examples calls 55% of articles Business, against 25% of them that actually are. Eight shots pull that to 48% and lift World from 10% of predictions to 20%. That fits [Min et al.](https://arxiv.org/abs/2202.12837), who found that randomly replacing the labels in the examples barely hurts and credit the label space, the input distribution and the format. The examples corrected part of a prior, and the task stayed hard for a 0.5B model.

## What does a wrong template cost?

Everything, or nothing, depending on which wrong. Drop the assistant header and the model scores 25%, exactly chance on a balanced set. It predicts Business for all 100 articles, because label mass is 0.000: at that position the model wants to open a new turn, so the four label tokens sit far down the vocabulary and the argmax among them is noise. Read that 25% as "not trying to answer", not as ability.

Llama-2's format has the same problem with no examples: label mass 0.000, accuracy 31%. Eight examples show the model how an answer starts and repair most of it, to 58%. That's 11 points under the right template on average, and the sets range from 50 to 66, a spread no other arm comes close to. With a slightly wrong template, your example choice suddenly matters.

The surprise is the last pair of rows. The prompt with no template at all beat the model's own, by 4 points at zero shots and by 7 to 10 points at eight, in every set. Paired on the same articles at eight shots, the no-template prompt got 13 right that the own template missed, against 3 the other way (p = 0.021), then 10 against 3 (p = 0.092) and 13 against 6 (p = 0.167). Three sets pointing the same way is a hint, not proof. I expected the opposite: I wrote down beforehand that no template would cost a few points. Why the plain cue works I can't say from this run.

![Accuracy against prompt tokens for Qwen2.5-0.5B on 100 AG News articles. No template scores 70% at 0 shots and 77% at 8, the model's own template 66% and 69%, a Llama-2 template 31% at 0 shots and 58% at 8, and a chat template missing its assistant header scores 25%.](/images/blog/few-shot-vs-template.svg "Accuracy against prompt tokens, Qwen2.5-0.5B-Instruct, 100 AG News articles, from [`output.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/output.txt). Bars run from the lowest to the highest of three example sets. The figure is drawn by [`make_figure.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/make_figure.py).")

## What do the tokens cost?

Each shot adds about 52 Qwen tokens, so eight shots turn a 92-token prompt into a 510-token one. The price per point is the extra tokens divided by the points they bought:

$$
\frac{510 - 92}{69.0 - 66.0} = 139\ \text{tokens per point}
$$

In dollars, take [Claude Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing), checked 2026-11-27: $2.00 per million input tokens, and $0.10 per million for a cache read. Claude's tokenizer counts differently from Qwen's, so read the dollars as a shape. The extra 418 tokens of eight shots cost:

| Queries | Extra, uncached | Extra, cached |
| --- | --- | --- |
| 1,000 | $0.84 | $0.04 |
| 100,000 | $83.53 | $4.18 |
| 10,000,000 | $8,353.33 | $417.67 |

Fixed examples at the front of a prompt are what a cache rewards, as in [Does Prompt Caching Always Save?](/blog/prompt-caching-rewards-boring-prompts). Caching fixes the bill, not the length: the 418 tokens still fill the context window on every request. The script is [`cost.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/cost.py), with its output in [`cost.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/cost.txt).

## Where I'd stop trusting this post

**I tested a 0.5B model on one task.** Eight shots might buy far more on a 70B model, or a model that doesn't already know AG News's categories. [Min et al.](https://arxiv.org/abs/2202.12837) tested 12 models including GPT-3, and I tested one small one, so don't carry the "shots barely help" line to a frontier model.

**The sample is 100 articles.** One score carries a 95% interval of about plus or minus 9 points, so every difference of a few points here is unresolved. The big effects (25%, 31%, the 1-shot dip) hold. The no-template win doesn't reach p < 0.05 in two of three sets, and the 8-shot gain doesn't in any.

**Template format isn't one thing.** [Sclar et al.](https://arxiv.org/abs/2310.11324) report accuracy differences of up to 76 points from meaning-preserving formatting changes, so four variants sample a far bigger space. And I only scored label logits: a model that would have generated the right label after a wrong template looks dead in the 25% and 31% rows. Those rows say the answer position broke, not that the model can't classify.

**I didn't run the 1.5B model.** The plan included Qwen2.5-1.5B-Instruct, but the machine was shared and one set stalled for an hour at a load average over 150. The load readings are in the [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/is-few-shot-worth-the-tokens/README.md).

## The takeaway

Check the template before you add an example. Print the exact string your model sees, confirm it ends where the model expects its answer to start, and measure label mass or the parse rate before accuracy. Then run zero, three and eight shots on your data with three example sets, and keep the cheapest count whose worst set beats zero.

If someone shows me a task where eight shots beat zero in every example set by more than the noise on a model this size, I'll happily eat my words. Until then I'm counting the whole prompt, not just the examples.
