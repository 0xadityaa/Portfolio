# X playbook: how posts get ranked, what pays, and the formats we use

All sources checked on **2026-11-15**. "Primary" means X's own code, help pages, or posts by X staff. Everything else is labelled secondary. Where a page could not be opened, that's stated.

This doc sets the format for every `content/research/<slug>/social.md`. The goal is reach with engineers who'd read the blog, not reach for its own sake: a viral post that brings the wrong audience earns little and converts nobody (see "What pays" below).

## Short answers

| Question | Answer |
| --- | --- |
| What does the ranker reward? | Conversation. In X's published weights a reply, a quote and a DM share are each worth about 7 likes, a follow from the post about 6, and a reply between mutual follows about 21. |
| What does it punish? | Anything that makes people back away. "Not interested" is about −75 likes, a mute −83, a report −330. One annoyed reader can cancel dozens of likes. |
| Bookmarks? | Not among the weights in the published code. Don't design for them. |
| Links in posts? | X says it stopped penalising links (Musk, 29 July 2026). A 28k-post dataset finds no penalty for the median account. Earlier data found non-Premium link posts dead, so this depends on Premium. |
| Format? | Text and image posts lead on engagement; the gap between them is small. Premium matters far more than format. |
| Threads or Articles? | Both. The thread is the reach play. The X Article is the dwell-time play and the monetisation play (original long-form). |
| What pays? | Original Content Rewards, which replaced revenue sharing in September 2026. Premium is required and replies don't count toward the impressions bar. Check the exact thresholds in Creator Studio before relying on them. |

---

## 1. How the For You ranker works (primary)

X open-sourced its Grok-based recommender in January 2026 and updates it publicly. Source: https://github.com/xai-org/x-algorithm (README; latest dated update 26 October 2026).

