import Link from "next/link";

interface SectionProps {
  id: string;
  /** Position on the page, shown as a hex byte: 1 becomes 0x01. */
  index: number;
  title: string;
  /** Optional "see everything" link shown opposite the title. */
  more?: { href: string; label: string };
  children: React.ReactNode;
}

export function Section({ id, index, title, more, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16">
      <div className="mb-8 flex items-center gap-4">
        <span aria-hidden className="font-mono text-xs text-brand">
          0x{index.toString(16).padStart(2, "0")}
        </span>
        <h2 id={`${id}-title`} className="font-serif text-2xl font-medium tracking-tight text-foreground">
          {title}
        </h2>
        <span aria-hidden className="h-px flex-1 bg-border" />
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
