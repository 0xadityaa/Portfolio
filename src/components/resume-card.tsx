import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

interface ResumeCardProps {
  logoUrl: string;
  altText: string;
  title: string;
  subtitle?: string;
  href?: string;
  period: string;
  description?: string;
}

export const ResumeCard = ({
  logoUrl,
  altText,
  title,
  subtitle,
  href,
  period,
  description,
}: ResumeCardProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group -mx-3 flex gap-4 rounded-lg p-3 transition-colors hover:bg-card"
    >
      <div className="relative mt-0.5 size-10 flex-none overflow-hidden rounded-lg border border-border bg-muted">
        <Image src={logoUrl} alt="" fill sizes="40px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col justify-between gap-x-4 gap-y-0.5 sm:flex-row sm:items-baseline">
          <h3 className="inline-flex items-center gap-1 font-medium text-foreground">
            {title}
            <ArrowUpRight
              className="size-3.5 text-muted-foreground opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden
            />
            <span className="sr-only">, {altText} website</span>
          </h3>
          <span className="meta flex-none">{period}</span>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-foreground/75">
            {description}
          </p>
        )}
      </div>
    </a>
  );
};
