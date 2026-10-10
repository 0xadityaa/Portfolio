import { PostCover } from "@/components/post-cover";
import { ProgressionPlayer } from "@/components/progression-player";
import { ProjectCard } from "@/components/project-card";
import { Section } from "@/components/section";
import { SystemDiagram } from "@/components/system-diagram";
import { getAllBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { contours } from "@/lib/art";
import { projectSlug } from "@/lib/projects";
import { formatDate, formatMonthYear, yearRange } from "@/lib/utils";
import Link from "next/link";

// Re-rendered every 10 minutes so scheduled posts appear when their publish time passes.
export const revalidate = 600;

const contact = [
  { label: "GitHub", href: DATA.contact.social.GitHub.url },
  { label: "LinkedIn", href: DATA.contact.social.LinkedIn.url },
  { label: "X", href: DATA.contact.social.X.url },
];

// Work and school on one line of history, newest first.
const timeline = [
  ...DATA.work.map((job) => ({
    key: job.company,
    years: yearRange(job.start, job.end),
    place: job.location,
    title: job.title,
    org: job.company,
    href: job.href,
    description: job.description as string | undefined,
  })),
  ...DATA.education.map((school) => ({
    key: school.school,
    years: yearRange(school.start, school.end),
    place: "Education",
    title: school.degree,
    org: school.school,
    href: school.href,
    description: undefined,
  })),
];

export default async function Page() {
  const posts = await getAllBlogPosts();
  const [latest, ...rest] = posts;
  const trail = contours("outdoors");

  return (
    <main className="fade-in flex flex-col gap-24">
      <section id="about" className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-[1fr_28rem]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brand">
            {DATA.role}, Toronto
          </p>
          <h1 className="mt-4 font-serif text-[2.75rem] font-medium leading-[1.05] tracking-tight text-foreground [text-wrap:pretty] sm:text-[3.5rem]">
            I turn legacy systems into event-driven ones.
          </h1>
          <div className="mt-6 max-w-[52ch] space-y-3 text-muted-foreground">
            {DATA.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/projects"
              className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.98]"
            >
              See projects
            </Link>
            <Link
              href="/blog"
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 active:scale-[0.98]"
            >
              Read the blog
            </Link>
            <a href={DATA.contact.social.email.url} className="link ml-1 text-sm">
              Email me
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-6">
          <SystemDiagram
            topics={[
              { name: "work.log", detail: `${DATA.work.length} roles since 2024`, href: "#work" },
              { name: "projects.shipped", detail: `${DATA.projects.length} projects`, href: "/projects" },
              { name: "posts.published", detail: `${posts.length} posts`, href: "/blog" },
            ]}
          />
        </div>
      </section>

      <Section id="work" index={1} title="Experience">
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[1fr_24rem]">
          <ol className="relative ml-1.5 space-y-9 border-l border-border">
            {timeline.map((item, index) => (
              <li key={item.key} className="relative pl-7">
                <span
                  aria-hidden
                  className={`absolute -left-[5.5px] top-[0.55rem] size-2.5 rounded-full border ${
                    index === 0 ? "border-brand bg-brand" : "border-foreground/40 bg-background"
                  }`}
                />
                <p className="meta">
                  {item.years} <span aria-hidden>/</span> {item.place}
                </p>
                <h3 className="mt-1 text-foreground">
                  {item.title} at{" "}
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="link">
                    {item.org}
                  </a>
                </h3>
                {item.description && (
                  <p className="mt-1.5 max-w-[60ch] text-muted-foreground">{item.description}</p>
                )}
              </li>
            ))}
          </ol>

          <div>
            <h3 className="meta mb-3 uppercase tracking-[0.14em]">The stack, top to bottom</h3>
            <dl className="overflow-hidden rounded-2xl border border-border bg-card">
              {DATA.stack.map((group) => (
                <div key={group.label} className="border-b border-border p-4 last:border-b-0">
                  <dt className="font-mono text-xs text-foreground">{group.label}</dt>
                  <dd className="mt-2.5 flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span key={item} className="chip">
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section id="projects" index={2} title="Projects" more={{ href: "/projects", label: "All projects" }}>
        <div className="grid gap-6 sm:grid-cols-2">
          {DATA.projects.slice(0, 4).map((project) => (
            <ProjectCard
              key={project.title}
              title={project.title}
              href={`/projects/${projectSlug(project)}`}
              description={project.description}
              dates={project.dates}
              slug={projectSlug(project)}
              technologies={project.technologies}
            />
          ))}
        </div>
      </Section>

      <Section id="writing" index={3} title="Writing" more={{ href: "/blog", label: "All posts" }}>
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[26rem_1fr]">
          {latest && (
            <Link
              href={`/blog/${latest.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/25"
            >
              <PostCover seed={latest.slug} cols={20} rows={9} className="aspect-[20/9] w-full border-b border-border" />
              <div className="p-5">
                <p className="meta">
                  Latest <span aria-hidden>/</span>{" "}
                  <time dateTime={latest.metadata.publishedAt}>{formatDate(latest.metadata.publishedAt)}</time>
                </p>
                <h3 className="mt-2 font-serif text-2xl font-medium leading-snug tracking-tight text-foreground">
                  {latest.metadata.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{latest.metadata.summary}</p>
              </div>
            </Link>
          )}
          <ul className="rows">
            {rest.slice(0, 5).map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="row-link flex items-center gap-4 !py-2.5">
                  <PostCover seed={post.slug} cols={3} rows={3} className="size-12 flex-none rounded-lg border border-border" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-foreground">{post.metadata.title}</span>
                    <time dateTime={post.metadata.publishedAt} className="meta">
                      {formatMonthYear(post.metadata.publishedAt)}
                    </time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="off-keyboard" index={4} title="Away from the keyboard">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-foreground">Making music</h3>
            <p className="mb-5 mt-1 text-muted-foreground">
              Working out a new progression scratches the same itch as working out a system. Here is one to play.
            </p>
            <ProgressionPlayer />
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
            <h3 className="text-foreground">Exploring outdoors</h3>
            <p className="mt-1 max-w-[34ch] text-muted-foreground">
              The same curiosity about how pieces fit together, pointed at a trail map.
            </p>
            <svg
              viewBox="0 0 340 230"
              aria-hidden
              fill="none"
              className="mt-2 h-auto w-full"
              preserveAspectRatio="xMidYMid slice"
            >
              {trail.map((d, index) => (
                <path
                  key={d}
                  d={d}
                  strokeWidth={1}
                  className={index === 2 || index === 11 ? "stroke-brand" : "stroke-foreground/20"}
                />
              ))}
              <circle cx={110} cy={95} r={3} className="fill-brand" />
            </svg>
          </div>
        </div>
      </Section>

      <Section id="contact" index={5} title="Contact">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">Want to build something, or just talk shop?</p>
            <p className="mt-2 text-muted-foreground">
              Email is the fastest way to reach me.{" "}
              {contact.map((item, index) => (
                <span key={item.label}>
                  {index > 0 && ", "}
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="link">
                    {item.label}
                  </a>
                </span>
              ))}{" "}
              work too.
            </p>
          </div>
          <a
            href={DATA.contact.social.email.url}
            className="flex-none rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.98]"
          >
            {DATA.contact.email}
          </a>
        </div>
      </Section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: DATA.name,
            url: DATA.url,
            image: `${DATA.url}${DATA.avatarUrl}`,
            jobTitle: DATA.work[0].title,
            worksFor: { "@type": "Organization", name: DATA.work[0].company, url: DATA.work[0].href },
            address: { "@type": "PostalAddress", addressLocality: "Toronto", addressCountry: "CA" },
            sameAs: contact.map((item) => item.href),
          }),
        }}
      />
    </main>
  );
}
