---
title: Does It Know It's Wrong?
publishedAt: '2027-01-07'
summary: >-
  A 1.5B model's own answer probability ranks right above wrong 79% of the time. Abstaining below 0.225 drops half its wrong answers and 15% of its right.
tags:
  - ai
  - evals
  - llm
draft: true
---

I asked Qwen2.5-1.5B 112 trivia questions with no notes, then recorded how likely it thought each of its own answers was. When it gave an answer a probability of 0.9 or more, it was right 9 times out of 11. When it gave one a probability under 0.1, it was right 3 times out of 26.

The model never says "I'm not sure". Its probabilities say it for free, if you read them. That matters for anything that can choose between answering and saying "I don't know": a support bot, a RAG answerer, a router that hands hard questions to a bigger model. The question is how far that signal can be trusted.

**A small model's probability for its own answer ranks right above wrong about 79% of the time (AUROC 0.79), and refusing to answer below a cutoff of 0.225 removes half of its wrong answers while keeping 85% of its right ones. It is not a calibrated percentage, so use it to rank and cut, not to quote.**

## The short version

- On 112 closed-book TriviaQA questions, Qwen2.5-1.5B was right 30.4% of the time (95% interval 22.6 to 39.4%).
- Its probability for its own answer ranked a right answer above a wrong one 79% of the time (AUROC 0.79, interval 0.69 to 0.88). Ranking by answer length alone got 0.58.
- Answers rated 0.9 or higher were right 82% of the time, on 10% of the questions. Its average stated probability overshot the hit rate by 9 points (0.39 against 0.30).
- Cutting off at 0.225 kept 85% of the right answers and 50% of the wrong ones. Qwen2.5-0.5B scored the same AUROC, but mostly because short answers tend to be right.

## How I measured it

