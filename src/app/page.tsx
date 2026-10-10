import { Row, TermRow } from "@/components/row";
import { Section } from "@/components/section";
import { getAllBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { projectSlug } from "@/lib/projects";
import { formatMonthYear, yearRange } from "@/lib/utils";
import Link from "next/link";

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
    <main className="fade-in flex flex-col gap-16">
        <section id="about" className="space-y-4">
          <h1 className="sr-only">{DATA.name}</h1>
          {DATA.about.map((paragraph, index) => (
            <p key={paragraph} className={index === 0 ? "text-foreground" : "text-muted-foreground"}>
              {paragraph}
            </p>
          ))}
        </section>
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
        <Section id="stack" title="Stack">
          <dl className="space-y-3">
            {DATA.stack.map((group) => (
              <TermRow key={group.label} term={group.label} className="text-muted-foreground">
                {group.items.join(", ")}
              </TermRow>
            ))}
          </dl>
        </Section>
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
        <Section id="contact" title="Contact">
          <dl className="space-y-3">
            {contact.map((item) => (
              <TermRow key={item.label} term={item.label}>
                <a
                    href={item.href}
                    target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="link"
                  >
                    {item.text}
                </a>
              </TermRow>
            ))}
          </dl>
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
            sameAs: [
              DATA.contact.social.GitHub.url,
              DATA.contact.social.LinkedIn.url,
              DATA.contact.social.X.url,
            ],
          }),
        }}
      />
    </main>
  );
}
