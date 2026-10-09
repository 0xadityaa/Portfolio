import { FadeIn } from "@/components/fade-in";
import { ResumeCard } from "@/components/resume-card";
import { Section } from "@/components/section";
import { DATA } from "@/data/resume";
import { pageAlternates } from "@/lib/seo";

export const metadata = {
  title: "About",
  description: `About ${DATA.name}: background, experience, the stack I work in, and how to reach me.`,
  alternates: pageAlternates("/about"),
};

export default function AboutPage() {
  return (
    <main className="flex flex-col gap-16">
      <FadeIn>
        <header className="space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            About
          </h1>
          <div className="space-y-4 leading-relaxed text-foreground/85">
            {DATA.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.05}>
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
      </FadeIn>

      <FadeIn delay={0.1}>
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
      </FadeIn>

      <FadeIn delay={0.1}>
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
      </FadeIn>

      <FadeIn delay={0.1}>
        <Section id="contact" title="Contact">
          <ul className="space-y-2 text-foreground/85">
            <li>
              <a href={DATA.contact.social.email.url} className="link">
                {DATA.contact.email}
              </a>
            </li>
            {(["GitHub", "LinkedIn", "X"] as const).map((name) => (
              <li key={name}>
                <a
                  href={DATA.contact.social[name].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </FadeIn>
    </main>
  );
}
