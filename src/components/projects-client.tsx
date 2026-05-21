"use client";

import React, { useState, useMemo } from "react";
import BlurFade from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/project-card";
import { Icons } from "@/components/icons";

const BLUR_FADE_DELAY = 0.04;

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
  githubRepos: any[]; // Array of GitHubPinnedRepo from github.ts
}

export function ProjectsClient({ projects, githubRepos }: ProjectsClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Merge DATA.projects with githubRepos
  const mergedProjects = useMemo(() => {
    const list: Project[] = [];
    const usedRepoUrls = new Set<string>();

    // 1. Process manual projects and attach stats if matched
    projects.forEach((p) => {
      let stargazerCount: number | undefined = undefined;
      let forkCount: number | undefined = undefined;
      let issuesCount: number | undefined = undefined;
      let commitsCount: number | undefined = undefined;

      const isGitHubUrl = p.href ? p.href.startsWith("https://github.com") : false;
      const repoSlug = isGitHubUrl ? p.href.split("/").pop()?.toLowerCase() : "";

      if (repoSlug) {
        const match = githubRepos.find((r) => r.name.toLowerCase() === repoSlug);
        if (match) {
          stargazerCount = match.stargazerCount;
          forkCount = match.forkCount;
          issuesCount = match.issuesCount;
          commitsCount = match.commitsCount;
          usedRepoUrls.add(match.url.toLowerCase());
        }
      }

      list.push({
        ...p,
        stargazerCount,
        forkCount,
        issuesCount,
        commitsCount,
      });
    });

    // 2. Add remaining github repos
    githubRepos.forEach((repo) => {
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

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    mergedProjects.forEach((p) => {
      p.technologies.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  }, [mergedProjects]);

  // Filter projects based on selected tag
  const filteredProjects = useMemo(() => {
    return mergedProjects.filter((project) => {
      return selectedTag ? (project.technologies as readonly string[]).includes(selectedTag) : true;
    });
  }, [mergedProjects, selectedTag]);

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

      {/* Interactive Filters Bar */}
      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Filter by Core Tech Stack:
            </div>
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-4 scroll-smooth w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
              <button
                onClick={() => setSelectedTag(null)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border border-border bg-card hover:bg-muted/50 hover:text-foreground",
                  selectedTag === null
                    ? "bg-foreground text-background hover:bg-foreground/90 border-foreground"
                    : "text-muted-foreground"
                )}
              >
                All Tech
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border border-border bg-card hover:bg-muted/50 hover:text-foreground",
                    selectedTag === tag
                      ? "bg-foreground text-background hover:bg-foreground/90 border-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BlurFade>

      {/* Dynamic Project List (Single Column Layout) */}
      <div className="flex flex-col gap-6 pt-2">
        {filteredProjects.map((project, id) => (
          <BlurFade
            key={project.href || project.title}
            delay={BLUR_FADE_DELAY * 3 + id * 0.04}
          >
            <ProjectCard
              href={project.href}
              title={project.title}
              description={project.description}
              dates={project.dates}
              tags={project.technologies}
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
              No active projects match your search constraints. Try running a different filter query.
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
    </div>
  );
}
