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
