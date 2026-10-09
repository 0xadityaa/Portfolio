import { getAllBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { projectSlug } from "@/lib/projects";

export const revalidate = 3600;

/** Index of the site for agents, following the llms.txt convention. */
export async function GET() {
  const posts = await getAllBlogPosts();
  const url = (pathname: string) => `${DATA.url}${pathname}`;

  const body = `# ${DATA.name}

> ${DATA.description}

Every page on this site has a Markdown version: add \`.md\` to its URL
(the home page is \`/index.md\`), or request the page with the header
\`Accept: text/markdown\`. The whole site in one file is at ${url("/llms-full.txt")}.

## Pages

- [Home](${url("/index.md")}): About, experience, stack, education, and contact details
- [Blog](${url("/blog.md")}): All posts with summaries
- [Projects](${url("/projects.md")}): All projects with descriptions and tech

## Blog posts

${posts
  .map((post) => `- [${post.metadata.title}](${url(`/blog/${post.slug}.md`)}): ${post.metadata.summary}`)
  .join("\n")}

## Projects

${DATA.projects
  .map((project) => `- [${project.title}](${url(`/projects/${projectSlug(project)}.md`)}): ${project.description}`)
  .join("\n")}

## Optional

- [RSS feed](${url("/rss.xml")}): Full post content as HTML
- [Sitemap](${url("/sitemap.xml")})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
