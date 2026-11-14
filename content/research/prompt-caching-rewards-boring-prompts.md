# Prompt Caching Rewards Boring Prompts

- Topic issue: none (series post 5, planned for Tue 22 December 2026)
- Format: essay
- Thesis: Prompt caching is the biggest price lever most LLM apps leave on the table, and whether you get it depends on two things you control: the order of the prompt (static first, per-request values last) and whether traffic arrives often enough to keep the cache warm.
- Reader: an engineer who calls an LLM API, has heard "caching is 90% off", and has not checked what their own prompt and traffic would get.

## What this adds

The strongest existing writing is the vendors' own docs: [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), and the [Gemini caching page](https://aistudio.google.com/docs/caching). They state the rules and the discounts. None of them says what hit rate and cost per request a given traffic level produces, or how much of a realistic prompt survives a timestamp at the top. This post adds a break-even calculation at each TTL, a seeded traffic simulation with the crossover points, and a token-level prompt-order test. It is distinct from the MCP post (`post/every-mcp-server-taxes-every-prompt`), which only used caching as the counter-argument.

## Artifact

Folder: `content/research/prompt-caching-rewards-boring-prompts/`.

Expectation, written before running (also in `EXPECTATION.txt`): break-even of one read at 5 minutes and two at 1 hour; hit rate following 1 - exp(-rate x TTL); 5-minute cache costing more than none below roughly 2 to 3 requests an hour, 1-hour below roughly 1; top-of-prompt values leaving only tools cacheable, bottom placement over 95%, shuffled tools nearly nothing.

Commands (from the artifact folder; Python 3.12.8, numpy 2.3.1, tiktoken 0.8.0, macOS, 2026-11-14):

```
python3 cost_model.py   > results/cost_model.txt
python3 simulate.py     > results/simulation.txt   (also writes results/simulation.csv)
python3 prompt_order.py > results/prompt_order.txt
python3 make_diagram.py                            (writes public/images/blog/cache-cost-vs-traffic.svg)
```

Raw output, abridged (full files are in `results/`):

```
Break-even (reads after one write):  Sonnet 5.5 5m 0.26 (1), 1h 1.05 (2); crossover vs no cache 2.80 and 0.72 req/hour
Sonnet 5.5: 5m and 1h cost the same at 0.53 req/hour
Gemini 3.1 Pro Preview: 2.50 hits per hour to pay for storage

req/hour  5m hit  5m vs none   1h hit  1h vs none     (Sonnet 5.5, one simulated year per rate, seed 20261114)
0.25       2.1%     +20.7%      22.8%     +51.2%
1          8.1%     +14.1%      63.8%     -22.6%
3         22.3%      -1.6%      95.1%     -78.9%
12        63.4%     -47.1%     100.0%     -87.7%
60        99.3%     -86.9%     100.0%     -87.7%
600      100.0%     -87.7%     100.0%     -87.7%

Monthly input bill: 1/hour $9.36 / $10.68 / $7.24; 1/minute $561.60 / $73.31 / $69.12; 10/minute $5,616.00 / $691.20 / $691.20  (none / 5m / 1h)

sample prompt: tools 601 tokens, system 1076 tokens
top_of_system 612 cacheable (35.7%), middle 902 (52.6%), bottom 1688 (98.4%), in user message 1690 (98.5%), tools shuffled mean 46 (2.7%)
blended $/MTok: 1.322, 1.001, 0.131, 0.128, 1.991
```

Did the expectation hold? Mostly. Break-even held (1 and 2 reads). The simulated hit rate matched the formula within sampling noise. The crossovers were inside my guessed bands (2.8 and 0.72 per hour). Two things I got wrong or missed: I did not expect the 1-hour TTL to be cheaper than the 5-minute one at every rate above 0.53 per hour (the write premium is paid so rarely), and I expected "only tools cacheable" for the top placement, which held (612 tokens), but did not check that 612 falls below OpenAI's 1,024-token minimum.

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Sonnet 5.5: base $2, 5m write $2.50, 1h write $4, read $0.10 (0.05x) | https://platform.claude.com/docs/en/about-claude/pricing | 1 | 2026-11-14 |
| Sonnet 4.6: $3 / $3.75 / $6 / $0.30 (used in the simulation file, not in the post) | same | 1 | 2026-11-14 |
| Cache refreshed at no cost on each use; lifetime measured from the start of the request; 1h option via `ttl: "1h"` | https://platform.claude.com/docs/en/build-with-claude/prompt-caching | 1 | 2026-11-14 |
| Prefix order tools, system, messages; a change invalidates that level and all later ones; changing a tool definition invalidates everything | same | 1 | 2026-11-14 |
| Up to 4 breakpoints; minimum 512 tokens for Sonnet 5.5; shorter prompts are processed without caching and no error is returned | same | 1 | 2026-11-14 |
| An entry is only readable after the first response starts | same | 1 | 2026-11-14 |
| OpenAI gpt-5.5: $5.00 input, $0.50 cached; gpt-6.1-sol $2.00 and $0.10 | https://developers.openai.com/api/docs/pricing | 1 | 2026-11-14 |
| OpenAI: automatic; exact prefix match; minimum 1,024 tokens for GPT-5.6 and later; earlier models no write charge, entries typically 5 to 10 minutes of inactivity up to one hour; GPT-5.6+ default writes 1.25x and last at least 30 minutes, 12h writes 2.5x; read 0.1x (0.05x for GPT-6.1 Sol and Terra); overflow routing above 15 requests per minute | https://developers.openai.com/api/docs/guides/prompt-caching | 1 | 2026-11-14 |
| Gemini 3.1 Pro Preview: $2.00 input, $0.20 cached (prompts up to 200k), $4.50 per 1M tokens per hour storage | https://aistudio.google.com/docs/pricing | 1 | 2026-11-14 |
| Gemini: implicit caching on by default for 2.5 and newer; explicit via generateContent for supported Gemini 3 and 2.5 models; page states no default TTL, no cached-token percentage, no storage price | https://aistudio.google.com/docs/caching | 1 | 2026-11-14 |
| vLLM APC: reuses KV for shared prefixes; no gain when new queries share no prefix with existing ones | https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html | 1 | 2026-11-14 |
| Hit probability for Poisson arrivals with refresh is 1 - exp(-rate x TTL) | derived; confirmed by `simulate.py` (columns "theory" and "hit") | derived | 2026-11-14 |
| Break-even, crossover rates, hit rates, costs, prompt-order token counts | artifact output, `results/` | his artifact | 2026-11-14 |
| tiktoken o200k_base as a tokenizer proxy | https://github.com/openai/tiktoken | 1 | 2026-11-14 |
| Counter: caching constraints (minimum length, 4 breakpoints, invalidation, concurrency, TTL) | the Anthropic and OpenAI pages above | 1 | 2026-11-14 |

