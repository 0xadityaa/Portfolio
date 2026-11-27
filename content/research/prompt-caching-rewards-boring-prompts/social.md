## Thread

Prompt caching cut my simulated input bill 87.7%. At 1 request an hour, the same 5-minute cache made it 14.1% bigger.

Two things decide which side you land on ↓

[image: /images/blog/cache-cost-vs-traffic.svg]
---
Traffic first. At 1 request an hour, a 5-minute cache hits 8.1% of the time, and every miss pays the write fee again.

Hit rate is 1 - e^(-rate x TTL). A year of simulated Poisson arrivals per rate matched it within noise.
---
Break-even for a 6,000-token prompt on Claude Sonnet 5.5, against no cache:

→ 5-minute cache: above 2.8 requests an hour
→ 1-hour cache: above 0.72

At 1 an hour: 5-minute is 14.1% dearer, 1-hour is 22.6% cheaper.
---
Order is the other lever. I tested a 1,677-token support-bot prompt:

→ timestamp and name at the top: 35.7% cacheable
→ at the bottom: 98.4%
→ tools shuffled per request: 2.7%
---
Put per-request values last, serialise tools in a fixed order, and check the cached-token count on a real response. Below about 1 request an hour per prefix, expect no savings.

Full post: <BLOG_URL>
Code and data: https://github.com/0xadityaa/Portfolio/tree/main/content/research/prompt-caching-rewards-boring-prompts

## Singles

I found a cache that makes the bill 14.1% bigger.

Claude Sonnet 5.5, 5-minute TTL, 1 request an hour, 6,000-token static prompt. The same cache at steady traffic cuts input cost 87.7%.

The discount comes from your traffic, not the API.
---
Most prompts open with the current time and the user's name. I measured a 1,677-token prompt:

→ top of the system prompt: 35.7% cacheable
→ bottom: 98.4%

One line moved, tenfold gap in blended input price.
---
A 1-hour cache write costs 60% more than a 5-minute one. Above about 0.5 requests an hour it's still the cheaper cache.

The write comes due so rarely that the longer TTL wins.
---
Count requests per prefix, not per app.

10 requests a minute across 1,000 users with their own prefixes is 0.6 an hour each. That's the row where a 5-minute cache costs more than none.
---
Shuffle the order of five tool definitions on every request and 2.7% of the prompt stays cacheable.

Same content, no cache. Serialising tools from an unordered map is the easiest way to get there.

## Link post

Prompt caching cut my simulated input bill 87.7%. At 1 request an hour, the same 5-minute cache made it 14.1% bigger.

Traffic rate and prompt order decide which side you get.

<BLOG_URL>

[image: /images/blog/cache-cost-vs-traffic.svg]

## Question

How many requests an hour does your busiest prompt prefix get, and have you checked its cached-token count?

## Substack Note

Prompt caching cut my simulated input bill by 87.7%. At one request an hour, the same 5-minute cache made it 14.1% bigger.

Two things decide it. Traffic comes first. On Claude Sonnet 5.5 with a 6,000-token static prompt, a 5-minute cache only beats no cache above 2.8 requests an hour. The 1-hour cache breaks even at 0.72, and a napkin formula gives your own hit rate: 1 minus e^(-rate x TTL).

Order is the second. Caches match an exact prefix, so anything that changes per request has to come last. In a 1,677-token sample prompt, a timestamp and user name at the top left 35.7% cacheable. At the bottom, 98.4%.

I called no live API, and the post lists what stays uncovered. Code and raw output are in the repo.

<BLOG_URL>
