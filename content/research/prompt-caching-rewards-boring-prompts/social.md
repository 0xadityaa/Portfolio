## Thread

Prompt caching cut my simulated input bill 87.7%. At one request an hour, the same cache cost 14.1% more than no cache. Here's what flips it, with prices and code.
---
The write fee is small. On Claude Sonnet 5.5, one read pays for a 5-minute write and two pay for a 1-hour write. Prices checked 14 Nov. The catch: you pay the fee again every time the cache goes cold.
---
How often it goes cold has a napkin formula: hit rate is 1 minus e^(-rate x TTL). At 3 requests an hour, a 5-minute cache hits 22% of the time. A 1-hour cache hits 95%.
---
The break-even for a 6,000-token static prompt: a 5-minute cache beats no cache above 2.8 requests an hour. The 1-hour cache gets there at 0.72. So at low traffic, the longer TTL is the cheaper one.
---
Prompt order is the other lever. Timestamp and user name at the top of my sample prompt: 35.7% cacheable. At the bottom: 98.4%. A tenfold gap in blended input price. Write-up and code: https://www.0xadityaa.dev/blog/prompt-caching-rewards-boring-prompts

## Singles

At 10 requests a minute, caching cut my simulated input bill 87.7%. At 1 an hour, a 5-minute cache cost 14.1% more than none. Same prompt, same provider. So check your traffic before you pay the write fee.
---
Timestamp at the top of the system prompt: 35.7% of my 1,677-token prompt cacheable. Timestamp at the bottom: 98.4%. Same words, tenfold gap in blended price. So put whatever changes per request last.
---
Why does a cache with identical tools never hit? Because an unordered map serialises them in a different order each request. With five tools and a seeded shuffle, 46 of 1,716 tokens stayed cacheable. So sort your tools.
---
A 1.25x cache write sounds like a penalty. On Claude Sonnet 5.5 it pays for itself after one read. The 2x one-hour write needs two. So the real question is how many reads you get, not what the write costs.
---
Napkin math for cache hit rate: 1 minus e^(-requests per hour x TTL in hours). At 1 request an hour, a 5-minute TTL hits 8% and a 1-hour TTL hits 63%. My simulation matched to within a point. So you can predict yours.

## Substack Note

At steady traffic, prompt caching cut my simulated input bill by 87.7%. At one request an hour, a 5-minute cache cost 14.1% more than no cache at all.

Two things decided it. The first is traffic. On Claude Sonnet 5.5, with a 6,000-token static prompt, a 5-minute cache only beats no cache above 2.8 requests an hour. The 1-hour cache breaks even at 0.72, and above about half a request an hour it's the cheaper of the two. There's a napkin formula for your own hit rate: 1 minus e^(-rate x TTL).

The second is order. Caches match an exact prefix, so anything that changes per request has to come last. In a 1,677-token sample prompt, a timestamp and user name at the top left 35.7% cacheable. At the bottom, 98.4%.

The post has the arithmetic, the chart, and a list of what I didn't test, including live API calls. Code and raw output are in the repo.

https://www.0xadityaa.dev/blog/prompt-caching-rewards-boring-prompts
