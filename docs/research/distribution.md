# Distribution research: what can be syndicated automatically, and when to publish

All sources checked on **2026-10-09**. "Primary" means the platform's own docs, help center, policy pages, or official source repository. Anything else is labelled secondary. Where a page could not be opened, that is stated rather than papered over.

## Short answers

| Question | Answer |
| --- | --- |
| Medium by API | Only with an integration token created before 2025. No new tokens are issued. Otherwise it is a manual import. |
| Hacker News by API | No. The official API is read-only, and the guidelines ask people not to automate posting. Use a prefilled submit link and click it yourself. |
| Substack by API | No publishing API, no email-to-post. One-off RSS/URL import exists, in the dashboard only. |
| dev.to scheduling | Supported in the Forem code through `published_at`, but not documented in the API spec. |
| Worth adding | Bluesky and Mastodon (free, simple). LinkedIn (free, OAuth upkeep). Hashnode now needs a paid Pro plan. X charges per post. |
| When to publish | Tuesday, 09:00 America/Toronto (13:00 UTC in summer). Low-to-moderate confidence; the measured effects are small. |

---

## 1. Medium

### Official API: frozen, no new tokens

- The official docs repo `Medium/medium-api-docs` is **archived**. GitHub shows it was archived by the owner on 2 March 2023 and is read-only; the GitHub API reports `"archived": true`, last push 2023-03-02. Source: https://github.com/Medium/medium-api-docs and https://api.github.com/repos/Medium/medium-api-docs
- The README opens with a warning: "The Medium API is no longer supported." It adds that Medium does not recommend using it. Source: https://github.com/Medium/medium-api-docs/blob/master/README.md
- The README still documents `POST https://api.medium.com/v1/users/{authorId}/posts` with `contentFormat` (`html` or `markdown`), `canonicalUrl`, and `publishStatus` (`public`, `draft`, `unlisted`). Same source.
- Medium's help center page "API/Importing" states that Medium will not issue new integration tokens and will not allow new integrations, and that **all existing tokens continue to work**. It then points writers to signing in to publish, or to importing an existing webpage. Source: https://help.medium.com/hc/en-us/articles/213480228-API-Importing
- The help center gives no cut-off date. A third-party connector vendor (StackOne) says issuance stopped on 1 January 2025. **Secondary, not confirmed by Medium.** Source: https://docs.stackone.com/connectors/medium/guides/link-account/integration-token

**What this means:** if the Medium account already has an integration token (Settings, then "Security and apps", then "Integration tokens"), the old API still accepts posts with a canonical URL, on an unsupported basis. If the section is absent or empty, there is no API path.

### "Import a story"

- Primary: the import tool backdates the story to the original date and adds a canonical link automatically. Steps are Stories, then "Import a story", paste the URL, Import, then edit and Publish. The result is a draft that a person publishes. Source: https://help.medium.com/hc/en-us/articles/214550207-Importing-a-post-to-Medium
- Primary: Medium uses a third-party service to fetch the page, and imports can fail or come back blank, in which case the fallback is copy-paste plus "Customize canonical link". Source: https://help.medium.com/hc/en-us/articles/360033931713-Trouble-importing-content-using-the-import-tool
- **Query parameter: not verified.** `https://medium.com/p/import?url=...` redirects a signed-out visitor to the sign-in page with the full URL preserved in the `redirect` parameter, so the query string survives login. Whether the import form then pre-fills from it could not be tested without signing in, and no Medium document mentions such a parameter. Treat prefill as unconfirmed; test it once by hand while signed in.
- The help article does not name the `medium.com/p/import` address at all; it describes the menu path only.

### RSS ingestion and email-to-Medium

