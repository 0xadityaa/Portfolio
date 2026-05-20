import { DATA } from "@/data/resume";
import { markdownToHTML } from "@/data/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft as ChevronLeftIcon, ExternalLink as ExternalLinkIcon, Github as GithubIcon, Star as StarIcon, GitFork as GitForkIcon } from "lucide-react";
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
    <section id="project-detail" className="mb-24 space-y-8">
      {/* Navigation */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeftIcon className="size-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Specifications Box */}
      <div className="p-6 bg-muted/30 rounded-xl border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground font-medium">Project name:</span>{" "}
            <span className="font-semibold text-foreground">{project?.title || slug}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Status:</span>{" "}
            <span className="font-semibold text-green-600 dark:text-green-500">Active / Deployed</span>
          </div>
          {project?.dates && (
            <div>
              <span className="text-muted-foreground font-medium">Release Date:</span>{" "}
              <span className="font-semibold text-foreground">{project.dates}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground font-medium">Source Link:</span>{" "}
            <a
              href={project?.href || `https://github.com/0xadityaa/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 minimal-link"
            >
              <span>GitHub Repo</span>
              <ExternalLinkIcon className="size-3" />
            </a>
          </div>

          {project?.technologies && project.technologies.length > 0 && (
            <div className="md:col-span-2">
              <span className="text-muted-foreground font-medium">Stack matrix:</span>{" "}
              <div className="inline-flex flex-wrap gap-1.5 ml-2 align-middle mt-1">
                {project.technologies.map((tech) => (
                  <Badge
                    key={tech}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <h1 className="font-bold text-3xl sm:text-4xl tracking-tight text-foreground">
          {project?.title || slug}
        </h1>
        {project?.links && project.links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <span>{link.type}</span>
                <ExternalLinkIcon className="size-3" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Compiled README article content */}
      <article
        className="prose prose-neutral dark:prose-invert text-base leading-relaxed max-w-none pt-2 pb-16
                   prose-headings:font-semibold prose-headings:tracking-tight
                   prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                   prose-a:minimal-link prose-a:font-medium prose-a:no-underline
                   prose-pre:border prose-pre:border-border"
        dangerouslySetInnerHTML={{ __html: compiledContent }}
      />
    </section>
  );
}
