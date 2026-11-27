---
name: blog-post
description: Take a blog post for 0xadityaa.dev from topic to a reviewed pull request. Use when asked to write, draft, research, schedule, or suggest topics for a blog post, or to act on a "blog:topic-needed" issue.
---

# Blog post

The process is `docs/blog/workflow.md`. Read it first, then work its stages in order. Each stage names when it is done; meet that before starting the next.

1. **Topic.** Find the open `blog:topic-needed` issue (`gh issue list --label blog:topic-needed`). If Aditya has not chosen a topic, suggest three by the rules in `docs/blog/research.md` and stop until he picks.
2. **Research.** Read `docs/blog/research.md` and follow its order of work: prior art, artifact, his inputs, claims, counter-argument, outline. Write `content/research/<slug>.md`.
3. **Angle.** Post the thesis, artifact, format, counter-argument, and open questions on the topic issue. Stop until he confirms and answers.
4. **Draft.** Read `docs/blog/style.md`; the voice is first person, technical, blunt and witty, never weird. Write `content/blog/<slug>.md` with `draft: true`.
5. **Check.** `npm run posts:check && npm run build`. Then find each of the six things `style.md` requires and fix the post until all six are there.
6. **Pull request.** Branch `post/<slug>`, fill in the template's post section, `Closes #<topic issue>`. Report the pull request link and the preview URL of the post.

Stop at the pull request, with a `Publish: YYYY-MM-DD HH:MM` line (Toronto time) in its description. The `Auto-publish` action merges it within an hour of that time and cross-posting follows, with no further step. Aditya can still comment `/publish <date>` to publish early, or label the pull request `hold` to stop it.
