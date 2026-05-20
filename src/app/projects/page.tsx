"use client";

import React, { useState, useMemo } from "react";
import BlurFade from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/project-card";
import { DATA } from "@/data/resume";
import { Search as SearchIcon, X as XIcon } from "lucide-react";

const BLUR_FADE_DELAY = 0.04;

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags across all projects
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    DATA.projects.forEach((p) => {
      p.technologies.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  }, []);

  // Filter projects based on search query and selected tag
  const filteredProjects = useMemo(() => {
    return DATA.projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.technologies.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = selectedTag ? (project.technologies as readonly string[]).includes(selectedTag) : true;

      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  return (
    <section id="projects" className="py-8">
      <div className="space-y-8 w-full max-w-2xl mx-auto">
        
        {/* Page Title & Subtitle */}
        <BlurFade delay={BLUR_FADE_DELAY}>
          <div className="flex flex-col gap-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Projects
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              A directory of my technical products, open-source utilities, and micro-services.
            </p>
          </div>
        </BlurFade>

        {/* Interactive Filters Bar */}
        <BlurFade delay={BLUR_FADE_DELAY * 2}>
          <div className="space-y-4">
            {/* Search Input Box */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search projects (e.g. LLM, React, Python)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted text-foreground px-10 py-3 text-sm rounded-xl border border-transparent focus:outline-none focus:border-border transition-colors"
              />
              <SearchIcon className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>

            {/* Tag Selection Bar */}
            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground font-medium">
                Filter by Core Tech Stack:
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer",
                    selectedTag === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  All Tech
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer",
                      selectedTag === tag
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Dynamic Project Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
          {filteredProjects.map((project, id) => (
            <BlurFade
              key={project.title}
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
                  setSearchQuery("");
                  setSelectedTag(null);
                }}
                className="mt-6 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          </BlurFade>
        )}
      </div>
    </section>
  );
}
