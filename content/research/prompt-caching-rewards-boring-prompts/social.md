## Hook

Prompt caching can make your bill bigger.

In my simulation it cut the input bill 87.7%. At 1 request an hour, the same 5-minute cache made it 14.1% bigger.

How many requests an hour does your busiest prompt get?

[image: public/images/blog/cache-cost-vs-traffic.svg]

## Thread

Prompt caching can make your bill bigger.

It cut my simulated input bill 87.7%, and at 1 request an hour it added 14.1%. The two things that decide which one you get:
---
At 1 request an hour, a 5-minute cache hits 8.1% of the time. Every miss pays the write fee again. The hit rate is 1 minus e^(-rate x TTL), and my year-long simulation matched it within noise.
---
The 1-hour cache costs 60% more to write and is still the cheaper one above about 0.5 requests an hour. At 1 an hour it's 22.6% cheaper than no cache. You pay that write so rarely that the longer TTL wins.
---
Prompt order is the other lever. In a 1,677-token support-bot prompt, a timestamp and user name at the top left 35.7% cacheable. At the bottom: 98.4%. Same words, a tenfold gap in blended input price.
---
The easiest bug: serialising tools from an unordered map, so the order changes per request. A seeded shuffle of five tools left a mean of 46 cacheable tokens, 2.7% of the prompt.
---
The fair objection: caching adds constraints. Four breakpoints at most, a minimum prompt length with no error when you miss it, and editing one tool invalidates everything. A team that ships a new prompt every deploy may reasonably skip it.
---
Rule of thumb, mine and not a vendor's: under about 1 request an hour per prefix, don't expect savings. Above about 3, either TTL pays. Put per-request values last, then check the cached-token count on a real response.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/prompt-caching-rewards-boring-prompts

## Singles

One request a minute on Claude Sonnet 5.5 with a 6,000-token static prompt: $561.60 a month with no cache, $73.31 with a 5-minute cache. Ten a minute: $5,616.00 against $691.20. The write fee is the cheap line on that bill.
---
Common advice: caching is a 90% discount. What I measured: 87.7% at steady traffic, and +14.1% at 1 request an hour on a 5-minute TTL. The discount belongs to your traffic, not to the API.
---
The default nobody chose: the current time in the first line of the system prompt. In my 1,677-token sample it left 35.7% cacheable. Moved to the bottom, 98.4%. One line moved, a tenfold gap in input price.
---
A 1-hour cache write costs 60% more than a 5-minute one, and it's still the cheaper cache above about 0.5 requests an hour. Choose the TTL by how often traffic arrives, not by the price of the write.
---
Count requests per prefix, not per app. 10 requests a minute across 1,000 users with their own prefixes is 0.6 an hour each, which is the row where a 5-minute cache costs more than none.

## Reply prompts

We simulated this: at 1 request an hour a 5-minute cache hits 8.1% of the time and the bill goes up 14.1%. The 1-hour TTL, same traffic, comes out 22.6% cheaper than no cache.
In our sample prompt a timestamp at the top of the system prompt left 35.7% cacheable. At the bottom, 98.4%. Worth checking where the date goes before blaming the provider's cache.
I measured the break-even for a 6,000-token static prompt on Sonnet 5.5: a 5-minute cache only beats no cache above 2.8 requests an hour. The 1-hour one gets there at 0.72.

## Substack Note

Prompt caching cut my simulated input bill by 87.7%. At one request an hour, the same 5-minute cache made it 14.1% bigger.

Two things decided it. The first is traffic. On Claude Sonnet 5.5 with a 6,000-token static prompt, a 5-minute cache only beats no cache above 2.8 requests an hour. The 1-hour cache breaks even at 0.72, and there's a napkin formula for your own hit rate: 1 minus e^(-rate x TTL).

The second is order. Caches match an exact prefix, so anything that changes per request has to come last. In a 1,677-token sample prompt, a timestamp and user name at the top left 35.7% cacheable. At the bottom, 98.4%.

I haven't called a live API, and the post lists what I didn't test. Code and raw output are in the repo.

https://www.0xadityaa.dev/blog/prompt-caching-rewards-boring-prompts
