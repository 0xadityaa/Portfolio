import { FadeIn } from "@/components/fade-in";
import { Row } from "@/components/row";
import { Section } from "@/components/section";
import { getAllBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { projectSlug } from "@/lib/projects";
import { formatMonthYear, yearRange } from "@/lib/utils";
import Link from "next/link";

const STEP = 0.05;

// Re-rendered every 10 minutes so scheduled posts appear when their publish time passes.
export const revalidate = 600;

const contact = [
  { label: "Email", text: DATA.contact.email, href: DATA.contact.social.email.url },
  { label: "GitHub", text: "0xadityaa", href: DATA.contact.social.GitHub.url },
  { label: "LinkedIn", text: "aditya-negandhi", href: DATA.contact.social.LinkedIn.url },
  { label: "X", text: "@0xadityaa", href: DATA.contact.social.X.url },
];

export default async function Page() {
  const posts = await getAllBlogPosts();

  return (
    <main className="flex flex-col gap-16">
      <FadeIn>
        <section id="about" className="space-y-4">
          <h1 className="sr-only">{DATA.name}</h1>
          <p className="text-foreground">{DATA.description}</p>
          {DATA.about.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      </FadeIn>

      <FadeIn delay={STEP}>
        <Section id="work" title="Experience">
          <div className="space-y-6">
            {DATA.work.map((work) => (
              <Row key={work.company} meta={yearRange(work.start, work.end)}>
                <h3 className="text-foreground">
                  {work.title} at{" "}
                  <a href={work.href} target="_blank" rel="noopener noreferrer" className="link">
                    {work.company}
                  </a>
                </h3>
                <p className="mt-1 text-muted-foreground">{work.description}</p>
              </Row>
            ))}
          </div>
        </Section>
      </FadeIn>

      <FadeIn delay={STEP * 2}>
        <Section id="projects" title="Projects" more={{ href: "/projects", label: "All projects" }}>
          <ul className="rows">
            {DATA.projects.slice(0, 4).map((project) => (
              <li key={project.title}>
                <Link href={`/projects/${projectSlug(project)}`} className="row-link">
                  <Row meta={yearRange(project.dates, project.dates)}>
                    <h3 className="text-foreground">{project.title}</h3>
                    <p className="mt-0.5 text-muted-foreground">{project.description}</p>
                  </Row>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </FadeIn>

      <FadeIn delay={STEP * 3}>
        <Section id="writing" title="Writing" more={{ href: "/blog", label: "All posts" }}>
          <ul className="rows">
            {posts.slice(0, 5).map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="row-link">
                  <Row
                    meta={
                      <time dateTime={post.metadata.publishedAt}>
                        {formatMonthYear(post.metadata.publishedAt)}
                      </time>
                    }
                  >
                    <h3 className="text-foreground">{post.metadata.title}</h3>
                  </Row>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </FadeIn>

      <FadeIn delay={STEP * 4}>
        <Section id="stack" title="Stack">
          <dl className="space-y-3">
            {DATA.stack.map((group) => (
              <Row key={group.label} meta={<dt>{group.label}</dt>}>
                <dd className="text-muted-foreground">{group.items.join(", ")}</dd>
              </Row>
            ))}
          </dl>
        </Section>
      </FadeIn>

      <FadeIn delay={STEP * 4}>
        <Section id="education" title="Education">
          <div className="space-y-3">
            {DATA.education.map((education) => (
              <Row key={education.school} meta={yearRange(education.start, education.end)}>
                <h3 className="text-foreground">
                  {education.degree},{" "}
                  <a href={education.href} target="_blank" rel="noopener noreferrer" className="link">
                    {education.school}
                  </a>
                </h3>
              </Row>
            ))}
          </div>
        </Section>
      </FadeIn>

      <FadeIn delay={STEP * 4}>
        <Section id="contact" title="Contact">
          <dl className="space-y-3">
            {contact.map((item) => (
              <Row key={item.label} meta={<dt>{item.label}</dt>}>
                <dd>
                  <a
                    href={item.href}
                    target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="link"
                  >
                    {item.text}
                  </a>
                </dd>
              </Row>
            ))}
          </dl>
        </Section>
      </FadeIn>
    </main>
  );
}
