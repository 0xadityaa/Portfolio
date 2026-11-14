---
title: Prompt Caching Rewards Boring Prompts
publishedAt: '2026-11-14'
summary: >-
  Caching cut simulated input cost 88% with a static-first prompt and steady
  traffic. Under 3 requests an hour, a 5-minute cache costs more.
tags:
  - ai
  - llm
  - cost
  - caching
draft: true
---
Prompt caching sounds like a free discount. In my simulation it cut the input bill 87.7%, and at one request an hour it made the bill 14.1% bigger.

The [last post](/blog/every-mcp-server-taxes-every-prompt) leaned on caching as the answer to a big tool list. This one asks how far that answer goes. My claim: **caching is the biggest price lever most LLM apps leave on the table, and whether you get it depends on two things you control, the order of your prompt and how often traffic arrives.**

I ran a break-even calculator, a traffic simulation and a prompt-order test with a real tokenizer. Everything is in [the artifact folder](https://github.com/0xadityaa/Portfolio/tree/main/content/research/prompt-caching-rewards-boring-prompts). I haven't called any live API.

## The short version

- A cache write pays for itself after one read on a 5-minute TTL and two on a 1-hour TTL (Claude Sonnet 5.5, prices copied 2026-11-14).
- At steady traffic the input bill drops 87.7%. At one request an hour, a 5-minute cache costs 14.1% more than no cache.
- The 5-minute cache only beats no cache above 2.8 requests an hour. The 1-hour cache gets there at 0.72.
- A timestamp and user name at the top of the system prompt left 35.7% of my sample cacheable. At the bottom, 98.4%.

## How does a prompt cache work?

It matches on a prefix. The provider stores its computed state for the start of your prompt, and a later request that begins with exactly the same tokens skips recomputing it. Change one token early and everything after it misses.

Providers differ in who decides. Anthropic's [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) is explicit: you mark up to four breakpoints, and the prefix runs through tools, then system, then messages. [OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching) caches by default on an exact prefix match. Gemini's [caching docs](https://aistudio.google.com/docs/caching) describe implicit caching on 2.5 and newer, plus explicit caching for some models. Self-hosting? [vLLM's prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html) does the same on your GPUs, and its docs say it does nothing when new queries share no prefix with old ones. That's the whole post in one line.

Two rules from the Anthropic docs matter below. Hits restart the clock: "the cache is refreshed for no additional cost each time the cached content is used." And a change at any level invalidates that level and everything after it, so editing one tool definition throws away the lot.

## Is the write fee a trap?

On [Claude Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing), input is $2.00 per million tokens. A 5-minute write is $2.50, a 1-hour write is $4.00, and a read is $0.10. The math says one read covers the 5-minute fee (0.26 reads) and two cover the 1-hour one (1.05).

So the fee is small. But you pay it every time the cache goes cold. The question is how often that happens.

The [OpenAI](https://developers.openai.com/api/docs/pricing) and [Gemini](https://aistudio.google.com/docs/pricing) prices, which are shaped differently, are in the artifact README.

## How often does the cache go cold?

I simulated [Poisson](https://en.wikipedia.org/wiki/Poisson_point_process) arrivals (random, at a fixed average rate) for a year per rate. The prompt is 6,000 static tokens and 500 per-request tokens. A request hits if the gap since the last one is shorter than the TTL.

The hit rate matched 1 minus e to the power of minus rate times TTL, within noise. That's a napkin formula for your own traffic.

| Requests per hour | 5-min hit rate | 5-min cost vs no cache | 1-hour hit rate | 1-hour cost vs no cache |
| ---: | ---: | ---: | ---: | ---: |
| 0.25 | 2.1% | +20.7% | 22.8% | +51.2% |
| 1 | 8.1% | +14.1% | 63.8% | -22.6% |
| 3 | 22.3% | -1.6% | 95.1% | -78.9% |
| 12 | 63.4% | -47.1% | 100.0% | -87.7% |
| 60 | 99.3% | -86.9% | 100.0% | -87.7% |
| 600 | 100.0% | -87.7% | 100.0% | -87.7% |

![Chart: cost per request against requests per hour on a log scale. The 5-minute cache is above the no-cache line until 2.8 requests an hour, the 1-hour cache until 0.72, and both fall to about one eighth of the no-cache cost](/images/blog/cache-cost-vs-traffic.svg)

As a monthly bill, input only, 30 days: one request an hour costs $9.36 with no cache, $10.68 on the 5-minute cache and $7.24 on the 1-hour one. One a minute costs $561.60, $73.31 and $69.12. Ten a minute costs $5,616.00 and $691.20 either way.

At the small end the "loss" is $1.32 a month. And above about 0.5 requests an hour the 1-hour TTL beats the 5-minute one, even though its write costs 60% more, because you pay that write so rarely.

One modelling choice to flag: a single prefix shared by every request. If traffic splits across a thousand users with their own prefixes, ten requests a minute is 0.6 an hour each. That's the low-traffic row.

## Does prompt order matter more than traffic?

For me it did. Traffic decides how often the cache goes cold. Order decides how much of the prompt is eligible at all.

I wrote a support-bot prompt for a made-up camping shop: five tool definitions plus a system prompt, 1,677 tokens by [tiktoken](https://github.com/openai/tiktoken)'s `o200k_base` (a proxy, since Claude and Gemini tokenize differently). I rendered it in Anthropic's order for 200 random pairs of requests with different timestamps, names and questions, and counted the longest run of identical leading tokens.

| Where the timestamp and name go | Cacheable tokens | Share of the prompt | Blended input price |
| --- | ---: | ---: | ---: |
| Top of the system prompt | 612 | 35.7% | $1.322 per million |
| Middle of the system prompt | 902 | 52.6% | $1.001 |
| Bottom of the system prompt | 1,688 | 98.4% | $0.131 |
| Inside the user message | 1,690 | 98.5% | $0.128 |
| Tool list shuffled each request, value at bottom | 46 | 2.7% | $1.991 |

"Blended price" applies Sonnet 5.5's $2.00 and $0.10 to the cacheable and uncacheable parts, assuming every request reads the cache. Top versus bottom is a tenfold gap.

Even at the very top of the system prompt, the tools stay cacheable because they render first. That's the 612. On OpenAI's published 1,024-token minimum it would be zero, and my sample is too short to say what a real 6,000-token prompt does.

The last row is the easy bug: serialising tools from an unordered map, so the order changes per request. Same content, no cache. I forced it with a seeded shuffle, and five tools left a mean of 46 cacheable tokens.

## Where I'd stop trusting this post

**Caching adds constraints, and I only priced one.** Prompts under the minimum length aren't cached, and Anthropic's docs say no error comes back. There are four breakpoints at most, editing a tool invalidates everything, and per-user prompts can't share an entry. A team whose prompt changes every deploy, with few users, may fairly skip the work. I couldn't find a named engineer arguing against caching, so this objection is the docs' own list of limits.

**Real traffic is bursty.** I assumed Poisson arrivals. I think bursts would raise hit rates at the same average, but that's reasoning, not something I ran.

**Input only, no live calls.** Output tokens cost the same either way, so the saving on a whole bill is smaller than 87.7%. I didn't measure time to first token. Concurrent requests that land before the first response starts can't read the entry yet, per Anthropic's docs, and I didn't model that.

**Some vendor behaviour is assumed.** OpenAI says entries last "typically" 5 to 10 minutes, and I used 5. For gpt-6.1-sol I assumed a read extends the 30 minutes, which the guide doesn't say. I skipped Gemini, because its docs don't state a default TTL, and I didn't model OpenAI's overflow above about 15 requests a minute on one key.

## The takeaway

Two checks, in this order.

First, put everything that changes per request after everything that doesn't: timestamps, names, retrieved documents, the user's question. Serialise tools in a fixed order. Then read the usage field on a real response. If the cached-token count is zero, your prefix isn't stable, whatever the config says.

Second, count requests per hour per prefix. My rule of thumb, mine and not a vendor's: below about one an hour, don't expect savings. Above about three, either TTL pays, and on Anthropic the 1-hour one is cheaper in this model.

A live hit rate well below my curve would change my mind. Next I'd like to run the same prompt against the real APIs and compare their usage counts to it.
