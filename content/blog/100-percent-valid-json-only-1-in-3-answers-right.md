---
title: 100% Valid JSON, Only 1 in 3 Answers Right
publishedAt: '2026-12-31'
summary: >-
  Constrained decoding and 3-shot prompts both took a 0.5B model to 100% schema-valid JSON on 120 messages. Neither lifted all-five-fields-right above 33%.
tags:
  - ai
  - llm
  - structured-outputs
draft: true
---

120 customer messages. 120 valid JSON objects. The priority field wrong 69% of the time.

That is constrained decoding on [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct): zero parse failures, zero schema violations, and a `priority` that matched the truth in 30.8% of cases. So what did the schema buy?

If an extraction pipeline is judged by its parse-error rate, that dashboard goes green long before the answers are right. A script ran four setups over the same 120 invented support messages and five fields, and the [code and raw output are in the repo](https://github.com/0xadityaa/Portfolio/tree/main/content/research/100-percent-valid-json-only-1-in-3-answers-right).

**Structure is cheap and says nothing about accuracy: a logit mask and three examples each took schema-valid output from 57.5% to 100%, and neither moved all-five-fields-right off about 1 in 3.**

## The short version

- Instruction only: 0 of 120 raw replies parse, because every one is wrapped in a code fence. Strip the fences and 57.5% fit the schema. The rest add a key like `reason` or `message`.
- 3-shot, constrained, and both together: 120 of 120 valid. All five fields right: 30.8%, 29.2% and 32.5%.
- `priority` is right 31% to 33% of the time in every arm. The model answered "high" for 114 to 120 of 120 messages.
- Three examples add 531 prompt tokens per request (163 to 694) and remove about 30 reply tokens.

## What was measured?

Each message is two to five sentences from a seeded template generator: a name in the signature, a product, a quantity (digits or words), a priority cue ("urgent", "no rush"), and a refund or replacement request. Distractors sit in the text: order numbers, prices, "4 weeks to arrive". The schema is [JSON Schema](https://json-schema.org/) with `customer` and `product` as strings, `quantity` as an integer, `priority` as one of low, medium, high, and `refund` as a boolean.

Four arms, greedy decoding, same instruction text. A is the instruction alone. B adds three worked examples. C and D are A and B with decoding constrained to the schema by [Outlines](https://github.com/dottxt-ai/outlines). A reply that fails to parse scores zero on all five fields. Intervals are 95% [Wilson](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval), about 8 points either side at these rates.

| Arm | Raw replies that parse | Valid after stripping fences | All five fields right | Prompt / reply tokens |
| --- | --- | --- | --- | --- |
| A Instruction only | 0 of 120 | 57.5% | 26.7% | 163 / 57 |
| B 3-shot | 120 of 120 | 100% | 30.8% | 694 / 27 |
| C Constrained | 120 of 120 | 100% | 29.2% | 163 / 34 |
| D 3-shot + constrained | 120 of 120 | 100% | 32.5% | 694 / 26 |

![Bar chart of four setups on 120 messages. Schema-valid output is 57.5% for instruction only and 100% for 3-shot, constrained, and both. All five fields right stays between 26.7% and 32.5% in every setup.](/images/blog/valid-json-vs-right-answers.svg)

## Which fix breaks less JSON: the examples or the mask?

Either one, completely. The mask is the guaranteed route: [Willard and Louf](https://arxiv.org/abs/2307.09702) compile the schema into a finite-state machine and index the model's vocabulary against it, so only tokens that keep the output valid can be picked. OpenAI reported the same trade at scale: gpt-4o-2024-08-06 reached about 93% schema adherence from training alone and [100% with constrained decoding](https://openai.com/index/introducing-structured-outputs-in-the-api/) (checked 2026-11-26).

Examples get there without any mask. [Min et al.](https://arxiv.org/abs/2202.12837) found that demonstrations mostly convey the label space, the input distribution and the format. Three bare-JSON examples were enough here: B never emitted a fence.

Instruction-only is the interesting failure. The model fenced all 120 replies, which is a one-line fix. The other 42.5% is harder. Each of those 51 replies carried an extra key (`message` 23 times, `reason` 27, both `action` and `reason` once), so the schema check fails even after the fences are gone.

## Does constraining the output hurt accuracy?

Not here. Mean field accuracy for C against A moved by -0.3 points, with a paired bootstrap interval of -1.7 to +1.0. Per field it was a wash: `customer` rose from 91.7% to 96.7% and `refund` fell from 90.8% to 83.3%.

The examples did more than the mask. B beat C by 3.3 points [1.8, 5.0], most of it in `refund`: 95.8% against 83.3%. A mask can force `true` or `false` to appear. It can't tell the model which one the customer meant. Adding the mask on top of the examples (D against B) changed nothing measurable: +0.5 [0.0, 1.2].

## Why is `priority` wrong 69% of the time?

Because "high" is a legal answer. The model chose it for every message in A and for 118, 118 and 114 of 120 in B, C and D. The truth is 36 high, 48 medium, 36 low, so always answering "medium" would score 40% and always answering "high" scores 30%.

| Arm | Replies saying "high" | `priority` right |
| --- | --- | --- |
| A Instruction only | 120 of 120 | 30.0% |
| B 3-shot | 118 of 120 | 31.7% |
| C Constrained | 118 of 120 | 30.8% |
| D 3-shot + constrained | 114 of 120 | 33.3% |

Every arm sits at or below the best constant guess. The three examples cover a high, a medium and a low and still did not teach the difference. Everything else was nearly solved: B and D get the other four fields right 99% of the time. Format was never the weak part, and a schema check can't see the weak part, because every wrong answer is a well-formed one.

## What do three examples cost?

531 extra input tokens on every request: 0.5 million per thousand requests, 53 million per hundred thousand, 531 million per million. A smaller reply claws some back (27 tokens against 57), and on this CPU the mean wait fell from 9.5 s to 7.4 s. Constraint alone had the shortest waits, 5.2 s, because it cuts the fence and the stray keys.

A fixed block of examples is a stable prefix, which is the shape [prompt caching](/blog/prompt-caching-rewards-boring-prompts) discounts. Whether that pays depends on the provider and the hit rate.

Two of the pre-run guesses were wrong. The raw parse-failure rate for A was expected at 30% to 60% and came out at 100%, all from fences. The few-shot cost was expected at about 250 tokens and came out at 531.

## Where this stops holding

**Constraints can hurt when the model has to think.** [Tam et al.](https://arxiv.org/abs/2408.02442) report a significant decline in reasoning under format restrictions. Extraction isn't reasoning, and this run found no loss, but a schema that forces the answer before the working would behave differently. That case wasn't run.

**One small model, templated text.** The 120 messages come from templates, the model is 0.5B, the three examples are one fixed set, and the prompt never defines what separates medium from high. A larger model or a written rubric may lift `priority`. A 120-case set also can't resolve small gaps (see [Your 100-Example Eval Is Lying About That 3-Point Win](/blog/your-eval-set-is-too-small-to-tell)). The paired intervals above are what separate B from C.

**Timings are indicative.** The machine was shared, with load averages from 16 to 24 and spikes far higher.

## The takeaway

Report two numbers for any extraction pipeline: valid, and right. Use a schema or examples for the first and a labelled set for the second, and for every enum field compare accuracy with the best constant guess before trusting it.

A rubric or a larger model lifting `priority` clear of 40% under the same mask would put the ceiling on the model, not the format, and that is the result to look for next.
