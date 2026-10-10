import { HeroArt } from "@/components/hero-art";
import { PostCover } from "@/components/post-cover";
import { ProjectCard } from "@/components/project-card";
import { Section } from "@/components/section";
import { getAllBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
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

  return (
    <main className="fade-in flex flex-col gap-24">
      <section id="about" className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-[1fr_28rem]">
        <div>
          <h1 className="font-serif text-[2.75rem] font-medium leading-[1.05] tracking-tight text-foreground [text-wrap:pretty] sm:text-[3.5rem]">
            Hi, I&apos;m Aditya
          </h1>
          <div className="mt-6 max-w-[52ch] space-y-3 text-muted-foreground">
            {DATA.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
            {[
              { label: "LinkedIn", href: DATA.contact.social.LinkedIn.url },
              { label: "GitHub", href: DATA.contact.social.GitHub.url },
            ].map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="link">
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <HeroArt className="aspect-[9/7] w-full" />
      </section>

      <Section id="writing" title="Things I&apos;ve written" more={{ href: "/blog", label: "All posts" }}>
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[26rem_1fr]">
          {latest && (
            <Link
              href={`/blog/${latest.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/25"
            >
              <PostCover seed={latest.slug} cols={20} rows={9} className="aspect-[20/9] w-full border-b border-border" />
              <div className="p-5">
                <h3 className="font-serif text-2xl font-medium leading-snug tracking-tight text-foreground">
                  {latest.metadata.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{latest.metadata.summary}</p>
                <p className="meta mt-3">
                  <time dateTime={latest.metadata.publishedAt}>{formatDate(latest.metadata.publishedAt)}</time>
                </p>
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

      <Section id="projects" title="Things I&apos;ve built" more={{ href: "/projects", label: "All projects" }}>
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

      <Section id="work" title="Where I&apos;ve been">
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[1fr_24rem]">
          <ol className="relative ml-1.5 space-y-9 border-l border-border">
            {timeline.map((item, index) => (
              <li key={item.key} className="relative pl-7">
                <span
                  aria-hidden
                  className={`absolute -left-[5.5px] top-[0.5rem] size-2.5 rounded-full border ${
                    index === 0 ? "border-brand bg-brand" : "border-foreground/40 bg-background"
                  }`}
                />
                <h3 className="text-foreground">
                  {item.title} at{" "}
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="link">
                    {item.org}
                  </a>
                </h3>
                <p className="meta mt-1">
                  {item.years} <span aria-hidden>/</span> {item.place}
                </p>
                {item.description && (
                  <p className="mt-1.5 max-w-[60ch] text-muted-foreground">{item.description}</p>
                )}
              </li>
            ))}
          </ol>

          <div>
            <h3 className="mb-3 text-foreground">My toolbox</h3>
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

      <Section id="contact" title="Say hi">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="font-serif text-3xl font-medium tracking-tight text-foreground">Let&apos;s talk</p>
            <p className="mt-2 text-muted-foreground">
              Got an idea, a question, or a hot take on microservices? My inbox is open. I&apos;m also on{" "}
              {contact.map((item, index) => (
                <span key={item.label}>
                  {index > 0 && ", "}
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="link">
                    {item.label}
                  </a>
                </span>
              ))}
              {"."}
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
