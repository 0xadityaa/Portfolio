## Thread

Eight examples made a prompt 5.5x longer and moved Qwen2.5-0.5B from 66% to 69% on AG News. On 100 articles, that is inside the noise.

A wrong chat template scored 25%. That is a broken answer position, not a weak model.

[image: /images/blog/few-shot-vs-template.svg]
---
One example made it worse. Accuracy fell from 66% to 58.3%, and every one of the three example sets lost to zero shots.

Three shots got back to 65%. Eight reached 69%, but the sets scored 66, 68 and 73.
---
Wrong template, no examples: Qwen's chat format minus the assistant header scores 25%. Llama-2's [INST] format scores 31%.

Both put 0.000 of the probability on the label words. The model wanted to open a new turn, so I was reading the answer in the wrong place.
---
Eight examples repair most of the Llama-2 damage, to 58%. The three example sets scored 66, 50 and 58. With a slightly wrong template, which examples you pick suddenly matters.
---
Eight shots cost 418 extra tokens a query for no measurable gain: $83.53 per 100,000 queries on Sonnet 5.5, or $4.18 cached. Check the template before the examples.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/is-few-shot-worth-the-tokens

## Singles

25%.

A chat template missing its assistant header scored exactly chance on a balanced 4-way task. The model predicted Business for all 100 articles. The scoring position broke: it wanted to open a new turn, not name a label.
---
Going from 0 to 1 example cut accuracy from 66% to 58.3% for a 0.5B model. All three example sets lost.

At one shot it called 61% of articles Business, its worst skew of any shot count.
---
A prompt with no chat template, 82 tokens: 70% on AG News. The same model with its own template and eight examples, 510 tokens: 69%.

On 100 articles that is a tie. The no-template edge is only a hint.
---
Same 8 examples, three shuffles, Llama-2's template on a Qwen model: 66%, 50% and 58%. With the right template, the same three shuffles scored 66%, 68% and 73%.
---
139 tokens per accuracy point. That is what going from 0 to 8 shots cost on a 0.5B model that went from 66% to 69%.

A 100-article score carries an interval about 18 points wide, so the point may not exist.

## Link post

Eight shots made the prompt 5.5x longer and added 3 points, inside the noise, to a 0.5B model. The wrong chat template broke where the answer is read. Count the template before the examples.

<BLOG_URL>
[image: /images/blog/few-shot-vs-template.svg]

## Question

When you add few-shot examples to a prompt, do you measure label mass or parse rate first, and how many example sets do you try before you trust the number?

## Substack Note

Eight examples made my prompt 5.5 times longer and lifted a 0.5B model from 66% to 69% on AG News. On 100 articles, that is inside the noise. What broke outright was the template.

I scored Qwen2.5-0.5B-Instruct on four prompt formats and four shot counts by reading the logits of the four label words, with three seeded example sets per count. One example made accuracy worse, 58.3%. Qwen's chat template minus its assistant header scored 25%, exactly chance, because the model wanted to open a new turn instead of naming a label. I was reading the answer in the wrong place, so that says nothing about ability. Llama-2's format scored 31% and then 58% with eight examples, with sets as far apart as 50% and 66%.

The prompt with no chat template at all scored highest, 70% with no examples and 77% with eight, but only one of three example sets is nominally significant, so I'm calling it a hint.

The extra 418 tokens cost $83.53 per 100,000 queries uncached on Sonnet 5.5. Print the exact string your model sees before you add an example.

https://www.0xadityaa.dev/blog/is-few-shot-worth-the-tokens
