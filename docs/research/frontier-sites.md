# Frontier engineering sites: what they do, and the gap to 0xadityaa.dev

Researched 2026-10-09. 16 people, 16 home or index pages, 33 posts.

**Method and limits.** Every page was fetched live and read as HTML converted to text. I did not see rendered layouts, so "above the fold" means "first in document order" (inferred). Word counts are estimates. 0xadityaa.dev was read through its Markdown twin, so its visual chrome (the dock, any tag filter) is unverified. Dropped because the posts could not be read: Phil Eaton (his posts are stubs that redirect to a host returning 403) and Thorsten Ball (only a Substack landing page loaded). Dan Abramov's "A Social Filesystem" was truncated, so I read a third post of his.

## 1. Records

Post labels (for example `[Brooker-1]`) are reused in the synthesis.

### AI and LLM practitioners

**Addy Osmani.** https://addyosmani.com, https://addyosmani.com/blog/
- Home: name, the tagline "Engineering and evangelism leader", a bio, then books (19), case studies, featured AI articles, talks, videos. Proof is employer (Anthropic, 14 years at Google), books, and more than 200 talks. Nav has Newsletter (Substack) and Blog. No now page; the bio names what he works on.
- Index: thumbnail, date, title, one-line summary; 24 per page; about weekly; grouped by venue (own blog, Substack, LeadDev).
- `[Addy-1]` https://addyosmani.com/blog/brownfield-agentic-engineering/ and `[Addy-2]` https://addyosmani.com/blog/agentic-skill-decay/: about 3,000 words each. Open with one bolded sentence that is the thesis, then a personal anecdote. Ten or so statement headings. No code; slide images restate each section. Evidence is cited numbers from named studies and company migrations, with the weakness of each source stated (vendor-reported, short-term, single library). End on a forward-looking paragraph, then related reading, bio, book CTA.
- Voice: first person, hedged, bold lines for skimmers.

**Simon Willison.** https://simonwillison.net/
- Home is the stream: entries, links, quotes, notes, with TILs and tools in the nav. No bio line. Tag counts (generative-ai has 2,013). Atom feed at top; paid monthly digest via GitHub Sponsors. Several items a day; three to four long entries a week.
- `[Simon-1]` https://simonwillison.net/2026/Oct/3/default-hard-budget-caps/ (about 575 words, no headings, title is the thesis, one counter-argument raised and answered, three vendor links). `[Simon-2]` https://simonwillison.net/2026/Oct/7/claude-haiku-5-5/ (about 900 words, opens on a price comparison, 20+ links, his own repeated test across effort levels, token counts from his own tool, a shell block to reproduce).
- Voice: short declaratives, dry. Never a summary conclusion; posts stop when the material does.

**Hamel Husain.** https://hamel.dev/
- Home: course banner, title, tagline "Notes on applied AI engineering, machine learning, and data science", photo, bio with employers and a student count above 5,000, then a date-and-title list. Nav: Blog, Notes, OSS, Teaching. Newsletter prompt. Roughly monthly.
- `[Hamel-1]` https://hamel.dev/blog/posts/eval-smell/index.html (about 3,000 words; opens by naming the objection he hears most and reframing it; three worked examples with before and after interface sketches; a section admitting the idea is not new; thanks two reviewers). `[Hamel-2]` https://hamel.dev/blog/posts/revenge/index.html (talk recap, about 1,900 words, five pitfalls each as mistake, what to do, remedy; ends on a four-word maxim).
- Voice: confident, imperative, "in my opinion" where it is opinion.

**Eugene Yan.** https://eugeneyan.com/
- Home: "Hi, I'm Eugene Yan", activity bullets, email prompt, then Latest, Trending (posts over 50k reads), Featured Talks, Favourites, a stats line (212 posts, 31 talks, 426,689 words), prototypes. Newsletter states 11,800+ readers; RSS in footer. Nav includes Start Here. About one post every four to six weeks.
- `[Eugene-1]` https://eugeneyan.com/writing/cybersecurity-evals/ (about 4,200 words; two questions, then the thesis in paragraph two as a four-part framework; seven benchmarks each summarised with task counts and success rates; negative results included; References section). `[Eugene-2]` https://eugeneyan.com/writing/product-evals/ (about 2,000 words; opens by saying he keeps giving this advice and decided to write it down; three steps named in paragraph one; worked confidence-interval arithmetic; dated Update line; BibTeX citation block).
- Voice: measured, numbers stated with their sample size.

