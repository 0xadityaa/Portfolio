"use client";

import { FilterChips } from "@/components/filter-chips";
import { PostRow } from "@/components/post-row";
import { getYear } from "@/lib/utils";
import { Search as SearchIcon, X as XIcon } from "lucide-react";
import { useMemo, useState } from "react";

// Broad category mapping for blog tags
const BLOG_TAG_CATEGORY_MAP: Record<string, string> = {
  "nextjs": "Frontend", "react": "Frontend", "vue": "Frontend", "css": "Frontend",
  "typescript": "Frontend", "javascript": "Frontend", "html": "Frontend",
  "node": "Backend", "python": "Backend", "go": "Backend", "rust": "Backend",
  "api": "Backend", "graphql": "Backend", "rest": "Backend",
  "ai": "AI / ML", "ml": "AI / ML", "llm": "AI / ML", "langchain": "AI / ML",
  "openai": "AI / ML", "rag": "AI / ML", "agents": "AI / ML",
  "aws": "Cloud", "gcp": "Cloud", "azure": "Cloud", "docker": "Cloud",
  "kubernetes": "Cloud", "devops": "Cloud", "ci-cd": "Cloud", "finops": "Cloud",
  "database": "Data", "postgresql": "Data", "mongodb": "Data", "redis": "Data", "db": "Data",
  "architecture": "Engineering", "system-design": "Engineering", "patterns": "Engineering",
  "testing": "Engineering", "performance": "Engineering", "security": "Engineering",
  "microservices": "Engineering", "distributed-systems": "Engineering",
  "algorithms": "Computer science", "dsa": "Computer science", "computer science": "Computer science",
};

function getBlogCategory(tag: string): string | null {
  return BLOG_TAG_CATEGORY_MAP[tag.toLowerCase()] ?? null;
}

interface Post {
  slug: string;
  metadata: {
    title: string;
    publishedAt: string;
    summary: string;
    tags?: string[];
  };
}

export function BlogList({ initialPosts }: { initialPosts: Post[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    const catSet = new Set<string>();
    initialPosts.forEach((post) =>
      post.metadata.tags?.forEach((t) => {
        const category = getBlogCategory(t);
        if (category) catSet.add(category);
      })
    );
    return Array.from(catSet).sort();
  }, [initialPosts]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialPosts.filter((post) => {
      const matchesSearch =
        !q ||
        post.metadata.title.toLowerCase().includes(q) ||
        post.metadata.summary.toLowerCase().includes(q) ||
        post.metadata.tags?.some((t) => t.toLowerCase().includes(q));

      const matchesTag = selectedTag
        ? post.metadata.tags?.some((t) => getBlogCategory(t) === selectedTag)
        : true;

      return matchesSearch && matchesTag;
    });
  }, [initialPosts, searchQuery, selectedTag]);

  // Posts arrive newest first, so years come out in descending order.
  const postsByYear = useMemo(() => {
    const groups = new Map<number, Post[]>();
    filteredPosts.forEach((post) => {
      const year = getYear(post.metadata.publishedAt);
      groups.set(year, [...(groups.get(year) ?? []), post]);
    });
    return Array.from(groups.entries());
  }, [filteredPosts]);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="relative flex items-center">
          <label htmlFor="post-search" className="sr-only">
            Search posts
          </label>
          <SearchIcon
            className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
            aria-hidden
          />
          <input
            id="post-search"
            type="search"
            placeholder="Search posts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-9 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:border-foreground/20 focus-visible:border-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              <XIcon className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <FilterChips
          label="Filter by topic"
          allLabel="All posts"
          options={allCategories}
          value={selectedTag}
          onChange={setSelectedTag}
        />
      </div>

      <p className="sr-only" role="status">
        {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
      </p>

      {postsByYear.map(([year, posts]) => (
        <section key={year} aria-label={`Posts from ${year}`}>
          <h2 className="meta mb-2 border-b border-border pb-2">{year}</h2>
          <div>
            {posts.map((post) => (
              <PostRow
                key={post.slug}
                slug={post.slug}
                title={post.metadata.title}
                summary={post.metadata.summary}
                publishedAt={post.metadata.publishedAt}
              />
            ))}
          </div>
        </section>
      ))}

      {filteredPosts.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="font-medium text-foreground">No posts match that</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Try a broader search, or clear the topic filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedTag(null);
            }}
            className="mt-5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.97]"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
