"use client";

import { FilterChips } from "@/components/filter-chips";
import { ProjectCard } from "@/components/project-card";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";

const REPOS_PER_PAGE = 8;

// Broad category mapping: each granular tech maps to a high-level group
const TAG_CATEGORY_MAP: Record<string, string> = {
  // Frontend
  "React": "Frontend", "Next.js": "Frontend", "Vue": "Frontend", "Angular": "Frontend",
  "Svelte": "Frontend", "HTML": "Frontend", "CSS": "Frontend", "Tailwind CSS": "Frontend",
  "JavaScript": "Frontend", "TypeScript": "Frontend", "Vite": "Frontend", "Tailwind + ShadCN": "Frontend",
  "TailwindCSS": "Frontend", "Shadcn UI": "Frontend", "Remix": "Frontend", "nextjs": "Frontend",
  // Backend
  "Node.js": "Backend", "Express": "Backend", "FastAPI": "Backend", "Flask": "Backend",
  "Django": "Backend", "Spring": "Backend", "Go": "Backend", "Rust": "Backend",
  "Python": "Backend", "Java": "Backend", "C#": "Backend", "Ruby": "Backend",
  "GraphQL": "Backend", "REST": "Backend", "Prisma": "Backend", "Drizzle": "Backend", "Fast API": "Backend",
  "WebSockets": "Backend", "WASM": "Backend", "Socket.io": "Backend",
  // AI / ML
  "LangChain": "AI / ML", "LangGraph": "AI / ML", "OpenAI": "AI / ML",
  "Azure OpenAI": "AI / ML", "Gemini": "AI / ML", "TensorFlow": "AI / ML",
  "PyTorch": "AI / ML", "Hugging Face": "AI / ML", "RAG": "AI / ML", "GPT-4o": "AI / ML",
  "Gemini 2.5 Pro": "AI / ML", "Gemini 2.5 Flash": "AI / ML", "Gemini 2.5 Flash + 2.5 Pro": "AI / ML",
  "Claude": "AI / ML", "Vercel AI SDK": "AI / ML",
  // Cloud & Infra
  "AWS": "Cloud", "GCP": "Cloud", "Azure": "Cloud", "Docker": "Cloud",
  "Kubernetes": "Cloud", "Terraform": "Cloud", "Vercel": "Cloud",
  "AWS S3": "Cloud", "Firebase": "Cloud", "Inngest": "Cloud", "Serverless": "Cloud",
  "Dapr": "Cloud", "FCM": "Cloud",
  // Mobile
  "Flutter": "Mobile", "React Native": "Mobile", "Dart": "Mobile",
  "Swift": "Mobile", "Kotlin": "Mobile", "Android": "Mobile", "iOS": "Mobile",
  // Data & DB
  "PostgreSQL": "Data", "MongoDB": "Data", "Redis": "Data", "Supabase": "Data",
  "MySQL": "Data", "SQLite": "Data", "Neo4j": "Data", "Elasticsearch": "Data",
  "Spanner Graph DB": "Data", "Pandas": "Data", "Firestore": "Data",
  // DevTools & Core
  "Git": "DevTools", "CI/CD": "DevTools", "GitHub Actions": "DevTools",
  "Deno": "DevTools", "FFmpeg": "DevTools",
  "Playwright": "DevTools", "Tokenizer": "DevTools", "Parser": "DevTools", "AST": "DevTools",
  "Bash": "DevTools", "Shell": "DevTools",
};

const CATEGORY_BY_LOWERCASE_TAG = new Map(
  Object.entries(TAG_CATEGORY_MAP).map(([tag, category]) => [tag.toLowerCase(), category])
);

function categoriesFor(tags: readonly string[]) {
  const categories = new Set<string>();
  tags.forEach((tag) => {
    const category = CATEGORY_BY_LOWERCASE_TAG.get(tag.toLowerCase());
    if (category) categories.add(category);
  });
  return categories;
}

export interface FeaturedProject {
  title: string;
  slug: string;
  description: string;
  dates: string;
  image?: string;
  technologies: readonly string[];
}

export interface RepoSummary {
  name: string;
  url: string;
  description: string;
  stargazerCount: number;
  pushedAt: string;
  primaryLanguage: { name: string; color: string } | null;
  tags: string[];
}

interface ProjectsClientProps {
  featured: FeaturedProject[];
  repos: RepoSummary[];
}

export function ProjectsClient({ featured, repos }: ProjectsClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [visibleRepos, setVisibleRepos] = useState(REPOS_PER_PAGE);

  const allCategories = useMemo(() => {
    const all = new Set<string>();
    featured.forEach((p) => categoriesFor(p.technologies).forEach((c) => all.add(c)));
    repos.forEach((r) => categoriesFor(r.tags).forEach((c) => all.add(c)));
    return Array.from(all).sort();
  }, [featured, repos]);

  const filteredFeatured = useMemo(
    () =>
      featured.filter(
        (p) => !selectedTag || categoriesFor(p.technologies).has(selectedTag)
      ),
    [featured, selectedTag]
  );
  const filteredRepos = useMemo(
    () => repos.filter((r) => !selectedTag || categoriesFor(r.tags).has(selectedTag)),
    [repos, selectedTag]
  );

  const isEmpty = filteredFeatured.length === 0 && filteredRepos.length === 0;

  return (
    <div className="space-y-10">
      <FilterChips
        label="Filter by area"
        allLabel="All"
        options={allCategories}
        value={selectedTag}
        onChange={(value) => {
          setSelectedTag(value);
          setVisibleRepos(REPOS_PER_PAGE);
        }}
      />

      {filteredFeatured.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
          {filteredFeatured.map((project, index) => (
            <ProjectCard
              key={project.slug}
              title={project.title}
              href={`/projects/${project.slug}`}
              description={project.description}
              dates={project.dates}
              image={project.image}
              priority={index < 2}
            />
          ))}
        </div>
      )}

      {filteredRepos.length > 0 && (
        <section aria-labelledby="more-repos">
          <h2 id="more-repos" className="section-title mb-3 border-b border-border pb-3">
            More on GitHub
          </h2>
          <ul>
            {filteredRepos.slice(0, visibleRepos).map((repo) => (
              <li key={repo.url}>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-mx-3 flex items-baseline justify-between gap-6 rounded-lg px-3 py-2.5 transition-colors hover:bg-card"
                >
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">{repo.name}</h3>
                    <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {repo.description}
                    </p>
                  </div>
                  <div className="meta flex flex-none items-center gap-3">
                    {repo.stargazerCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="size-3" aria-hidden />
                        {repo.stargazerCount}
                        <span className="sr-only">stars</span>
                      </span>
                    )}
                    {repo.primaryLanguage && (
                      <span className="hidden items-center gap-1.5 sm:flex">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: repo.primaryLanguage.color }}
                          aria-hidden
                        />
                        {repo.primaryLanguage.name}
                      </span>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
          {filteredRepos.length > visibleRepos && (
            <button
              type="button"
              onClick={() => setVisibleRepos((count) => count + REPOS_PER_PAGE)}
              className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground active:scale-[0.97]"
            >
              Show more
            </button>
          )}
        </section>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="font-medium text-foreground">Nothing in this area yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Try a different filter to see the rest of my work.
          </p>
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className="mt-5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.97]"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  );
}
