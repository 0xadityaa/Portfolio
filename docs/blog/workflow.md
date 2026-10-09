# Blog workflow

One post a week, from topic to syndication. Aditya decides at two **gates**; an agent does the work between them. Nothing reaches production or another platform without passing both.

```
topic issue ──▶ [gate 1: topic] ──▶ research ──▶ draft ──▶ pull request ──▶ [gate 2: merge] ──▶ live on publishedAt ──▶ cross-post
```

## 1. Topic (gate 1)

Every Monday the `Weekly blog topic` action opens an issue labelled `blog:topic-needed`. Aditya answers it with a topic, a draft, sources, or a pick from the backlog (issues labelled `blog:topic`).

If he asks for suggestions, propose three using the selection rules in `research.md`, and wait. The topic is settled when he names one in the issue or in chat.

Done when: the issue states the topic and whatever he wants the post built around.

## 2. Research

Follow `research.md`. The output is `content/research/<slug>.md`: the thesis, the outline, every factual claim with its source, and the questions only Aditya can answer.

If the post depends on something only he knows (what happened at work, a number, his opinion), ask in the issue and wait for the answer. A post built around an invented experience is worse than a late post.

Done when: every claim the outline needs is sourced or marked as his, and the open-questions list is empty.

## 3. Draft

Write `content/blog/<slug>.md` to `style.md`. If he supplied a draft, keep his ideas and his wording where it works, and restructure to the format.

Set `publishedAt` to the date it should go live. Default: the coming Thursday. A post is hidden in production until that date and until `draft: true` is removed, so both are safe to merge early.

Done when: `npm run posts:check` passes and you have reread the post once against each section of `style.md`.

## 4. Pull request (gate 2)

Branch `post/<slug>`, one pull request holding the post and its research note. Fill in the post section of the pull request template, link the topic issue with `Closes #N`, and list anything you want him to check. The Vercel preview on the pull request shows the post exactly as it will appear, including scheduled posts and drafts.

Then stop. Review comments come back as changes on the same branch. **The merge is the approval and Aditya makes it.**

## 5. Publish

Nothing to do. After the merge the site re-renders hourly, so the post appears on the blog, in `/rss.xml`, in `/llms.txt`, and at `<url>.md` within an hour of its `publishedAt` time (a date alone means 12:00 UTC, 8am Toronto).

To change the date after merging, edit `publishedAt` in a new pull request. To pull a live post, set `draft: true`.

## 6. Cross-post

The `Cross-post` action runs hourly. Once the post is live it publishes to every platform that has a secret, records each URL in the post's frontmatter, and opens one `crosspost` issue listing the manual platforms. Details and failure handling: `docs/publishing.md`.

## Frontmatter

```yaml
---
title: A question or a claim, 60 characters at most
publishedAt: '2026-10-15'        # or a full ISO time: '2026-10-15T14:00:00Z'
summary: >-
  One or two sentences, 160 characters at most, saying what the reader gets.
tags:                            # 1 to 5, lowercase
  - architecture
draft: true                      # optional; remove to release
image: /images/blog/cover.png    # optional social card override
---
```

`devto_url`, `medium_url`, `substack_url`, and `crosspost_issue` are written by the Cross-post action. Images for a post go in `public/images/blog/` and are referenced as `/images/blog/<file>`.