**Geoffrey Huntley.** https://ghuntley.com/
- Home is a card feed: image, category, title, excerpt. No bio. Nav: Lately (a now page), Media, Workshops, Speaking, Disclosures. Subscribe is a Ghost membership. Bursty, about two a month.
- `[Huntley-1]` https://ghuntley.com/readable/ (about 1,800 words; title is the thesis; one code demonstration; the opposing view is dismissed, not engaged). `[Huntley-2]` https://ghuntley.com/slop/ (about 600 words; job announcement plus a four-point hypothesis).
- Voice: lowercase titles, slang, strong assertion. The weakest of the 16 on caveats, and the only one with a recurring sign-off line.

**Andrej Karpathy.** https://karpathy.bearblog.dev/blog/
- Index is date and title only. No bio, no subscribe visible. 13 posts in 19 months, bursty.
- `[Karpathy-1]` https://karpathy.bearblog.dev/auto-grade-hn/ (about 1,000 words; a build log with the pipeline, the prompt, 930 queries, about $58, about one hour, repo link). `[Karpathy-2]` https://karpathy.bearblog.dev/verifiability/ (about 500 words, one idea, no headings, ends on a one-line maxim).
- Voice: plain, lightly hedged; caveats thin.

### Systems and infrastructure

**Marc Brooker.** https://brooker.co.za/blog/
- One page: About Me ("I like to build things that work, and do cool stuff."), current AWS work, links to publications, a post titled "Is this blog written by AI?", then every post since 2012 grouped by year as date and title. RSS and Atom. About 1.5 to 2 a month.
- `[Brooker-1]` https://brooker.co.za/blog/2026/07/29/lorenz-and-little.html (about 900 words: a concrete question, a Python function, a worked example, an interactive calculator, three footnotes carrying the caveats). `[Brooker-2]` https://brooker.co.za/blog/2026/06/19/waiting.html (about 1,050 words: a two-character vignette, "You're both right", the formula, a simulator, a closing note that his modelling choice is probably a poor fit for real data).
- Voice: dry, first person, hedges tied to a specific approximation.

**Mitchell Hashimoto.** https://mitchellh.com/, https://mitchellh.com/writing
- Home is a bio only: "I'm a developer living in Los Angeles, CA.", then Ghostty and HashiCorp. Writing is one nav click away; flat date and title list; about monthly. No feed link observed.
- `[Mitchell-1]` https://mitchellh.com/writing/ghostty-memory-leak-fix (about 1,600 words; opens with a user report of 37 GB after ten days and says the fix is merged; then data structure, bug, fix, how it was found, prevention; two code snippets, diagrams, PR link; rejected alternatives explained). `[Mitchell-2]` https://mitchellh.com/writing/everyone-should-know-simd (about 2,400 words; contrarian claim in paragraph two; one real function rewritten in five numbered steps; a section answering "why can't the compiler do this"; a measured speedup from his own project; discloses no AI assistance).

**Armin Ronacher.** https://lucumr.pocoo.org/
- Home is the list: date, title, one-line teaser. Nav: archive, projects, travel, talks, about. Atom and RSS; an AI transparency link in the footer. About every eight days.
- `[Armin-1]` https://lucumr.pocoo.org/2026/10/6/codemode/ (about 3,000 words; opens by linking his earlier position and what changed; five code examples from real sessions; a full section on failure modes; says whether this reverses his earlier stance). `[Armin-2]` https://lucumr.pocoo.org/2026/8/22/fast-hard-code/ (about 370 words, no headings, one observation, three project links).
- Voice: thinking in public, heavy hedging.

**Julia Evans.** https://jvns.ca/
- Home: "Hey! I'm Julia.", the ten latest posts, then every post by category (Git, DNS, Terminals). Nav: About, Talks, Projects, Favorites, TIL, Zines, RSS. Weekly digest email. About monthly now.
- `[Julia-1]` https://jvns.ca/blog/2026/07/17/learning-about-running-sqlite/ (about 1,100 words; opens by admitting what she does not know; real commands; a query going from 5 seconds to about 0.05; says she has not tested restoring her backups). `[Julia-2]` https://jvns.ca/blog/2026/02/18/man-pages/ (about 1,800 words; an open question, about 25 links to primary man pages, her own reorganisation experiment; ends by asking readers for examples).
- Voice: lowercase conversational headings, hedges that say exactly what is unknown.

