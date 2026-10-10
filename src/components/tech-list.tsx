import { LIGHTEN_ICONS, TECH_ICONS } from "@/lib/tech-icons";
import { cn } from "@/lib/utils";

interface TechListProps {
  items: readonly string[];
  /** Show only the first few. */
  max?: number;
  className?: string;
}

/**
 * Technologies as logos. Names that share a logo (Azure and Azure DevOps)
 * collapse into one tile, and a name with no logo falls back to a text chip.
 * The name is always there for screen readers and as a hover title.
 */
export function TechList({ items, max, className }: TechListProps) {
  const tiles: { names: string[]; icon?: string }[] = [];
  for (const name of items) {
    const icon = TECH_ICONS[name];
    const existing = icon && tiles.find((tile) => tile.icon === icon);
    if (existing) existing.names.push(name);
    else tiles.push({ names: [name], icon });
  }

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {tiles.slice(0, max).map((tile) => {
        const label = tile.names.join(", ");
        return tile.icon ? (
          <li
            key={label}
            title={label}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-background"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/icons/${tile.icon}`}
              alt=""
              width={18}
              height={18}
              loading="lazy"
              className={cn("size-[18px] object-contain", LIGHTEN_ICONS.has(tile.icon) && "brightness-0 invert")}
            />
            <span className="sr-only">{label}</span>
          </li>
        ) : (
          <li key={label} className="chip flex h-9 items-center rounded-lg px-2.5">
            {label}
          </li>
        );
      })}
    </ul>
  );
}
