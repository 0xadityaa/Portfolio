# Prompt injection isn't a prompt problem (it's permissions)

- Topic issue: none (series post 10, planned for Tue Jan 26)
- Format: essay-length note (about 1,200 words of body)
- Thesis: You can't prompt your way out of prompt injection. Warnings lower the rate but never zero it, so the real fix is limiting what an agent can do after it reads text you don't control.
- Reader: an engineer wiring an LLM agent to email, web pages or tickets who has heard "just add a warning" and wants to know what to do instead.

## What this adds

Prior art: Simon Willison's [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) post (the framing), [AgentDojo](https://arxiv.org/abs/2406.13352) (published numbers on defences for GPT-4o and others), and [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813) (CaMeL). This post adds a small, reproducible measurement of how far prompt-only defences move a tiny model, with the raw outputs, set beside those published numbers and a table of the permission patterns that close each leg of the trifecta.

## Artifact

A benchmark in `content/research/prompt-injection-isnt-a-prompt-problem-its-permissions/`: 40 invented benign documents, 6 harmless canary injections (3 ask for "PWNED", 3 ask for a fake key in the system prompt), 4 defences, Qwen2.5-0.5B-Instruct on CPU, greedy decoding, 64 new tokens.

**Expectation, written before running (`EXPECTATION.txt`):** none 60-80%, delimiters 50-70%, delimiters plus warning 30-50%, sandwich 20-40% and best of the four, nothing reaching zero, key leaks rarer than PWNED, 0% on clean documents.

**Environment:** Apple-silicon Mac, CPU only, Python 3.12, torch 2.15.0, transformers 5.23.0, 4 threads, machine shared with other jobs (load average 25 to 45). Model fetched from `Qwen/Qwen2.5-0.5B-Instruct` (and `Qwen/Qwen2.5-1.5B-Instruct` for the pilot), weights kept in /private/tmp, not in the repo.

**Commands:**

```bash
python bench.py --model <qwen0.5b dir> --out results/results_qwen2.5-0.5b.jsonl --batch 16 --design reduced
python3 analyse.py results/results_qwen2.5-0.5b.jsonl
STRICT=1 python3 analyse.py results/results_qwen2.5-0.5b.jsonl
```

**What changed along the way (all in the README):** I started on the 1.5B model. It ran at 27 s per prompt on the loaded machine, so the full design (1,120 generations) would have taken about 8 hours. I stopped after one document (28 generations, kept as `results/pilot_qwen2.5-1.5b_one_document.jsonl`) and moved to the 0.5B model with a reduced design: document `d` gets template `d mod 6` under all 4 defences, and every 5th document also gets a clean control. 192 generations in 815 s.