**Dan Luu.** https://danluu.com/
- Home is a text list: month, title. Nav: Patreon, RSS. Bursty: eight public posts July to September 2026 after a long gap.
- `[Luu-1]` https://danluu.com/agentic-testing/ and `[Luu-2]` https://danluu.com/pl-tokens/: about 10,000 words each. Open by naming a widely repeated claim, then test it with original experiments (about 160 runs per condition in the first). Predictions written before the runs and graded after. Appendices list flaws in his own evals. Named reviewers thanked. Dated update notes.
- Voice: long sentences, numeric confidence levels.

**Brandur Leach.** https://brandur.org/, https://brandur.org/articles, https://brandur.org/now
- Home: "I'm Brandur.", a photo, recent writing with date, summary and type. Nav: Articles, Atoms, Fragments, Newsletter, Sequences, Now, Uses, About. The now page is dated (last entry 25 July 2026). Articles about two a year; fragments every week or two.
- `[Brandur-1]` https://brandur.org/minimum-viable-unit (about 1,800 words; opens with reader pushback on his own decision; break-even arithmetic with stated assumptions; a table; a chart he drew; admits the post is self-serving). `[Brandur-2]` https://brandur.org/fragments/postgres-without-pgbouncer (about 750 words; a question, a table of about 25 providers he checked, then the argument). Footer on both invites a correction by pull request and states the writing is human.

### Product and frontend

**Josh Comeau.** https://www.joshwcomeau.com/
- Home: latest articles with summaries, browse by category, a numbered Popular list of ten, newsletter form, courses. Nav: Categories, Courses, Goodies, About. RSS in footer.
- `[Josh-1]` https://www.joshwcomeau.com/css/anchor-positioning/ (about 3,500 words; opens on a broken tooltip you can see; scope stated as the 20% of the API worth learning; live playgrounds; browser-support percentages with source and month; labelled gotcha boxes; published and last-updated dates). `[Josh-2]` https://www.joshwcomeau.com/animation/css-vs-javascript/ (about 1,800 words; "is JS animation slower?" answered in the introduction; a demo that blocks the main thread; concedes where the other library's trade-off is better).

**Dan Abramov.** https://overreacted.io/
- Home: "A blog by Dan Abramov", then title, date, one-line subtitle per post. Nothing else. No feed link observed. Bursty.
- `[Dan-1]` https://overreacted.io/how-to-fix-any-bug/ (about 2,200 words; opens mid-bug; thesis early, that the agent failed for lack of a repro; Step 0 to Step 4; real code; ends on a four-word callback). `[Dan-2]` https://overreacted.io/there-are-no-instances-in-atproto/ (about 1,400 words; corrects a question he keeps seeing; a sequence of diagrams carries the argument; the last diagram repeats the first).
- Voice: short sentences, objections voiced before the reader can raise them.

**Lee Robinson.** https://leerob.com/
- Home: name, bio ("I'm an engineer and writer."), employers, then Notes (ten evergreen topic pages), then posts as title and month. No subscribe observed. About five posts a year.
- `[Lee-1]` https://leerob.com/pixo (about 2,900 words; the first sentence is the result, with days, agent count, tokens and dollars in the first paragraph; 50+ links, mostly to his own PRs and commits; footnotes invite benchmark corrections). `[Lee-2]` https://leerob.com/model-behavior (about 1,300 words; explainer by analogy; no data; the weaker of the two).

**Sam Rose.** https://samwho.dev/
- Home: "Hi.", a one-line bio, visual essay cards, newsletter (a few emails a year), talks, experiments. RSS. Each essay takes one to three months.
- `[Sam-1]` https://samwho.dev/big-o/ and `[Sam-2]` https://samwho.dev/reservoir-sampling/: about 3,000 words each. Line one defines the topic and says what you will know by the end. Each section has an interactive figure. The reader's objection is written into the text and answered. Reviewers thanked.

## 2. Patterns (N = 16)

