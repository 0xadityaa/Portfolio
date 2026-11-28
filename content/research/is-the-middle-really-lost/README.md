# Does the position of the answer paragraph change a 0.5B model's accuracy?

The artifact behind the post `content/blog/is-the-middle-really-lost.md`.

Question: with one relevant paragraph among seven (1,087 to 1,593 tokens), does the slot it sits in change Qwen2.5-0.5B-Instruct's answers, and is the effect bigger than sampling noise?

## What it does

- Picks 3 SQuAD v1.1 dev questions from each of the 48 articles (144 chosen; 74 finished, see below), seeded with 20261127. Questions are taken in article round-robin order, so a run cut short still spans every article.
- Builds a prompt of 7 numbered paragraphs from the question's article: the gold paragraph plus 6 paragraphs that contain none of the gold answer strings. The paragraph total is kept to 1,000 to 1,500 tokens; with the chat template the prompts run 1,087 to 1,593 tokens (median 1,250).
- Distractors and their order are fixed per question. Only the slot of the gold paragraph changes: slots 1, 4 and 7 of 7 (0-based 0, 3, 6). The first two questions also ran slots 2 and 6 before the design was cut; `analyze.py` ignores those.
- Reference conditions: `gold_only` (the gold paragraph alone, median 225 tokens) on every question, and `no_gold` (7 distractors) on every third question.
- Qwen2.5-0.5B-Instruct, chat template, fp32 on CPU, 4 threads, greedy, up to 16 new tokens. Prompt: "Answer the question using the passages below. Reply with only the answer, as a short phrase copied from the passages."
- Metrics per answer: `contains` (a normalised gold answer is a substring of the normalised output; the primary metric, fixed in `EXPECTATION.txt`), `em`, `f1` (max over gold answers) and `gold_logprob` (log-probability of the first gold answer, teacher-forced from the same prefill).
- `analyze.py` runs a paired bootstrap that resamples whole articles (10,000 resamples) and a within-question permutation test on max minus min of the slot means.

## Files

- `EXPECTATION.txt`: expectations and the tests, written before the first run, with one dated amendment (five slots cut to three).
- `run.py`: the experiment. `analyze.py`: the tables and tests. `make_chart.py`: draws `public/images/blog/middle-of-the-context-dip.svg`.
- `results/records.jsonl`: one line per (question, condition), with the model's answer. `results/analysis.txt` and `results/analysis.json`: the output of `analyze.py`. `results/run.log` and `results/load-log.txt`: raw logs, with `uptime` at each stage.
- `social.md`: social cuts for the post.

## Run it again

```bash
WORK=/private/tmp/claude-501/lim
mkdir -p $WORK/data && cd $WORK
uv venv --python 3.12 venv
uv pip install --python venv/bin/python torch==2.7.1 transformers==4.52.4 numpy==2.2.6

# dataset (4.8 MB, CC BY-SA 4.0)
curl -sSL -o data/dev-v1.1.json https://rajpurkar.github.io/SQuAD-explorer/dataset/dev-v1.1.json
shasum -a 256 data/dev-v1.1.json   # 95aa6a52d5d6a735563366753ca50492a658031da74f301ac5238b03966972c9

R=/path/to/repo/content/research/is-the-middle-really-lost
venv/bin/python $R/run.py data $R/results 3 0,3,6 3000   # last argument: time limit in seconds; resumable
venv/bin/python $R/analyze.py $R/results
venv/bin/python $R/make_chart.py $R/results /path/to/repo/public/images/blog
```

Runtime: on an idle machine roughly 30 to 45 s per question on 4 threads (4 to 5 prefills of about 1,250 tokens plus short answers), so the full 144 questions is about 1.5 hours. The model weights (about 1 GB) download on first use. `run.py` appends to `records.jsonl` and skips finished (question, condition) pairs, so a second call continues where the first stopped. `analyze.py` takes about a minute; `make_chart.py` seconds.

## What happened on the day

The machine was shared, and `results/load-log.txt` holds every `uptime`. The load average was 67 at the first check and 19.0 at the third (5 minutes apart), when the run started. Load average (1 minute) before the run: 19.04, and after the last leg: 44.04.

A first leg with five slots ran about 85 s per question, so I cut the design to three slots and resumed. That leg stopped at 52 questions at its 50-minute limit while the load average peaked at 160. A second leg of 25 minutes took it to 74 questions covering all 48 articles. The 144-question plan was not reached. `run.log` prints the question count once per leg.

## Environment

Apple laptop, 8 cores, 16 GB, CPU only, 4 torch threads. Python 3.12, torch 2.7.1, transformers 4.52.4, numpy 2.2.6. Model `Qwen/Qwen2.5-0.5B-Instruct`.

## Things to know before trusting it

- 74 questions. Only 20 of them (27%) gave different outcomes across slots, and the smallest paired difference the sample detects reliably is 14.8 points (2.8 times the standard error of middle minus start). A null from it would not have been informative.
- `contains` is the pre-chosen primary metric. Middle minus start on it is -5.4 points with an interval that includes zero, and the permutation p is 0.178. F1 and log-probability, which I recorded as secondary, show clearer dips. The three metrics come from the same answers and no multiple-comparison correction was applied.
- Intervals are clustered by article. They do not cover the choice of model, prompt wording or dataset.
- Distractors come from the same article and contain no gold string, SQuAD questions were written looking at the paragraph, and `contains` is a generous match.
- A 0.5B model. Liu et al. (https://arxiv.org/abs/2307.03172) report on larger models; nothing here shows what a frontier model does.
