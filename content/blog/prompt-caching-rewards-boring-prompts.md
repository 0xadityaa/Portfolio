---
title: Prompt Caching Rewards Boring Prompts
publishedAt: '2026-11-14'
summary: >-
  Prompt caching cut input cost 88% in my simulation, but only with a static-first
  prompt and steady traffic. Below 3 requests an hour it costs more.
tags:
  - ai
  - llm
  - cost
  - caching
draft: true
---

Prompt caching sounds like a free discount. Turn it on, pay about a tenth for the repeated part, move on. So I wrote a small simulation to put numbers on it, and found two ways to get none of the discount while still paying the setup fee.

The [last post](/blog/every-mcp-server-taxes-every-prompt) used caching as the counter-argument to a big tool list. This one is about caching itself. My claim: **caching is the biggest price lever most LLM apps leave on the table, and whether you get it depends less on the provider than on two things you control. The order of your prompt, and how often your traffic arrives.**

Everything here is in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/prompt-caching-rewards-boring-prompts). I ran three scripts: a break-even calculator, a traffic simulation, and a prompt-order test with a real tokenizer. I have not called any live API.

## The short version

- A cache write pays for itself after one read on a 5-minute TTL and after two on a 1-hour TTL (Claude Sonnet 5.5 prices, copied on 2026-11-14).
- At steady traffic the input bill drops 87.7%. At one request an hour, a 5-minute cache costs 14.1% more than no cache.
- The 5-minute cache only beats no cache above 2.8 requests an hour. The 1-hour cache gets there at 0.72.
- Putting a timestamp and a user name at the top of the system prompt left 35.7% of my sample prompt cacheable. Putting them at the bottom left 98.4%, a tenfold gap in blended input price.

## How does a prompt cache work?

It matches on a prefix. The provider stores its computed state for the start of your prompt, and a later request that begins with exactly the same tokens skips recomputing that part. Change one token early on and everything after it is a miss.

