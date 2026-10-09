import { Icons } from "@/components/icons";
import BlurFade from "@/components/magicui/blur-fade";
import { PostRow } from "@/components/post-row";
import { ProjectCard } from "@/components/project-card";
import { ResumeCard } from "@/components/resume-card";
import { Section } from "@/components/section";
import { getAllBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { getGitHubBuilderProfile } from "@/lib/github";
import { projectSlug } from "@/lib/projects";
import { BookMarked, MapPin } from "lucide-react";
import Image from "next/image";

const STEP = 0.06;

export default async function Page() {
  const [github, posts] = await Promise.all([
    getGitHubBuilderProfile("0xadityaa").catch(() => null),
    getAllBlogPosts(),
  ]);
  // Only show GitHub numbers when they are real.
  const stats = github && !github.isMock ? github : null;

  return (
    <main className="flex flex-col gap-16">
      <section id="hero" className="flex flex-col-reverse items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="space-y-4">
          <BlurFade>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {DATA.name}
            </h1>
          </BlurFade>
          <BlurFade delay={STEP}>
            <p className="max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              {DATA.description}
            </p>
          </BlurFade>
          <BlurFade delay={STEP * 2}>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                Toronto, Canada
              </li>
              {stats && (
                <>
                  <li className="flex items-center gap-1.5">
                    <Icons.github className="size-4" aria-hidden />
                    <span className="tabular-nums">
                      {stats.contributionsCount.toLocaleString("en-US")} commits
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <BookMarked className="size-4" aria-hidden />
                    <span className="tabular-nums">{stats.publicReposCount} repos</span>
                  </li>
                </>
              )}
            </ul>
          </BlurFade>
        </div>
        <BlurFade delay={STEP} className="flex-none">
          <div className="relative size-24 overflow-hidden rounded-full border border-border bg-muted sm:size-28">
            <Image
              src={DATA.avatarUrl}
              alt={`Pixel art portrait of ${DATA.name}`}
              fill
              priority
              sizes="112px"
              className="scale-[1.06] object-cover"
            />
          </div>
        </BlurFade>
      </section>

      <BlurFade delay={STEP * 3}>
        <Section id="about" title="About">
          <div className="space-y-4 leading-relaxed text-foreground/85">
            {DATA.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Section>
      </BlurFade>

      <BlurFade delay={STEP * 4}>
        <Section id="work" title="Experience">
          <div className="space-y-1">
            {DATA.work.map((work) => (
              <ResumeCard
                key={work.company}
                logoUrl={work.logoUrl}
                altText={work.company}
                title={work.company}
                subtitle={work.title}
                href={work.href}
                period={`${work.start} - ${work.end ?? "Present"}`}
                description={work.description}
              />
            ))}
          </div>
        </Section>
      </BlurFade>

      <BlurFade inView>
        <Section id="projects" title="Projects" more={{ href: "/projects", label: "All projects" }}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            {DATA.projects.slice(0, 4).map((project) => (
              <ProjectCard
                key={project.title}
                title={project.title}
                href={`/projects/${projectSlug(project)}`}
                description={project.description}
                dates={project.dates}
                image={project.image}
              />
            ))}
          </div>
        </Section>
      </BlurFade>

      <BlurFade inView>
        <Section id="writing" title="Writing" more={{ href: "/blog", label: "All posts" }}>
          <div>
            {posts.slice(0, 5).map((post) => (
              <PostRow
                key={post.slug}
                slug={post.slug}
                title={post.metadata.title}
                publishedAt={post.metadata.publishedAt}
                showYear
              />
            ))}
          </div>
        </Section>
      </BlurFade>

      <BlurFade inView>
        <Section id="skills" title="Stack">
          <dl className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-3 text-sm">
            {DATA.stack.map((group) => (
              <div key={group.label} className="contents">
                <dt className="meta pt-0.5">{group.label}</dt>
                <dd className="leading-relaxed text-foreground/85">
                  {group.items.join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      </BlurFade>

      <BlurFade inView>
        <Section id="education" title="Education">
          <div className="space-y-1">
            {DATA.education.map((education) => (
              <ResumeCard
                key={education.school}
                href={education.href}
                logoUrl={education.logoUrl}
                altText={education.school}
                title={education.school}
                subtitle={education.degree}
                period={`${education.start} - ${education.end}`}
              />
            ))}
          </div>
        </Section>
      </BlurFade>

      <BlurFade inView>
        <Section id="contact" title="Contact">
          <p className="text-lg leading-relaxed text-muted-foreground">
            Want to chat? Send me an{" "}
            <a href={DATA.contact.social.email.url} className="link">
              email
            </a>{" "}
            or a DM on{" "}
            <a
              href={DATA.contact.social.X.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              X
            </a>
            .
          </p>
        </Section>
      </BlurFade>
    </main>
  );
}
