# Site design and performance

## Design rules

The look is minimal, dark, single column, mostly text. Changes extend it; they do not restyle it.

- Three pages: home, projects, blog. Posts and project write-ups hang off the last two. A new top-level page needs Aditya's say-so.
- One 672px column. Dark only. Monochrome: the avatar is the only colour.
- Body text is 15px Geist. Page titles are small (`text-xl font-medium`); only a post or project title is large.
- The layout unit is `Row` (`src/components/row.tsx`): mono metadata (a year, a date, a label) in a left column, content on the right, stacked on phones. Lists of anything use it before inventing a new shape.
- Navigation is text in the header: the name links home, then Projects and Blog. No icons, no floating dock.
- Linked rows sit in a `.rows` list and use `.row-link`: hovering one dims the others. No hover backgrounds, no cards. Images appear only on the projects pages.
- Section headings are small and quiet (`.section-title`). Group with space; a hairline only above the footer and around a post header.
- Tokens are CSS variables in `src/app/globals.css`. Use them through Tailwind (`text-muted-foreground`), never raw hex.
- Copy is plain and specific, with commas and periods where an em dash would go, and no emoji in the interface.

## What goes where

The home page is the whole introduction: bio, experience, selected projects, latest writing, stack, education, contact. There is no about page; `/about` redirects home.

## Performance budget

Every page is rendered to HTML on the server and served from Vercel's CDN, refreshed every 10 minutes (`revalidate = 600`) so a scheduled post appears on time. Keep it that way:

- A page stays a Server Component. `"use client"` is for a leaf that needs state or a browser API (the dock, the filters, copy buttons).
- Reading `cookies()`, `headers()`, or `searchParams` in a page makes it render per request and breaks the budget. Filter on the client instead.
- Animation is CSS (`.fade-in`). The site ships no animation library.
- Images go through `next/image` with real `sizes`. Only the first screen gets `priority`.
- Budget: HTML response under 200ms from the CDN, Lighthouse accessibility and SEO at 100. Check with `curl -w '%{time_starttransfer}\n' -o /dev/null -s <url>` after a deploy.

## Markdown mode

Agents can read any page as Markdown: `<url>.md`, `/index.md` for the home page, or the page URL with `Accept: text/markdown`. `/llms.txt` is the index and `/llms-full.txt` is the whole site. The twins are built in `src/lib/markdown-pages.ts` and routed by the rewrites in `next.config.mjs`. A new page type needs a twin, an entry in `markdownPagePaths`, and a line in `/llms.txt`.
