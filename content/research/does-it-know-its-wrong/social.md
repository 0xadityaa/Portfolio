## Thread
A 1.5B model's own probability for its answer works as an "I don't know" switch. Below 0.225 it drops half its wrong answers and keeps 90% of its right ones. 112 closed-book TriviaQA questions, Qwen2.5-1.5B, which I graded by hand.

[image: /images/blog/abstain-keeps-right.svg]
---
Ranking: its probability puts a right answer above a wrong one 84% of the time (AUROC 0.84, interval 0.74 to 0.93). Ranking by answer length alone gets 0.64.
---
It isn't a real probability. Average stated confidence was 0.39, the real hit rate 0.27. Answers rated 0.9 or more were right 82% of the time (9 of 11). Use it to rank and cut, not to quote.
---
Qwen2.5-0.5B: AUROC 0.78. But ranking its answers by shortness alone gets 0.79, and its confidence adds -0.01 (interval -0.14 to 0.13). 112 questions can't tell its confidence from "short answers are right".
---
Log the probability of every answer, rank by it, and pick the cutoff on graded examples you didn't tune on.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/does-it-know-its-wrong

## Singles
At a confidence of 0.9 or more, a 1.5B model was right 9 times in 11. Under 0.1, it was right 2 times in 26. It never says "I'm not sure", but its token probabilities do.
---
I expected the 0.5B model's confidence to be worse. AUROC 0.78 against 0.84 for the 1.5B, inside my guess. But answer length alone scores 0.79 on the 0.5B, and its confidence adds -0.01 (-0.14 to 0.13). I can't tell them apart.
---
An automatic grader (strict match, or token F1 of 0.5 or more) passed 8 answers that strict matching rejected. 5 were wrong, like "Grand Canyon National Park" for Joshua Tree. Fixing the grades moved AUROC from 0.79 to 0.84.
---
A model's stated confidence averaged 0.39 and its real hit rate was 0.27. It still halved the wrong answers for a 10% loss of right ones. Miscalibrated and useful turn out to be compatible.
---
Pick the abstention cutoff on half your questions, apply it to the other half. Mine kept 89.5% of right answers and let 48.8% of wrong ones through. Picked and scored on the same questions: 90% and 50%.

## Link post
A 1.5B model that abstains below 0.225 confidence keeps 90% of its right answers and gives half its wrong ones.

It's the cheapest "I don't know" there is: one log probability and a threshold.

<BLOG_URL>

[image: /images/blog/abstain-keeps-right.svg]

## Question
If your model can return token probabilities, do you log them next to every answer, and has anyone checked whether they predict the wrong ones?

## Substack Note
A 1.5B model answered 112 trivia questions with no notes. When it gave an answer a probability of 0.9 or more, it was right 9 times out of 11. Under 0.1, it was right 2 times out of 26.

That's the whole idea behind letting a small model say "I don't know". Rank its answers by the probability it gave them and the ranking works: AUROC 0.84, against 0.64 for answer length alone. Refuse to answer below a cutoff of 0.225 and you drop half the wrong answers while keeping 90% of the right ones.

The number isn't a real probability. It averaged 0.39 and the hit rate was 0.27, so use it to rank and cut, not to quote. The 0.5B model scored a similar AUROC, but so does its answer length, so I can't say its confidence adds anything. I hand-graded everything; the automatic grader let 5 wrong answers through.

Full write-up, with code and data:

<BLOG_URL>
