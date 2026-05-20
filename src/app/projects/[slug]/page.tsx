import { DATA } from "@/data/resume";
import { markdownToHTML } from "@/data/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, ExternalLinkIcon, GithubIcon, StarIcon, GitForkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

interface ProjectDetailParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: ProjectDetailParams): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug;
  const project = DATA.projects.find((p) => p.href.toLowerCase().endsWith(slug.toLowerCase()));

  return {
    title: project ? `${project.title} - Documentation` : "Project Documentation",
    description: project?.description || `Detailed documentation for ${slug}`,
  };
}

async function fetchProjectReadme(slug: string): Promise<string | null> {
  const mainUrl = `https://raw.githubusercontent.com/0xadityaa/${slug}/main/README.md`;
  const masterUrl = `https://raw.githubusercontent.com/0xadityaa/${slug}/master/README.md`;

  try {
    // Attempt to fetch from 'main' branch
    let res = await fetch(mainUrl, { next: { revalidate: 3600 } });
    if (res.ok) {
      return await res.text();
    }

    // Fallback to 'master' branch
    res = await fetch(masterUrl, { next: { revalidate: 3600 } });
    if (res.ok) {
      return await res.text();
    }

    return null;
  } catch (err) {
    console.error(`Error fetching README for ${slug}:`, err);
    return null;
  }
}

export default async function ProjectDetailPage(props: ProjectDetailParams) {
  const params = await props.params;
  const slug = params.slug;
  
  // Find project in static data
  const project = DATA.projects.find((p) => p.href.toLowerCase().endsWith(slug.toLowerCase()));

  // Fetch the README content dynamically from GitHub
  const rawReadme = await fetchProjectReadme(slug);

  if (!rawReadme && !project) {
    notFound();
  }

  // Compile raw markdown to beautiful brutalist HTML
  const compiledContent = rawReadme 
    ? await markdownToHTML(rawReadme) 
    : `<p class="italic text-muted-foreground">Detailed documentation is currently unavailable. You can visit the project repository via the link below.</p>`;

  return (
    <section id="project-detail" className="mb-24 space-y-6">
      {/* Navigation */}
      <div>
        <Link
          href="/projects"
          className="inline-flex brutalist-button hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <ChevronLeftIcon className="size-4 mr-2" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Specifications Box */}
      <div className="border-2 border-black dark:border-white p-6 bg-card text-card-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] font-mono">
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-3 select-none">
          [ REPOSITORY :: SPECIFICATIONS ]
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground uppercase">Project name:</span>{" "}
            <span className="font-bold uppercase tracking-tight">{project?.title || slug}</span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase">Status:</span>{" "}
            <span className="font-bold text-green-600 dark:text-green-400">ACTIVE // DEPLOYED</span>
          </div>
          {project?.dates && (
            <div>
              <span className="text-muted-foreground uppercase">Release Date:</span>{" "}
              <span className="font-bold">{project.dates}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground uppercase">Source Link:</span>{" "}
            <a
              href={project?.href || `https://github.com/0xadityaa/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline hover:bg-foreground hover:text-background transition-colors inline-flex items-center gap-1"
            >
              <span>GitHub Repo</span>
              <ExternalLinkIcon className="size-3" />
            </a>
          </div>

          {project?.technologies && project.technologies.length > 0 && (
            <div className="md:col-span-2">
              <span className="text-muted-foreground uppercase">Stack matrix:</span>{" "}
              <div className="inline-flex flex-wrap gap-1.5 ml-2 align-middle">
                {project.technologies.map((tech) => (
                  <Badge
                    key={tech}
                    className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-none border border-black/20 dark:border-white/20 bg-muted text-foreground transition-none"
                    variant="secondary"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b-2 border-dashed border-black/20 dark:border-white/20 pb-4">
        <h1 className="font-extrabold text-3xl sm:text-5xl uppercase tracking-tight leading-none">
          {project?.title || slug}
        </h1>
        {project?.links && project.links.length > 0 && (
          <div className="flex flex-wrap gap-2 select-none">
            {project.links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] font-bold uppercase border-2 border-black dark:border-white bg-card shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 transition-all"
              >
                <span>{link.type}</span>
                <ExternalLinkIcon className="size-3" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Documentation Header banner */}
      <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase font-bold tracking-widest border border-dashed border-black/20 dark:border-white/20 px-3 py-1.5 w-max">
        <span>[ DOCUMENTATION :: README.md FROM GITHUB ]</span>
      </div>

      {/* Compiled README article content */}
      <article
        className="prose dark:prose-invert text-base sm:text-lg leading-relaxed max-w-none pt-2 pb-16
                   prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-tight prose-headings:font-mono
                   prose-h1:text-3xl prose-h1:border-b-2 prose-h1:border-black dark:prose-h1:border-white prose-h1:pb-1.5
                   prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-black dark:prose-h2:border-white prose-h2:pb-1.5
                   prose-h3:text-xl
                   prose-p:font-sans prose-p:font-medium prose-p:text-muted-foreground prose-p:leading-relaxed dark:prose-p:text-muted-foreground
                   prose-strong:text-foreground prose-strong:font-extrabold
                   prose-a:underline prose-a:font-extrabold prose-a:text-foreground hover:prose-a:bg-foreground hover:prose-a:text-background prose-a:transition-colors
                   prose-li:font-sans prose-li:font-medium prose-li:text-muted-foreground
                   prose-table:font-mono prose-table:text-sm prose-table:w-full prose-table:border-collapse prose-table:border-2 prose-table:border-black dark:prose-table:border-white
                   prose-th:border-2 prose-th:border-black dark:prose-th:border-white prose-th:p-2 prose-th:bg-muted prose-th:font-extrabold
                   prose-td:border-2 prose-td:border-black dark:prose-td:border-white prose-td:p-2"
        dangerouslySetInnerHTML={{ __html: compiledContent }}
      />
    </section>
  );
}
