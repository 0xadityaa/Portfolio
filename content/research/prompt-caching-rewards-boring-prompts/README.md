# Prompt caching artifact

Three small scripts behind the post "Prompt Caching Rewards Boring Prompts". Everything is seeded, runs offline (except the first tiktoken vocabulary download), and uses only the standard library, NumPy, and tiktoken.

Prices and rules were copied from the live vendor pages on 2026-11-14 and are recorded, with their URLs, in `prices.json`. `EXPECTATION.txt` was written before the first run.

## Setup

Python 3.12 with `numpy` and `tiktoken` (tested with numpy 2.3.1, tiktoken 0.8.0). To rebuild a virtualenv outside the repo:

```
python3 -m venv /private/tmp/claude-501/prompt-caching-venv
/private/tmp/claude-501/prompt-caching-venv/bin/pip install numpy tiktoken
```

tiktoken downloads and caches the `o200k_base` vocabulary the first time it runs. Nothing downloaded is committed.

## Run

From this folder:

```
python3 cost_model.py   > results/cost_model.txt     # break-even reads, crossover rates, Gemini storage break-even
python3 simulate.py     > results/simulation.txt     # Poisson arrivals vs 5-minute and 1-hour TTL; also writes results/simulation.csv
python3 prompt_order.py > results/prompt_order.txt   # cacheable prefix tokens by placement of a per-request block
python3 make_diagram.py                              # writes ../../../public/images/blog/cache-cost-vs-traffic.svg
```

## What each file does

- `prices.json`: per-model prices, TTLs and source URLs.
- `cost_model.py`: reads needed for one write to pay for itself, the request rate above which caching beats no caching, and the rate where the 5-minute and 1-hour TTLs cost the same.
- `simulate.py`: one year of Poisson arrivals per rate (0.25 to 600 requests an hour), a 6,000-token static prefix plus 500 per-request tokens, one cache entry whose TTL restarts on every request. Compares against the closed form 1 - exp(-rate x TTL).
- `prompt_order.py`: renders `sample/tools.json` and `sample/system_prompt.txt` plus a per-request block in five placements and counts the longest identical token prefix over 200 random pairs.
- `sample/`: the fictional camping-shop support prompt and tool definitions.
- `make_diagram.py`: draws the chart from the analytic model.
- `results/`: the raw outputs the post quotes.

## Prices and monthly bill

Dollars per million input tokens, copied from the live pages on 2026-11-14 (sources in `prices.json`).

| Model | Base | Cache write | Cache read |
| --- | ---: | --- | ---: |
| [Claude Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing) | $2.00 | $2.50 (5 min), $4.00 (1 hour) | $0.10 |
| [OpenAI gpt-5.5](https://developers.openai.com/api/docs/pricing) | $5.00 | none | $0.50 |
| OpenAI gpt-6.1-sol | $2.00 | $2.50 (30 min), $5.00 (12 hours) | $0.10 |
| [Gemini 3.1 Pro Preview](https://aistudio.google.com/docs/pricing) | $2.00 | storage: $4.50 per million tokens per hour | $0.20 |

The OpenAI guide says models before GPT-5.6 have no write charge and entries typically last 5 to 10 minutes of inactivity. GPT-5.6 and later charge 1.25 times base for a 30-minute write. Gemini bills explicit caches by the hour they sit in storage instead of charging a write premium. A Gemini cache held for an hour needs 2.5 hits in that hour to cover its storage; the creation cost isn't on the page, so it is left out.

Sonnet 5.5 for the simulated prompt (6,000 static plus 500 per-request tokens), 30 days, input only:

| Volume | Requests | No cache | 5-min cache | 1-hour cache |
| --- | ---: | ---: | ---: | ---: |
| 1 per hour | 720 | $9.36 | $10.68 | $7.24 |
| 1 per minute | 43,200 | $561.60 | $73.31 | $69.12 |
| 10 per minute | 432,000 | $5,616.00 | $691.20 | $691.20 |

## What is not modelled

Concurrent requests arriving before the first response starts, multiple cache entries or tenants, bursty arrivals, latency, output tokens, Gemini TTL behaviour, OpenAI cache-routing overflow, and non-OpenAI tokenizers (o200k_base is a proxy).
