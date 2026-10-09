import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface SectionProps {
  id: string;
  title: string;
  /** Optional "see everything" link shown opposite the title. */
  more?: { href: string; label: string };
  children: React.ReactNode;
}

export function Section({ id, title, more, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 id={`${id}-title`} className="section-title">
          {title}
        </h2>
        {more && (
          <Link
            href={more.href}
            className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {more.label}
            <ArrowUpRight
              className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
