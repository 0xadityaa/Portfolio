import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  title: string;
  href: string;
  description: string;
  dates?: string;
  image?: string;
  /** Set on above-the-fold cards so the screenshot is not lazy loaded. */
  priority?: boolean;
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  image,
  priority,
}: ProjectCardProps) {
  return (
    <Link href={href} className="group block rounded-lg">
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-card">
        {image && (
          <Image
            src={image}
            alt={`Screenshot of ${title}`}
            fill
            priority={priority}
            sizes="(min-width: 640px) 312px, 100vw"
            className="object-cover object-top brightness-90 transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-100"
          />
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <h3 className="text-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-foreground/60">
          {title}
        </h3>
        {dates && <span className="meta flex-none">{dates}</span>}
      </div>
      <p className="mt-0.5 text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