- **No automatic RSS ingestion.** The help center's "API/Importing" page lists RSS and IFTTT only under "Outbound" (content leaving Medium). The only inbound options it lists are signing in, the mobile apps, and single-page import. Source: https://help.medium.com/hc/en-us/articles/213480228-API-Importing
- **No email-to-post feature.** A help-center search for posting by email returns nothing of the kind. The one "Email Import" result is the terms for importing subscriber email addresses, not stories. Sources: https://help.medium.com/hc/en-us/search?query=email+to+medium+post+by+email and https://help.medium.com/hc/en-us/articles/4412585313431-Email-Import-Terms-of-Use

### The RapidAPI "Medium API" (150 free requests a month)

- This is **mediumapi.com**, which labels itself "Unofficial". Its free BASIC plan is 150 calls per month; paid plans start at $10 a month. Source: https://mediumapi.com/
- It is **read-only**. Its own site describes it as a way to fetch content from Medium and says any tool that supports GET calls will work. Its documentation lists only retrieval paths: `/user/{user_id}`, `/user/{user_id}/articles`, `/article/{article_id}`, `/article/{article_id}/markdown`, `/publication/{publication_id}`, `/list/{list_id}`, `/search/...`, and similar. There is no create, publish, or update endpoint. Source: https://docs.mediumapi.com/
- **It cannot publish a post.** It is useful only for reading stats or content back out.

### Third-party tools and MCP servers

| Tool | Can it create a Medium post today? | Credential | Source |
| --- | --- | --- | --- |
| n8n | Node still exists, but n8n's docs say Medium stopped supporting the API and new integrations cannot be set up | Existing integration token, or OAuth2 client (no longer granted) | https://docs.n8n.io/integrations/builtin/credentials/medium/ (primary for n8n) |
| IFTTT | No. The Medium service lists zero actions; triggers and queries only | Medium account connection | https://ifttt.com/medium (primary for IFTTT) |
| Zapier | Not verified. The app directory page returned 404 on the date checked | Historically an integration token | https://zapier.com/apps/medium/integrations |
| Make | Not verified. The integration page returned 404 on the date checked | Historically an integration token | https://www.make.com/en/integrations/medium |
| `designly1/mcp-medium` (MCP) | Only with an existing token; it wraps the official API | `MEDIUM_TOKEN` integration token | https://glama.ai/mcp/servers/@designly1/mcp-medium (secondary listing; code not reviewed) |
| `jackyckma/medium-mcp-server` (MCP) | Yes, by driving a logged-in browser with Playwright | Stored browser session | https://glama.ai/mcp/servers/@jackyckma/medium-mcp-server (secondary listing; code not reviewed) |
| StackOne hosted connector | Only for accounts with a pre-2025 token, by its own docs | Existing integration token | https://docs.stackone.com/connectors/medium/guides/link-account/integration-token (secondary) |

Every token-based tool has the same dependency: an integration token that Medium no longer issues. None of them is a way around that.

### Would browser automation with a stored session break Medium's terms?

**Yes.** Medium's Terms of Service bind users to the Medium Rules ("Your use of the Services must comply with our Rules"). Source: https://policy.medium.com/medium-terms-of-service-9db0094a1e0f (effective 1 September 2020).

The Medium Rules, under "Prohibitions on Use of the Services", item (5), forbid users, without Medium's written consent, to:

> "use any software, script, robot, spider or other automatic device, process or means"

to access the Services for any purpose. Source: https://help.medium.com/hc/en-us/articles/213477928-Medium-Rules

The same page also lists, among disallowed behaviours, registering accounts or posting content automatically, systematically, or programmatically. Both clauses cover a Playwright script that logs in and publishes. The consequence Medium reserves is removal of content and suspension of the account.

### Best available path for Medium

1. Check Settings, "Security and apps", for an existing integration token. If one exists, post through the old API with `canonicalUrl` and `publishStatus: "draft"`, and accept that it is unsupported and can stop without notice.
2. Otherwise keep Medium **manual**: have the workflow output the post URL and a link to the import page; a person imports, checks the formatting, and presses Publish. Import sets the canonical link and backdates on its own.
3. Do not automate a browser session. It breaks the Rules and risks the account.

---

