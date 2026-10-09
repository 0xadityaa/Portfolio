# Blog style guide

How posts on 0xadityaa.dev are written. Derived from the published posts
(start with `going-event-driven-read-the-bill-first` and
`microservices-do-you-really-need-them`, they are the current reference).

## Voice

- First person, conversational, a little cheeky. Write like you are explaining
  it to a teammate over coffee, not presenting at a conference.
- Opinionated and practical. Every post takes a position ("most teams go
  event-driven too early") and backs it with something that actually happened.
- Lead with lived experience: what I saw at work, what broke, what the bill
  said. No invented anecdotes, numbers, or quotes. If a claim comes from a
  source, link it.
- Short sentences. Plain words. Contractions are fine.
- No em-dashes. No filler like "in today's fast-paced world", "let's dive in",
  "game-changer", "unlock", "leverage".
- Define jargon the first time it shows up, in one clause.

## Structure

1. **Frontmatter**
   ```yaml
   ---
   title: A question or a punchy claim, under 60 characters
   publishedAt: 'YYYY-MM-DD'
   summary: >-
     One or two sentences, under 160 characters, that say what the reader gets.
   tags:
     - three
     - to-five
     - lowercase
   publish: false   # flipped to true only after Aditya approves
   ---
   ```
2. **Opening meme or GIF** using the `<Image ... />` block the other posts use,
   with real alt text.
3. **Hook**: two short paragraphs. A concrete scene ("Picture this."), then why
   I am writing about it.
4. **`## TL;DR`**: one paragraph, the whole argument in 3 to 4 sentences.
5. **Body**: 3 to 5 `##` sections. Headings are questions or plain statements
   in sentence case ("So what is actually broken with plain HTTP calls?").
   Inside a section, lead each key point with a bold sentence, then explain it.
   Use code blocks, tables, or a diagram only when they carry the point.
6. **`## Final Thoughts`**: the hot take, stated plainly, plus when the opposite
   advice is right.
7. **Sign-off**, always the last line:
   `✌️ Stay curious, Keep coding, Peace nerds!`

## Length and format

- 700 to 1,200 words. A 4 to 6 minute read.
- Slug is the kebab-case title, lowercase, no punctuation.
- Inline code for identifiers, service names, and patterns.
- Images go in the Obsidian vault next to the note and are embedded with
  `![[name.png]]`.

## Where posts live

- Source of truth: the Obsidian vault at `obsidian/<slug>.md`.
- `scripts/process-obsidian.mjs` turns published notes into `content/<slug>.mdx`.
  Never hand-edit a generated file.
- Merging to `main` publishes the post on the site and in `/rss.xml`.
