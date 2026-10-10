import { cn } from "@/lib/utils";

interface RowProps {
  /** Left column: a date, a year, or a short label. */
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** The site's one layout unit: quiet metadata on the left, content on the right. Stacks on phones. */
export function Row({ meta, children, className }: RowProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-y-0.5 sm:grid-cols-[7rem_1fr] sm:gap-x-6", className)}>
      {meta ? <div className="meta sm:pt-[0.3rem]">{meta}</div> : <div className="hidden sm:block" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** A Row for use directly inside a <dl>: the label is the term, the content its definition. */
export function TermRow({ term, children, className }: { term: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="grid grid-cols-1 gap-y-0.5 sm:grid-cols-[7rem_1fr] sm:gap-x-6">
      <dt className="meta sm:pt-[0.3rem]">{term}</dt>
      <dd className={cn("min-w-0", className)}>{children}</dd>
    </div>
  );
}
