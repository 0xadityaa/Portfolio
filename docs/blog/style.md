# Blog style

How posts on 0xadityaa.dev read. The reference posts are `going-event-driven-read-the-bill-first` and `microservices-do-you-really-need-them`; read both before writing. Posts dated before October 2026 predate this guide and are not models for format.

## Voice

Aditya explaining something to a teammate over coffee: first person, conversational, a little cheeky, and sure of his opinion.

- **Take a side.** Every post argues one position and says when the opposite advice is right.
- **Start from what happened.** What he saw at work, what broke, what the bill said. The experience comes first and the theory explains it.
- **Short sentences, plain words, contractions.** One idea per paragraph, four sentences at most.
- **Say it once.** Cut the sentence that restates the one before it.
- **Define a term in one clause the first time it appears**, then use it without ceremony.
- **Commas, colons, and periods** do the work an em dash would.
- **Concrete over grand.** "Twelve Lambda invocations per order" beats "significant fan-out". Verbs that describe what the system does beat verbs that sell it.
- **Talk to "you".** Rhetorical questions are welcome as section headings and rare in body text.
- Light humour and a meme up top are part of the voice. One joke per section is plenty.

## Structure

In this order:

1. **Opening image.** A meme or GIF as a Markdown image with real alt text: `![what it shows](url)`.
2. **Hook.** Two short paragraphs. A concrete scene ("Picture this."), then why he is writing about it.
3. **`## TL;DR`** One paragraph, the whole argument in three or four sentences.
4. **Body.** Three to five `##` sections. Headings are questions or plain statements in sentence case ("So what is actually broken with plain HTTP calls?"). Within a section, open each key point with a bold sentence, then explain it. A code block, table, or diagram earns its place by carrying a point prose cannot.
5. **`## Final Thoughts`** The hot take stated plainly, then the case where the reader should ignore it.
6. **Sign-off**, always the last line: `✌️ Stay curious, Keep coding, Peace nerds!`

## Format

- 700 to 1,200 words, a four to six minute read.
- The title is a question or a punchy claim, 60 characters at most. The file name is the title in kebab-case.
- The summary says what the reader walks away with, in 160 characters at most. It is the search snippet and the social card text.
- No H1 in the body; the title renders from frontmatter.
- Inline code for identifiers, service names, and config keys. Fenced blocks carry a language.
- Link the primary source the first time a claim leans on it.

`npm run posts:check` enforces the mechanical parts. The voice is yours to get right: read the draft aloud once, and rewrite any sentence he would not say.
