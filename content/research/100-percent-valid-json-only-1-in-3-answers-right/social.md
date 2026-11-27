## Thread

120 of 120 valid JSON. 0 parse failures. Only 29.2% of answers had all five fields right.

That is constrained decoding on Qwen2.5-0.5B-Instruct. Three examples in the prompt get the same 100% valid, and 30.8% right. Format is solved. The answer isn't. ↓

[image: /images/blog/valid-json-vs-right-answers.svg]

---

Instruction only: all 120 replies came wrapped in a code fence, so json.loads fails on every one.

Strip the fences and 42.5% still break the schema. The model adds a key nobody asked for, like "reason" or "message".

---

Priority is where it goes wrong.

The model said "high" for 114 to 120 of 120 messages in every setup. Always guessing "medium" scores 40%. Always "high" scores 30%. Every setup landed at 30% to 33%.

"high" is a legal enum value, so the schema never complains.

---

Constraint on its own cost nothing in accuracy: -0.3 points [-1.7, +1.0] against the plain prompt.

Three examples on top of the mask added 3.8 points [+2.3, +5.5], mostly in the refund field. A mask can force true or false to appear. It can't pick which one the customer meant.

---

Report valid and right as two numbers. For every enum field, compare accuracy with the best constant guess before trusting it.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/100-percent-valid-json-only-1-in-3-answers-right

## Singles

120 of 120 replies wrapped in a ```json fence. json.loads failed on every one.

Strip the fences and 42.5% still broke the schema, because the model added a key. Parse errors are the cheap half of the problem.

---

100% schema-valid. 31% right on priority (constrained decoding).

The model answered "high" for 118 of 120 messages, and "high" is a legal enum value. A schema check can't tell a confident wrong answer from a right one.

---

Adding the mask on top of three examples: +0.5 points [0.0, 1.2].

Adding the examples on top of the mask: +3.8 [+2.3, +5.5].

The examples carry content. The mask only carries shape.

---

Always answering "medium" scores 40% on a three-way priority field.

A 0.5B model with a schema, three examples, or both scored 31% to 33%. Every enum field needs a comparison with the constant guess before it ships.

---

Constrained decoding changed accuracy by -0.3 points [-1.7, +1.0] on a 120-message extraction task.

Quality didn't drop. The wrong answers just arrived in perfect JSON.

## Link post

Valid JSON is not right JSON: 100% schema-valid, 30.8% of priorities right, on Qwen2.5-0.5B with constrained decoding.

A parse-error dashboard stays green while the answers are wrong. <BLOG_URL>

[image: /images/blog/valid-json-vs-right-answers.svg]

## Question

For LLM extraction in production: is there a per-field accuracy number against a labelled set, or only the parse-error rate?

## Substack Note

120 messages, 120 valid JSON objects, and only 35 with all five fields right.

That is the result of running Qwen2.5-0.5B-Instruct through constrained decoding on a five-field extraction task. The schema guaranteed the shape: no parse failures, no stray keys, every enum value legal. It could not guarantee the content. The model answered "high" for 118 of 120 messages, so priority scored 30.8% (wrong 69% of the time), below the 40% an always-"medium" guess would get.

Three examples in the prompt got to 100% valid too, without any mask, and added 531 input tokens per request. The mask on top of the examples moved accuracy by half a point.

Plain instruction alone came out worse in a boring way: every reply was wrapped in a code fence, and 42.5% still failed the schema after stripping it.

Valid and right are two different numbers. Full write-up, with code and raw output: <BLOG_URL>
