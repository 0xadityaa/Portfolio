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

## What is not modelled

Concurrent requests arriving before the first response starts, multiple cache entries or tenants, bursty arrivals, latency, output tokens, Gemini TTL behaviour, OpenAI cache-routing overflow, and non-OpenAI tokenizers (o200k_base is a proxy).
