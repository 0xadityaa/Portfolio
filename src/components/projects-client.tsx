"use client";

import React, { useState, useMemo } from "react";
import BlurFade from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/project-card";
import { Icons } from "@/components/icons";

const BLUR_FADE_DELAY = 0.04;
const PROJECTS_PER_PAGE = 6;

// Broad category mapping — each granular tech maps to a high-level group
const TAG_CATEGORY_MAP: Record<string, string> = {
  // Frontend
  "React": "Frontend", "Next.js": "Frontend", "Vue": "Frontend", "Angular": "Frontend",
  "Svelte": "Frontend", "HTML": "Frontend", "CSS": "Frontend", "Tailwind CSS": "Frontend",
  "JavaScript": "Frontend", "TypeScript": "Frontend", "Vite": "Frontend",
  // Backend
  "Node.js": "Backend", "Express": "Backend", "FastAPI": "Backend", "Flask": "Backend",
  "Django": "Backend", "Spring": "Backend", "Go": "Backend", "Rust": "Backend",
  "Python": "Backend", "Java": "Backend", "C#": "Backend", "Ruby": "Backend",
  "GraphQL": "Backend", "REST": "Backend", "Prisma": "Backend", "Drizzle": "Backend",
  // AI / ML
  "LangChain": "AI / ML", "LangGraph": "AI / ML", "OpenAI": "AI / ML",
  "Azure OpenAI": "AI / ML", "Gemini": "AI / ML", "TensorFlow": "AI / ML",
  "PyTorch": "AI / ML", "Hugging Face": "AI / ML", "RAG": "AI / ML",
  "langgraph": "AI / ML", "langchain": "AI / ML",
  // Cloud & Infra
  "AWS": "Cloud", "GCP": "Cloud", "Azure": "Cloud", "Docker": "Cloud",
  "Kubernetes": "Cloud", "Terraform": "Cloud", "Vercel": "Cloud",
  "AWS S3": "Cloud", "Firebase": "Cloud",
  // Mobile
  "Flutter": "Mobile", "React Native": "Mobile", "Dart": "Mobile",
  "Swift": "Mobile", "Kotlin": "Mobile", "Android": "Mobile",
  // Data & DB
  "PostgreSQL": "Data", "MongoDB": "Data", "Redis": "Data", "Supabase": "Data",
  "MySQL": "Data", "SQLite": "Data", "Neo4j": "Data", "Elasticsearch": "Data",
  "supabase": "Data",
  // DevTools
  "Git": "DevTools", "CI/CD": "DevTools", "GitHub Actions": "DevTools",
  "Deno": "DevTools", "FFmpeg": "DevTools", "Socket.IO": "DevTools",
  "ffmpeg": "DevTools", "socketio": "DevTools",
};

function getCategoryForTag(tag: string): string {
  return TAG_CATEGORY_MAP[tag] || "Other";
}

interface Project {
  title: string;
  href: string;
  dates: string;
  active: boolean;
  description: string;
  technologies: readonly string[];
  links: readonly {
    type: string;
    href: string;
    icon: React.ReactNode;
  }[];
  image?: string;
  stargazerCount?: number;
  forkCount?: number;
  issuesCount?: number;
  commitsCount?: number;
}

interface ProjectsClientProps {
  projects: readonly Project[];
  githubRepos: any[];
}

