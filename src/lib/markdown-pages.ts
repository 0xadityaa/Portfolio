import { getAllBlogPosts, getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { findProject, projectSlug } from "@/lib/projects";
import { formatDate } from "@/lib/utils";

/**
 * Markdown twins of every page, for agents and crawlers. Served at
 * <page>.md and to any request that sends `Accept: text/markdown`
 * (see the rewrites in next.config.mjs). Keep these in step with the pages.
 */

const abs = (pathname: string) => `${DATA.url}${pathname}`;

/** Site-relative links and images only resolve on the site, so make them absolute. */
const absolutize = (markdown: string) =>
  markdown.replace(/\]\(\/(?!\/)/g, `](${DATA.url}/`);

const footer = `
---

More: [Home](${abs("/index.md")}) | [Blog](${abs("/blog.md")}) | [Projects](${abs("/projects.md")}) | [Index of every page](${abs("/llms.txt")})
`;

const experience = () =>
  DATA.work
    .map(
      (job) =>
        `### ${job.title}, [${job.company}](${job.href})\n\n${job.start} - ${job.end ?? "Present"}, ${job.location}\n\n${job.description}`
    )
    .join("\n\n");

const contact = () => {
  const social = DATA.contact.social;
  return `- Email: ${DATA.contact.email}
- GitHub: ${social.GitHub.url}
- LinkedIn: ${social.LinkedIn.url}
- X: ${social.X.url}
- RSS: ${abs("/rss.xml")}`;
};

async function home() {
  const posts = await getAllBlogPosts();

  return `# ${DATA.name}

${DATA.description}

${DATA.about.join("\n\n")}

Location: Toronto, Canada.

## Experience

${experience()}

## Writing

${posts
  .map(
    (post) =>
      `- [${post.metadata.title}](${abs(`/blog/${post.slug}.md`)}) (${post.metadata.publishedAt.slice(0, 10)})`
  )
  .join("\n")}

## Projects

${DATA.projects
  .map(
    (project) =>
      `- [${project.title}](${abs(`/projects/${projectSlug(project)}.md`)}): ${project.description}`
  )
  .join("\n")}

## Stack

${DATA.stack.map((group) => `- ${group.label}: ${group.items.join(", ")}`).join("\n")}

## Education

${DATA.education
  .map((school) => `- ${school.degree}, [${school.school}](${school.href}), ${school.start} - ${school.end}`)
  .join("\n")}

## Contact

${contact()}
${footer}`;
}

async function blogIndex() {
  const posts = await getAllBlogPosts();

  return `# Blog

Notes by ${DATA.name} on building software and the systems behind it.

${posts
  .map(
    (post) =>
      `## [${post.metadata.title}](${abs(`/blog/${post.slug}.md`)})\n\n${post.metadata.publishedAt.slice(0, 10)}${
        post.metadata.tags?.length ? `, tags: ${post.metadata.tags.join(", ")}` : ""
      }\n\n${post.metadata.summary}`
  )
  .join("\n\n")}
${footer}`;
}

async function blogPost(slug: string) {
  const post = await getPost(slug);
  if (!post) return null;
  const { title, publishedAt, summary, tags, readingTime } = post.metadata;

  return `# ${title}

- Author: ${DATA.name}
- Published: ${formatDate(publishedAt)}
- Reading time: ${readingTime} min
${tags?.length ? `- Tags: ${tags.join(", ")}\n` : ""}- Canonical URL: ${abs(`/blog/${slug}`)}

> ${summary}

${absolutize(post.markdown)}
${footer}`;
}

function projectsIndex() {
  return `# Projects

Open source work and side projects by ${DATA.name}.

${DATA.projects
  .map(
    (project) =>
      `## [${project.title}](${abs(`/projects/${projectSlug(project)}.md`)})\n\n${project.dates}\n\n${project.description}\n\nBuilt with: ${project.technologies.join(", ")}`
  )
  .join("\n\n")}

More repositories: ${DATA.contact.social.GitHub.url}
${footer}`;
}

export async function fetchProjectReadme(slug: string): Promise<string | null> {
  // Repo names only, so the slug cannot point the fetch anywhere else.
  if (!/^[\w.-]+$/.test(slug)) return null;

  for (const branch of ["main", "master"]) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/0xadityaa/${slug}/${branch}/README.md`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) return await res.text();
    } catch (err) {
      console.error(`Error fetching README for ${slug}:`, err);
      return null;
    }
  }
  return null;
}

async function projectPage(slug: string) {
  const project = findProject(slug);
  if (!project) return null;
  const readme = await fetchProjectReadme(slug);

  return `# ${project.title}

${project.description}

- Dates: ${project.dates}
- Built with: ${project.technologies.join(", ")}
${project.links
  .map((link) => `- ${link.type}: ${link.href.startsWith("/") ? abs(link.href) : link.href}`)
  .join("\n")}
- Canonical URL: ${abs(`/projects/${slug}`)}
${readme ? `\n## README\n\n${readme.trim()}\n` : ""}${footer}`;
}

/** Every page that has a Markdown twin, as path segments ([] is the home page). */
export async function markdownPagePaths(): Promise<string[][]> {
  const posts = await getAllBlogPosts();
  return [
    [],
    ["blog"],
    ["projects"],
    ...posts.map((post) => ["blog", post.slug]),
    ...DATA.projects.map((project) => ["projects", projectSlug(project)]),
  ];
}

export async function renderMarkdownPage(segments: string[]): Promise<string | null> {
  const [section, slug, ...rest] = segments;
  if (rest.length > 0) return null;

  if (!section || (section === "index" && !slug)) return home();
  if (section === "blog") return slug ? blogPost(slug) : blogIndex();
  if (section === "projects") return slug ? projectPage(slug) : projectsIndex();
  return null;
}
