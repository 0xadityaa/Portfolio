---
title: Does It Know It's Wrong?
publishedAt: '2027-01-07'
summary: >-
  A 1.5B model's own answer probability ranks right above wrong 84% of the time. Abstaining below 0.225 drops half its wrong answers and 10% of its right.
tags:
  - ai
  - evals
  - llm
draft: true
---

I asked Qwen2.5-1.5B 112 trivia questions with no notes, then recorded how likely it thought each of its own answers was. When it gave an answer a probability of 0.9 or more, it was right 9 times out of 11. When it gave one a probability under 0.1, it was right 2 times out of 26.

The model never says "I'm not sure". Its probabilities say it for free, if you read them. That matters for anything that can choose between answering and saying "I don't know": a support bot, a RAG answerer, a router that hands hard questions to a bigger model. How far can the signal be trusted?

**A small model's probability for its own answer ranks right above wrong about 84% of the time (AUROC 0.84), and refusing to answer below a cutoff of 0.225 removes half of its wrong answers while keeping 90% of its right ones. It is not a calibrated percentage, so use it to rank and cut, not to quote.**

## The short version

- On 112 closed-book TriviaQA questions, Qwen2.5-1.5B was right 26.8% of the time by my hand grading (95% interval 19.5 to 35.7%), against 30.4% from the automatic grader.
- Its probability for its own answer ranked a right answer above a wrong one 84% of the time (AUROC 0.84, interval 0.74 to 0.93). Ranking by answer length alone got 0.64.
- Answers rated 0.9 or higher were right 82% of the time, on 10% of the questions. Its average stated probability overshot the hit rate by 13 points (0.39 against 0.27).
- Cutting off at 0.225 kept 90% of the right answers and 50% of the wrong ones. The 0.5B model's AUROC was 0.78, but length alone scores as high, and 112 questions can't separate them.

## How I measured it

