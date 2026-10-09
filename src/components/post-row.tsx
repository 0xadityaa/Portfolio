import { formatMonthYear, formatShortDate } from "@/lib/utils";
import Link from "next/link";

interface PostRowProps {
  slug: string;
  title: string;
  publishedAt: string;
  summary?: string;
  /** Show "Jun 2026" instead of "Jun 19" when rows are not grouped by year. */
  showYear?: boolean;
}

export function PostRow({ slug, title, publishedAt, summary, showYear }: PostRowProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group -mx-3 flex items-baseline justify-between gap-6 rounded-lg px-3 py-2.5 transition-colors hover:bg-card"
    >
      <div className="min-w-0">
        <h3 className="font-medium text-foreground">{title}</h3>
        {summary && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        )}
      </div>
      <time dateTime={publishedAt} className="meta flex-none">
        {showYear ? formatMonthYear(publishedAt) : formatShortDate(publishedAt)}
      </time>
    </Link>
  );
}