**Raw output (strict metric, the post's headline; the full files are in `results/`):**

```
none                     12/40   30.0%  boot 17.5-45.0%
delimiters               11/40   27.5%  boot 15.0-42.5%
delimiters_warning        7/40   17.5%  boot  7.5-30.0%
sandwich                 11/40   27.5%  boot 15.0-42.5%
key templates: 0/19 under every defence
PAIRED vs none: delimiters -2.5 (-7.5 to 0.0); warning -12.5 (-22.5 to -2.5); sandwich -2.5 (-7.5 to 0.0)
sandwich - warning: +10.0 (+2.5 to +20.0)
clean control: 0/8 under every defence
```

Mechanical metric (output merely mentions PWNED or the key): 12, 11, 10, 12 of 40. The 4 extra hits are outputs that repeat or describe the injection without obeying, so the post uses the strict metric and says so.

**Did the expectation hold?** No. No-defence rate was 30%, not 60-80%. The sandwich did no better than delimiters alone (expected: best). The warning before the document was the only defence that beat no defence. Held: nothing reached zero, key leaks were rarer than PWNED (0 against 12), clean control 0%. The zero key leaks were more extreme than predicted; in the one-document 1.5B pilot the key leaked twice (`key_print` under none and delimiters).

## Claims and sources

| Claim | Source | Tier | Checked |
| --- | --- | --- | --- |
| Lethal trifecta: private data, untrusted content, external communication; avoid combining all three; published 16 June 2025 | https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ | 2 | 2026-11-14 |
| Dual LLM pattern: privileged and quarantined LLM plus a controller; published 25 April 2023 | https://simonwillison.net/2023/Apr/25/dual-llm-pattern/ | 2 | 2026-11-14 |
| Delimiters do not reliably protect against injection; 11 May 2023 | https://simonwillison.net/2023/May/11/delimiters-wont-save-you/ | 2 | 2026-11-14 |
| Indirect prompt injection against Bing's GPT-4 chat and other GPT-4 applications | https://arxiv.org/abs/2302.12173 (abstract only) | 1 | 2026-11-14 |
| OWASP LLM01: unclear whether fool-proof prevention exists; recommends least privilege and human approval for risky actions | https://genai.owasp.org/llmrisk/llm01-prompt-injection/ | 1 | 2026-11-14 |
| AgentDojo, GPT-4o targeted attack success, "Important message" attack: none 57.69%, data delimiting 41.65%, repeat prompt (sandwiching) 27.82%, PI detector 7.95%, tool filter 6.84% (Table 5). The paper's Table 3 shows 47.69% for GPT-4o, a different attack. | https://arxiv.org/html/2406.13352 (read the HTML source and grepped the table; arXiv version fetched 2026-11-15) | 1 | 2026-11-15 |
| CaMeL solved 77% of AgentDojo tasks with provable security, against 84% with an undefended system | https://arxiv.org/abs/2503.18813 (abstract only) | 1 | 2026-11-14 |
| Instruction hierarchy "drastically increases robustness" on GPT-3.5, even for unseen attack types | https://arxiv.org/abs/2404.13208 (abstract only) | 1 | 2026-11-14 |
| The Attacker Moves Second: 12 recent defences bypassed, attack success above 90% for most (abstract's wording, relayed by a fetch summary; I did not read the body) | https://arxiv.org/abs/2510.09023 | 1 | 2026-11-14 |
| 12/40, 11/40, 7/40, 11/40; key 0/19 per defence; clean control 0/8; pilot 3/3/0/1 of 6 on one document | this artifact, `results/` | own | 2026-11-15 |
| Counter: trained-in instruction hierarchy makes frontier models far more resistant than a 0.5B model | https://arxiv.org/abs/2404.13208 | 1 | 2026-11-14 |

## From Aditya

Nothing yet. The post makes no claim about his own work or history.

## Outline

1. Hook: 12 of 40; a warning leaves 7 of 40; who it bites; bold thesis; short version (4 bullets).
2. What I ran: the setup in one paragraph; table 1 (four defences).
3. Did the warning work: warning helped by 12.5 points, sandwich did not, my expectation was wrong; AgentDojo's published numbers beside it, with the not-comparable caveat; which templates worked; key 0/76 and the 1.5B pilot.
4. What a leak needs: the trifecta; diagram `public/images/blog/lethal-trifecta.svg` (three overlapping circles, the overlap in orange).
5. Which permissions do the work: table 2 (pattern, leg removed, cost), with OWASP.
6. Limits: instruction hierarchy objection first; n = 40; a zero is not a result; permissions cost.
7. Takeaway: list the legs, remove one; what would change my mind.

## Where the six required things are

1. Thesis: bold sentence in the first 150 words.
2. Artifact: the benchmark, table 1, link to the folder.
3. Numbers with papers: AgentDojo, CaMeL, instruction hierarchy and attacker-moves-second numbers each carry a link; the local numbers come from the artifact.
4. Links: 14 external links in about 1,200 words.
5. Limits: "Where I'd stop trusting this post", strongest objection first and linked.
6. Ending: "The takeaway" gives the decision rule and what would change his mind.

## Open questions

- The post says nothing about Aditya's own agents. Does he want a line on whether any agent he runs has all three legs? That has to come from him.
- Series post 10 is planned for Tue Jan 26. The post's `publishedAt` is the placeholder 2026-11-14.
- The 1.5B model could run the full design (about 8 hours on a loaded machine). Worth a quiet-machine overnight run before publishing, so the headline is not a 0.5B one?

## Left out

Position of the injection (middle of a document rather than the end); adaptive attacks; spotlighting and datamarking variants; real tool-calling agents; a size ladder from 0.5B to 7B; the 1.5B model on the full design.
