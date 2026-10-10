"use client";

import { FilterChips } from "@/components/filter-chips";
import { Row } from "@/components/row";
import { formatShortDate, getYear } from "@/lib/utils";
import Link from "next/link";
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

  const filteredPosts = useMemo(
    () =>
      initialPosts.filter((post) =>
        selectedTag
          ? post.metadata.tags?.some((t) => getBlogCategory(t) === selectedTag)
          : true
      ),
    [initialPosts, selectedTag]
  );

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
      <FilterChips
        label="Filter by topic"
        allLabel="All"
        options={allCategories}
        value={selectedTag}
        onChange={setSelectedTag}
      />

      <p className="sr-only" role="status">
        {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
      </p>

      <div className="rows space-y-8">
        {postsByYear.map(([year, posts]) => (
          <section key={year} aria-labelledby={`posts-${year}`}>
            <h2 id={`posts-${year}`} className="sr-only">
              {year}
            </h2>
            <ul>
              {posts.map((post, index) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="row-link">
                    <Row meta={index === 0 ? <span aria-hidden>{year}</span> : null}>
                      <div className="flex items-baseline justify-between gap-6">
                        <h3 className="text-foreground">{post.metadata.title}</h3>
                        <time dateTime={post.metadata.publishedAt} className="meta hidden flex-none sm:block">
                          {formatShortDate(post.metadata.publishedAt)}
                        </time>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                        {post.metadata.summary}
                      </p>
                    </Row>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
