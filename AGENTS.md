# Portfolio

Aditya Negandhi's personal site and blog, live at https://www.0xadityaa.dev. Next.js App Router on Vercel. `main` is production: every merge deploys.

GitHub is the whole platform. Content is Markdown in the repo, review happens in pull requests, scheduling and syndication run in GitHub Actions. There is no CMS and no database.

## Working here

- Install with `npm install --force` (the React 19 peer ranges need it; Vercel does the same).
- Before opening a pull request, run `npm run posts:check && npm run typecheck && npm run build`. CI runs the same three.
- Work on a branch and open a pull request. Merging is Aditya's call: a merge is a production deploy, and for a blog post it is his approval to publish.
- Secrets live in GitHub Actions secrets and Vercel env vars. Refer to them by name only.

## Where things are

- `src/data/resume.tsx`: everything about Aditya shown on the site (bio, jobs, projects, stack). Edit facts here, not in page components. Add only facts he has given you.
- `content/blog/<slug>.md`: blog posts. The file name is the URL.
- `content/research/<slug>.md`: the research note behind each post.
- `src/lib/markdown-pages.ts`: the Markdown twin of every page, served at `<url>.md` for agents. When a page gains or loses content, update its twin in the same change.
- `scripts/crosspost.mjs` and `scripts/platforms/`: syndication to dev.to, Medium, Substack.

## Read before you start

- Writing, editing, or scheduling a blog post: `docs/blog/workflow.md`. It is the process, with the approval gates.
- Researching a post, or picking topics: `docs/blog/research.md`.
- Any prose that will be published under Aditya's name: `docs/blog/style.md`.
- Cross-posting, secrets, adding a platform, or a failed Cross-post run: `docs/publishing.md`.
- Changing how the site looks or renders: `docs/site.md` for the design rules and the performance budget.
