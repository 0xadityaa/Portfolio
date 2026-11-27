#!/usr/bin/env python3
"""Agent-loop context model.

Each step is one API request. The request carries: a fixed prefix (system prompt
+ tool definitions), the user's task, and every earlier assistant reply and tool
result that the strategy still keeps. The model then adds one reply and one
tool result.

Strategies
  none            keep everything
  clear-sliding   tool results older than N steps become a placeholder
  clear-trigger   Anthropic's context-editing shape: once input passes TRIGGER
                  tokens, replace all but the latest KEEP tool results
  compact-K       every K steps, one extra call summarises the whole context;
                  context restarts as prefix + summary
  compact-T       same, when the next request would pass T tokens

Each strategy is priced twice: no caching, and with prompt caching (automatic
breakpoint at the end of every request plus one after the prefix).

Standard library + tiktoken only. Deterministic: no randomness.
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).parent
PRICES = json.loads((HERE / "prices.json").read_text())["claude-sonnet-5-5"]

# ---- tool output sizes: tokenise the committed samples -----------------------
SAMPLE_FILES = {
    "file_read_large": "file_read_large.txt",
    "file_read_medium": "file_read_medium.txt",
    "file_read_small": "file_read_small.txt",
    "grep": "grep_search.txt",
    "ls": "ls_listing.txt",
    "vcs_log": "vcs_log_stat.txt",
    "check": "check_posts.txt",
}
# One 10-step cycle of tool calls. Agents mostly read and search, and rarely run
# the check at the end, so reads and greps dominate. This is the modelling choice
# that sets the mean tool result size; the README sweeps it.
CYCLE = [
    "file_read_large", "grep", "file_read_medium", "file_read_small", "ls",
    "grep", "vcs_log", "file_read_medium", "check", "file_read_small",
]


def sample_tokens():
    import tiktoken
    enc = tiktoken.get_encoding("o200k_base")
    return {k: len(enc.encode((HERE / "samples" / f).read_text())) for k, f in SAMPLE_FILES.items()}


# ---- parameters --------------------------------------------------------------
PREFIX = 8_000        # system prompt (~2k) + tool definitions (~6k)
TASK = 500            # the user's first message
REPLY = 250           # assistant reply per step: a sentence of narration + one tool call
PLACEHOLDER = 20      # what a cleared tool result is replaced with
SUMMARY = 4_000       # size of a compaction summary (the docs' example shows 3,500 output tokens)
WINDOW = 200_000
STEPS = (10, 25, 50, 100)
CACHE_TTL_OK = True   # assume every step arrives inside the 5-minute TTL


def tool_sizes(n, scale=1.0, tokens=None):
    tokens = tokens or sample_tokens()
    return [max(1, round(tokens[CYCLE[i % len(CYCLE)]] * scale)) for i in range(n)]


# ---- strategies: each returns, per step, the list of context segments --------
# A segment is (key, tokens). Equal keys at equal positions mean identical text,
# which is what a prefix cache needs.
def build(strategy, tools, n_steps, params):
    segs = []         # kept history: list of dicts {id, reply, tool, cleared}
    ctxs = []         # per request: list of (key, tokens)
    extra_calls = []  # per request: list of summarisation calls (context list)
    summary_n = 0
    summary = None    # (key, tokens) once compacted
    last_compact = 0
    for i in range(n_steps):
        pre_calls = []

        def render():
            out = [("P", PREFIX)]
            if summary:
                out.append((("S", summary_n), SUMMARY))
            else:
                out.append(("U", TASK))
            for s in segs:
                out.append((("r", s["id"]), REPLY))
                out.append((("t", s["id"], s["cleared"]), PLACEHOLDER if s["cleared"] else s["tool"]))
            return out

        if strategy == "clear-sliding":
            n = params["N"]
            for s in segs:
                s["cleared"] = (i - s["id"]) > n
        elif strategy == "clear-trigger":
            if sum(t for _, t in render()) >= params["TRIGGER"]:
                live = [s for s in segs if not s["cleared"]]
                for s in live[: max(0, len(live) - params["KEEP"])]:
                    s["cleared"] = True
        elif strategy in ("compact-K", "compact-T"):
            due = (strategy == "compact-K" and i > 0 and i - last_compact >= params["K"]) or (
                strategy == "compact-T" and sum(t for _, t in render()) >= params["T"]
            )
            if due:
                pre_calls.append(render())
                summary_n += 1
                summary = True
                segs = []
                last_compact = i
        ctx = render()
        ctxs.append(ctx)
        extra_calls.append(pre_calls)
        segs.append({"id": i, "tool": tools[i], "cleared": False})
    return ctxs, extra_calls


def price(ctxs, extra_calls, cached, n_steps):
    """Return dict of totals for the first n_steps requests (plus their summarisation calls)."""
    p = PRICES
    written = []   # previously sent lists (cache entries exist at their ends and after the prefix)
    tot = dict(sum_in_cost=0.0, sum_out_cost=0.0, input_tokens=0, in_cost=0.0, out_tokens=0, out_cost=0.0, cum=[], per_step=[], summary_calls=0)
    cum_in = 0

    def cost_request(ctx):
        toks = [t for _, t in ctx]
        total = sum(toks)
        if not cached:
            return total, total * p["input"] / 1e6
        best = 0
        keys = [k for k, _ in ctx]
        for w in written:
            c = 0
            for a, b in zip(keys, [k for k, _ in w]):
                if a != b:
                    break
                c += 1
            if c == len(w):
                best = max(best, c)
            elif c >= 1:
                best = max(best, 1)  # the breakpoint after the prefix
        read = sum(toks[:best])
        write = total - read
        written.append(ctx)
        return total, (read * p["cache_read"] + write * p["cache_write_5m"]) / 1e6

    for i in range(n_steps):
        for call in extra_calls[i]:
            t, c = cost_request(call)
            cum_in += t
            tot["input_tokens"] += t
            tot["in_cost"] += c
            tot["sum_in_cost"] += c
            tot["sum_out_cost"] += SUMMARY * p["output"] / 1e6
            tot["out_tokens"] += SUMMARY
            tot["out_cost"] += SUMMARY * p["output"] / 1e6
            tot["summary_calls"] += 1
        t, c = cost_request(ctxs[i])
        cum_in += t
        tot["input_tokens"] += t
        tot["in_cost"] += c
        tot["out_tokens"] += REPLY
        tot["out_cost"] += REPLY * p["output"] / 1e6
        tot["cum"].append(cum_in)
        tot["per_step"].append(t)
    return tot


STRATS = {
    "none": ("none", {}),
    "clear-sliding (keep 10)": ("clear-sliding", {"N": 10}),
    "clear-trigger (50k, keep 5)": ("clear-trigger", {"TRIGGER": 50_000, "KEEP": 5}),
    "compact every 25 steps": ("compact-K", {"K": 25}),
    "compact at 100k": ("compact-T", {"T": 100_000}),
}


def run(scale=1.0, n=100, tokens=None, strats=None):
    tools = tool_sizes(n, scale, tokens)
    res = {}
    for name, (strat, params) in (strats or STRATS).items():
        ctxs, extra = build(strat, tools, n, params)
        res[name] = {
            "uncached": price(ctxs, extra, False, n),
            "cached": price(ctxs, extra, True, n),
            "ctx": [sum(t for _, t in c) for c in ctxs],
        }
    return res, tools


def first_over(ctx, limit):
    for i, c in enumerate(ctx):
        if c > limit:
            return i + 1
    return None


def prefix_stats(res, n):
    return {k: {m: dict(input_tokens=v[m]["input_tokens"], in_cost=v[m]["in_cost"]) for m in ("uncached", "cached")} for k, v in res.items()}


def main():
    global PREFIX
    tokens = sample_tokens()
    print("Tokenised samples (tiktoken o200k_base, proxy):")
    for k, v in tokens.items():
        print(f"  {k:18s} {v:6d}")
    tools = tool_sizes(10, 1.0, tokens)
    mean = sum(tool_sizes(100, 1.0, tokens)) / 100
    print(f"Mean tool result over the 10-step cycle: {mean:,.0f} tokens; reply {REPLY}; per-step growth {mean + REPLY:,.0f}")
    print(f"Prefix {PREFIX:,}, task {TASK}, summary {SUMMARY:,}, placeholder {PLACEHOLDER}")
    print("Prices ($/MTok):", PRICES)
    res, _ = run(1.0, 100, tokens)

    print("\n=== Cumulative input tokens billed (millions), and cost in $ (input only | input+output) ===")
    for n in STEPS:
        print(f"\n-- {n} steps --")
        print(f"{'strategy':32s} {'input Mtok':>10s} {'uncached $':>11s} {'cached $':>9s} {'cached/uncached':>16s} {'total $ unc':>12s} {'total $ cached':>15s} {'calls':>6s}")
        for name in STRATS:
            ctxs, extra = build(*STRATS[name][:1], tool_sizes(100, 1.0, tokens), 100, STRATS[name][1])
            u = price(ctxs, extra, False, n)
            c = price(ctxs, extra, True, n)
            print(f"{name:32s} {u['input_tokens']/1e6:10.3f} {u['in_cost']:11.3f} {c['in_cost']:9.3f} {c['in_cost']/u['in_cost']:16.3f} {u['in_cost']+u['out_cost']:12.3f} {c['in_cost']+c['out_cost']:15.3f} {u['summary_calls']:6d}")

    print("\n=== Per-step context size (tokens) at selected steps, and first step over the 200k window ===")
    print(f"{'strategy':32s}" + "".join(f"{s:>9d}" for s in STEPS) + f"{'peak':>9s} {'>200k at':>9s}")
    for name, r in res.items():
        print(f"{name:32s}" + "".join(f"{r['ctx'][s-1]:9,d}" for s in STEPS) + f"{max(r['ctx']):9,d} {str(first_over(r['ctx'], WINDOW)):>9s}")

    # quadratic check for 'none'
    print("\n=== Does 'none' follow the quadratic formula? ===")
    g = mean + REPLY
    for n in STEPS:
        exact = res["none"]["uncached"]["cum"][n - 1]
        formula = n * (PREFIX + TASK) + g * n * (n - 1) / 2
        print(f"n={n:3d} exact={exact:>10,d} formula n(P+U)+g*n(n-1)/2={formula:>12,.0f}  ratio={exact/formula:.4f}")
    print("Growth 10->100 steps (x10 steps):")
    c = res["none"]["uncached"]["cum"]
    print(f"  cumulative input 10 steps {c[9]:,}  100 steps {c[99]:,}  ratio {c[99]/c[9]:.1f}x")
    # where the quadratic term overtakes the linear (prefix) term
    n_star = 1 + 2 * (PREFIX + TASK) / g
    print(f"  history term overtakes prefix term at step ~{n_star:.1f}")

    # caching: share of cached bill that is writes vs reads, at 100 steps
    print("\n=== 'none' with caching: where the money goes ===")
    ctxs, extra = build("none", tool_sizes(100, 1.0, tokens), 100, {})
    for n in STEPS:
        reads = sum(sum(t for _, t in ctxs[i]) for i in range(1, n)) - 0
        # reads = every context except the new tail each step
        tail = [REPLY + tool_sizes(100, 1.0, tokens)[i - 1] for i in range(1, n)]
        r = sum(sum(t for _, t in ctxs[i]) - tail[i - 1] for i in range(1, n))
        w = (PREFIX + TASK) + sum(tail)
        print(f"n={n:3d} read tokens {r:>10,} cost ${r*PRICES['cache_read']/1e6:7.3f} | write tokens {w:>8,} cost ${w*PRICES['cache_write_5m']/1e6:7.3f}")

    # sensitivity
    print("\n=== Sensitivity: 'none' and 'compact at 100k', 100 steps, cost uncached | cached (input only $) ===")
    for scale in (0.5, 1.0, 2.0):
        r, _ = run(scale, 100, tokens, {k: STRATS[k] for k in ("none", "clear-trigger (50k, keep 5)", "compact at 100k")})
        mean_s = sum(tool_sizes(100, scale, tokens)) / 100
        line = f"tool results x{scale} (mean {mean_s:,.0f}): "
        for k, v in r.items():
            line += f"{k}: {v['uncached']['in_cost']:.2f}|{v['cached']['in_cost']:.2f}  "
        line += f"none first over 200k: {first_over(r['none']['ctx'], WINDOW)}"
        print(line)

    # no-cache break-even for caching on the 'none' strategy and cold cache (every step a miss) sanity
    print("\n=== Prefix size sensitivity ('none', 50 steps, uncached $ | cached $) ===")
    keep = PREFIX
    for pre in (2_000, 8_000, 24_000):
        PREFIX = pre
        r, _ = run(1.0, 50, tokens, {"none": STRATS["none"]})
        print(f"prefix {pre:6,d}: {r['none']['uncached']['in_cost']:.3f} | {r['none']['cached']['in_cost']:.3f}")
    PREFIX = keep


    # doubling ratios
    print("\n=== Doubling the steps: cost ratio (input only) ===")
    print(f"{'strategy':32s} {'25->50 unc':>11s} {'50->100 unc':>12s} {'25->50 cach':>12s} {'50->100 cach':>13s}")
    for name, (strat, params) in STRATS.items():
        ctxs, extra = build(strat, tool_sizes(100, 1.0, tokens), 100, params)
        u = {n: price(ctxs, extra, False, n)["in_cost"] for n in (25, 50, 100)}
        c = {n: price(ctxs, extra, True, n)["in_cost"] for n in (25, 50, 100)}
        print(f"{name:32s} {u[50]/u[25]:11.2f} {u[100]/u[50]:12.2f} {c[50]/c[25]:12.2f} {c[100]/c[50]:13.2f}")

    print("\n=== Cost of the summarisation calls themselves, 100 steps ($) ===")
    for name in ("compact every 25 steps", "compact at 100k"):
        strat, params = STRATS[name]
        ctxs, extra = build(strat, tool_sizes(100, 1.0, tokens), 100, params)
        u = price(ctxs, extra, False, 100)
        c = price(ctxs, extra, True, 100)
        print(f"{name:26s} calls {u['summary_calls']}  uncached: input {u['sum_in_cost']:.3f} + output {u['sum_out_cost']:.3f} = {u['sum_in_cost']+u['sum_out_cost']:.3f} of total {u['in_cost']+u['out_cost']:.3f};  cached: input {c['sum_in_cost']:.3f} + output {c['sum_out_cost']:.3f} of total {c['in_cost']+c['out_cost']:.3f}")

    # where is the 200k window hit (run longer)
    print("\n=== First step whose request exceeds 200k (run to 300 steps) ===")
    for scale in (1.0, 2.0):
        r, _ = run(scale, 300, tokens)
        print(f"tool results x{scale}: " + ", ".join(f"{k}: {first_over(v['ctx'], WINDOW)} (peak {max(v['ctx']):,})" for k, v in r.items()))

    # dump series for the chart
    out = {name: {"cum": r["uncached"]["cum"], "ctx": r["ctx"]} for name, r in res.items()}
    (HERE / "results").mkdir(exist_ok=True)
    (HERE / "results" / "series.json").write_text(json.dumps(out))


if __name__ == "__main__":
    main()
