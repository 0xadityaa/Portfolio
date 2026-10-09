---
name: blog-post
description: Take a blog post for 0xadityaa.dev from topic to a reviewed pull request. Use when asked to write, draft, research, schedule, or suggest topics for a blog post, or to act on a "blog:topic-needed" issue.
---

# Blog post

The process is `docs/blog/workflow.md`. Read it first, then work its stages in order. Each stage names when it is done; meet that before starting the next.

1. **Topic.** Find the open `blog:topic-needed` issue (`gh issue list --label blog:topic-needed`). If Aditya has not chosen a topic, suggest three by the rules in `docs/blog/research.md` and stop until he picks.
2. **Research.** Read `docs/blog/research.md`. Write `content/research/<slug>.md`. Put anything only Aditya can answer to him and wait for the answers.
3. **Draft.** Read `docs/blog/style.md` and the two reference posts it names. Write `content/blog/<slug>.md`.
4. **Check.** `npm run posts:check && npm run build`. Then reread the draft against `style.md` section by section and fix what you find.
5. **Pull request.** Branch `post/<slug>`, fill in the template's post section, `Closes #<topic issue>`. Report the pull request link and the preview URL of the post.

Stop at the pull request. Merging is Aditya's approval to publish; scheduling and cross-posting happen on their own after it.