## 2. Hacker News

- **The official API is read-only.** The `HackerNews/API` README documents only reads from `https://hacker-news.firebaseio.com/v0/` (items, users, live lists). It has no write, vote, or submit endpoint, and no authentication. It notes there is currently no rate limit. Source: https://github.com/HackerNews/API
- **Self-promotion.** The guidelines say not to use HN primarily for promotion, and that posting your own work part of the time is fine as long as curiosity is the main use of the site. Source: https://news.ycombinator.com/newsguidelines.html
- **Automation.** The guidelines ask for text to be written by people and then say: "please don't automate posting." Same source. This is a recent, explicit line and settles the question for scripted submission.
- **Votes and comments.** The FAQ says users should vote because they find a story interesting, not because someone has content to promote, and that HN penalises or bans submissions, accounts, and sites that break this. The guidelines also say not to solicit upvotes, comments, or submissions. Sources: https://news.ycombinator.com/newsfaq.html and https://news.ycombinator.com/newsguidelines.html
- **Reposts.** A small number of reposts is acceptable if the story has not had significant attention in about a year; deleting and reposting is not. Source: https://news.ycombinator.com/newsfaq.html
- **Titles.** Use the original title, drop the site name, no uppercase or exclamation marks for emphasis. Source: https://news.ycombinator.com/newsguidelines.html
- **Prefilled submit URL.** Confirmed. HN's own bookmarklet page builds exactly `https://news.ycombinator.com/submitlink?u=<encoded url>&t=<encoded title>`. Source: https://news.ycombinator.com/bookmarklet.html. Requested on 2026-10-09 without a session, the URL returns HTTP 200 with a login prompt ("You have to be logged in to submit"), so it leads to the normal signed-in submit form.
- **Second chances.** Moderators run a "second-chance pool" that re-floats good submissions that got no attention, which reduces the cost of an unlucky submission time. Source (moderator post): https://news.ycombinator.com/item?id=26998308

**Recommendation.** Do not script submission. Have the workflow print or message a ready-made `submitlink` URL with the title already cleaned to HN's title rules. Click it yourself, and only for posts with real substance, not every week. Keep the account's activity mostly about other people's work, and do not ask anyone to upvote.

---

## 3. Substack

- **No official publishing API.** A search of Substack's support site for "API" returns a single article, about the Substack MCP server. Source: https://support.substack.com/hc/en-us/search?query=API
- **The official MCP server is read-only and gated.** It needs an Admin on a Bestseller publication, and Substack states it cannot publish posts, send Notes, or modify the account. Source: https://support.substack.com/hc/en-us/articles/50834026608916-How-to-connect-Substack-to-your-AI-Assistant
- **RSS import exists, but it is a manual, one-off importer.** Settings, Import/Export, "Import posts", then paste a site URL; the importer also accepts RSS feeds, and has an "Update existing posts" option for re-imports. It is a dashboard action, not a subscription to a feed. Source: https://support.substack.com/hc/en-us/articles/360037830351
- **No email-to-post.** Support search for publishing by email returns only articles about sending posts to subscribers and scheduling. No primary source describes posting by emailing Substack. Source: https://support.substack.com/hc/en-us/search?query=publish+a+post+by+email
- Unofficial libraries that replay the web app's private endpoints with a session cookie exist. **Secondary and unsupported;** not recommended.

**Practical position:** Substack stays manual. If it is used at all, the realistic routine is a periodic re-import from the site's RSS feed in the dashboard, or copy-paste.

---

## 4. dev.to (Forem API)

**Scheduled publishing**

