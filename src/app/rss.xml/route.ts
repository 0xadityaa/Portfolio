import { getAllBlogPosts, getPost } from "@/data/blog";
import { DATA } from "@/data/resume";

export const dynamic = "force-static";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Feed readers and cross-posting importers need absolute URLs and no site chrome. */
function toFeedHtml(html: string) {
  return html
    .replace(/<button[\s\S]*?<\/button>/g, "")
    .replace(/(src|href)="\/(?!\/)/g, `$1="${DATA.url}/`)
    .replace(/]]>/g, "]]&gt;");
}

export async function GET() {
  const posts = await getAllBlogPosts();

  const items = await Promise.all(
    posts.map(async ({ slug, metadata }) => {
      const post = await getPost(slug);
      const url = `${DATA.url}/blog/${slug}`;
      return `
    <item>
      <title>${escapeXml(metadata.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${metadata.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(DATA.name)}</dc:creator>
      <description>${escapeXml(metadata.summary ?? "")}</description>
      ${(metadata.tags ?? []).map((tag) => `<category>${escapeXml(tag)}</category>`).join("")}
      <content:encoded><![CDATA[${toFeedHtml(post?.source ?? "")}]]></content:encoded>
    </item>`;
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(DATA.name)}</title>
    <link>${DATA.url}/blog</link>
    <description>Notes on building software and the systems behind it.</description>
    <language>en-us</language>
    <atom:link href="${DATA.url}/rss.xml" rel="self" type="application/rss+xml" />${items.join("")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
