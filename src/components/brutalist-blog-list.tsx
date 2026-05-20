"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchIcon, XIcon, CalendarIcon, TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const BLUR_FADE_DELAY = 0.04;

interface Post {
  slug: string;
  metadata: {
    title: string;
    publishedAt: string;
    summary: string;
    tags?: string[];
  };
}

interface BrutalistBlogListProps {
  initialPosts: Post[];
}

export function BrutalistBlogList({ initialPosts }: BrutalistBlogListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags across all posts
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    initialPosts.forEach((post) => {
      if (post.metadata.tags) {
        post.metadata.tags.forEach((t) => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet).sort();
  }, [initialPosts]);

  // Filter posts based on search query and selected tag
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesSearch =
        post.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.metadata.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.metadata.tags &&
          post.metadata.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesTag = selectedTag ? post.metadata.tags?.includes(selectedTag) : true;

      return matchesSearch && matchesTag;
    });
  }, [initialPosts, searchQuery, selectedTag]);

  return (
    <div className="space-y-8">
      {/* Search and Filter Panel */}
      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="space-y-4 font-mono">
          {/* Search Input Box */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search articles in Second Brain..."
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
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5 select-none">
              <TagIcon className="size-3" />
              <span>Browse by Category:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag(null)}
                className={cn(
                  "px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-none border transition-all cursor-pointer",
                  selectedTag === null
                    ? "border-black dark:border-white bg-foreground text-background"
                    : "border-black/20 dark:border-white/20 bg-muted hover:border-black dark:hover:border-white text-foreground"
                )}
              >
                All posts
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
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BlurFade>

      <Separator className="h-1 bg-black dark:bg-white" />

      {/* Dynamic Articles List */}
      <div className="space-y-6">
        {filteredPosts.map((post, id) => (
          <BlurFade delay={BLUR_FADE_DELAY * 3 + id * 0.04} key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="border-2 border-black dark:border-white p-5 bg-card text-card-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all duration-100 ease-out">
                
                {/* Meta details */}
                <div className="flex items-center gap-4 text-xs font-mono font-semibold text-muted-foreground mb-2 select-none">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="size-3" />
                    <span>{post.metadata.publishedAt}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight group-hover:underline decoration-2">
                  {post.metadata.title}
                </h3>

                {/* Summary */}
                <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed font-sans font-medium">
                  {post.metadata.summary}
                </p>

                {/* Tags Badges */}
                {post.metadata.tags && post.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 select-none">
                    {post.metadata.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border border-black/20 dark:border-white/20 bg-muted text-foreground transition-none"
                        variant="secondary"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </BlurFade>
        ))}

        {/* Empty Search State */}
        {filteredPosts.length === 0 && (
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <div className="border-2 border-dashed border-black dark:border-white p-12 text-center bg-muted rounded-none font-mono">
              <span className="block text-xl font-bold uppercase tracking-tight text-foreground/80 mb-2">
                Second Brain Offline // Query Empty
              </span>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No articles matched your criteria. Try adjusting your tags or running a broader keyword search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag(null);
                }}
                className="mt-6 border-2 border-black dark:border-white bg-card text-card-foreground text-xs uppercase font-extrabold tracking-wider px-4 py-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Reset Search constraints
              </button>
            </div>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