- The published OpenAPI spec for `POST /api/articles` lists `title`, `body_markdown`, `published`, `series`, `main_image`, `canonical_url`, `description`, `tags`, `organization_id`, and `ai_disclosure_level`. **`published_at` is not in the documented schema**, and the description says `published: true` publishes immediately. Source: https://github.com/forem/forem/blob/main/swagger/v1/api_v1.json (rendered at https://developers.forem.com/api/v1)
- The **source code does accept it.** The API controller's permitted parameters include `:published_at`. Source: https://github.com/forem/forem/blob/main/app/controllers/concerns/api/articles_controller.rb
- The model treats a future `published_at` as scheduled: `scheduled?` is true when `published_at` is in the future, the public `published` scope requires `published_at <= now`, and validation on create allows a future time (or up to 15 minutes in the past). Values more than five years ahead are discarded. Front matter `published_at` is read too. Source: https://github.com/forem/forem/blob/main/app/models/article.rb
- **Conclusion:** `{"article": {"published": true, "published_at": "<future RFC 3339 time>"}}` should create a scheduled article. This is code-verified, not documented, and was not exercised against the live API in this research. Test it once with a throwaway post. Since the workflow already runs on a schedule, publishing immediately at run time is the lower-risk design.

**Rate limits for creating articles**

| Limit | Value | Source |
| --- | --- | --- |
| API writes (POST/PUT/DELETE) per IP and per API key | 1 request per second | https://github.com/forem/forem/blob/main/config/initializers/rack_attack.rb |
| Published articles per user | More than 9 created in 30 seconds trips the limit (default setting); retry after 30 seconds | https://github.com/forem/forem/blob/main/app/services/rate_limit_checker.rb and https://github.com/forem/forem/blob/main/app/models/settings/rate_limit.rb |
| New accounts (default: younger than 3 days) | More than 1 published article in 5 minutes trips the anti-spam limit; retry after 300 seconds | Same two files, plus https://github.com/forem/forem/blob/main/app/services/articles/creator.rb |
| Article updates | Default 30 per 30 seconds | Same settings file |

These are Forem defaults. dev.to can override the settings values on its own instance, and the live numbers are not published. One post a week is far below every limit. The API key comes from https://dev.to/settings/extensions (stated in the spec's security section).

---

## 5. Other platforms worth adding

| Platform | Endpoint or mutation | Canonical URL | Credential and where to get it | Cost |
| --- | --- | --- | --- | --- |
| **Hashnode** | GraphQL `publishPost` mutation. `gql.hashnode.com` returned a 301 to the announcement page for an unauthenticated request on the date checked | Yes, `originalArticleURL` input field (**secondary**, community write-ups; schema could not be introspected without a paid publication) | Personal Access Token from hashnode.com/settings/developer | **Paid.** Hashnode announced on 13 May 2026 that every API request now requires a Pro plan on the publication. Pro is listed at $5/month or $50/year |
| **Bluesky** | `POST {pds}/xrpc/com.atproto.repo.createRecord`, collection `app.bsky.feed.post`, link card via `app.bsky.embed.external` (client must supply title, description, and optional thumbnail blob) | Not applicable (link post) | App password (Settings, Privacy and Security, App Passwords), exchanged at `com.atproto.server.createSession` | Free |
| **Mastodon** | `POST /api/v1/statuses` on your instance; supports `scheduled_at` and an `Idempotency-Key` header | Not applicable (link post) | Access token with `write:statuses`, from Preferences, Development, New application on your instance | Free |
| **LinkedIn** | `POST https://api.linkedin.com/v2/ugcPosts` with `shareMediaCategory: "ARTICLE"` and `originalUrl` (self-serve doc), or the newer `POST https://api.linkedin.com/rest/posts` with `content.article` | Not applicable (link post) | OAuth 2.0 access token with `w_member_social`; create an app at linkedin.com/developers and add the "Share on LinkedIn" product | Free. 150 requests per member per day. Tokens expire and need a refresh routine (lifetime not re-verified here) |
| **X** | Create Post endpoint, X API v2 | Not applicable (link post) | Developer Console app with OAuth user-context credentials | **Paid, pay-per-use, no free tier listed.** Creating a post is $0.015; a post **with a URL is $0.20** per request |

Sources:

