# Site design and performance

## Design rules

The look is minimal, dark, single column. Changes extend it; they do not restyle it.

- One 672px column (`max-w-2xl`). Dark only. Monochrome: no accent colour.
- Geist for text, Geist Mono for dates and metadata (the `.meta` class).
- Radius: surfaces and images `rounded-lg`, chips and inputs `rounded-md`, the dock and avatar are pills.
- Section headings are small and quiet (`.section-title`). Group with space and hairlines before reaching for a card.
- Tokens are CSS variables in `src/app/globals.css`. Use them through Tailwind (`bg-card`, `text-muted-foreground`), never raw hex.
- Copy is plain and specific, with commas and periods where an em dash would go, and no emoji in the interface.

## What goes where

The home page is a short introduction followed by writing, then projects, then experience. Writing leads because it is the freshest proof of how he thinks. Stack and education live on `/about`. Why: `docs/research/frontier-sites.md`, section 4.

## Performance budget

Every page is rendered to HTML on the server and served from Vercel's CDN, refreshed every 10 minutes (`revalidate = 600`) so a scheduled post appears on time. Keep it that way:

- A page stays a Server Component. `"use client"` is for a leaf that needs state or a browser API (the dock, the filters, copy buttons).
- Reading `cookies()`, `headers()`, or `searchParams` in a page makes it render per request and breaks the budget. Filter on the client instead.
- Animation is CSS (`.fade-in`). The site ships no animation library.
- Images go through `next/image` with real `sizes`. Only the first screen gets `priority`.
- Budget: HTML response under 200ms from the CDN, Lighthouse accessibility and SEO at 100. Check with `curl -w '%{time_starttransfer}\n' -o /dev/null -s <url>` after a deploy.

## Markdown mode

Agents can read any page as Markdown: `<url>.md`, `/index.md` for the home page, or the page URL with `Accept: text/markdown`. `/llms.txt` is the index and `/llms-full.txt` is the whole site. The twins are built in `src/lib/markdown-pages.ts` and routed by the rewrites in `next.config.mjs`. A new page type needs a twin, an entry in `markdownPagePaths`, and a line in `/llms.txt`.
