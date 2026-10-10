import { weave } from "@/lib/art";
import { cn } from "@/lib/utils";

/** The home page artwork: woven ribbons, a cousin of the post covers. */
export function HeroArt({ className }: { className?: string }) {
  const art = weave("aditya-negandhi", 9, 7);
  return (
    <svg
      viewBox={`0 0 ${art.width} ${art.height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={cn("block", className)}
      style={{ backgroundColor: "hsl(var(--tint-4))" }}
    >
      <path d={art.base} className="stroke-foreground/25" />
      <path d={art.accent} className="stroke-foreground/90" />
      {art.dots.map((dot) => (
        <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={3} className="fill-foreground" />
      ))}
    </svg>
  );
}
