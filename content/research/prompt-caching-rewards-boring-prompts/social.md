## Hook

Prompt caching can make your bill 14% bigger.

Simulated, 5-minute cache, 1 request an hour: +14.1%
Steady traffic: -87.7%
Timestamp at the top of the prompt: 35.7% cacheable

How many requests an hour does your busiest prompt get?

[image: public/images/blog/cache-cost-vs-traffic.svg]

## Thread

Prompt caching can make your bill 14% bigger.

In my simulation it also cut the input bill 87.7%. Two things decide which side you land on ↓
---
Traffic comes first.

At 1 request an hour, a 5-minute cache hits 8.1% of the time. Every miss pays the write fee again.

The hit rate is 1 - e^(-rate x TTL). A year of simulated Poisson arrivals per rate matched it within noise.
---
Break-even for a 6,000-token prompt on Claude Sonnet 5.5, vs no cache:

→ 5-minute cache: above 2.8 requests an hour
→ 1-hour cache: above 0.72

At 1 an hour: 5-minute is 14.1% dearer, 1-hour is 22.6% cheaper. Same prompt, same traffic.
---
Order is the other lever.

1,677-token support-bot prompt, made-up shop. Timestamp and name at the top: 35.7% cacheable. At the bottom: 98.4%.

Same words. Tools shuffled per request: 2.7%.
---
The fair objection: caching adds constraints.

- 4 breakpoints at most
- a minimum prompt length, with no error when you miss it
- editing one tool invalidates everything

A team that ships a new prompt every deploy can reasonably skip it.
---
Want the break-even calculator and the traffic simulation? Reply CACHE and I'll DM it.
---
Rule of thumb, mine and not a vendor's: below about 1 request an hour per prefix, don't expect savings. Above about 3, either TTL pays. Put per-request values last.

Full write-up, code and raw output: https://www.0xadityaa.dev/blog/prompt-caching-rewards-boring-prompts

## Singles

Prompt caching cut my simulated input bill 87.7%.

At 1 request an hour, the same 5-minute cache made it 14.1% bigger.

The discount belongs to your traffic, not to the API.
---
Most prompts open with the current time and the user's name. I measured it:

→ top of the system prompt: 35.7% cacheable
→ bottom: 98.4%

Same 1,677 tokens. Moving one line is a tenfold gap in blended input price.
---
One request a minute on Claude Sonnet 5.5, 6,000-token static prompt, input only:

$561.60 a month with no cache
$73.31 with a 5-minute cache

At ten a minute, $5,616.00 against $691.20. The write fee is the cheap line on that bill.
---
A 1-hour cache write costs 60% more than a 5-minute one. Above about 0.5 requests an hour it's still the cheaper cache.

You pay that write so rarely that the longer TTL wins.
---
Count requests per prefix, not per app.

10 requests a minute across 1,000 users with their own prefixes is 0.6 an hour each. That's the row where a 5-minute cache costs more than none.

## CTA

CACHE | the prompt-caching break-even calculator and traffic simulation | https://github.com/0xadityaa/Portfolio/tree/main/content/research/prompt-caching-rewards-boring-prompts

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