- **Candidates.** In-network posts come from accounts you follow (Thunder). Out-of-network posts come from embedding retrieval (Phoenix), SimClusters and a popular-posts pool. Out-of-network posts get a discount factor below 1. Same source.
- **Scoring.** Phoenix predicts the probability of each action for each viewer, and the final score is `Σ weight_i × P(action_i)`. The weights scale predicted probabilities, not raw counts. Same source.
- **Weights.** From `home-mixer/params/param.rs` (https://github.com/xai-org/x-algorithm/blob/main/home-mixer/params/param.rs, read 2026-11-15):

| Action | Weight | In likes |
| --- | ---: | ---: |
| Reply between mutual follows (boost) | 15.0 | 21 |
| Reply | 5.0 | 7 |
| Quote | 5.0 | 7 |
| Share via DM | 5.0 | 7 |
| Follow author | 4.0 | 5.6 |
| Share | 2.118 | 3 |
| Repost | 1.0 | 1.4 |
| Like | 0.708 | 1 |
| Continuous click dwell time | 0.385 | |
| Click | 0.274 | |
| Open link | 0.2 | |
| Dwell | 0.05 | |
| Photo expand | 0.05 | |
| Not dwelled | −0.02 | |
| Block author | −31.2 | −44 |
| Not interested | −53.07 | −75 |
| Mute author | −58.8 | −83 |
| Report | −234.0 | −330 |

- **Other adjustments.** Later posts from the same author in one feed decay (author diversity). Authors below an impression threshold get a boost toward a target position (new-author boost). Posts older than 48 hours are filtered out of ranking. Source: the README.
- **What I couldn't see.** The out-of-network discount value, the diversity decay and the new-author threshold weren't in the visible part of `param.rs`. The Grok content-understanding layer isn't fully public.

**What it means for us:**
1. Every post should give an engineer a reason to *reply*: a number they'd argue with, a choice they've made differently, a question only practitioners can answer. One real reply beats seven likes.
2. Make it something people send to a colleague (DM share, 7 likes) or quote with their own take (7 likes).
3. Don't do anything that earns a mute: no bait ("RT if", "agree?"), no rage, no inflated numbers, no tagging big accounts for attention, no posting five times in an hour.
4. Reply to repliers fast. Replies between mutual follows carry the largest positive weight in the file, and the post is only ranked for 48 hours.

## 2. Links (primary statements, secondary data)

- X's head of product, Nikita Bier, posted "you do not need to put the links in replies anymore" on 28 July 2026. Elon Musk replied to Paul Graham on 29 July 2026 that X hasn't penalised links "for over a year". As reported by PPC Land, 30 July 2026: https://ppc.land/x-drops-year-old-link-penalty-musk-tells-zuckerberg-on-platform/ (secondary report of primary posts).
- OpenTweet compared 28,124 posts (1 Jan to 10 Oct 2026) within the same accounts. The median account's link posts got 1.05x the impressions of its non-link posts, and 1.07x after 29 July. Most accounts were small, and the study is observational. Source: https://opentweet.io/answers/does-x-penalize-links-2026 (secondary, method stated).
- Buffer analysed 18.8M posts from 71,000 accounts as of August 2025. Link posts from non-Premium accounts had a median engagement of 0% from March 2025, against ~0.28% for Premium. Source: https://buffer.com/resources/links-on-x/ (secondary, published 14 Oct 2025, so it predates X's July 2026 statement).

**Rule:** with Premium, a link in the last post of a thread is fine. Never lead with a link: the first post has to work on its own, because that's what gets ranked and shared.

## 3. Formats (secondary data)

- Buffer's 2026 report covers 52M+ posts across 10 platforms. On X, median engagement is text 3.56%, images 3.40%, video 2.96%, links 2.25%, and the gap between text and images is "razor-thin". Source: https://buffer.com/resources/state-of-social-media-engagement-2026/
- Buffer's Premium study puts Premium accounts at about 10x the reach of regular ones. Source: https://buffer.com/resources/x-premium-review/

**Rule:** text first. Attach one image only when it *is* the finding: the chart, a table or a terminal screenshot from the artifact. Never decorative. No video for now.

## 4. What pays: Original Content Rewards

- X stopped enrolling new creators in Creator Revenue Sharing on 7 August 2026 and retired it on 7 September 2026, replacing it with the Original Content Rewards Program. Source: X's help page, https://help.x.com/en/using-x/original-content-rewards (returned 403 to an automated fetch; content seen through search snippets), and coverage at https://www.tubefilter.com/2026/08/11/x-monetization-original-content-rewards-program-creators/ and https://engadget.com/2232981/x-replacing-revenue-sharing-with-original-content-rewards-program
- **Original** means content you made yourself that reflects your own voice, perspective or expertise. Reuploads and misleading posts don't qualify. Same sources.
- **Thresholds.** Third-party guides say 500K Home Timeline impressions from verified users over 90 days, with replies excluded, plus Premium. They disagree on details, and X publishes no per-impression rate. Treat this as **unverified until checked in Creator Studio**. Secondary: https://www.tech2geek.net/x-original-content-rewards-program-eligibility-payouts-and-rules/

**What it means for us:** our edge is that every post carries a number we measured ourselves. That's the definition of original. Payouts come from impressions on our own posts and Articles, not from replies to others. So replies to bigger accounts are a follower-growth tactic, and our own posts are the payout engine.

## 5. The format for every social.md

Five sections, in this order. Write to the reader who builds with LLMs for a living.

### `## Hook`
One standalone post, ≤280 characters, the strongest single finding, posted on blog day at 09:30. It has to work with no context and no link.

Pick a shape:
- **The measured surprise.** "I measured X. Expected A. Got B." Lead with the number.
- **The default nobody chose.** "Most RAG stacks use 512-token chunks. Nobody I can find measured it. So I did:"
- **The bill.** A dollar figure at a volume the reader recognises.
- **The flip.** "Caching saves 88%. At 1 request an hour it costs 14% more."

Then one line that invites a reply only a practitioner can give. A real question ("What chunk size are you running, and who picked it?"), not "Thoughts?".

Attach the post's chart only if it shows the finding at a glance. Note it as `[image: public/images/blog/<file>.svg]`; it's converted to PNG when scheduling.

### `## Thread`
5–7 posts, `---` between them.
1. Post 1 is the hook again, rewritten to promise what the thread shows ("Here's what moved the number, and what didn't:").
2. Posts 2 to n−1 carry one number or idea each, in order of surprise, not in the order the blog uses. Plain claims and short sentences; a line break to set off the number is fine.
3. One post states the strongest objection fairly (from the post's limits). Engineers respect it, and it invites quotes.
4. The last post gives the rule of thumb plus the link: "Full write-up, code and raw output:" + URL.
- No "🧵", no "1/", no emoji, no hashtags.

### `## Singles`
Exactly 5 standalone posts across the week, each with a different shape from the list above, plus:
- **The rule of thumb.** "If X, do Y. If not, don't bother."
- **Myth vs measured.** "Common advice: A. What I measured: B."
- **The contrarian line.** A claim from the post that a reasonable engineer would push back on, stated with its number.

Each must work alone and end on the implication, not on "So …". No links.

### `## Reply prompts`
3 questions to use when replying to bigger accounts' posts on the same topic that week. Each adds the post's number to someone else's conversation ("We measured this: at 100 examples a real 3-point gain looked significant 7% of the time."). These grow followers; they don't count for payouts.

### `## Substack Note`
One post, 80–160 words, conversational, opening on the surprising number, ending with the link.

## 6. Weekly schedule (Toronto time)

| Day | Post |
| --- | --- |
| Tue 09:00 | Blog goes live |
| Tue 09:30 | Hook |
| Tue 12:00 | Thread |
| Wed 18:00 | Single 1 |
| Thu 09:00 | X Article (the full post) |
| Fri 09:00 | Single 2 |
| Sat 10:00 | Single 3 |
| Sun 10:00 | Single 4 |
| Mon 18:00 | Single 5 |

For the first hour after the hook and the thread, reply to every reply.

## 7. What this doc doesn't know

- None of these rules has been tested on this account yet. After four weeks, compare impressions, replies and follows per format in X's analytics and revise this doc.
- The weights change. X says it updates the published model every four weeks. Re-read `param.rs` before relying on a number.
- The payout thresholds above are unverified. Read Creator Studio.
