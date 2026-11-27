## Thread

Qwen2.5-0.5B picked answer A on 825 of 825 MT-Bench pairs. The two answers were swapped. It picked A on 825 of 825 again.

If a small LLM judge grades your outputs, that's your verdict: a slot, not an answer.

[image: /images/blog/judge-picks-first-slot.svg]
---
A constant verdict agrees with humans exactly as often as humans pick the first answer: 51.4% (95% interval 48.5 to 54.5). A coin.

It was scored from the logits of "A" and "B". Nothing was generated.
---
The margin still moves. Subtract the order-2 margin from the order-1 margin and agreement with humans rises to 63.2% (59.5 to 66.8).

"Pick the longer answer" gets 73.2%. Two humans agree 82.6%.
---
Qwen2.5-1.5B doesn't remove the bias, it moves it: slot B in 71% of verdicts, and the same slot in both orders on 60 of 100 pairs. Independent flips with that slot preference would give 58.5%.
---
Run every pair in both orders, count how often the judge picks one slot, and put "pick the longer answer" next to every judge. If it can't beat len(), it's guessing.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-your-llm-judge-guessing

## Singles

825 of 825.

A small judge picked answer A on every MT-Bench pair, then picked A again with the answers swapped. Its agreement with human votes: 51.4%, the share of humans who also picked the first answer.
---
A 1.5B judge agrees with humans 48.5% of the time with the answers in one order and 64.2% in the other. Same model, same 100 pairs.

Average the margins from both orders: 73.1%.
---
"Pick the longer answer" agrees with MT-Bench human votes 73.2% of the time (70.0 to 76.5).

A 0.5B judge reaches 63.2% after you subtract both orders. Run the length baseline before you pay for a judge.
---
Keeping only the pairs where a judge gives the same verdict in both orders sounds careful. For the 1.5B judge it dropped 60 of 100 pairs and scored 65.5%.

Averaging the margins kept all 100 and scored 73.1%.
---
A one-pass fix for a biased judge: subtract the median margin from every score. For the 1.5B judge that gave 71.6% agreement with humans, against 73.1% for two passes.

For the 0.5B judge it gave 51.1%. Its signal is in the gap between orders, not the offset.

## Link post

A 0.5B judge picked answer A on 825 of 825 pairs, in both orders. Subtracting the margins from the two orders is where its 63% agreement with humans comes from.

<BLOG_URL>
[image: /images/blog/judge-agreement-with-humans.svg]

## Question

When you use an LLM as a judge, do you score each pair in both orders, and what share of your verdicts pick the same slot?

## Substack Note

825 of 825. That's how many MT-Bench pairs a 0.5B Qwen judge answered "A" on, and when the two answers were swapped it said "A" on all 825 again.

A constant verdict agrees with human votes 51.4% of the time, the share of humans who picked the first answer. But the margin behind the letter still moves. Subtract the order-2 margin from the order-1 margin and agreement rises to 63.2%.

A rule that picks the longer answer scores 73.2%. Two humans agree 82.6%.

The 1.5B model flips the bias to the second slot (71% of verdicts) and agrees 48.5% in one order, 64.2% in the other, 73.1% with both averaged. Everything was scored from the logits of "A" and "B", no generation, on a shared CPU.

Check how often your judge picks one slot before you trust a single score.

<BLOG_URL>
