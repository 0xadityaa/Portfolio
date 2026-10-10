# Blog workflow

One post a week, from topic to syndication. Aditya decides at three **gates**; an agent does the work between them. Nothing reaches production or another platform without passing all three.

```
topic issue ─▶ [gate 1: topic] ─▶ research ─▶ [gate 2: angle] ─▶ draft ─▶ pull request ─▶ [gate 3: /publish <date>] ─▶ live at that time ─▶ cross-post
```

## 1. Topic (gate 1)

Every Monday the `Weekly blog topic` action opens an issue labelled `blog:topic-needed`. Aditya answers it with a topic, a draft, sources, or a pick from the backlog (issues labelled `blog:topic`).

If he asks for suggestions, propose three using the selection rules in `research.md`, and wait. The topic is settled when he names one in the issue or in chat.

Done when: the issue states the topic and whatever he wants the post built around.

## 2. Research and angle (gate 2)

Follow `research.md` in its order of work. The output is `content/research/<slug>.md`.

Then post the angle on the topic issue for him to confirm, in a few lines: the thesis, the artifact, the format (note or essay), the strongest counter-argument, and the open questions only he can answer. A post built around an invented experience is worse than a late post, so wait for his answers.

Done when: he has confirmed the angle, the open-questions list is empty, and every claim the outline needs is sourced or marked as his.

## 3. Draft

Write `content/blog/<slug>.md` to `style.md`. If he supplied a draft, keep his ideas and his wording where it works.

Set `draft: true` and a placeholder `publishedAt` of today. The real publish time is set at approval, in stage 4.

Done when: `npm run posts:check` passes and you can point to each of the six things `style.md` says every post has.

## 4. Pull request (gate 3)

Branch `post/<slug>`, one pull request holding the post and its research note. Fill in the post section of the pull request template, link the topic issue with `Closes #N`, say where each of the six required things is in the post, and list anything you want him to check. The Vercel preview on the pull request shows the post exactly as it will appear, including scheduled posts and drafts.

Then stop. Review comments come back as changes on the same branch. **Approval is Aditya's and he gives it with a comment on the pull request:**

```
/publish                     the next default slot
/publish 2026-10-15          that day at the default time, Toronto
/publish 2026-10-15 14:30    that day and time, Toronto
/publish now
```

The `Publish` action writes that time into `publishedAt`, removes `draft`, merges, and replies with the exact go-live time. If he gives you a date in chat instead, post that comment for him only when he has said the draft is final. The default slot and the reason for it are in `scripts/lib/schedule.mjs` and `docs/research/distribution.md`.

## 5. Publish

Nothing to do. Pages re-render every 10 minutes, so the post appears on the blog, in `/rss.xml`, in `/llms.txt`, and at `<url>.md` within 10 minutes of its `publishedAt`.

To change the time after merging, edit `publishedAt` in a new pull request. To pull a live post, set `draft: true`.

## 6. Cross-post

The `Cross-post` action runs every 15 minutes. Once the post is live it publishes to every platform that has a secret, records each URL in the post's frontmatter, and opens one `crosspost` issue with a ready-made link for each manual platform. Details and failure handling: `docs/publishing.md`.

## Frontmatter

```yaml
---
title: A claim or a question, 60 characters at most
publishedAt: '2026-10-15T13:00:00Z' # set by /publish; a bare date means 12:00 UTC
summary: >-
  160 characters at most, stating what the reader walks away with.
tags:                            # 1 to 5, lowercase
  - architecture
draft: true                      # optional; cleared by /publish
preview: true                    # optional; show on the site before publishedAt (feeds and cross-posting still wait)
updated: '2026-11-02'            # optional; date of the last substantive edit
image: /images/blog/cover.png    # optional social card override
---
```

`devto_url`, `medium_url`, `substack_url`, `hackernews_url`, and `crosspost_issue` are written by the Cross-post action. Images for a post go in `public/images/blog/` and are referenced as `/images/blog/<file>`.
