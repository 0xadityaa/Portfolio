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
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <div className="gap-4 flex flex-col-reverse sm:flex-row justify-between items-start">
            <div className="flex-col flex flex-1 space-y-2">
              <BlurFadeText
                delay={BLUR_FADE_DELAY}
                className="text-4xl font-extrabold tracking-tighter sm:text-5xl xl:text-6xl/none font-sans uppercase"
                yOffset={8}
                text={`Hi, I'm ${DATA.name.split(" ")[0]}.`}
              />
              <BlurFadeText
                className="max-w-[600px] text-lg sm:text-xl font-mono text-muted-foreground font-semibold"
                delay={BLUR_FADE_DELAY}
                text={DATA.description}
              />
            </div>
            <BlurFade delay={BLUR_FADE_DELAY}>
              <div className="relative border-4 border-black dark:border-white p-1 bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Avatar className="size-20 sm:size-24 rounded-none border border-black/10 dark:border-white/10">
                  <AvatarImage alt={DATA.name} src={DATA.avatarUrl} className="object-cover rounded-none" />
                  <AvatarFallback className="rounded-none font-mono font-bold text-xl">{DATA.initials}</AvatarFallback>
                </Avatar>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* TERMINAL SECTION */}
      <section id="terminal" className="w-full max-w-2xl mx-auto">
        <BlurFade delay={BLUR_FADE_DELAY * 2}>
          <BrutalistTerminal />
        </BlurFade>
      </section>

      {/* ABOUT SECTION */}
      <section id="about">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <div className="border-b-4 border-black dark:border-white pb-1 mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase font-mono tracking-tight">01 // Profile Summary</h2>
            </div>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <Markdown className="prose max-w-full text-pretty font-sans text-base sm:text-lg leading-relaxed text-muted-foreground dark:prose-invert">
              {DATA.summary}
            </Markdown>
          </BlurFade>
        </div>
      </section>

      {/* GITHUB BUILDER SPEC CARD (DYNAMIC INTEGRATION) */}
      <section id="github-specs" className="w-full max-w-2xl mx-auto">
        <BlurFade delay={BLUR_FADE_DELAY * 5}>
          <div className="border-b-4 border-black dark:border-white pb-1 mb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold uppercase font-mono tracking-tight">02 // Live Builder Specifications</h2>
          </div>
          <div className="border-2 border-black dark:border-white p-5 bg-card text-card-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-mono text-sm rounded-none">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3 mb-4 select-none">
              <div className="flex items-center gap-2">
                <span className={`size-3 inline-block animate-pulse ${isOffline ? "bg-red-500" : "bg-green-500"}`}></span>
                <span className="font-bold tracking-tight">0xadityaa.json</span>
              </div>
              <span className="text-[10px] bg-muted border border-black dark:border-white px-2 py-0.5 font-bold uppercase tracking-wider">[ DYNAMIC STATE ]</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border-2 border-black dark:border-white p-3 bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Followers</div>
                <div className="text-xl font-bold mt-1">{githubData.followersCount}</div>
              </div>
              <div className="border-2 border-black dark:border-white p-3 bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Public Repos</div>
                <div className="text-xl font-bold mt-1">{githubData.publicReposCount}</div>
              </div>
              <div className="border-2 border-black dark:border-white p-3 bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Status</div>
                <div className={`text-xl font-bold mt-1 uppercase tracking-tight ${isOffline ? "text-red-500" : "text-green-500"}`}>
                  {isOffline ? "DEV_OFFLINE" : "ONLINE"}
                </div>
              </div>
              <div className="border-2 border-black dark:border-white p-3 bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Contributions</div>
                <div className="text-xl font-bold mt-1 uppercase text-foreground">
                  {githubData.contributionsCount}
                </div>
              </div>
            </div>
          </div>
        </BlurFade>
      </section>

      {/* SKILLS MARQUEE SECTION */}
      <section id="skills">
        <div className="w-full max-w-2xl mx-auto flex min-h-0 flex-col gap-y-3">
          <BlurFade delay={BLUR_FADE_DELAY * 6}>
            <div className="border-b-4 border-black dark:border-white pb-1 mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase font-mono tracking-tight">03 // Built-in Core Skills</h2>
            </div>
          </BlurFade>
          <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden border-2 border-black dark:border-white bg-background py-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
            <Marquee pauseOnHover className="[--duration:60s]">
              {DATA.skills.slice(0, Math.ceil(DATA.skills.length / 2)).map((skill) => {
                const iconUrl = customIcons[skill] || (iconSlugs[skill] ? `https://cdn.simpleicons.org/${iconSlugs[skill]}/000000` : null);
                return (
                  <div key={skill} className="flex items-center gap-2 mr-3 px-3 py-1.5 border-2 border-black dark:border-white bg-card text-card-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-mono text-xs font-semibold">
                    {iconUrl ? (
                      <Image
                        src={iconUrl}
                        className="size-3.5 brightness-0 dark:invert"
                        alt={skill}
                        width={14}
                        height={14}
                      />
                    ) : null}
                    <span>{skill}</span>
                  </div>
                );
              })}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:60s] mt-3">
              {DATA.skills.slice(Math.ceil(DATA.skills.length / 2)).map((skill) => {
                const iconUrl = customIcons[skill] || (iconSlugs[skill] ? `https://cdn.simpleicons.org/${iconSlugs[skill]}/000000` : null);
                return (
                  <div key={skill} className="flex items-center gap-2 mr-3 px-3 py-1.5 border-2 border-black dark:border-white bg-card text-card-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-mono text-xs font-semibold">
                    {iconUrl ? (
                      <Image
                        src={iconUrl}
                        className="size-3.5 brightness-0 dark:invert"
                        alt={skill}
                        width={14}
                        height={14}
                      />
                    ) : null}
                    <span>{skill}</span>
                  </div>
                );
              })}
            </Marquee>
          </div>
        </div>
      </section>

      {/* WORK EXPERIENCE */}
      <section id="work">
        <div className="w-full max-w-2xl mx-auto flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 7}>
            <div className="border-b-4 border-black dark:border-white pb-1 mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase font-mono tracking-tight">04 // Professional Track</h2>
            </div>
          </BlurFade>
          <div className="space-y-4">
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
            <div className="border-b-4 border-black dark:border-white pb-1 mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase font-mono tracking-tight">05 // Academic Foundations</h2>
            </div>
          </BlurFade>
          <div className="space-y-4">
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
        <div className="w-full max-w-2xl mx-auto py-8 border-t-4 border-black dark:border-white">
          <BlurFade delay={BLUR_FADE_DELAY * 11}>
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-extrabold tracking-tighter uppercase font-sans sm:text-4xl">
                Get in Touch
              </h2>
              <p className="mx-auto max-w-[500px] text-muted-foreground font-mono text-sm">
                Have an interesting problem to solve, or want to discuss architecture? Let&apos;s build something.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href={DATA.contact.social.email.url}
                  className="border-2 border-black dark:border-white bg-card text-card-foreground font-mono text-xs sm:text-sm px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all select-none font-bold uppercase tracking-wider"
                >
                  Send Email
                </Link>
                <Link
                  href={DATA.contact.social.X.url}
                  className="border-2 border-black dark:border-white bg-card text-card-foreground font-mono text-xs sm:text-sm px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all select-none font-bold uppercase tracking-wider"
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