The questions come from the validation split of [TriviaQA](https://arxiv.org/abs/1705.03551), in the [closed-book config](https://huggingface.co/datasets/mandarjoshi/trivia_qa) with no passage attached: 17,944 questions, each with a list of accepted answer aliases. I shuffled them with a fixed seed and answered them in order, so the 112 I got through in 33 minutes are a random sample. The machine was shared, so I got 112. [Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct) ran on 4 CPU threads in bf16, greedy, 16 tokens at most, under a system prompt asking for the answer and nothing else. [`run.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/run.py) saves every token's log probability.

My confidence score is the probability of the whole answer, the product of its token probabilities:

$$
P(a \mid q) = \prod_{t=1}^{T} p(y_t \mid q, y_{<t})
$$

Every extra token multiplies in another number below 1, so the score punishes rambling as well as doubt.

Grading is where I had to be careful. The automatic rule comes from [Is Exact Match Lying?](/blog/exact-match-would-fail-the-humans-too): an answer is right if it matches an alias after normalising, or if its token F1 against one is at least 0.5. It accepted 34 answers, 8 of them on F1 alone, and I read all eight. Three were right ("Iron Lady" was one). Five were wrong, such as "Grand Canyon National Park" for Joshua Tree. The rule also rejected "Kristiania" for Oslo's old name, because the alias list spells it "Christiania". I corrected those six grades. Every number below uses the corrected grading unless it says otherwise: 30 right of 112 (26.8%), not the rule's 34 (30.4%). The corrections are in [`overrides.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/overrides.json).

## Does the probability tell right from wrong?

Yes. AUROC is the chance that a randomly chosen right answer got a higher confidence than a randomly chosen wrong one: 0.5 is a coin flip, 1.0 is perfect. For the 1.5B model it's **0.84** (95% bootstrap interval 0.74 to 0.93). I'd written down 0.75 to 0.85 beforehand, and that held.

Confidence might be a stand-in for something dumber, and answer length is the obvious candidate. Ranking by shortness alone gets 0.64 (0.53 to 0.75). The gap is 0.20 (0.10 to 0.31), so the probabilities carry information that length doesn't.

The grader moves the number. Strict alias matching gives 0.88, my corrected grading gives 0.84, and the F1 rule as written gives 0.79. The intervals overlap, but the looser the rule, the worse confidence looks.

## Is it a real probability?

No. A bathroom scale that reads four pounds heavy is useless for your weight and fine for telling who weighs more, and the model's confidence is that scale. The standard check is expected calibration error: sort answers into ten equal-width bins of stated confidence, then average each bin's gap between mean confidence and hit rate, weighted by bin size:

$$
\text{ECE} = \sum_{b=1}^{10} \frac{n_b}{n}\,\bigl|\,\text{acc}_b - \text{conf}_b\,\bigr|
$$

For the 1.5B model it's 0.144 (0.11 to 0.22). Its stated probabilities average 0.39 and its real hit rate is 0.27. The figure uses five wider bands, since ten bins hold as few as 4 answers.

![Horizontal bars of how often Qwen2.5-1.5B was right by the probability it gave its own answer: under 0.1 was right 8 percent, 0.1 to 0.3 was right 7 percent, 0.3 to 0.6 was right 25 percent, 0.6 to 0.9 was right 53 percent and 0.9 or more was right 82 percent. The average stated probability sits above the bar in every band but the lowest.](/images/blog/calibration-bands.svg "112 TriviaQA questions, Qwen2.5-1.5B-Instruct, hand-corrected grading. Counts and bin tables are in [`analysis.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/analysis.txt).")

Answers rated 0.1 to 0.3 averaged 0.20 and were right 7% of the time (2 of 28); those rated 0.6 to 0.9 averaged 0.75 and were right 53% (10 of 19). Look at the top bar: it averaged 0.97 and was right 82% (9 of 11), a strong signal, still 15 points shy of its own claim. At the bottom the number holds up: answers under 0.1 averaged 0.04 and were right 8% of the time (2 of 26), so a low score means unlikely, not impossible.

[Guo and colleagues](https://arxiv.org/abs/1706.04599) reported overconfident image and document classifiers in 2017, and [Kadavath and colleagues](https://arxiv.org/abs/2207.05221) say in their abstract that "larger models are well-calibrated on diverse multiple choice and true/false questions". Mine is free-form answers from a much smaller model.

## What does abstaining buy?

This is the part you'd ship: answer only when confidence clears a cutoff, refuse otherwise. It is the risk-coverage trade from [selective classification](https://arxiv.org/abs/1705.08500). The figure plots right answers kept against wrong answers still given as the cutoff slides from 1 down to 0.

![Curve of right answers kept against wrong answers still given as the confidence cutoff moves. At a cutoff of 0.225 the model keeps 90 percent of its right answers and still gives 50 percent of its wrong ones. The curve sits well above the diagonal that marks no signal.](/images/blog/abstain-keeps-right.svg "112 TriviaQA questions, Qwen2.5-1.5B-Instruct, hand-corrected grading; one step per distinct confidence value. Produced by [`make_figs.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/make_figs.py) from [`analysis.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/analysis.json).")

The cutoff that halves the wrong answers is 0.225. It answers 61% of the questions and is right 39.7% of the time when it answers, against 26.8% with no abstaining. It keeps 27 of the 30 right answers (90%, interval 77 to 100%) and still gives 41 of the 82 wrong ones. I'd guessed it would cost 20 to 30% of the right ones. Five cutoffs, side by side:

| Cutoff | Questions answered | Right when answered | Right answers kept | Wrong answers given |
| --- | --- | --- | --- | --- |
| 0.9 | 9.8% | 81.8% | 30.0% | 2.4% |
| 0.7 | 20.5% | 73.9% | 56.7% | 7.3% |
| 0.5 | 36.6% | 53.7% | 73.3% | 23.2% |
| 0.3 | 51.8% | 44.8% | 86.7% | 39.0% |
| 0.1 | 76.8% | 32.6% | 93.3% | 70.7% |

I picked 0.225 after seeing the answers, which flatters it. So I repeated the choice 500 times: pick the cutoff on a random half, apply it to the other half. On the held-out half it kept 89.5% of the right answers and let 48.8% of the wrong ones through, with a spread of 11 points on that wrong share.

## Does a smaller model know less about what it knows?

I expected so, and ran Qwen2.5-0.5B-Instruct on the same 112 questions. It was right 11.6% of the time, and its AUROC was 0.78 (0.65 to 0.90) against the 1.5B's 0.84. A gap of 0.06 fits my guess of 0.03 to 0.08, but the intervals overlap almost completely, so 112 questions can't confirm it.

The length baseline is the bigger story. Ranking the 0.5B's answers by shortness alone scores 0.79 (0.69 to 0.88), a hair above its confidence, so confidence adds -0.01 (-0.14 to 0.13). That interval spans zero: the sample can't say whether its confidence carries anything beyond "short answers are right", and it can't rule out a gain of 0.13 either. (The looser rule grader gave +0.04, -0.09 to 0.16.) When this model is wrong it rambles: 10 of its 112 answers hit the 16-token cap, and none were right.

## Where I'd stop trusting this post

**Token probabilities punish rewording.** [Kuhn and colleagues](https://arxiv.org/abs/2302.09664) argue that different sentences can mean the same thing, so probability splits across paraphrases and token-level scores understate a model's confidence in the meaning. Mine is that kind of score; sampling many answers per question and grouping them by meaning, as their semantic entropy does, could beat 0.84. I didn't run it.

**112 questions is thin.** The interval on the "halve the wrong answers" result runs from 77 to 100%, and each reliability band holds 11 to 28 answers. A few points between two cutoffs is noise, for the reasons in [Is Your Eval Too Small?](/blog/your-eval-set-is-too-small-to-tell).

**I graded the gray cases myself.** I judged the 13 F1-only passes (8 for the 1.5B, 5 for the 0.5B) alone and caught one miss. Two more 1.5B failures are arguable: "The convict who was transformed into a gentleman" for Magwitch, and "algae" for algology. Crediting either or both moves AUROC between 0.81 and 0.84 and accuracy to 27.7 or 28.6%. The [per-question grades](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/graded_qwen2.5-1.5b.jsonl) are in the repo.

**Closed-book trivia isn't your workload.** Reasoning chains, long outputs and RAG answers could behave differently, as could larger models.

## The takeaway

Log the probability of every answer your model gives; it's free. Rank by it, never quote it as a percentage, and choose the cutoff on a few hundred graded examples kept apart from whatever you tuned on.

To test it on your own model, take 100 questions you have answers for, sort the model's answers by confidence, and count the wrong ones in the top third. If it holds a third of them, the signal is noise. In my run the top third (37 questions) held 16 of the 82 wrong answers, 20% instead of 33%. If someone shows me a held-out set of a few hundred questions where the 0.9 band is right less than 70% of the time, I'll drop the cutoff idea. I'd like to measure next whether sending below-cutoff questions from the 0.5B to the 1.5B beats always using the 1.5B. Everything is in the [artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/does-it-know-its-wrong).
