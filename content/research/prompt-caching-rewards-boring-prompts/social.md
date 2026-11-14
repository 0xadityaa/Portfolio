## Thread

I assumed prompt caching was a free 90% discount, so I simulated it. At steady traffic the input bill dropped 87.7%. At one request an hour, a 5-minute cache cost 14.1% more than no cache at all.
---
Cache math on Claude Sonnet 5.5, prices checked 14 Nov: a write pays for itself after 1 read on the 5-minute TTL and 2 reads on the 1-hour TTL. Cheap entry fee. But you pay it every time the cache goes cold.
---
How often it goes cold is simple: hit rate is 1 minus e^(-rate x TTL) when requests arrive at random and every hit refreshes the clock. At 3 requests an hour a 5-minute cache hits 22% of the time. The 1-hour TTL hits 95%.
---
Crossovers for a 6,000-token static prompt: the 5-minute cache only beats no cache above 2.8 requests an hour. The 1-hour cache gets there at 0.72. Above about 0.5 an hour the 1-hour TTL is cheaper than the 5-minute one.
---
The other lever is prompt order. Timestamp and user name at the top of my sample prompt: 35.7% cacheable. At the bottom: 98.4%. That is a tenfold gap in blended input price. Write-up and code: https://www.0xadityaa.dev/blog/prompt-caching-rewards-boring-prompts

## Singles

I simulated a year of random traffic against a prompt cache. At 10 requests a minute the input bill fell 87.7%. At 1 request an hour, a 5-minute cache cost 14.1% more than no cache. Same prompt, same provider, different traffic.
---
Prompt caching matches on an exact prefix. I put a timestamp and a user name at the top of a 1,677-token system prompt and 35.7% stayed cacheable. Moved to the bottom, 98.4%. Same words, tenfold difference in blended input price.
---
Serialising tool definitions from an unordered map changes their order per request. The content is identical, the cache is not. With five tools and a seeded shuffle, a mean of 46 of 1,716 prompt tokens stayed cacheable.
---
A cache write that costs 1.25x the base price sounds like a penalty. On Claude Sonnet 5.5 it pays for itself after a single read. The 1-hour write at 2x needs two. Whether you get those reads depends on requests per hour, not on the provider.
---
Napkin math for cache hit rate: 1 minus e^(-requests per hour x TTL in hours). At 1 request an hour, a 5-minute TTL hits 8% of the time and a 1-hour TTL hits 63%. My simulation matched the formula to within a point.

## Substack Note

I assumed prompt caching was a free discount. So I wrote a small simulation and a prompt-order test to see what it actually does.

Two things decided the outcome. The first is traffic. On Claude Sonnet 5.5, with a 6,000-token static prompt, the input bill fell 87.7% at steady traffic. But a 5-minute cache only beats no cache above 2.8 requests an hour, and at one request an hour it cost 14.1% more. The 1-hour TTL breaks even at 0.72 requests an hour, and above about half a request an hour it is cheaper than the 5-minute one.

The second is order. Caches match on an exact prefix, so anything that changes per request has to come last. In a 1,677-token sample prompt, a timestamp and user name at the top left 35.7% cacheable. At the bottom, 98.4%.

The post has the break-even arithmetic, the simulation, a chart, and everything I did not test, including live API calls. Code and raw output are in the repo.

https://www.0xadityaa.dev/blog/prompt-caching-rewards-boring-prompts
