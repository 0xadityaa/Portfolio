# The Cheap Model Isn't Always Cheaper

- Topic issue: none yet (drafted from a series brief, AI-engineering syllabus; the topic list is the only thing taken from llmdojo.dev/curriculum)
- Format: essay
- Thesis: Price per token is the wrong unit. Cost per useful answer, counting wrong answers and what they cost downstream, can make the cheap model the expensive choice, and a cheap-first cascade beats both, but only if its check is reliable.
- Reader: an engineer who picks models by price list and has not written down what one wrong answer costs.

## What this adds

Prior art, checked 2026-11-14:

- [FrugalGPT](https://arxiv.org/abs/2305.05176) (Chen, Zaharia, Zou, 2023): proposes LLM cascades; abstract reports matching GPT-4 at up to 98% lower cost, on benchmarks.
- [RouteLLM](https://arxiv.org/abs/2406.18665) (Ong et al., 2024): routers trained on preference data; abstract reports cost reductions of over 2 times in certain cases.
- [Chip Huyen, Building A Generative AI Platform](https://huyenchip.com/2024/07/25/genai-platform.html), Router section: routing as an intent classifier in front of the models.
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), Routing: sends easy questions to a smaller model.

What it adds: one formula for cost per useful answer with the failure cost swept from $0 to $5, the closed-form break-even, and a cascade whose verifier has an explicit leak, so the reader can see how much leak a given failure cost tolerates. The papers report savings on benchmarks; this shows the assumption the savings rest on.

## Artifact

`content/research/the-cheap-model-is-not-always-cheaper/`: `cost_model.py`, `prices.json`, `output.txt`, `make_chart.py`, `EXPECTATION.txt`, `README.md`, `social.md`. Chart at `public/images/blog/cost-per-useful-answer.svg`.

**Expectation, written beforehand** (full text in `EXPECTATION.txt`): break-even F* in tens of cents for the Claude pair and lower for the OpenAI pair; F* explodes as the cheap model's success approaches the expensive one's; cheap wins at F = $0 for any success rate above a few percent; a cascade with a decent verifier wins a broad middle band; a leaky verifier erases it, which I guessed would happen around a 50% leak at F near $1; the cascade does not beat the cheap model at F near $0; Monte Carlo agrees with the closed form.

**Commands.**

```bash
cd content/research/the-cheap-model-is-not-always-cheaper
python3 cost_model.py > output.txt
python3 make_chart.py ../../../public/images/blog/cost-per-useful-answer.svg
xmllint --noout ../../../public/images/blog/cost-per-useful-answer.svg
```

**Environment.** Python 3.12.8, macOS (Darwin 25.5.0), standard library only. Seed 20261114; 200,000 tasks per Monte Carlo row, per-row RNG seeded from `seed-index`.

**Raw output** (excerpts from `output.txt`; the file has everything):

```text
| claude-haiku-5.5 | 0.1 | 0.5 | $0.00055 |
| claude-opus-5.5 | 4.0 | 20.0 | $0.022 |
| gpt-5.4-mini | 0.75 | 4.5 | $0.0045 |
| gpt-5.4 | 2.5 | 15.0 | $0.015 |
Anthropic pair: expensive costs 40.0x the cheap one per request
OpenAI pair: expensive costs 3.3x the cheap one per request

Break-even F* (expensive success 0.95)
| 80% | $0.114 | $0.051 |   (Claude pair | OpenAI pair)
| 90% | $0.386 | $0.184 |
| 94% | $2.02 | $0.982 |
| 95% | never | never |

Steelman, F = 0: cheap wins for any cheap success above 2.4% (Claude pair), 28.5% (OpenAI pair)

Cascade leak f* (Claude pair, cheap 0.80, expensive 0.95, verifier passes 95% of right answers):
| $0.25 | 0.533 |
| $0.5 | 0.367 |
| $1 | 0.283 |
| $5 | 0.217 |
Cascade (leak 0.10) cheapest of three: cheap alone up to $0.025, cascade from $0.025 up to $5.

Hard-case sensitivity (F = $1, leak 0.10): cascade $0.038 / $0.050 / $0.075 / $0.100 / $0.156 at expensive-on-escalated 95/90/80/70/50%; expensive alone $0.076.

Monte Carlo, leak 0.10: P(wrong) 0.0310 closed form, 0.0316 simulated; spend/task 0.005790 vs 0.005777.
```

**Did the expectation hold?** Mostly. Held: F* is in tens of cents ($0.114) and lower for the OpenAI pair ($0.051); F* explodes near parity; cheap wins at F = $0; cascade wins a broad band and does not beat the cheap model below $0.025; Monte Carlo matches within sampling error. Did not hold: I guessed the cascade would stop beating Opus alone at about a 50% leak at F near $1. It stopped at 28%. The leak a cascade can afford is smaller than I thought, and the post says so.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Claude Haiku 5.5 $0.10 in / $0.50 out per MTok (prompts up to 100,000 tokens); Claude Opus 5.5 $4 in / $20 out | https://platform.claude.com/docs/en/about-claude/pricing (fetched via the docs page; the marketing pricing page redirects to claude.com/pricing) | 1 | 2026-11-14 |
| Anthropic Batch API gives a 50 percent discount on input and output tokens | same page, Batch processing section | 1 | 2026-11-14 |
| gpt-5.4-mini $0.75 in / $4.50 out; gpt-5.4 $2.50 in / $15 out (standard tier, under 272K context) | https://developers.openai.com/api/docs/pricing (platform.openai.com/docs/pricing redirects here; openai.com/api/pricing returned 403) | 1 | 2026-11-14 |
| FrugalGPT: cascade of LLMs; matches GPT-4 at up to 98% cost reduction or beats it by 4% at equal cost | https://arxiv.org/abs/2305.05176 (abstract) | 1 | 2026-11-14 |
| RouteLLM: routers trained on preference data cut cost over 2x in certain cases without hurting quality | https://arxiv.org/abs/2406.18665 (abstract) | 1 | 2026-11-14 |
| Anthropic lists routing easy questions to smaller models as a workflow | https://www.anthropic.com/engineering/building-effective-agents | 1 | 2026-11-14 |
| Router as intent classifier; small classifiers are faster and cheaper than general models | https://huyenchip.com/2024/07/25/genai-platform.html | 2 | 2026-11-14 |
| Counter: when failure is cheap and visible, per-token price decides; routers add latency and complexity | Chip Huyen (above, partly); own numbers in sections 4 and 5 of `output.txt` | 2 / artifact | 2026-11-14 |
| All cost, break-even, cascade and leak numbers | `output.txt`, seed 20261114 | artifact | 2026-11-14 |
| Retries only help for visible, transient failures | his post draft, `content/blog/95-percent-per-step-is-a-coin-flip-by-step-14.md` (open PR) | his | |

Primary sources: every row but the artifact row, the Huyen row, and the row from his own post. Two caveats: only abstracts of the two papers were read, so the post quotes only abstract-level numbers; and the "flagship" OpenAI model is my choice (see open questions).

## Counter-argument

In many applications a wrong answer is cheap and visible: the user rereads and asks again. Then cost per useful answer is `c / s`, so the cheapest model per token is the cheapest, and routers add latency and complexity (Huyen describes the router as another component; a verifier also adds a serial call). Steelman with my numbers: at F = $0, Haiku wins unless it is right under 2.4% of the time, and at a failure cost below $0.025 Haiku alone beat the cascade. The OpenAI pair shows the corollary: with only a 3.3x price gap, there is little room for a quality gap, with break-even at $0.051. The post puts this in the limits section and says where the advice applies.

## Self-check against style.md

1. Thesis in the first 150 words: third paragraph, bold sentence, after the priced-request opening.
2. Artifact: calculator, cascade simulation and break-even solver in the linked folder; chart and tables in the post.
3. Numbers with their papers: prices link to both pricing pages with the checked date in this note and "copied today" in the post; cost shown at 10,000, 1,000,000 and 100,000,000 useful answers; other numbers come from the script.
4. Links as evidence trail: 10+ external links in about 2,150 words.
5. Limits: "Where I'd stop trusting this post" opens with the cheap-and-visible-failures objection, using my own numbers, then routers (Huyen), assumed rates, and what was not tested.
6. Ending that adds: decision rule (write down what a wrong answer costs; cents and retryable means cheap model; over ten cents and silent means price per useful answer; cascade only after measuring the check's leak) plus what would change my mind.

## Outline

Thesis: price per token is the wrong unit; cost per useful answer flips the choice above a break-even failure cost, and a cascade is the fix only with a reliable check.

1. Opening: one request priced on two models, 40x gap; thesis.
2. The short version.
3. What is "cost per useful answer"? Formula, price table for both pairs.
4. At what failure cost does the cheap model stop winning? Sweep table, F* formula, chart, F* against success gap.
5. What does a cascade change? FrugalGPT, RouteLLM, setup, results table, volume table, the flag that the verifier is a free second opinion.
6. What does a leaky check do? Leak break-even table; hard-case sensitivity.
7. Where I'd stop trusting this post.
8. The takeaway.

Diagram: `public/images/blog/cost-per-useful-answer.svg`. Cost per useful answer against failure cost for cheap, expensive, a good cascade and a leaky cascade; the cheap/expensive crossover at $0.114 is the one accent mark.

## Open questions

- Does he have a real case (any product, at any scale) where a cheap model's wrong answers had a measurable cost, or where he moved up a tier? What can be said publicly? The post has no such story on purpose.
- Which OpenAI pair does he want as the "flagship" example? I used gpt-5.4-mini against gpt-5.4 because they are same generation; the pricing page also lists newer names (gpt-5.6 and gpt-6 families) and I did not know which he regards as the flagship.
- Does he want a follow-up that measures real success and verifier false-positive rates on a real task, which would replace the assumed rates?
- Is a 3,000 in / 500 out request shape representative of his use?

## Left out

Prompt caching and the 0.1x cache-read price, which cut the input side for both models and shrink the price gap in practice; batch pricing; an expensive-model verifier; "expensive model plus the same check" as the fair rival to the cascade; more than two tiers; latency cost of escalation in seconds; the long tail of failure costs.
