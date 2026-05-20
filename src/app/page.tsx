import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { ResumeCard } from "@/components/resume-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DATA } from "@/data/resume";
import Link from "next/link";
import Markdown from "react-markdown";
import Image from "next/image";
import Marquee from "@/components/magicui/marquee";
import { Icons } from "@/components/icons";
import { BrutalistTerminal } from "@/components/brutalist-terminal";

const BLUR_FADE_DELAY = 0.04;

const iconSlugs: { [key: string]: string } = {
  "React": "react",
  "Nest.js": "nestjs",
  "Tanstack": "reactquery",
  "Next.js": "nextdotjs",
  "React Native": "react",
  "Node": "nodedotjs",
  "Bun": "bun",
  "Deno": "deno",
  "Javascript": "javascript",
  "Typescript": "typescript",
  "React Query": "reactquery",
  "Redux": "redux",
  "Tailwind": "tailwindcss",
  "Jest": "jest",
  "Playwright": "playwright",
  "Sentry": "sentry",
  "Storybook": "storybook",
  "Java": "openjdk",
  "Spring Boot": "springboot",
  "Docker": "docker",
  "MS SQL": "microsoftsqlserver",
  "MySQL": "mysql",
  "PostgreSQL": "postgresql",
  "MongoDB": "mongodb",
  "DynamoDB": "amazondynamodb",
  "Firebase": "firebase",
  "FastAPI": "fastapi",
  "Supabase": "supabase",
  "Convex": "convex",
  "Redis": "redis",
  "Kafka": "apachekafka",
  "WebSockets": "socketdotio",
  "ORM's [Prisma, Drizzle, Hibernate, SQLAlchemy]": "prisma",
  "Git": "git",
  "GitHub Actions": "githubactions",
  "Azure": "microsoftazure",
  "Azure DevOps": "azuredevops",
  "GCP": "googlecloud",
  "Vercel": "vercel",
  "Vercel AI SDK": "vercel",
  "LangChain": "langchain",
  "LangGraph": "langchain",
  "Vertex AI": "googlecloud",
  "MCP": "anthropic",
  "Vector Search": "algolia",
  "Opentelemetry": "opentelemetry",
  "Datadog": "datadog",
  "Python": "python",
  "Go": "go",
  "C++": "cplusplus",
  "C#": "csharp",
  "Linux": "linux",
  "Terraform": "terraform",
  "Ansible": "ansible",
  "Kubernetes": "kubernetes",
  "Grafana": "grafana",
};

const customIcons: { [key: string]: string } = {
  "DynamoDB": "https://svgl.app/library/dynamodb.svg",
  "Azure": "https://svgl.app/library/azure.svg",
  "Azure DevOps": "https://svgl.app/library/azure.svg",
  "MS SQL": Icons.mssql,
  "Playwright": "https://svgl.app/library/playwright.svg",
  "Convex": "https://svgl.app/library/convex.svg",
  "MCP": Icons.mcp,
  "TensorFlow": "https://www.vectorlogo.zone/logos/tensorflow/tensorflow-icon.svg",
  "Prisma": "https://svgl.app/library/prisma.svg",
  "TypeORM": "https://svgl.app/library/typeorm.svg",
};

import { getGitHubBuilderProfile } from "@/lib/github";
import { BookMarked } from "lucide-react";

