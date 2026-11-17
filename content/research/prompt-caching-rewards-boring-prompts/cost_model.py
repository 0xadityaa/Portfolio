"""Break-even maths for prompt caching, from prices.json. Standard library only.

Per prefix token, a cache write costs `write`, a read costs `read`, a normal
pass costs `base`. A write that is followed by n reads is cheaper than n+1 normal
passes when write + n*read < (n+1)*base, so n > (write - base) / (base - read).

It also finds, for Poisson traffic with the TTL refreshed on every request, the
request rate at which caching starts to beat no caching. A request hits when the
gap since the previous request is shorter than the TTL, which has probability
h = 1 - exp(-rate * TTL). Expected prefix cost per request is
h*read + (1-h)*write, compared with base.
"""
import json
import math
import pathlib

HERE = pathlib.Path(__file__).parent
P = json.loads((HERE / "prices.json").read_text())


def breakeven_reads(base, write, read):
    if write <= base:
        return 0.0
    return (write - base) / (base - read)


def crossover_rate_per_hour(base, write, read, ttl_min):
    """Requests per hour above which caching is cheaper than no cache."""
    if write <= base:
        return 0.0
    h = (write - base) / (write - read)  # hit rate where expected cost equals base
    return -math.log(1 - h) / (ttl_min / 60)


def expected_prefix_cost(rate_per_hour, base, write, read, ttl_min):
    h = 1 - math.exp(-rate_per_hour * ttl_min / 60)
    return h * read + (1 - h) * write


def crossover_between(rate_lo, rate_hi, f_a, f_b):
    """Bisection for the rate where f_a(rate) == f_b(rate)."""
    d = lambda r: f_a(r) - f_b(r)
    lo, hi = rate_lo, rate_hi
    if d(lo) * d(hi) > 0:
        return None
    for _ in range(100):
        mid = (lo + hi) / 2
        if d(lo) * d(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def main():
    print(f"Prices checked {P['checked']}, {P['unit']}\n")
    print("Break-even: reads needed after one write for the write to pay for itself")
    print(f"{'model':<22}{'TTL':<8}{'write':>8}{'read':>8}{'reads (exact)':>15}{'reads (whole)':>15}"
          f"{'rate for cache to beat no-cache (req/hour)':>46}")
    for key, m in P["models"].items():
        for name, w, ttl in (("short", m["write_short"], m["ttl_short_min"]),
                             ("long", m["write_long"], m["ttl_long_min"])):
            if key == "openai-gpt-5.5" and name == "long":
                continue
            n = breakeven_reads(m["base"], w, m["read"])
            c = crossover_rate_per_hour(m["base"], w, m["read"], ttl)
            label = f"{ttl}m" if ttl < 60 else f"{ttl // 60}h"
            print(f"{m['label']:<22}{label:<8}{w:>8.3f}{m['read']:>8.3f}{n:>15.2f}{math.ceil(n):>15d}{c:>46.2f}")

    s = P["models"]["anthropic-sonnet-5.5"]
    f5 = lambda r: expected_prefix_cost(r, s["base"], s["write_short"], s["read"], s["ttl_short_min"])
    f1 = lambda r: expected_prefix_cost(r, s["base"], s["write_long"], s["read"], s["ttl_long_min"])
    x = crossover_between(0.01, 1000, f5, f1)
    print(f"\nSonnet 5.5: 5-minute and 1-hour TTL cost the same at {x:.2f} requests/hour "
          f"(above that the 1-hour cache is cheaper per request; below it the 5-minute cache is, "
          f"though both cost more than no cache there).")

    g = P["gemini"]
    # Explicit cache held for a full hour: storage cost vs saving per hit.
    saving = g["base"] - g["read"]
    hits = g["storage_per_mtok_hour"] / saving
    print(f"\n{g['label']}: storage {g['storage_per_mtok_hour']} per MTok-hour, saving {saving:.2f} per MTok per hit.")
    print(f"  A cache kept for one hour needs {hits:.2f} hits per hour to pay for its storage "
          f"(creation cost not modelled; the docs page did not state it).")


if __name__ == "__main__":
    main()
