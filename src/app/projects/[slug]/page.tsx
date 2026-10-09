import { CopyCodeHandler } from "@/components/copy-code-handler";
import { markdownToHTML } from "@/data/blog";
import { DATA } from "@/data/resume";
import { findProject, projectSlug } from "@/lib/projects";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ProjectDetailParams {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return DATA.projects.map((project) => ({ slug: projectSlug(project) }));
}

export async function generateMetadata(props: ProjectDetailParams): Promise<Metadata> {
  const { slug } = await props.params;
  const project = findProject(slug);

  return {
    title: project?.title ?? slug,
    description: project?.description ?? `Notes and documentation for ${slug}.`,
    alternates: { canonical: `/projects/${slug}` },
    ...(project?.image ? { openGraph: { images: [{ url: project.image }] } } : {}),
  };
}

async function fetchProjectReadme(slug: string): Promise<string | null> {
  // Repo names only, so the slug cannot point the fetch anywhere else.
  if (!/^[\w.-]+$/.test(slug)) return null;

  for (const branch of ["main", "master"]) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/0xadityaa/${slug}/${branch}/README.md`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) return await res.text();
    } catch (err) {
      console.error(`Error fetching README for ${slug}:`, err);
      return null;
    }
  }
  return null;
}

export default async function ProjectDetailPage(props: ProjectDetailParams) {
  const { slug } = await props.params;
  const project = findProject(slug);
  const rawReadme = await fetchProjectReadme(slug);

  if (!rawReadme && !project) {
    notFound();
  }

  const compiledContent = rawReadme ? await markdownToHTML(rawReadme) : null;
  const sourceUrl = project?.href ?? `https://github.com/0xadityaa/${slug}`;
  // Lead with the thing a visitor can try, then the code, then the write-up.
  const linkOrder = ["Website", "Source", "Devlog"];
  const links = [...(project?.links ?? [{ type: "Source", href: sourceUrl }])].sort(
    (a, b) => linkOrder.indexOf(a.type) - linkOrder.indexOf(b.type)
  );

  return (
    <main>
      <Link
        href="/projects"
        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Projects
      </Link>

      <header className="mt-8 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {project?.title ?? slug}
          </h1>
          {project?.dates && <span className="meta">{project.dates}</span>}
        </div>
        {project?.description && (
          <p className="max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map((link, index) => (
            <a
              key={link.href + link.type}
              href={link.href}
              target={link.href.startsWith("/") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={
                index === 0
                  ? "inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.97]"
                  : "inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-card active:scale-[0.97]"
              }
            >
              {link.type}
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          ))}
        </div>
      </header>

      {project?.image && (
        <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-lg border border-border bg-card">
          <Image
            src={project.image}
            alt={`Screenshot of ${project.title}`}
            fill
            priority
            sizes="(min-width: 672px) 624px, 100vw"
            className="object-cover object-top"
          />
        </div>
      )}

      {project && project.technologies.length > 0 && (
        <dl className="mt-8 grid grid-cols-[5.5rem_1fr] gap-x-4 border-y border-border py-4 text-sm">
          <dt className="meta pt-0.5">Built with</dt>
          <dd className="leading-relaxed text-foreground/85">
            {project.technologies.join(", ")}
          </dd>
        </dl>
      )}

      {compiledContent ? (
        <>
          <article
            className="prose prose-invert max-w-none pt-8 leading-relaxed prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
            dangerouslySetInnerHTML={{ __html: compiledContent }}
          />
          <CopyCodeHandler />
        </>
      ) : (
        <p className="pt-8 text-muted-foreground">
          The README for this project is not available right now. The{" "}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="link">
            repository
          </a>{" "}
          has the full story.
        </p>
      )}
    </main>
  );
}
