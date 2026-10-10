import { TechList } from "@/components/tech-list";
import { ProjectArt } from "@/components/project-art";
import Link from "next/link";

interface ProjectCardProps {
  title: string;
  href: string;
  description: string;
  dates?: string;
  /** Repo name: picks the illustration. */
  slug: string;
  technologies?: readonly string[];
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  slug,
  technologies = [],
}: ProjectCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/25"
    >
      <div className="overflow-hidden border-b border-border">
        <ProjectArt
          slug={slug}
          className="aspect-[16/10] w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-medium text-foreground">{title}</h3>
          {dates && <span className="meta flex-none">{dates}</span>}
        </div>
        <p className="mt-1.5 text-muted-foreground">{description}</p>
        {technologies.length > 0 && (
          <TechList items={technologies} max={5} className="mt-auto pt-4" />
        )}
      </div>
    </Link>
  );
}
