"use client";

import React, { useState, useMemo } from "react";
import BlurFade from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/project-card";
import { DATA } from "@/data/resume";
import { SearchIcon, XIcon } from "lucide-react";

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
          <div className="border-b-4 border-black dark:border-white pb-3 mb-6">
            <h1 className="text-4xl font-extrabold tracking-tighter uppercase font-sans">
              Stuff I&apos;ve Built
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-2 font-medium">
              A comprehensive directory of my technical products, open-source utilities, and micro-services.
            </p>
          </div>
        </BlurFade>

        {/* Interactive Filters Bar */}
        <BlurFade delay={BLUR_FADE_DELAY * 2}>
          <div className="space-y-4 font-mono">
            {/* Search Input Box */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search projects (e.g. LLM, Deno, AWS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-black dark:border-white bg-background text-foreground px-10 py-2.5 text-sm select-text focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all rounded-none"
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
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Filter by Core Tech Stack:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 pb-1">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={cn(
                    "px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-none border transition-all cursor-pointer",
                    selectedTag === null
                      ? "border-black dark:border-white bg-foreground text-background"
                      : "border-black/20 dark:border-white/20 bg-muted hover:border-black dark:hover:border-white text-foreground"
                  )}
                >
                  All Tech
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={cn(
                      "px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-none border transition-all cursor-pointer",
                      selectedTag === tag
                        ? "border-black dark:border-white bg-foreground text-background"
                        : "border-black/20 dark:border-white/20 bg-muted hover:border-black dark:hover:border-white text-foreground"
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
            <div className="border-2 border-dashed border-black dark:border-white p-12 text-center bg-muted rounded-none font-mono">
              <span className="block text-xl font-bold uppercase tracking-tight text-foreground/80 mb-2">
                Specs Unmatched // Code Not Found
              </span>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active projects match your search constraints. Try running a different filter query.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag(null);
                }}
                className="mt-6 border-2 border-black dark:border-white bg-card text-card-foreground text-xs uppercase font-extrabold tracking-wider px-4 py-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
