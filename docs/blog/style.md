# Blog style

How posts on 0xadityaa.dev are written. The bar is set by engineers whose posts get passed around: each post is built on something the author made or measured, and says so in the first screen. The study behind these rules, with examples to read, is `docs/research/frontier-sites.md`; sections 3 and 5 are the short version.

## What every post has

A reviewer should be able to point at each of these.

1. **A thesis in the first 150 words.** One sentence a competent engineer could disagree with. When the title is a question, one sentence answers it directly.
2. **An artifact.** Something that did not exist before the post: a measurement, runnable code, a cost calculation with its inputs, a table he compiled, a diagram of his system. The post is the write-up of the artifact. A topic with no artifact becomes a note (see Formats) or waits until it has one.
3. **Numbers with their papers.** Every cost, speed, or scale claim carries a number, a unit, a link to its source, and the date it was checked. A post about cost shows the arithmetic at three volumes (small, medium, large) so the reader can find themselves on it.
4. **Links as the evidence trail.** Each named service, pattern, spec, and price links to its primary source at first mention. Expect five or more per 1,000 words.
5. **Limits.** A section that states the strongest objection in its strongest form, linked to someone who holds it; says where the advice stops applying; and names what he did not test.
6. **An ending that adds.** The last paragraph gives the decision rule, what would change his mind, or what he will measure next.

## Voice

Aditya explaining something to a friend who codes: first person, casual, a little cheeky, sure of his opinion and exact about how far it reaches. It should sound like a person talking, never like documentation. Section headings can be loose too ("The short version", "Where I'd stop trusting this post", "The takeaway").

- **Open on what happened.** A real moment with a rough date ("In March our queue bill tripled"), from him. A thought experiment is fine when it is called one.
- **Size the claim to the evidence.** "I have seen this in one system." "I have not load-tested this." A threshold is either sourced or marked as his rule of thumb.
- **Short sentences, plain words, contractions.** One idea per paragraph, four sentences at most. Say it once.
- **Concrete over grand.** "Twelve Lambda invocations per order" beats "significant fan-out".
- **Fresh phrasing.** Where a stock phrase comes to mind ("hot take", "the hard way", "nobody talks about", "game changer", "everyone and their dog"), write the specific thing it was standing in for. `npm run posts:check` flags these.
- **Commas, colons, and periods** do the work an em dash would.
- **Define a term in one clause** the first time it appears.
- **Humour is welcome** when it is his and it is quick. Visuals earn their place by carrying a point: a diagram, a chart, real output. No GIFs or memes: he had them all removed in October 2026.
- **Sequels say so.** Link the earlier post in the first paragraph with one sentence on what changed.

## Formats

- **Note**, 400 to 900 words. One observation, sharply made. Headings optional. Use this when there is a clear point and a small artifact, or a strong link with his commentary.
- **Essay**, 1,500 to 3,000 words. Only when an artifact justifies the length: an experiment, a cost model, a build log.

Between 900 and 1,500 words is usually an essay missing its artifact or a note that has not been cut yet. Decide which.

## Structure

No fixed template. A shape that works for an essay:

1. Opening: what happened, then the thesis.
2. The artifact: what he built or measured, how, and the result, with the diagram or table.
3. What it means: two to four `##` sections. Headings are questions or plain statements in sentence case.
4. Limits.
5. The ending.

Every post has a short version near the top, under the heading "The short version": three or four bullets a reader could stop at. Posts end on the real ending: no sign-off line. The site adds his animated signature under every post.

## Format details

- The title is a claim or a question, 60 characters at most. The file name is the title in kebab-case.
- The summary says what the reader walks away with, in 160 characters at most, stated as fact ("Fan-out, payload size, and retry loops are what make event-driven systems expensive"), never as a promise to teach.
- No H1 in the body. Inline code for identifiers, service names, and config keys. Fenced blocks carry a language.
- Diagrams and charts go in `public/images/blog/` with alt text that says what the picture shows. Draw them as SVG with their own background, in the site's colours (`#30302E` background, `#FAF9F5` ink, `#D97757` for the one thing to notice), so they also read correctly on dev.to.
- When a published post changes in substance, set `updated: YYYY-MM-DD` in frontmatter; the page shows it next to the date. No dated note in the body. If a correction came from a reader, thank them by name where the fix is.

## Before the pull request

Read the draft aloud once and rewrite any sentence he would not say. Then check the six things in "What every post has" one by one and write, in the pull request, where each one is.
