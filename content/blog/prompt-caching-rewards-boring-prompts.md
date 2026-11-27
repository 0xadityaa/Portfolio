---
title: 'Does Prompt Caching Always Save?'
publishedAt: '2026-11-14'
summary: >-
  Prompt caching cut the simulated input bill 88%, yet below 3 requests an hour
  a 5-minute cache costs more than none. Two things decide which side you get.
tags:
  - ai
  - llm
  - cost
  - caching
draft: true
---
Prompt caching cut my simulated input bill by 87.7%. At one request an hour, the same cache made the bill 14.1% bigger.

So which side of that line are you on? If a prompt of yours gets a few requests an hour, or has the time stamped at the top, the discount you're counting on may never arrive.

In my [earlier post](/blog/every-mcp-server-taxes-every-prompt) I leaned on caching as the answer to a big tool list. This time I wanted to know how far that answer goes. Here is the claim: **caching is the biggest price lever most LLM apps leave on the table, and you only get it if you control two things: the order of your prompt and how often traffic arrives.**

The evidence is a break-even calculator ([`cost_model.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/cost_model.py)), a traffic simulation ([`simulate.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/simulate.py)) and a prompt-order run with a real tokenizer ([`prompt_order.py`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/prompt_order.py)). All of it sits in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/prompt-caching-rewards-boring-prompts) and reruns in about 40 seconds on a laptop, with no live API calls.

## The short version

- A cache write pays for itself after one read on a 5-minute TTL and two on a 1-hour TTL (Claude Sonnet 5.5, prices copied 2026-11-14).
- At steady traffic the input bill drops 87.7%. At one request an hour, a 5-minute cache costs 14.1% more than no cache.
- The 5-minute cache only beats no cache above 2.8 requests an hour. The 1-hour cache gets there at 0.72.
- A timestamp and user name at the top of the system prompt left 35.7% of my sample cacheable. At the bottom, 98.4%.

## How does a prompt cache work?

It matches on a prefix. The provider stores its computed state for the start of your prompt, and a later request that begins with exactly the same tokens skips recomputing it. Change one early token and everything after it misses.

