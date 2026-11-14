# Publishing and syndication

The site is the original; every other platform gets a copy with its canonical link pointing home.

| Where | How | Needs |
| --- | --- | --- |
| Site, `/rss.xml`, `/llms.txt`, `<url>.md` | Automatic within 10 minutes of `publishedAt` | Nothing |
| dev.to | `Cross-post` action, API | `DEVTO_API_KEY` secret (set) |
| Medium | Manual: "Import a story" link in the checklist | A Medium account |
| Substack | Manual, from the checklist | A Substack publication |
| Hacker News | Manual and selective: prefilled submit link in the checklist | An HN account |
| X, Substack Notes | Typefully drafts, cut from the post (see "Social posts") | `typefully` skill, API key |

Why three of these are manual, with sources, is in `docs/research/distribution.md`. In short: Medium archived its API and issues no new tokens, and its rules forbid scripted access to the website; Substack has no publishing API; Hacker News has a read-only API and asks people to submit by hand. Each of these is a deliberate stop, so route around them only with a supported API.

The channels that matter for now are X, Medium and Substack. LinkedIn is deliberately off the plan; Bluesky and Mastodon have free APIs if that changes.

## Social posts (Typefully)

Short-form posts on X and Substack Notes go through Typefully, drafted by an agent with the `typefully` skill (`.claude/skills/typefully/`, vendored from github.com/typefully/agent-skills; update by re-copying `skills/typefully/` from that repository). Account: social set `364514` (@0xadityaa), saved as the default.

- Each social post is a cut of a published blog post and links to it on the site, so the site stays the original.
- `docs/blog/style.md` applies: these go out under Aditya's name. Every post carries something real from the essay: a number, a table, a diagram, a code diff. No engagement bait.
- What to cut from: the 2026 posts and anything newer. The 2024 to early-2025 explainers (Big O, JS internals, hoisting, spell checker, JSON parser, What are LLMs) stay on the site and are not turned into social posts.
- The weekly shape: the essay as an X Article (`x_article`, its own draft, since X Articles can't share a draft), then single posts or short threads across the following days. A Substack Note rides in the same draft as its X post, as a single post (Notes take no threads).
- Agents create drafts and may `--plan` them onto a date. Scheduling for real (`--schedule`) or publishing needs Aditya's explicit yes for that draft, the same gate as `/publish`.
- Typefully's Substack support is Notes only. Newsletter issues are still the manual checklist above.
- Check `social-sets:get` for `publishing_quota` before planning a week: the Free plan allows 10 posts a month, and two a day needs the Creator plan.

The key: generate one at https://typefully.com/?settings=api and run `.claude/skills/typefully/scripts/typefully.js setup`, choosing the global location so the key lands in `~/.config/typefully/`, outside the repo. `.typefully/` is gitignored in case the local option is picked. For GitHub Actions later: `gh secret set TYPEFULLY_API_KEY`.

## How the Cross-post action decides

`scripts/crosspost.mjs` runs hourly, at seven past. A post is due on a platform when it is not a draft, its `publishedAt` has passed, it returns 200 on the site, it was published on or after `CROSSPOST_SINCE` (default 2026-10-01, so the older archive is left alone), and its frontmatter has no URL for that platform.

After publishing it writes the URL into the post's frontmatter and commits to `main`. That field is the record: a platform with a URL is never posted to again. Platforms that cannot be automated go into one issue per run, labelled `crosspost`, with the exact steps for each post; `crosspost_issue` in the frontmatter stops it being opened twice.

A backlog drains slowly on purpose: at most `CROSSPOST_MAX` API publishes per run (default 1), oldest post first, and a platform that answers with an error is left alone until the next run. dev.to rate-limits after two posts in quick succession, so twelve posts take about three hours.

To try it safely: Actions, Cross-post, Run workflow, leave "dry run" ticked. Locally: `npm run crosspost -- --dry-run`.

`CROSSPOST_SINCE` and `CROSSPOST_MAX` are repository variables (Settings, Secrets and variables, Actions, Variables). `CROSSPOST_SINCE` is set to 2024-01-01 so the whole archive is syndicated. To keep one post off a platform, put any placeholder in its field, for example `devto_url: skip`.

## When posts go out

Aditya sets the time when he approves: `/publish <date>` on the pull request (`docs/blog/workflow.md`, stage 4). With no date it takes the default slot, Tuesday 09:00 Toronto time, defined in `scripts/lib/schedule.mjs`. The evidence for that slot is weak and says so; revisit it against the site's own analytics after a dozen posts.

## After rewriting a published post

The Cross-post action only publishes; it never edits a copy that already exists. When a post that has a `devto_url` changes, run the **Update dev.to copies** workflow by hand (`gh workflow run update-devto.yml -f dry_run=false`). It pushes the current title, summary, tags and body to each existing dev.to article. Medium and Substack copies are edited by hand.

## The GitHub profile README

The "Writing" list on github.com/0xadityaa is rewritten from `/rss.xml` by a workflow in the profile repository (`0xadityaa/0xadityaa`, `.github/workflows/latest-posts.yml`). It runs hourly, so a new post shows up there within the hour with nothing to configure.

A workflow in this repository cannot write to another repository with its built-in token. To refresh the profile the moment a post is cross-posted, add a `PROFILE_REPO_TOKEN` secret here: a fine-grained personal access token limited to the `0xadityaa/0xadityaa` repository with "Contents: read and write". The Cross-post action then triggers the profile workflow directly.

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
- 429 from dev.to: rate limited. Expected while a backlog drains; the run still passes and the post goes out on a later run.
- 422 from dev.to: usually a duplicate title or canonical URL, meaning the article exists. Find it on dev.to and add its URL to the frontmatter by hand.
- The post is "not live on the site yet": the page has not re-rendered. It resolves itself within 10 minutes.

## Adding a platform

1. Add `scripts/platforms/<name>.mjs` exporting `{ name, field, secret, publish(post, secret) }`. `publish` returns the public URL and sets the canonical link to `post.url`. For a platform with no API, export `{ name, field, manual(post) }` and it joins the checklist.
2. List it in `scripts/platforms/index.mjs`.
3. Pass its secret through in `.github/workflows/crosspost.yml` and document it above.
4. Dry-run before merging.