- Hashnode: https://hashnode.com/announcements/graphql-api (primary), https://hashnode.com/pro (primary), https://support.hashnode.com/en/articles/6423579-developer-access-token (primary, token location), https://dev.to/morinaga/three-hashnode-api-behaviors-that-differ-from-devto-in-a-cross-post-pipeline-14ml (secondary, `originalArticleURL`)
- Bluesky: https://docs.bsky.app/docs/advanced-guides/posts and https://docs.bsky.app/docs/get-started (source at https://github.com/bluesky-social/bsky-docs), lexicon at https://github.com/bluesky-social/atproto/blob/main/lexicons/app/bsky/embed/external.json
- Mastodon: https://docs.joinmastodon.org/methods/statuses/ and https://docs.joinmastodon.org/client/token/
- LinkedIn: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin and https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
- X: https://docs.x.com/x-api/getting-started/pricing

Notes:

- Hashnode was the obvious second blog platform with canonical support, but the May 2026 paywall changes the calculation: about $50 a year for one extra syndication target.
- On X, a weekly link post costs roughly $10 a year. Posting the link in a reply does not avoid the URL price if the reply itself contains the URL.
- LinkedIn's newer Posts API does not scrape the URL; the caller supplies title, description, and thumbnail.

---

## 6. Best time to publish

### What the evidence actually says

**Strong (large first-party datasets, but about email, not blogs)**

- Mailchimp's send-time analysis, built on engagement data for billions of addresses, puts the optimal hour at about **10:00 in the recipient's local time**, with Tuesday to Thursday slightly ahead. Mailchimp itself says no single day wins outright, Monday to Friday are quite similar, and Sunday is weakest. Source: https://mailchimp.com/resources/insights-from-mailchimps-send-time-optimization-system/
- This is strong evidence that weekday mid-morning local time is a safe default, and equally strong evidence that the day-of-week effect is **small**.

**Moderate (real data, single analyst, limited controls)**

- Hacker News, BigQuery, 384,871 posts from November 2024 to November 2025: across the top 100,000 posts, median scores and comments were fairly even across hours of the day. Sunday had far fewer posts and slightly better signals. The authors say the data did not support their own earlier advice to post midweek. Secondary analysis by a content agency. Source: https://pithandpip.com/blog/hn-is-human
- Hacker News, older full-history analysis (2017): weekend submissions were nearly 50% more likely to reach a score of 10, with weak time-of-day peaks around 06:00, 10:30, and 17:00 Pacific. The author flags the threshold as arbitrary. Source: https://intoli.com/blog/hacker-news-title-tool/
- dev.to, community analysis of the public API (April 2020): the highest average reactions cluster **around midday UTC on weekdays**. Reactions stand in for reads; outliers were removed; the dataset size is not stated and the data is six years old. Source: https://dev.to/m_nevin/when-s-the-best-time-to-post-on-dev-to-5824

**Weak or folklore**

- "Tuesday at 10 a.m." as a universal rule. Vendor roundups disagree with each other: one 2026 dataset has Tuesday highest for opens by about 1.6 points over Monday, another 2025 dataset has Friday highest. Secondary sources, and open rates are inflated by Apple Mail Privacy Protection. Source: https://www.omnisend.com/blog/best-time-to-send-email/
- "Post to HN at 5 a.m. Pacific on a weekday." Repeated in comment threads; the data-backed analyses above do not support a strong hour effect.
- Claims of one magic slot with a 2x effect. Reported second-hand, methods not available.

**Missing**

- No primary statement from dev.to (Forem) on the best time to publish was found.
- No published Substack or beehiiv research on open rate by day was found in this pass.
- Nothing rigorous exists that is specific to developer blog readership across North America and Europe.

### Reasoning

