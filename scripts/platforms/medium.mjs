/**
 * Medium. Its API is frozen and Medium stopped issuing integration tokens to
 * new users, so this only runs for accounts that still have one. Without a
 * token Medium falls back to the manual checklist in crosspost.mjs.
 */
export const medium = {
  name: "Medium",
  field: "medium_url",
  secret: "MEDIUM_INTEGRATION_TOKEN",
  /** Shown in the manual checklist when there is no token. */
  manual: (post) =>
    `Open https://medium.com/p/import and paste ${post.url}. Medium sets the canonical link for you.`,

  async publish(post, token) {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const me = await fetch("https://api.medium.com/v1/me", { headers });
    if (!me.ok) throw new Error(`Medium profile lookup responded ${me.status}: ${await me.text()}`);
    const authorId = (await me.json()).data.id;

    const res = await fetch(`https://api.medium.com/v1/users/${authorId}/posts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: post.title,
        contentFormat: "markdown",
        content: `# ${post.title}\n\n${post.body}`,
        canonicalUrl: post.url,
        publishStatus: "public",
        tags: post.tags.slice(0, 5),
      }),
    });
    if (!res.ok) throw new Error(`Medium responded ${res.status}: ${await res.text()}`);
    return (await res.json()).data.url;
  },
};
