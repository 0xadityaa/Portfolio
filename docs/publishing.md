# Publishing and syndication

The site is the original; every other platform gets a copy with its canonical link pointing home.

| Where | How | Needs |
| --- | --- | --- |
| Site, `/rss.xml`, `/llms.txt`, `<url>.md` | Automatic within an hour of `publishedAt` | Nothing |
| dev.to | `Cross-post` action, API | `DEVTO_API_KEY` secret |
| Medium | API if a token exists, otherwise manual import | `MEDIUM_INTEGRATION_TOKEN` secret (optional) |
| Substack | Manual, from the checklist issue | A Substack publication |

## How the Cross-post action decides

`scripts/crosspost.mjs` runs hourly. A post is due on a platform when it is not a draft, its `publishedAt` has passed, it returns 200 on the site, it was published on or after `CROSSPOST_SINCE` (default 2026-10-01, so the older archive is left alone), and its frontmatter has no URL for that platform.

After publishing it writes the URL into the post's frontmatter and commits to `main`. That field is the record: a platform with a URL is never posted to again. Platforms that cannot be automated go into one issue per post, labelled `crosspost`, with the exact steps; `crosspost_issue` in the frontmatter stops it being opened twice.

To try it safely: Actions, Cross-post, Run workflow, leave "dry run" ticked. Locally: `npm run crosspost -- --dry-run`.

To syndicate older posts, run the workflow with `since` set to an earlier date. To keep one post off a platform, put any placeholder in its field, for example `devto_url: skip`.

## Secrets

Set with the GitHub CLI so the value never lands in a file or a chat:

```bash
gh secret set DEVTO_API_KEY
```

- **`DEVTO_API_KEY`**: dev.to, Settings, Extensions, "DEV Community API Keys", generate.
- **`MEDIUM_INTEGRATION_TOKEN`**: Medium, Settings, Security and apps, "Integration tokens". Medium stopped offering this to new accounts; if the section is not there, Medium stays a manual import and needs no secret.
- **`CLAUDE_CODE_OAUTH_TOKEN`**: lets `@claude` work in issues and pull requests. Run `/install-github-app` inside Claude Code in this repo; it installs the app and saves the secret. (Or `claude setup-token`, then `gh secret set CLAUDE_CODE_OAUTH_TOKEN`.)
- **`GITHUB_TOKEN`** (Vercel env var, already set): GitHub stats and the repo list on the site.

## When a run fails

The run log names the platform and prints its response. A failed platform is retried on the next hourly run; the ones that succeeded are already recorded and are skipped.

- 401 or 403: the secret is wrong or expired. Regenerate and set it again.
- 422 from dev.to: usually a duplicate title or canonical URL, meaning the article exists. Find it on dev.to and add its URL to the frontmatter by hand.
- The post is "not live on the site yet": the page has not re-rendered. It resolves itself within the hour.

## Adding a platform

1. Add `scripts/platforms/<name>.mjs` exporting `{ name, field, secret, publish(post, secret) }`. `publish` returns the public URL and sets the canonical link to `post.url`. For a platform with no API, export `{ name, field, manual(post) }` and it joins the checklist.
2. List it in `scripts/platforms/index.mjs`.
3. Pass its secret through in `.github/workflows/crosspost.yml` and document it above.
4. Dry-run before merging.