Providers differ in who decides. Anthropic's [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) is explicit: you mark up to four breakpoints, and the prefix runs through tools, then system, then messages. [OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching) caches by default on an exact prefix match. Gemini's [caching docs](https://aistudio.google.com/docs/caching) describe implicit caching on 2.5 and newer, plus an explicit mode. Self-hosting? [vLLM's prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html) does the same on your GPUs, and does nothing when new queries share no prefix with old ones. That's the whole post in one line.

Two Anthropic rules matter. Hits restart the clock: "the cache is refreshed for no additional cost each time the cached content is used." And a change at any level invalidates that level and everything after it, so editing one tool definition throws away the lot.

## Wait, is the write fee a trap?

No. On [Claude Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing), input is $2.00 per million tokens. A 5-minute write is $2.50, a 1-hour write is $4.00, and a read is $0.10. One read covers the 5-minute fee (0.26 reads) and two cover the 1-hour one (1.05). The [OpenAI](https://developers.openai.com/api/docs/pricing) and [Gemini](https://aistudio.google.com/docs/pricing) prices are shaped differently, and they're in the [README](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/README.md). The break-even rows come from [`results/cost_model.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/results/cost_model.txt), with the prices and their source URLs recorded in [`prices.json`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/prices.json).

The catch is that the fee comes due again every time the cache goes cold. How often is that?

## How often does the cache go cold?

At low traffic, nearly every time. My simulation draws [Poisson](https://en.wikipedia.org/wiki/Poisson_point_process) arrivals (random, at a fixed average rate) for a year per rate, against a prompt of 6,000 static tokens and 500 per-request tokens. A request hits if the gap since the last one is shorter than the TTL.

The hit rate matched 1 minus e to the power of minus rate times TTL, within noise. That's a napkin formula for your own traffic.

| Requests per hour | 5-min hit rate | 5-min cost vs no cache | 1-hour hit rate | 1-hour cost vs no cache |
| ---: | ---: | ---: | ---: | ---: |
| 0.25 | 2.1% | +20.7% | 22.8% | +51.2% |
| 1 | 8.1% | +14.1% | 63.8% | -22.6% |
| 3 | 22.3% | -1.6% | 95.1% | -78.9% |
| 12 | 63.4% | -47.1% | 100.0% | -87.7% |
| 60 | 99.3% | -86.9% | 100.0% | -87.7% |
| 600 | 100.0% | -87.7% | 100.0% | -87.7% |

Those are six of the rates I ran. The full output is in [`results/simulation.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/results/simulation.txt) and [`results/simulation.csv`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/results/simulation.csv).

![Chart: cost per request against requests per hour on a log scale. The 5-minute cache is above the no-cache line until 2.8 requests an hour, the 1-hour cache until 0.72, and both fall to about one eighth of the no-cache cost](/images/blog/cache-cost-vs-traffic.svg)

As a monthly bill, input only, 30 days: one request an hour costs $9.36 with no cache, $10.68 on the 5-minute cache and $7.24 on the 1-hour one. One a minute costs $561.60, $73.31 and $69.12. Ten a minute costs $5,616.00, then $691.20 either way.

At the small end the "loss" is $1.32 a month. Above about 0.5 requests an hour the 1-hour TTL beats the 5-minute one, even though its write costs 60% more, because the write comes due so rarely.

The model uses one prefix shared by every request. Split traffic across a thousand users with their own prefixes and ten requests a minute becomes 0.6 an hour each, which is the low-traffic row.

## Does prompt order matter more than traffic?

They do different jobs. Traffic decides how often the cache goes cold. Order decides how much of the prompt is eligible at all.

My test prompt is a support bot for a made-up camping shop: five tool definitions plus a system prompt ([`sample/`](https://github.com/0xadityaa/Portfolio/tree/main/content/research/prompt-caching-rewards-boring-prompts/sample)), 1,677 tokens by [tiktoken](https://github.com/openai/tiktoken)'s `o200k_base` (a proxy, since Claude and Gemini tokenize differently). The script renders 200 random pairs of requests and counts the longest run of identical leading tokens. Raw output: [`results/prompt_order.txt`](https://github.com/0xadityaa/Portfolio/blob/main/content/research/prompt-caching-rewards-boring-prompts/results/prompt_order.txt).

| Where the timestamp and name go | Cacheable tokens | Share of the prompt | Blended input price |
| --- | ---: | ---: | ---: |
| Top of the system prompt | 612 | 35.7% | $1.322 per million |
| Middle of the system prompt | 902 | 52.6% | $1.001 |
| Bottom of the system prompt | 1,688 | 98.4% | $0.131 |
| Inside the user message | 1,690 | 98.5% | $0.128 |
| Tool list shuffled each request, value at bottom | 46 | 2.7% | $1.991 |

"Blended price" applies Sonnet 5.5's $2.00 and $0.10 to the cacheable and uncacheable parts, assuming every request reads the cache. Top versus bottom is a tenfold gap, from moving one line.

Even at the very top, the tools stay cacheable because they render first. That's the 612. Under OpenAI's 1,024-token minimum it would be zero.

The last row is the easy bug: serialising tools from an unordered map, so the order changes per request. Same content, no cache. A seeded shuffle of five tools left a mean of 46 cacheable tokens.

## Where I'd stop trusting this post

**Caching has constraints I only priced in part.** There's a minimum prompt length (no error comes back when a prompt falls under it, per [Anthropic's docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)), four breakpoints at most, invalidation on any tool edit, and no sharing between per-user prompts. A team whose prompt changes every deploy may fairly skip the work. That objection is the docs' own list of limits, not a named engineer's.

**These are simulated, input-only numbers.** I used Poisson arrivals and no concurrent requests that land before the first response starts. Output tokens cost the same either way, so the saving on a whole bill is smaller than 87.7%. I didn't measure time to first token.

**Some vendor behaviour is my assumption.** OpenAI says entries last "typically" 5 to 10 minutes, and my model uses 5. For gpt-6.1-sol it assumes a read extends the 30 minutes, which the guide doesn't say. I skipped Gemini because its docs don't state a default TTL.

## The takeaway

Two checks, in this order.

First, put everything that changes per request after everything that doesn't: timestamps, names, retrieved documents, the user's question. Serialise tools in a fixed order. Then read the usage field on a real response. A cached-token count of zero means your prefix isn't stable, whatever the config says.

Second, count requests per hour per prefix. My rule of thumb, not a vendor's: below about one an hour, don't expect savings. Above about three, either TTL pays, and on Anthropic the 1-hour one is cheaper in this model.

If you have a live hit rate well below my curve, I'd like to see it, because it would overturn all of this.
