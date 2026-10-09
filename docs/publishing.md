# Publishing and syndication

The site is the original; every other platform gets a copy with its canonical link pointing home.

| Where | How | Needs |
| --- | --- | --- |
| Site, `/rss.xml`, `/llms.txt`, `<url>.md` | Automatic within 10 minutes of `publishedAt` | Nothing |
| dev.to | `Cross-post` action, API | `DEVTO_API_KEY` secret (set) |
| Medium | Manual: "Import a story" link in the checklist | A Medium account |
| Substack | Manual, from the checklist | A Substack publication |
| Hacker News | Manual and selective: prefilled submit link in the checklist | An HN account |

Why three of these are manual, with sources, is in `docs/research/distribution.md`. In short: Medium archived its API and issues no new tokens, and its rules forbid scripted access to the website; Substack has no publishing API; Hacker News has a read-only API and asks people to submit by hand. Each of these is a deliberate stop, so route around them only with a supported API.

Free APIs that could be added next: Bluesky, Mastodon, LinkedIn.

## How the Cross-post action decides

`scripts/crosspost.mjs` runs every 15 minutes. A post is due on a platform when it is not a draft, its `publishedAt` has passed, it returns 200 on the site, it was published on or after `CROSSPOST_SINCE` (default 2026-10-01, so the older archive is left alone), and its frontmatter has no URL for that platform.

After publishing it writes the URL into the post's frontmatter and commits to `main`. That field is the record: a platform with a URL is never posted to again. Platforms that cannot be automated go into one issue per post, labelled `crosspost`, with the exact steps; `crosspost_issue` in the frontmatter stops it being opened twice.

To try it safely: Actions, Cross-post, Run workflow, leave "dry run" ticked. Locally: `npm run crosspost -- --dry-run`.

To syndicate older posts, run the workflow with `since` set to an earlier date. To keep one post off a platform, put any placeholder in its field, for example `devto_url: skip`.

## When posts go out

Aditya sets the time when he approves: `/publish <date>` on the pull request (`docs/blog/workflow.md`, stage 4). With no date it takes the default slot, Tuesday 09:00 Toronto time, defined in `scripts/lib/schedule.mjs`. The evidence for that slot is weak and says so; revisit it against the site's own analytics after a dozen posts.

## Secrets

Set with the GitHub CLI so the value never lands in a file or a chat:

```bash
gh secret set DEVTO_API_KEY
```

- **`DEVTO_API_KEY`**: dev.to, Settings, Extensions, "DEV Community API Keys", generate.
- **`MEDIUM_INTEGRATION_TOKEN`**: only if the account already holds a token from before Medium stopped issuing them. With it set, Medium publishes by API; without it, Medium stays in the checklist.
- **`CLAUDE_CODE_OAUTH_TOKEN`**: lets `@claude` work in issues and pull requests. Run `/install-github-app` inside Claude Code in this repo; it installs the app and saves the secret. (Or `claude setup-token`, then `gh secret set CLAUDE_CODE_OAUTH_TOKEN`.)
- **`GITHUB_TOKEN`** (Vercel env var, already set): GitHub stats and the repo list on the site.

## When a run fails

The run log names the platform and prints its response. A failed platform is retried on the next run; the ones that succeeded are already recorded and are skipped.

- 401 or 403: the secret is wrong or expired. Regenerate and set it again.
- 422 from dev.to: usually a duplicate title or canonical URL, meaning the article exists. Find it on dev.to and add its URL to the frontmatter by hand.
- The post is "not live on the site yet": the page has not re-rendered. It resolves itself within 10 minutes.

## Adding a platform

1. Add `scripts/platforms/<name>.mjs` exporting `{ name, field, secret, publish(post, secret) }`. `publish` returns the public URL and sets the canonical link to `post.url`. For a platform with no API, export `{ name, field, manual(post) }` and it joins the checklist.
2. List it in `scripts/platforms/index.mjs`.
3. Pass its secret through in `.github/workflows/crosspost.yml` and document it above.
4. Dry-run before merging.