The questions come from the validation split of [TriviaQA](https://arxiv.org/abs/1705.03551), in the [closed-book config](https://huggingface.co/datasets/mandarjoshi/trivia_qa) with no passage attached: 17,944 questions, each with a list of accepted answer aliases. I shuffled them with a fixed seed and answered them in order, so the 112 I got through in about 33 minutes are a uniform random sample. The machine was shared (load average 14 at the start, 98 at the end), which is why it's 112 and not 1,000. [Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct) ran on 4 CPU threads in bf16, greedy, 16 tokens at most, under a system prompt asking for the answer and nothing else. [`run.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/run.py) saves every token's log probability.

My confidence score is the probability of the whole answer, the product of its token probabilities:

$$
P(a \mid q) = \prod_{t=1}^{T} p(y_t \mid q, y_{<t})
$$

Every extra token multiplies in another number below 1, so the score punishes rambling as well as doubt.

Grading uses the alias lists plus the rule from [Is Exact Match Lying?](/blog/exact-match-would-fail-the-humans-too): an answer is right if it matches an alias after normalising, or if its token F1 against one is at least 0.5. Here, 8 of the 34 accepted answers got in on F1 alone. I read all eight. Three were right ("Iron Lady", "Every 10 years", "Happy Birthday to You"). Five were wrong, such as "Grand Canyon National Park" for Joshua Tree. The rule also rejected "Kristiania" for Oslo's old name, because the alias list spells it "Christiania". The headline numbers use the rule as written, and [`overrides.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/overrides.json) holds my corrections.

## Does the probability tell right from wrong?

Yes. AUROC is the chance that a randomly chosen right answer got a higher confidence than a randomly chosen wrong one: 0.5 is a coin flip, 1.0 is perfect. For the 1.5B model it's **0.79** (95% bootstrap interval 0.69 to 0.88, resampling questions). I'd written down 0.75 to 0.85 beforehand, and that held.

Confidence might be a stand-in for something dumber, and answer length is the obvious candidate, because long answers are usually waffle. Ranking by shortness alone gets 0.58 (0.47 to 0.69). The gap is 0.21 (0.11 to 0.32), so the probabilities carry information that length doesn't.

The grader moves the number. Strict alias matching gives 0.88, my hand corrections give 0.84, and the F1 rule as written gives 0.79. The intervals overlap, but the looser the rule, the worse confidence looks.

## Is it a real probability?

No. A bathroom scale that reads four pounds heavy is useless for your weight and fine for telling who weighs more, and the model's confidence is that scale. The standard check is expected calibration error: sort answers into ten equal-width bins of stated confidence, then average the gap between each bin's mean confidence and its hit rate, weighted by bin size:

$$
\text{ECE} = \sum_{b=1}^{10} \frac{n_b}{n}\,\bigl|\,\text{acc}_b - \text{conf}_b\,\bigr|
$$

For the 1.5B model it's 0.126 (0.10 to 0.22). Its stated probabilities average 0.39 and its real hit rate is 0.30. The figure uses five wider bands, since ten bins hold as few as 4 answers.

![Horizontal bars of how often Qwen2.5-1.5B was right by the probability it gave its own answer: under 0.1 was right 12 percent, 0.1 to 0.3 was right 11 percent, 0.3 to 0.6 was right 32 percent, 0.6 to 0.9 was right 53 percent and 0.9 or more was right 82 percent. The average stated probability sits above the bar in every band but the lowest.](/images/blog/calibration-bands.svg "112 TriviaQA questions, Qwen2.5-1.5B-Instruct, rule grader. Counts and bin tables are in [`analysis.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/analysis.txt).")

The middle is where it overreaches. Answers rated 0.6 to 0.9 averaged 0.75 and were right 53% of the time (10 of 19). The top band averaged 0.97 and was right 82% (9 of 11), a strong signal that is still 15 points shy of its own claim. At the bottom the model undersells itself: answers under 0.1 averaged 0.04 and were right 12% of the time (3 of 26), so a low score means unlikely, not impossible.

[Guo and colleagues](https://arxiv.org/abs/1706.04599) reported overconfidence in modern image and document classifiers in 2017. [Kadavath and colleagues](https://arxiv.org/abs/2207.05221) say in their abstract that "larger models are well-calibrated on diverse multiple choice and true/false questions". Mine is free-form answers from a much smaller model.

## What does abstaining buy?

This is the part you'd ship: answer only when confidence clears a cutoff, refuse otherwise. It is the risk-coverage trade from [selective classification](https://arxiv.org/abs/1705.08500), where answering fewer questions buys a higher share of right ones. The figure plots right answers kept against wrong answers still given as the cutoff slides from 1 down to 0.

![Curve of right answers kept against wrong answers still given as the confidence cutoff moves. At a cutoff of 0.225 the model keeps 85 percent of its right answers and still gives 50 percent of its wrong ones. The curve sits well above the diagonal that marks no signal.](/images/blog/abstain-keeps-right.svg "112 TriviaQA questions, Qwen2.5-1.5B-Instruct, rule grader; one step per distinct confidence value. Produced by [`make_figs.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/make_figs.py) from [`analysis.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/analysis.json).")

The cutoff that halves the wrong answers is 0.225. It answers 61% of the questions and is right 42.6% of the time when it answers, against 30.4% with no abstaining. It keeps 29 of the 34 right answers (85%, interval 71 to 97%) and still gives 39 of the 78 wrong ones. I'd guessed that would cost 20 to 30% of the right ones, so the model beat my expectation. Five cutoffs, side by side:

| Cutoff | Questions answered | Right when answered | Right answers kept | Wrong answers given |
| --- | --- | --- | --- | --- |
| 0.9 | 9.8% | 81.8% | 26.5% | 2.6% |
| 0.7 | 20.5% | 73.9% | 50.0% | 7.7% |
| 0.5 | 36.6% | 53.7% | 64.7% | 24.4% |
| 0.3 | 51.8% | 48.3% | 82.4% | 38.5% |
| 0.1 | 76.8% | 36.0% | 91.2% | 70.5% |

I picked 0.225 after seeing the answers, which flatters it. So I repeated the choice 500 times: pick the cutoff on a random half, apply it to the other half. On the held-out half it kept 84.5% of the right answers and let 48.9% of the wrong ones through, with a spread of 11 points on that wrong share. The cutoff transfers, noisily.

## Does a smaller model know less about what it knows?

I expected so, and ran Qwen2.5-0.5B-Instruct on the same 112 questions. It was right 14.3% of the time (9.0 to 22.0%), and its AUROC was 0.79 (0.68 to 0.89), identical to the 1.5B's. I'd written down "lower by 0.03 to 0.08", so I was wrong.

The explanation is the length baseline. For the 0.5B model, ranking by shortness alone scores 0.75 (0.65 to 0.85), and confidence adds 0.04 (-0.09 to 0.17), which is nothing at this sample size. When it's wrong it rambles: 10 of its 112 answers hit the 16-token cap. Its confidence works mostly as a rambling detector. Divide the log probability by the token count to remove the length penalty and the 0.5B drops to 0.56 (0.39 to 0.72), while the 1.5B holds at 0.81.

## Where I'd stop trusting this post

**Token probabilities punish rewording.** [Kuhn and colleagues](https://arxiv.org/abs/2302.09664) argue that different sentences can mean the same thing, so probability splits across paraphrases and token-level scores understate a model's confidence in the meaning. Mine is that kind of score. Sampling many answers per question and grouping them by meaning, as their semantic entropy does, could beat 0.79. I didn't run it.

**112 questions is thin.** The interval on the "halve the wrong answers" result runs from 71 to 97%, and each reliability band holds 11 to 28 answers. A few points between two cutoffs is noise, for the reasons in [Is Your Eval Too Small?](/blog/your-eval-set-is-too-small-to-tell).

**I graded the gray cases myself.** The eight F1-only passes and the one miss were judged by one reader, me. The [per-question grades](https://github.com/0xadityaa/Portfolio/blob/main/content/research/does-it-know-its-wrong/results/graded_qwen2.5-1.5b.jsonl) are in the repo. Hand-corrected, the 1.5B scores 26.8% accuracy and 0.84 AUROC.

**Closed-book trivia isn't your workload.** Every question has one short factual answer. Reasoning chains, long outputs and RAG answers could behave differently, as could larger models. Batching 8 in bf16 can also shift a probability's last digits.

## The takeaway

Log the probability of every answer your model gives. It costs nothing, and any local runtime can return it. Rank by it, never quote it as a percentage, and choose the cutoff on a few hundred graded examples kept apart from whatever you tuned on.

To test it on your own model, take 100 questions you have answers for, sort the model's answers by confidence, and count the wrong ones in the top third. If it holds a third of them, the signal is noise. In my run the top third (37 questions) held 16 of the 78 wrong answers, 21% instead of 33%. If someone shows me a held-out set of a few hundred questions where the 0.9 band is right less than 70% of the time, I'll drop the cutoff idea. I'd like to measure next whether sending below-cutoff questions from the 0.5B to the 1.5B beats always using the 1.5B. Everything is in the [artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/does-it-know-its-wrong).
