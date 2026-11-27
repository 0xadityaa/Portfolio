## Thread
A 1.5B model's own probability for its answer works as an "I don't know" switch. Below 0.225 it drops half its wrong answers and keeps 85% of its right ones. 112 closed-book TriviaQA questions, Qwen2.5-1.5B.

[image: /images/blog/abstain-keeps-right.svg]
---
Ranking: its probability puts a right answer above a wrong one 79% of the time (AUROC 0.79, interval 0.69 to 0.88). Ranking by answer length alone gets 0.58.
---
It isn't a real probability. Average stated confidence was 0.39, the real hit rate 0.30. Answers rated 0.9 or more were right 82% of the time (9 of 11). Use it to rank and cut, not to quote.
---
Qwen2.5-0.5B scores the same AUROC, 0.79. But ranking its answers by shortness alone gets 0.75, so most of its confidence is "short answers are right". The 1.5B adds 0.21 over length.
---
Log the probability of every answer, rank by it, and pick the cutoff on graded examples you didn't tune on.

Full post: https://www.0xadityaa.dev/blog/does-it-know-its-wrong
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/does-it-know-its-wrong

## Singles
At a confidence of 0.9 or more, a 1.5B model was right 9 times in 11. Under 0.1, it was right 3 times in 26. It never says "I'm not sure", but its token probabilities do.
---
I expected the 0.5B model's confidence to be worse than the 1.5B's. Same AUROC, 0.79. Answer length alone scores 0.75 on the 0.5B, so most of that signal is "short answers are right".
---
The token-F1 >= 0.5 grading rule accepted 8 answers that strict matching rejected. 5 were wrong, like "Grand Canyon National Park" for Joshua Tree. Pick the grader before you measure confidence.
---
A model's stated confidence averaged 0.39 and its real hit rate was 0.30. It still halved the wrong answers for a 15% loss of right ones. Miscalibrated and useful turn out to be compatible.
---
Pick the abstention cutoff on half your questions, apply it to the other half. Mine kept 84.5% of right answers and let 48.9% of wrong ones through. Picked and scored on the same questions: 85% and 50%.

## Link post
A 1.5B model that abstains below 0.225 confidence keeps 85% of its right answers and gives half its wrong ones.

It's the cheapest "I don't know" there is: one log probability and a threshold.

https://www.0xadityaa.dev/blog/does-it-know-its-wrong

[image: /images/blog/abstain-keeps-right.svg]

## Question
If your model can return token probabilities, do you log them next to every answer, and has anyone checked whether they predict the wrong ones?

## Substack Note
A 1.5B model answered 112 trivia questions with no notes. When it gave an answer a probability of 0.9 or more, it was right 9 times out of 11. Under 0.1, it was right 3 times out of 26.

That's the whole idea behind letting a small model say "I don't know". Rank its answers by the probability it gave them and the ranking works: AUROC 0.79, against 0.58 for answer length alone. Refuse to answer below a cutoff of 0.225 and you drop half the wrong answers while keeping 85% of the right ones.

The number isn't a real probability, though. It averaged 0.39 and the hit rate was 0.30, so use it to rank and cut, not to quote. The smaller 0.5B model scored the same AUROC, but mostly because its short answers were the right ones.

Full write-up, with the code and every raw token probability:

https://www.0xadityaa.dev/blog/does-it-know-its-wrong
