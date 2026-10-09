/**
 * Medium. The API was archived in March 2023 and Medium no longer issues
 * integration tokens, so `publish` only runs for an account that already has
 * one. Everyone else gets the manual import step. Automating Medium's website
 * instead would break the Medium Rules, so it is not an option here.
 * Sources: docs/research/distribution.md.
 */
export const medium = {
  name: "Medium",
  field: "medium_url",
  secret: "MEDIUM_INTEGRATION_TOKEN",
  /** Shown in the manual checklist when there is no token. */
  manual: (post) =>
    `Open [Import a story](https://medium.com/p/import), paste \`${post.url}\`, then publish the draft it creates. Medium sets the canonical link for you.`,

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
