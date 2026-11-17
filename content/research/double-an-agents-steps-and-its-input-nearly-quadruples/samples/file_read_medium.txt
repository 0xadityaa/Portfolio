     1	#!/usr/bin/env node
     2	/**
     3	 * Syndicates live posts to the platforms in scripts/platforms.
     4	 *
     5	 *   node scripts/crosspost.mjs            publish what is due
     6	 *   node scripts/crosspost.mjs --dry-run  print what would happen
     7	 *
     8	 * A post is due on a platform when it is not a draft, its publish time has
     9	 * passed, it is live on the site, and its frontmatter has no URL for that
    10	 * platform yet. Published URLs are written back to the frontmatter, which is
    11	 * what makes a rerun safe. Platforms without an API (or without a secret) are
    12	 * collected into one GitHub issue per run as a manual checklist.
    13	 */
    14	import { absolutize, loadPosts, publishTime, saveFrontmatter } from "./lib/posts.mjs";
    15	import { platforms } from "./platforms/index.mjs";
    16	
    17	const dryRun = process.argv.includes("--dry-run");
    18	// Posts older than this were published before syndication existed. Leave them alone.
    19	const since = new Date(process.env.CROSSPOST_SINCE || "2026-10-01T00:00:00Z");
    20	
    21	async function isLive(url) {
    22	  try {
    23	    return (await fetch(url, { method: "HEAD", redirect: "follow" })).ok;
    24	  } catch {
    25	    return false;
    26	  }
    27	}
    28	
    29	/** One issue per run, covering every post that has manual platforms left. */
    30	async function openChecklistIssue(entries) {
    31	  const repo = process.env.GITHUB_REPOSITORY;
    32	  const token = process.env.GITHUB_TOKEN;
    33	  const body = [
    34	    "These posts are live. The platforms below have no publishing API, so they need you:",
    35	    "",
    36	    ...entries.flatMap(({ post, steps }) => [
    37	      `### [${post.data.title}](${post.url})`,
    38	      "",
    39	      ...steps.map((step) => `- [ ] ${step}`),
    40	      "",
    41	      `Markdown source for pasting: ${post.url}.md`,
    42	      "",
    43	    ]),
    44	    "Close this issue when you are done. To record a link, add it to the post's frontmatter.",
    45	  ].join("\n");
    46	
    47	  if (!repo || !token) {
    48	    console.log("manual steps (no GITHUB_TOKEN, not opening an issue):\n" + body);
    49	    return null;
    50	  }
    51	  const title =
    52	    entries.length === 1
    53	      ? `Cross-post: ${entries[0].post.data.title}`
    54	      : `Cross-post: ${entries.length} posts`;
    55	  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    56	    method: "POST",
    57	    headers: {
    58	      Authorization: `Bearer ${token}`,
    59	      Accept: "application/vnd.github+json",
    60	      "Content-Type": "application/json",
    61	    },
    62	    body: JSON.stringify({ title, labels: ["crosspost"], body }),
    63	  });
    64	  if (!res.ok) throw new Error(`Could not open checklist issue: ${res.status} ${await res.text()}`);
    65	  return (await res.json()).html_url;
    66	}
    67	
    68	// Platforms rate-limit bursts (dev.to allowed two posts, then asked for a
    69	// pause) and a wall of posts reads as spam, so a backlog drains one post per run. Oldest first keeps each platform's feed in order.
    70	const maxPerRun = Number(process.env.CROSSPOST_MAX || 1);
    71	// A platform that fails once is left alone for the rest of the run.
    72	const blocked = new Set();
    73	let published = 0;
    74	const checklist = [];
    75	
    76	let failures = 0;
    77	
    78	const posts = loadPosts().sort(
    79	  (a, b) => publishTime(a.data.publishedAt) - publishTime(b.data.publishedAt)
    80	);
    81	
    82	for (const post of posts) {
    83	  const { data } = post;
    84	  const due =
    85	    !data.draft &&
    86	    publishTime(data.publishedAt) <= new Date() &&
    87	    publishTime(data.publishedAt) >= since;
    88	  if (!due) continue;
    89	
    90	  const pending = platforms.filter((platform) => !data[platform.field]);
    91	  const needsIssue = !data.crosspost_issue && pending.some((p) => !p.publish || !process.env[p.secret]);
    92	  if (pending.every((p) => !p.publish || !process.env[p.secret]) && !needsIssue) continue;
    93	
    94	  if (!(await isLive(post.url))) {
    95	    console.log(`${post.slug}: not live on the site yet, skipping until the next run`);
    96	    continue;
    97	  }
    98	
    99	  console.log(`${post.slug}:`);
   100	  const article = {
   101	    title: data.title,
   102	    summary: data.summary,
   103	    tags: data.tags ?? [],
   104	    url: post.url,
   105	    body: absolutize(post.content.trim()),
   106	  };
   107	  const manualSteps = [];
   108	
   109	  for (const platform of pending) {
   110	    const secret = platform.secret && process.env[platform.secret];
   111	    if (!platform.publish || !secret) {
   112	      if (platform.manual) manualSteps.push(`**${platform.name}**: ${platform.manual(post)}`);
   113	      else console.log(`  ${platform.name}: ${platform.secret} is not set, skipping`);
   114	      continue;
   115	    }
   116	    if (published >= maxPerRun || blocked.has(platform.name)) {
   117	      console.log(`  ${platform.name}: waiting for the next run`);
   118	      continue;
   119	    }
   120	    if (dryRun) {
   121	      published++;
   122	      console.log(`  ${platform.name}: would publish`);
   123	      continue;
   124	    }
   125	    try {
   126	      const url = await platform.publish(article, secret);
   127	      published++;
   128	      saveFrontmatter(post, { [platform.field]: url });
   129	      console.log(`  ${platform.name}: ${url}`);
   130	    } catch (error) {
   131	      blocked.add(platform.name);
   132	      // Being asked to slow down is expected with a backlog, not a failure.
   133	      if (!/\b429\b/.test(error.message)) failures++;
   134	      console.error(`  ${platform.name}: not published, will retry next run. ${error.message}`);
   135	    }
   136	  }
   137	
   138	  if (manualSteps.length > 0 && !data.crosspost_issue) {
   139	    checklist.push({ post, steps: manualSteps });
   140	  }
   141	}
   142	
   143	if (checklist.length > 0) {
   144	  if (dryRun) {
   145	    console.log(`would open one checklist issue covering ${checklist.length} post(s)`);
   146	  } else {
   147	    const issueUrl = await openChecklistIssue(checklist);
   148	    if (issueUrl) {
   149	      for (const { post } of checklist) saveFrontmatter(post, { crosspost_issue: issueUrl });
   150	      console.log(`checklist: ${issueUrl}`);
   151	    }
   152	  }
   153	}
   154	
   155	process.exit(failures > 0 ? 1 : 0);