The providers differ in who decides. Anthropic's [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) is explicit: you mark breakpoints, up to four, and the cached prefix runs through tools, then system, then messages. [OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching) caches by default and needs an exact match on the whole rendered prefix. Gemini's [caching docs](https://aistudio.google.com/docs/caching) describe implicit caching on by default for 2.5 and newer models, and explicit caching for some of them.

If you host your own model, [vLLM's automatic prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html) is the same idea on your GPUs. Its docs say it does nothing when new queries share no prefix with old ones, which is the whole post in one line.

Two rules from the Anthropic docs matter for what follows. Hits restart the clock: "the cache is refreshed for no additional cost each time the cached content is used." And a change at any level invalidates that level and everything after it, so editing a tool definition throws away the whole cache.

## What do the prices say?

I copied these from the live pages on 2026-11-14. All are dollars per million input tokens.

| Model | Base | Cache write | Cache read |
| --- | ---: | --- | ---: |
| [Claude Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing) | $2.00 | $2.50 (5 min), $4.00 (1 hour) | $0.10 |
| [OpenAI gpt-5.5](https://developers.openai.com/api/docs/pricing) | $5.00 | none | $0.50 |
| OpenAI gpt-6.1-sol | $2.00 | $2.50 (30 min), $5.00 (12 hours) | $0.10 |
| [Gemini 3.1 Pro Preview](https://aistudio.google.com/docs/pricing) | $2.00 | storage: $4.50 per million tokens per hour | $0.20 |

The OpenAI guide says models before GPT-5.6 have no write charge and entries typically last 5 to 10 minutes of inactivity. GPT-5.6 and later charge 1.25 times base for a 30-minute write. Gemini bills explicit caches by the hour they sit in storage instead of charging a write premium.

Break-even is arithmetic. A write followed by n reads beats n+1 normal passes when write plus n times read is less than (n+1) times base. For Sonnet 5.5 that is 0.26 reads at 5 minutes and 1.05 reads at 1 hour. In practice: one read, or two. For Gemini, a cache held for an hour needs 2.5 hits in that hour to cover its storage, and I could not find the creation cost on the page, so I left it out.

On paper, caching looks like a trap with a tiny entry fee. The fee is small. It is paid every time the cache goes cold, though, so the real question is how often that happens.

## How often does the cache go cold?

I simulated [Poisson](https://en.wikipedia.org/wiki/Poisson_point_process) arrivals, which means requests land at random with a fixed average rate, for one year per rate. The prompt is 6,000 static tokens (system prompt plus tools) and 500 per-request tokens. A request hits if the gap since the previous request is shorter than the TTL, and every request restarts the clock, because the docs say hits refresh it.

The hit rate matches the formula 1 minus e to the power of minus rate times TTL, within sampling noise. That is a useful sanity check, and also a shortcut: you can estimate your own hit rate on a napkin.

| Requests per hour | 5-min hit rate | 5-min cost vs no cache | 1-hour hit rate | 1-hour cost vs no cache |
| ---: | ---: | ---: | ---: | ---: |
| 0.25 | 2.1% | +20.7% | 22.8% | +51.2% |
| 1 | 8.1% | +14.1% | 63.8% | -22.6% |
| 3 | 22.3% | -1.6% | 95.1% | -78.9% |
| 12 | 63.4% | -47.1% | 100.0% | -87.7% |
| 60 | 99.3% | -86.9% | 100.0% | -87.7% |
| 600 | 100.0% | -87.7% | 100.0% | -87.7% |

No cache costs $0.0130 per request for this shape on Sonnet 5.5. At 600 requests an hour (ten a minute) it is $0.0016.

![Chart: cost per request against requests per hour on a log scale. The 5-minute cache is above the no-cache line until 2.8 requests an hour, the 1-hour cache until 0.72, and both fall to about one eighth of the no-cache cost](/images/blog/cache-cost-vs-traffic.svg)

Here is the same thing as a monthly bill at three volumes, so you can find yourself on it. Thirty days, input only.

| Volume | Requests | No cache | 5-min cache | 1-hour cache |
| --- | ---: | ---: | ---: | ---: |
| 1 per hour | 720 | $9.36 | $10.68 | $7.24 |
| 1 per minute | 43,200 | $561.60 | $73.31 | $69.12 |
| 10 per minute | 432,000 | $5,616.00 | $691.20 | $691.20 |

Two things to notice. At the small volume the "loss" is $1.32 a month. And above about 0.5 requests an hour the 1-hour TTL is cheaper than the 5-minute one, even though its write costs 60% more, because you pay the write so rarely.

That last comparison leans on a modelling choice, so here it is: I assumed a single prefix shared by every request, Poisson arrivals, and TTL refresh on hit. If your traffic is split across many users with their own prefixes, each one sees only its share of the rate. Ten requests a minute across a thousand users is 0.6 an hour each, and that is the low-traffic row of the table.

## Does the order of the prompt matter more than the traffic?

For me it did, by a wide margin. Traffic decides how often the cache goes cold. Order decides how much of the prompt is eligible in the first place.

I wrote a support-bot prompt for a made-up camping shop: five tool definitions and a system prompt covering policies, tone and worked examples. It is 1,677 tokens by [tiktoken](https://github.com/openai/tiktoken)'s `o200k_base`, a proxy, since Claude and Gemini tokenize differently. Then I rendered it in the order Anthropic documents (tools, system, user message) for two requests with different timestamps, names and questions, and counted the longest run of identical leading tokens. I did that for 200 random pairs per placement.

| Where the timestamp and name go | Cacheable tokens | Share of the prompt | Blended input price |
| --- | ---: | ---: | ---: |
| Top of the system prompt | 612 | 35.7% | $1.322 per million |
| Middle of the system prompt | 902 | 52.6% | $1.001 |
| Bottom of the system prompt | 1,688 | 98.4% | $0.131 |
| Inside the user message | 1,690 | 98.5% | $0.128 |
| Tool list shuffled each request, value at bottom | 46 | 2.7% | $1.991 |

"Blended price" is Sonnet 5.5's $2.00 base and $0.10 read applied to the cacheable and uncacheable parts, assuming every request reads the cache. The gap between the first and third rows is about tenfold.

Look at the first row. Even with the value at the very top of the system prompt, the tools stay cacheable, because they render before the system prompt. That is 612 tokens. On OpenAI's published 1,024-token minimum it would be zero, and my sample is too short to say what a real 6,000-token prompt does there.

The last row is an easy bug to write: serialising tools from an unordered map, so the order changes between requests. The content is identical and the cache is not. I forced it with a seeded shuffle. Five tools gave me a mean of 46 cacheable tokens.

## Where I'd stop trusting this post

**Caching adds constraints, and I only priced one of them.** Prompts under the minimum length are not cached, and Anthropic's docs say no error is returned. There are at most four breakpoints. Editing a tool invalidates the lot. Per-user prompts cannot share an entry. Each of those is an engineering cost, and a team with a prompt that changes every deploy and a small user base may reasonably decide the work is not worth it. My simulation prices only the traffic one. I could not find a named engineer arguing against caching, so this objection is the docs' own list of limits.

**The low-traffic loss is small in dollars and real in percent.** A 5-minute cache costs 14.1% more at one request an hour, which is $1.32 a month in my example. A long prompt, a big model or thousands of idle per-user prefixes multiply that.

**I assumed Poisson arrivals.** Real traffic comes in bursts. I think bursts would raise hit rates for the same average rate, but that is reasoning, not something I ran.

**Input only, no latency, no live calls.** Output tokens cost the same either way, so the saving on a whole bill is smaller than 87.7%. Caching also cuts time to first token, and I did not measure that. Concurrent requests that arrive before the first response starts cannot read the entry yet, per the Anthropic docs, and I did not model it.

**Vendor behaviour that I assumed.** OpenAI says entries last "typically" 5 to 10 minutes, and I used 5. For gpt-6.1-sol I assumed a read extends the 30 minutes, which the guide does not say. I did not simulate Gemini at all, because its docs page does not state a default TTL. The OpenAI guide also says traffic above about 15 requests a minute on one key can overflow to other machines, which I did not model.

## The takeaway

Two checks, in this order.

First, put everything that changes per request after everything that does not. Timestamps, names, retrieved documents and the user's question go last. Serialise tools in a fixed order. Then read the usage field on a real response and look at the cached-token count. If it is zero, your prefix is not stable, whatever the config says.

Second, estimate requests per hour per prefix. My rule of thumb from these numbers, which is mine and not a vendor's: below about one an hour, do not expect savings. Above about three, either TTL pays, and on Anthropic the 1-hour one is the cheaper in this model. What would change my mind is a hit rate from live traffic that sits well below what the formula predicts. Next I want to run the same prompt against the real APIs and compare their usage counts to my curve.