1. Timing effects are small everywhere they have been measured. Topic, title, and consistency matter more.
2. The one constraint that is real is geography. A slot should fall inside the working day in both regions. 13:00 to 15:00 UTC is the only window that is morning in eastern North America and still afternoon in Europe.
3. That same window matches the dev.to "midday UTC, weekdays" finding and Mailchimp's mid-morning local result for the eastern half of North America.
4. Hacker News weekend odds are slightly better, but HN is a manual, occasional submission and should not drive the weekly slot.
5. Tuesday rather than Monday (inbox backlog) or Friday (attention drops into the weekend). This choice rests on weak evidence and on convention.

### Recommended default slot

**Tuesday at 09:00 America/Toronto, which is 13:00 UTC while daylight time is in effect.**

| Region | Local time in summer | Local time in winter, if the cron is fixed at 13:00 UTC |
| --- | --- | --- |
| Toronto / New York | 09:00 EDT | 08:00 EST |
| San Francisco | 06:00 PDT | 05:00 PST |
| London | 14:00 BST | 13:00 GMT |
| Berlin / Paris | 15:00 CEST | 14:00 CET |

**Confidence: low to moderate.** High confidence that a weekday slot in the 13:00 to 15:00 UTC band is sensible for a split North America and Europe audience. Low confidence that Tuesday beats Wednesday or Thursday, or that 13:00 beats 14:00. After roughly 12 posts, compare the site's own analytics by slot; that will be better evidence than anything above.

### Daylight saving and the cron

- GitHub Actions cron runs in UTC by default. A fixed `0 13 * * 2` fires at 09:00 Toronto time in summer and 08:00 in winter. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub now documents a `timezone` key on `schedule` entries that takes an IANA zone, which removes the drift. Schedules that land in a skipped hour move to the next valid time. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax

  ```yaml
  on:
    schedule:
      - cron: '7 9 * * 2'
        timezone: "America/Toronto"
  ```

- Use a minute other than `:00`. GitHub states scheduled runs are delayed, and can be dropped, under high load, and that the start of every hour is a high-load time. Same events source.
- North America and Europe change clocks on different dates (in 2026, Europe on 25 October and North America on 1 November; in spring the gap is about three weeks). During those weeks European readers see the post one hour earlier or later than usual. This does not matter in practice.
- If the `timezone` key is not used, keep `7 13 * * 2` in UTC and accept 08:07 local in winter. Both are inside the reasonable band.

---

## What to automate, what stays manual

| Channel | Automate? | How | Why |
| --- | --- | --- | --- |
| Own site | Yes | Existing publish workflow | Source of truth and canonical URL |
| dev.to | Yes (already working) | `POST /api/articles` with `canonical_url`, publish at run time | Documented API, generous limits |
| Bluesky | Yes | `createRecord` with an external embed, app password in Actions secrets | Free, stable, simple credential |
| Mastodon | Yes | `POST /api/v1/statuses` with an idempotency key | Free, stable, simple credential |
| LinkedIn | Yes, with upkeep | `ugcPosts` or `rest/posts` with `w_member_social` | Free, but OAuth tokens expire and need refreshing |
| Hashnode | Optional | `publishPost` with `originalArticleURL` | Works, but needs a paid Pro plan since May 2026 |
| X | Optional | Create Post, pay-per-use | $0.20 per link post; cheap but not free |
| Medium | Manual, or API only if a pre-2025 token exists | Import tool, then review and Publish | No new tokens; browser automation breaks Medium Rules |
| Hacker News | Manual | Workflow emits a prefilled `submitlink` URL; a person clicks it, selectively | Read-only API; guidelines ask not to automate posting |
| Substack | Manual | Dashboard RSS import or copy-paste | No publishing API, official MCP is read-only |

## Gaps in this research

- Medium import prefill by query parameter: untested (sign-in required).
- Zapier and Make Medium pages: returned 404, current status unverified.
- Hashnode `PublishPostInput` schema: not read from a primary source, because the API now sits behind the Pro plan.
- dev.to `published_at` scheduling: verified in Forem source, not against the live dev.to API.
- LinkedIn access-token lifetime: not re-verified.
- MCP server repositories: found through directory listings; code and maintenance status not reviewed.