| Pattern | Count |
| --- | --- |
| Writes in first person | 16 |
| At least one post states its thesis in the title or first two paragraphs | 14 (not Brandur, Lee's explainer; Armin previews it) |
| States a limit of its own claim or its own evidence | 14 (thin in Huntley, Karpathy) |
| Writing is the home page, or follows directly after a short bio | 14 (not Addy, Mitchell) |
| At least one post built on something the author made or measured | 13 (Addy and Eugene use dense cited data; Hamel uses design sketches) |
| Six or more external links, mostly primary sources, in one post | 13 |
| A real number with a unit in at least one post | 12 |
| Neither post has a "Conclusion" or "Final thoughts" heading | 12 |
| RSS or email subscription visible | 12 (not observed: Mitchell, Abramov, Lee, Karpathy) |
| A short-form stream beside long posts (links, notes, TIL, fragments) | 6 |
| A statement about AI use in the writing | 5 (Brooker, Armin, Mitchell, Brandur, Simon) |
| A now page | 2 (Brandur, Huntley); 7 more name current work in the bio |
| A section labelled TL;DR | 0 |
| A stock meme or GIF as the opening image | 0 |
| A skills or stack list, or an education section, on the home page | 0 |

Length is bimodal: 370 to 1,100 words for one observation (`[Armin-2]`, `[Simon-1]`, `[Karpathy-2]`, `[Brooker-1]`), 1,600 to 4,500 when there is an experiment, tutorial or survey. Index pages are plain: 8 show only date and title, 6 add a one-line summary.

## 3. What separates the strongest posts

1. **The post contains something that did not exist before it.** A measurement, a simulator, a table the author compiled, a repro. `[Brooker-2]`, `[Brandur-2]`, `[Luu-1]`.
2. **The first paragraph gives the result, with numbers.** `[Lee-1]`, `[Mitchell-1]`.
3. **Claims are sized to the evidence.** The hedge names the specific thing not known or not tested. `[Julia-1]`, `[Brooker-1]`.
4. **The best objection gets a section, not a clause.** `[Mitchell-2]`, `[Armin-1]`.
5. **Links are the evidence trail.** Specs, pricing pages, PRs, papers, at the point of the claim. `[Simon-2]`, `[Josh-1]`.
6. **Visuals carry the argument.** Remove the diagrams and the post fails. `[Dan-2]`, `[Sam-2]`.
7. **Arithmetic is shown with its assumptions.** `[Brandur-1]`, `[Eugene-2]`.
8. **The ending adds something** (a maxim, a prediction, a question) instead of recapping. `[Hamel-2]`, `[Dan-1]`.
9. **Posts connect.** They open by linking the author's earlier position and saying what changed. `[Armin-1]`, `[Simon-2]`.

Average dev-blog writing is the mirror image: a known pattern re-explained by analogy, no links, no numbers, a rule of thumb with no source, a recap ending. `[Lee-2]` and `[Huntley-2]` show that well-known authors publish this too; it is their other posts that earn the audience.

## 4. Gap analysis: 0xadityaa.dev

Sources: https://www.0xadityaa.dev/llms-full.txt, https://www.0xadityaa.dev/blog, and the two post pages.

**What already works**
- The positioning line says what he does and where he is heading. Most of the 16 have nothing this clear.
- Index entries carry date, tags and a summary, which is more than 8 of the 16 show.
- Both new posts take a position, start from his own work, and are a sensible length for a single claim.
- The "12 Lambda functions" example is the right kind of concrete. "Boy, was I wrong" is a real hook.
- Markdown twins and `llms.txt`. I did not observe this on any of the 16.

**Home page**
- Order is About, Experience, Projects, Writing, Stack, Education, Contact. Writing is fifth; 14 of 16 put it first or second.
- Stack and Education sections appear on none of the 16.
- No experience entry has a number or an outcome. Proof elsewhere is a figure (Eugene, Hamel), a shipped thing with a link (Mitchell), or a result (Lee).
- Projects link to internal pages, not to repos or live demos (inferred from the Markdown twin).
- All 12 posts are listed, so 2024 fundamentals posts sit at equal weight with the two posts that show his current level.
- No now element, and no subscription path except an RSS link under Contact.

**Blog index**
- One flat list. No split between architecture essays and older tutorials, no series marker although the two newest posts are a pair, and no RSS link on the page.

**Post pages**
- After the sign-off there is nothing: no bio line, no next post, no subscribe, no corrections link, no updated date.

**`going-event-driven-read-the-bill-first`** (about 750 words)
- A post about the bill with no price, no dollar figure and no arithmetic. Compare `[Brandur-1]` and `[Simon-2]`.
- Zero external links. EventBridge, Kafka, claim-check and dead-letter queues are named, never linked.
- The opening scene is "Picture this", a hypothetical. `[Mitchell-1]` and `[Dan-1]` open on something that happened.
- The image is a stock GIF. No diagram of the fan-out or the loop.
- No limits stated: nothing on ordering, debugging cost, or when the bill is worth paying.

**`microservices-do-you-really-need-them`** (about 1,000 words)
- The title asks a question the post does not answer; it argues for orchestrated sagas instead.
- One link. The "more than 3 or 4 services" threshold has no source and is not labelled as his guess.
- Choreography versus orchestration is explained by a kitchen analogy with no diagram and no code. `[Dan-2]` does the same job with diagrams.
- The strongest objection, that the orchestrator becomes a bottleneck and a single point of failure, is absent.
- Stock phrases: "hot take", "everyone and their dog", "gets spicy".

**The current guides cause part of this.** `docs/blog/style.md` requires an opening meme, a TL;DR heading, a Final Thoughts heading and a fixed sign-off, and caps posts at 1,200 words. None of the 16 use the first two, 12 avoid the third, and the cap rules out any post with an experiment in it. `docs/blog/research.md` has a claims table but does not require a first-hand artifact, a counter-argument, or prior-art reading.

## 5. Recommendations

### (a) Site, by impact

No new facts needed:
1. Move Writing to directly under the intro. Show three to five selected posts, with a link to the full index.
2. Remove Stack and Education from the home page; fold them into an about or resume page.
3. Add a post footer: one-line bio, next or related post, RSS, and "found a mistake?" linking to the post's source on GitHub (as on `[Brandur-2]`).
4. Add RSS to the blog index and site navigation.
5. Split the index into essays and fundamentals, or group by year, and mark the two event-driven posts as a series.
6. Support an `updated` date and render dated update notes (as on `[Josh-1]`, `[Eugene-2]`).
7. Link each project to its repo or live demo from the home page.

Needs Aditya:
1. One outcome per experience entry: scale, latency, cost, or what changed. Input: the numbers, and what Enercare allows him to say.
2. A dated "now" paragraph or page. Input: current work and what he is learning, refreshed monthly.
3. An AI-use statement, since agents draft his posts. Five of 16 publish one. Input: his wording and what he reviews himself.
4. Selected posts and one flagship project write-up with measurements. Input: his pick, and benchmark or cost data.
5. Email subscription. Input: whether he wants to run one. RSS alone is acceptable; 4 of 16 show neither.

### (b) Guides, as checkable rules

Style guide:
1. **Thesis in the first 150 words**, as a sentence someone could disagree with. If the title is a question, one sentence in the post answers it directly.
2. **One first-hand artifact per post**: a measurement, runnable code, a cost calculation with its inputs, a table he compiled, or a diagram he drew. The reviewer must be able to point to it. Without one, the piece is published as a short note or not at all.
3. **Every cost, speed or scale claim has a number, a unit, a source link and a checked date.** A cost post shows the arithmetic at three volumes.
4. **Link at first mention** every named service, pattern, spec and price. At least five primary-source links per 1,000 words.
5. **A real opening.** The scene happened and says roughly when, or it is labelled a thought experiment. No decorative image; the first visual is a diagram or output that carries a point.
6. **A limits section.** State the strongest objection in its strongest form with a link to someone who holds it, where the advice stops applying, and what he did not test.
7. **Hedge specifically.** "I have seen this in one system" or "I have not load-tested this", not "it depends". A threshold is sourced or marked as his guess.
8. **The last paragraph adds something**: the decision rule, what would change his mind, or what he will measure next. The TL;DR and Final Thoughts headings become optional. The sign-off is optional and never replaces a real ending.
9. **Two formats.** Note: 400 to 900 words, one observation, headings optional. Essay: 1,500 to 3,000 words, only when there is an artifact to support the length.
10. **Banned stock phrases**: "hot take", "the hard way", "nobody talks about", "everyone and their dog", "game changer". The check script can enforce this list.
11. **Open sequels with a link to the earlier post** and one sentence on what changed.
12. **Corrections are dated and visible**, and reviewers are thanked by name.

Research checklist:
1. Read the three strongest existing posts on the topic. Write one sentence on what this post adds. If nothing, stop.
2. Plan the artifact before the outline: what can be run, priced or counted in an afternoon. Record the command, the environment and the raw output in the note.
3. For any cost claim, copy the figure from the live pricing page with the date, and compute it for small, medium and large volume.
4. Find the best published counter-argument and add it to the claims table with its link.
5. At least 70% of claims-table rows cite a primary source. No row cites a tutorial or an AI summary.
6. Specify each diagram in one line: what it shows and which claim it carries.
7. Ask Aditya for: the real numbers, what broke, when, and what is public. The draft does not start while these are open.
8. Write down what he expects to find before running the experiment, and report whether he was right (as in `[Luu-2]`).