Pricing-page notes: the Anthropic page lists more models than I used. The WebFetch tool summarises pages with a small model, so the Sonnet 5.5, Sonnet 4.6 and Opus rows were re-checked by grepping the saved page text; the OpenAI and Gemini figures were read through the summary only and are worth one human look before publishing. The Gemini pricing page was truncated at 100,000 characters (the last 11,617 were not read). Gemini 3.1 Pro explicit-caching support was not confirmed on the caching page, which lists supported models by name for generateContent.

## Counter-argument

Caching adds engineering constraints (minimum cacheable length, breakpoints, TTL, invalidation when tools or system prompts change, per-user prompts that cannot share), and below about 3 requests an hour a 5-minute cache costs more than none. The post steelmans this with the simulation's low-traffic rows (+14.1% at 1 per hour, +20.7% at 0.25) and the per-user dilution example (10 requests a minute over 1,000 users is 0.6 an hour each). Gap: I did not find a named practitioner arguing against caching, so the post says the objection is the docs' own list of limits. Aditya may know one.

## From Aditya

Nothing. The post claims no personal experience. The opening is the simulation itself, and "I assumed prompt caching was a free discount" is a framing line he should confirm is true for him.

## Outline

Thesis: caching is the biggest lever, and traffic plus prompt order decide whether you get it.
1. Opening and thesis, sequel line linking the MCP post.
2. The short version.
3. How does a prompt cache work? Prefix matching, who decides, the two rules (hits refresh; changes invalidate downstream).
4. What do the prices say? Price table across Anthropic, OpenAI, Gemini and break-even reads.
5. How often does the cache go cold? Simulation table, the diagram (cost per request vs requests per hour, crossovers marked), monthly bill at three volumes, modelling-choice flag next to the 1-hour vs 5-minute comparison.
6. Does the order of the prompt matter more? Prompt-order table.
7. Where I'd stop trusting this post: constraints, low-traffic loss in dollars and percent, Poisson, input only and no live calls, assumed vendor behaviour.
8. The takeaway: put per-request values last and check the cached-token count; estimate requests per hour per prefix; rule of thumb thresholds; what would change my mind.

Diagram: `public/images/blog/cache-cost-vs-traffic.svg`, no cache vs 5-minute vs 1-hour cost per request against requests per hour, with the 2.8 and 0.72 crossovers marked. It carries the claim that traffic decides whether caching pays.

## Style.md's six things, where they are

1. Thesis in the first 150 words: the bold sentence in the third paragraph.
2. Artifact: the three scripts in the artifact folder, linked in the second paragraph after the thesis.
3. Numbers with their papers: price table (linked, dated 2026-11-14), simulation table, three-volume monthly table.
4. Links as evidence: 10 or more external links; each provider, price and doc linked at first mention.
5. Limits: "Where I'd stop trusting this post", with the steelman, the percent-versus-dollars point, and what was not tested.
6. Ending that adds: the two checks, the rule-of-thumb thresholds marked as his, what would change his mind, and what he will measure next.

## Open questions

- Is "I assumed prompt caching was a free discount" true for him? Change the opening if not.
- Does he know a named practitioner arguing that caching is not worth it, for the limits section?
- Does he want to run the prompt against live APIs (usage counts of cached tokens) before publishing? That would turn the "I have not called any live API" limit into a result.
- The fictional Fernwood prompt is mine. Fine to publish, or swap in a prompt of his own with the company details removed?
- Re-check the OpenAI and Gemini prices by eye on the publish day, since both pages carry a date-dependent change (Gemini 3.8 Flash prices change 2027-01-01, not used in the post).

## Left out

Opus and Haiku rows; Gemini explicit-cache simulation (no TTL stated); bursty (non-Poisson) arrivals; the effect of caching on time to first token; cache-aware routing (OpenAI `prompt_cache_key`); a sweep of the static prompt size.
