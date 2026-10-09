/** dev.to (Forem API). Docs: https://developers.forem.com/api/v1#tag/articles */
export const devto = {
  name: "dev.to",
  /** Frontmatter key that records the published URL. */
  field: "devto_url",
  secret: "DEVTO_API_KEY",

  async publish(post, apiKey) {
    const res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        article: {
          title: post.title,
          body_markdown: post.body,
          published: true,
          description: post.summary,
          canonical_url: post.url,
          // dev.to allows at most 4 tags, lowercase alphanumeric only.
          tags: post.tags
            .map((tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, ""))
            .filter(Boolean)
            .slice(0, 4),
        },
      }),
    });
    if (!res.ok) throw new Error(`dev.to responded ${res.status}: ${await res.text()}`);
    return (await res.json()).url;
  },
};