export default async function Page() {
  let githubData;
  let isOffline = false;

  try {
    githubData = await getGitHubBuilderProfile("0xadityaa");
  } catch (err) {
    isOffline = true;
    githubData = {
      name: DATA.name,
      bio: DATA.description,
      company: "Enercare",
      location: DATA.location,
      avatarUrl: DATA.avatarUrl,
      followersCount: 36,
      publicReposCount: DATA.projects.length + 12,
      contributionsCount: 1842,
      pinnedRepos: [],
    };
  }

  return (
    <main className="flex flex-col min-h-[100dvh] space-y-12 mb-24 overflow-x-hidden pt-4">
      {/* HERO SECTION */}
      <section id="hero">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="gap-6 flex flex-col-reverse sm:flex-row justify-between items-start">
            <div className="flex-col flex flex-1 space-y-4">
              <BlurFadeText
                delay={BLUR_FADE_DELAY}
                className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl/none"
                yOffset={8}
                text={DATA.name}
              />
              <BlurFadeText
                className="max-w-[600px] text-lg sm:text-xl text-muted-foreground leading-relaxed"
                delay={BLUR_FADE_DELAY}
                text={DATA.description}
              />
              
              {/* MINIMAL GITHUB STATS */}
              <BlurFade delay={BLUR_FADE_DELAY * 2}>
                <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${isOffline ? "bg-red-500" : "bg-green-500"}`}></span>
                    <span>{isOffline ? "Offline" : "Available"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icons.github className="size-4" />
                    <span>{githubData.contributionsCount.toLocaleString()} contributions</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <BookMarked className="size-4" />
                    <span>{githubData.publicReposCount} repos</span>
                  </div>
                </div>
              </BlurFade>
            </div>
            <BlurFade delay={BLUR_FADE_DELAY}>
              <Avatar className="size-24 sm:size-32 rounded-2xl border border-border">
                <AvatarImage alt={DATA.name} src={DATA.avatarUrl} className="object-cover" />
                <AvatarFallback className="rounded-2xl font-medium text-xl bg-muted text-muted-foreground">{DATA.initials}</AvatarFallback>
              </Avatar>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <h2 className="text-sm tracking-widest text-muted-foreground uppercase font-medium">About</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <Markdown className="prose prose-neutral dark:prose-invert max-w-full text-pretty text-base sm:text-lg leading-relaxed text-foreground">
              {DATA.summary}
            </Markdown>
          </BlurFade>
        </div>
      </section>

      {/* SKILLS MARQUEE SECTION */}
      <section id="skills">
        <div className="w-full max-w-2xl mx-auto flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 6}>
            <h2 className="text-sm tracking-widest text-muted-foreground uppercase font-medium">Tech Stack</h2>
          </BlurFade>
          <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden py-4 mask-edges">
            <Marquee pauseOnHover className="[--duration:60s]">
              {DATA.skills.slice(0, Math.ceil(DATA.skills.length / 2)).map((skill) => {
                const iconUrl = customIcons[skill] || (iconSlugs[skill] ? `https://cdn.simpleicons.org/${iconSlugs[skill]}/000000` : null);
                return (
                  <div key={skill} className="flex items-center gap-2 mr-4 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium">
                    {iconUrl ? (
                      <Image
                        src={iconUrl}
                        className="size-4 brightness-0 dark:invert opacity-70"
                        alt={skill}
                        width={16}
                        height={16}
                      />
                    ) : null}
                    <span>{skill}</span>
                  </div>
                );
              })}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:60s] mt-4">
              {DATA.skills.slice(Math.ceil(DATA.skills.length / 2)).map((skill) => {
                const iconUrl = customIcons[skill] || (iconSlugs[skill] ? `https://cdn.simpleicons.org/${iconSlugs[skill]}/000000` : null);
                return (
                  <div key={skill} className="flex items-center gap-2 mr-4 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium">
                    {iconUrl ? (
                      <Image
                        src={iconUrl}
                        className="size-4 brightness-0 dark:invert opacity-70"
                        alt={skill}
                        width={16}
                        height={16}
                      />
                    ) : null}
                    <span>{skill}</span>
                  </div>
                );
              })}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
          </div>
        </div>
      </section>

      {/* WORK EXPERIENCE */}
      <section id="work">
        <div className="w-full max-w-2xl mx-auto flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 7}>
            <h2 className="text-sm tracking-widest text-muted-foreground uppercase font-medium">Experience</h2>
          </BlurFade>
          <div className="space-y-6">
            {DATA.work.map((work, id) => (
              <BlurFade
                key={work.company}
                delay={BLUR_FADE_DELAY * 8 + id * 0.05}
              >
                <ResumeCard
                  logoUrl={work.logoUrl}
                  altText={work.company}
                  title={work.company}
                  subtitle={work.title}
                  href={work.href}
                  period={`${work.start} - ${work.end ?? "Present"}`}
                  description={work.description}
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* EDUCATION */}
      <section id="education">
        <div className="w-full max-w-2xl mx-auto flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 9}>
            <h2 className="text-sm tracking-widest text-muted-foreground uppercase font-medium">Education</h2>
          </BlurFade>
          <div className="space-y-6">
            {DATA.education.map((education, id) => (
              <BlurFade
                key={education.school}
                delay={BLUR_FADE_DELAY * 10 + id * 0.05}
              >
                <ResumeCard
                  href={education.href}
                  logoUrl={education.logoUrl}
                  altText={education.school}
                  title={education.school}
                  subtitle={education.degree}
                  period={`${education.start} - ${education.end}`}
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <div className="w-full max-w-2xl mx-auto py-12 mt-12 border-t border-border">
          <BlurFade delay={BLUR_FADE_DELAY * 11}>
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                Get in Touch
              </h2>
              <p className="mx-auto max-w-[500px] text-muted-foreground text-sm sm:text-base">
                Have an interesting problem to solve, or want to discuss architecture? Let&apos;s build something.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link
                  href={DATA.contact.social.email.url}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium transition-transform hover:scale-105"
                >
                  Send Email
                </Link>
                <Link
                  href={DATA.contact.social.X.url}
                  className="px-6 py-3 bg-muted text-foreground rounded-full text-sm font-medium transition-transform hover:scale-105"
                >
                  Twitter / X DM
                </Link>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>
    </main>
  );
}
