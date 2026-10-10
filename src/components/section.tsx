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
            className="group text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {more.label}{" "}
            <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
