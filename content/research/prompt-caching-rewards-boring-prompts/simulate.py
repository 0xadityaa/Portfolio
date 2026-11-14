"""Poisson arrivals against a cache with a TTL that refreshes on every request.

Prompt shape: STATIC tokens that are identical every request (system prompt plus
tools) and DYNAMIC tokens that differ per request. One cache entry, one prefix,
one tenant. Input cost only: output tokens are the same with or without a cache.

Rules, from the Anthropic prompt caching docs (checked 2026-11-14):
  - a request that finds a live entry reads it (read price) and restarts the TTL
  - a request that does not find one writes it (write price) and starts the TTL
  - the first request is always a write
Not modelled: concurrent requests arriving before the first response starts
(the entry is not yet readable), several cache entries, and latency.

Seeded. NumPy only.
"""
import json
import pathlib

import numpy as np

HERE = pathlib.Path(__file__).parent
P = json.loads((HERE / "prices.json").read_text())

STATIC, DYNAMIC = 6000, 500
HOURS = 8760.0  # one year of simulated traffic per rate
SEED = 20261114
RATES = [0.25, 0.5, 1, 2, 3, 6, 12, 30, 60, 120, 300, 600]  # requests per hour (600 = 10 a minute)


def arrivals(rate, rng):
    n = rng.poisson(rate * HOURS)
    return np.sort(rng.uniform(0, HOURS, size=n))


def run(times, ttl_min, base, write, read):
    gaps = np.diff(times) * 60.0  # minutes
    hit = np.concatenate(([False], gaps < ttl_min))
    prefix = np.where(hit, read, write)
    cost = (STATIC * prefix + DYNAMIC * base) / 1e6
    return hit.mean(), cost.mean()


def main():
    out = []
    csv = ["model,ttl_min,rate_per_hour,requests,hit_rate,analytic_hit_rate,cost_per_request,no_cache_cost,vs_no_cache_pct"]
    for key, m in P["models"].items():
        base = m["base"]
        nocache = (STATIC + DYNAMIC) * base / 1e6
        variants = [("short", m["write_short"], m["ttl_short_min"])]
        if key != "openai-gpt-5.5":
            variants.append(("long", m["write_long"], m["ttl_long_min"]))
        out.append(f"\n=== {m['label']}  (base {base}, read {m['read']}, "
                   f"prompt {STATIC} static + {DYNAMIC} dynamic tokens) ===")
        out.append(f"No cache: ${nocache:.6f} per request")
        head = f"{'req/hour':>9}{'requests':>10}"
        for name, w, ttl in variants:
            lab = f"{ttl}m" if ttl < 60 else f"{ttl // 60}h"
            head += f" | {lab + ' w=' + str(w) + ' theory':>16} {'hit':>7} {'$/req':>10} {'vs none':>8}"
        out.append(head)
        for i, rate in enumerate(RATES):
            rng = np.random.default_rng([SEED, i])
            times = arrivals(rate, rng)
            line = f"{rate:>9g}{len(times):>10d}"
            for name, w, ttl in variants:
                h, c = run(times, ttl, base, w, m["read"])
                an = 1 - np.exp(-rate * ttl / 60)
                line += f" | {an * 100:>15.1f}% {h * 100:>6.1f}% {c:>10.6f} {c / nocache * 100 - 100:>+7.1f}%"
                csv.append(f"{key},{ttl},{rate},{len(times)},{h:.4f},{an:.4f},{c:.8f},{nocache:.8f},{c / nocache * 100 - 100:.2f}")
            out.append(line)
    # Monthly bill at three volumes (30 days = 720 hours) for Sonnet 5.5, from the simulated per-request cost.
    m = P["models"]["anthropic-sonnet-5.5"]
    nocache = (STATIC + DYNAMIC) * m["base"] / 1e6
    out.append("\n=== Claude Sonnet 5.5, monthly input bill (30 days) at three volumes ===")
    out.append(f"{'volume':<22}{'requests':>10}{'no cache':>12}{'5m cache':>12}{'1h cache':>12}")
    for rate, label in ((1, "1 per hour"), (60, "1 per minute"), (600, "10 per minute")):
        i = RATES.index(rate)
        times = arrivals(rate, np.random.default_rng([SEED, i]))
        n = int(round(rate * 720))
        c5 = run(times, 5, m["base"], m["write_short"], m["read"])[1]
        c1 = run(times, 60, m["base"], m["write_long"], m["read"])[1]
        out.append(f"{label:<22}{n:>10,d}{'$' + format(n * nocache, ',.2f'):>12}"
                   f"{'$' + format(n * c5, ',.2f'):>12}{'$' + format(n * c1, ',.2f'):>12}")
    text = "\n".join(out)
    print(text)
    (HERE / "results" / "simulation.csv").write_text("\n".join(csv) + "\n")


if __name__ == "__main__":
    main()