export function ProjectsClient({ projects, githubRepos }: ProjectsClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Merge DATA.projects with githubRepos
  const mergedProjects = useMemo(() => {
    const list: Project[] = [];
    const usedRepoUrls = new Set<string>();

    projects.forEach((p) => {
      let stargazerCount: number | undefined = undefined;
      let forkCount: number | undefined = undefined;
      let issuesCount: number | undefined = undefined;
      let commitsCount: number | undefined = undefined;

      const isGitHubUrl = p.href ? p.href.startsWith("https://github.com") : false;
      const repoSlug = isGitHubUrl ? p.href.split("/").pop()?.toLowerCase() : "";

      let description = p.description;
      let technologies = p.technologies;

      if (repoSlug) {
        const match = githubRepos.find((r: any) => r.name.toLowerCase() === repoSlug);
        if (match) {
          stargazerCount = match.stargazerCount;
          forkCount = match.forkCount;
          issuesCount = match.issuesCount;
          commitsCount = match.commitsCount;
          usedRepoUrls.add(match.url.toLowerCase());
          
          // Override description and tags from GitHub if available
          if (match.description) description = match.description;
          if (match.languages && match.languages.length > 0) technologies = match.languages;
        }
      }

      list.push({
        ...p,
        description,
        technologies,
        stargazerCount,
        forkCount,
        issuesCount,
        commitsCount,
      });
    });

    githubRepos.forEach((repo: any) => {
      if (usedRepoUrls.has(repo.url.toLowerCase())) return;

      const links = [];
      if (repo.homepageUrl) {
        links.push({
          type: "Website",
          href: repo.homepageUrl,
          icon: <Icons.globe className="size-3" />,
        });
      }
      links.push({
        type: "Source",
        href: repo.url,
        icon: <Icons.github className="size-3" />,
      });

      list.push({
        title: repo.name,
        href: repo.url,
        dates: "Live on GitHub",
        active: true,
        description: repo.description,
        technologies: repo.languages || [],
        links,
        stargazerCount: repo.stargazerCount,
        forkCount: repo.forkCount,
        issuesCount: repo.issuesCount,
        commitsCount: repo.commitsCount,
        image: repo.openGraphImageUrl || undefined,
      });
    });

    return list;
  }, [projects, githubRepos]);

  // Extract consolidated category tags
  const allCategories = useMemo(() => {
    const catSet = new Set<string>();
    mergedProjects.forEach((p) => {
      p.technologies.forEach((t) => {
        catSet.add(getCategoryForTag(t));
      });
    });
    return Array.from(catSet).sort();
  }, [mergedProjects]);

  // Filter projects based on selected category
  const filteredProjects = useMemo(() => {
    return mergedProjects.filter((project) => {
      if (!selectedTag) return true;
      return (project.technologies as readonly string[]).some(
        (t) => getCategoryForTag(t) === selectedTag
      );
    });
  }, [mergedProjects, selectedTag]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedTag]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PROJECTS_PER_PAGE;
    return filteredProjects.slice(start, start + PROJECTS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto">
      
      {/* Page Title & Subtitle */}
      <BlurFade delay={BLUR_FADE_DELAY}>
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl text-foreground">
            Stuff I&apos;ve Built
          </h1>
          <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            From random experiments to full-blown web apps, here&apos;s a collection of things I&apos;ve built with code and caffeine.
          </p>
        </div>
      </BlurFade>

      {/* Tags */}
      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border border-border bg-card hover:bg-muted/50 hover:text-foreground",
                selectedTag === null
                  ? "bg-foreground text-background hover:bg-foreground/90 border-foreground"
                  : "text-muted-foreground"
              )}
            >
              All
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedTag(selectedTag === cat ? null : cat)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border border-border bg-card hover:bg-muted/50 hover:text-foreground",
                  selectedTag === cat
                    ? "bg-foreground text-background hover:bg-foreground/90 border-foreground"
                    : "text-muted-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </BlurFade>

      {/* Dynamic Project List */}
      <div className="flex flex-col gap-6 pt-2">
        {paginatedProjects.map((project, id) => (
          <BlurFade
            key={project.href || project.title}
            delay={BLUR_FADE_DELAY * 3 + id * 0.04}
          >
            <ProjectCard
              href={project.href}
              title={project.title}
              description={project.description}
              dates={project.dates}
              tags={Array.from(new Set(project.technologies.map(getCategoryForTag)))}
              image={project.image}
              links={project.links}
              stargazerCount={project.stargazerCount}
              forkCount={project.forkCount}
              issuesCount={project.issuesCount}
              commitsCount={project.commitsCount}
            />
          </BlurFade>
        ))}
      </div>

      {/* Empty Filter State */}
      {filteredProjects.length === 0 && (
        <BlurFade delay={BLUR_FADE_DELAY * 3}>
          <div className="p-12 text-center bg-muted/50 rounded-xl border border-border mt-8">
            <span className="block text-lg font-semibold text-foreground/80 mb-2">
              No projects found
            </span>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No active projects match your filter. Try a different tag.
            </p>
            <button
              onClick={() => {
                setSelectedTag(null);
              }}
              className="mt-6 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90 transition-colors cursor-pointer border border-transparent"
            >
              Reset Filters
            </button>
          </div>
        </BlurFade>
      )}

      {/* Pagination Controls — same style as blog */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-8 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}
