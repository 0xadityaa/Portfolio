## Thread

A MiniLM semantic cache at a 0.85 threshold gave the wrong answer on 28% of its hits.

I ran it on 5,000 Quora question pairs, a hard set where most non-duplicates are related questions. Raising the threshold doesn't fix it ↓
[image: /images/blog/semantic-cache-false-hits.svg]
---
"Castor oil at 36 weeks" vs "castor oil at 39 weeks": cosine 0.989 on MiniLM.

Same for Hale County vs Clarke County (0.961) and Northeastern vs Western Illinois University (0.959).

The detail that flips the answer is a sliver of the vector.
---
The "narrow cone" is real. Random unrelated question pairs average cosine 0.05 on MiniLM, 0.38 on bge-small and 0.77 on e5-small.

At 0.80, 14% of unrelated pairs hit on e5-small. On the other two, 1 pair in 5,000.
---
At 0.85 it also missed 38% of the real duplicates. Holding the wrong share to 10%:

→ MiniLM: threshold 0.966, keeps 13% of duplicates
→ bge-small: 0.969, 18%
→ e5-small: 0.990, 11%

5% was out of reach for MiniLM and e5-small.
---
Calibrate the threshold on your own pairs, and add an entity or number check before serving a hit.

Full post: https://www.0xadityaa.dev/blog/is-your-semantic-cache-lying
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-your-semantic-cache-lying

## Singles

28% of a MiniLM semantic cache's hits were wrong at a 0.85 threshold on hard Quora pairs. At 0.95 it was still 14%.
---
The same cosine means different things per model: 0.80 is 14% of unrelated pairs on e5-small and 1 in 5,000 on MiniLM.
---
"Castor oil at 36 weeks" and "castor oil at 39 weeks" score 0.989. A cache that returns the first answer for the second has done exactly what it was built to do.
---
On hard Quora pairs, a 0.85 cache on bge-small: 45% of pairs hit, 35% of those hits wrong. Same threshold on e5-small: 83% hit, 55% wrong.
---
A semantic cache needs a query embedding before it can say hit or miss. On 4 CPU threads that was 33 to 84 ms per query across three small models.

## Link post

A semantic cache at 0.85 returned the wrong answer on 28% of its hits (MiniLM, 5,000 Quora pairs, a deliberately hard set). Unrelated text isn't the cause; one-word differences are. I tested three models and what a stricter threshold costs.

https://www.0xadityaa.dev/blog/is-your-semantic-cache-lying
[image: /images/blog/semantic-cache-false-hits.svg]

## Question

What similarity threshold is your semantic cache running, and did you ever measure its wrong-hit rate?

## Substack Note

At a 0.85 cosine threshold, a MiniLM semantic cache gave the wrong answer on 28% of its hits.

I tested three small embedding models on 5,000 Quora question pairs, a hard set because most non-duplicates are related questions. The famous "narrow cone" is real: random unrelated questions average 0.05 on MiniLM but 0.77 on e5-small, so a threshold only means something per model. But it isn't what breaks the cache. What breaks it are near misses like "castor oil at 36 weeks" versus "castor oil at 39 weeks", which score 0.989.

Raising the threshold shrinks the wrong share slowly and the hits much faster. Holding it to 10% kept only 11 to 18% of real duplicates, and two of the three models never reached 5%.

The numbers, the figures and the script are in the post:

https://www.0xadityaa.dev/blog/is-your-semantic-cache-lying
