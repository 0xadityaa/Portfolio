import { FadeIn } from "@/components/fade-in";
import {
  ProjectsClient,
  type FeaturedProject,
  type RepoSummary,
} from "@/components/projects-client";
import { DATA } from "@/data/resume";
import { getGitHubBuilderProfile } from "@/lib/github";
import { projectSlug } from "@/lib/projects";
import { pageAlternates } from "@/lib/seo";

export const metadata = {
  title: "Projects",
  description:
    "Open source work and side projects: AI agents, RAG systems, developer tools, and experiments.",
  alternates: pageAlternates("/projects"),
};

export const revalidate = 3600;

export default async function ProjectsPage() {
  const github = await getGitHubBuilderProfile("0xadityaa").catch(() => null);

  const featured: FeaturedProject[] = DATA.projects.map((project) => ({
    title: project.title,
    slug: projectSlug(project),
    description: project.description,
    dates: project.dates,
    image: project.image,
    technologies: project.technologies,
  }));

  // The rest of GitHub, minus what is already featured, placeholder data,
  // and repos with nothing to say about themselves.
  const featuredSlugs = new Set(featured.map((p) => p.slug.toLowerCase()));
  const repos: RepoSummary[] =
    github && !github.isMock
      ? github.repos
          .filter((repo) => repo.description && !featuredSlugs.has(repo.name.toLowerCase()))
          .map((repo) => ({
            name: repo.name,
            url: repo.url,
            description: repo.description,
            stargazerCount: repo.stargazerCount,
            pushedAt: repo.pushedAt,
            primaryLanguage: repo.primaryLanguage,
            tags: [...repo.topics, ...repo.languages],
          }))
      : [];

  return (
    <main className="space-y-10">
      <FadeIn>
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Projects
          </h1>
          <p className="max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
            From random experiments to full-blown web apps, here&apos;s a
            collection of things I&apos;ve built with code and caffeine.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.08}>
        <ProjectsClient featured={featured} repos={repos} />
      </FadeIn>
    </main>
  );
}
