/** Substack has no publishing API, so it is always a manual step. */
export const substack = {
  name: "Substack",
  field: "substack_url",
  manual: (post) =>
    `Create a new post in your Substack dashboard, paste the body from ${post.url}.md, and link back to ${post.url} in the first line.`,
};
