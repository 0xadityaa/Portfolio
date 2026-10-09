/**
 * Hacker News has no submission API and asks that people submit by hand, so
 * this is always a manual step. The link opens the submit form filled in.
 */
export const hackernews = {
  name: "Hacker News",
  field: "hackernews_url",
  manual: (post) =>
    `Only if the post is a strong fit. [Open the submit form, filled in](https://news.ycombinator.com/submitlink?u=${encodeURIComponent(post.url)}&t=${encodeURIComponent(post.data.title)}).`,
};
