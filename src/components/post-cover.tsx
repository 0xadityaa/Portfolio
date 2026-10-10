import { truchet } from "@/lib/art";
import { cn } from "@/lib/utils";

interface PostCoverProps {
  /** The post slug seeds the pattern, so every post gets its own cover. */
  seed: string;
  /** Background tint 0 to 5. Defaults to one picked from the seed. */
  tint?: number;
  cols?: number;
  rows?: number;
  className?: string;
}

export function PostCover({ seed, tint, cols = 6, rows = 6, className }: PostCoverProps) {
  const art = truchet(seed, cols, rows);
  return (
    <svg
      viewBox={`0 0 ${art.width} ${art.height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={cn("block", className)}
      style={{ backgroundColor: `hsl(var(--tint-${tint ?? art.tint}))` }}
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <path d={art.base} className="stroke-foreground/25" />
      <path d={art.accent} className="stroke-foreground/90" />
      {art.dots.map((dot) => (
        <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={2} className="fill-foreground" />
      ))}
    </svg>
  );
}
