"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, X as XIcon, Calendar as CalendarIcon, Tag as TagIcon } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 4;

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

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  return (
    <div className="space-y-8 mt-6">
      {/* Search and Filter Panel */}
      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="space-y-4">
          {/* Search Input Box */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search articles..."
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
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer",
                  selectedTag === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                All posts
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
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BlurFade>

      {/* Dynamic Articles List */}
      <div className="space-y-4 pt-4">
        {paginatedPosts.map((post, id) => (
          <BlurFade delay={BLUR_FADE_DELAY * 3 + id * 0.04} key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="p-5 -mx-5 rounded-xl border border-transparent hover:border-border bg-transparent hover:bg-muted/30 transition-all duration-300 ease-out">
                
                {/* Meta details */}
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <CalendarIcon className="size-3" />
                  <span>{post.metadata.publishedAt}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold tracking-tight text-foreground minimal-link inline-block">
                  {post.metadata.title}
                </h3>

                {/* Summary */}
                <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                  {post.metadata.summary}
                </p>

                {/* Tags Badges */}
                {post.metadata.tags && post.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.metadata.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted"
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
            <div className="p-12 text-center bg-muted/50 rounded-xl border border-border mt-8">
              <span className="block text-lg font-semibold text-foreground/80 mb-2">
                No articles found
              </span>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No articles matched your criteria. Try adjusting your tags or running a broader keyword search.
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

        {/* Pagination Controls */}
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
    </div>
  );
}
