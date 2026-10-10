import { cn } from "@/lib/utils";

const R = 30;
const STEP = Math.sqrt(3) * R;

/** Corner points of a pointy-top hexagon. */
function hexagon(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, k) => {
    const angle = ((30 + 60 * k) * Math.PI) / 180;
    return `${(cx + R * Math.cos(angle)).toFixed(1)},${(cy + R * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
}

// The six cells around the centre, then a few further out that fade.
const ring = Array.from({ length: 6 }, (_, k) => {
  const angle = (60 * k * Math.PI) / 180;
  return { x: 160 + STEP * Math.cos(angle), y: 100 + STEP * Math.sin(angle) };
});
const outer = [
  { x: 160 + 2 * STEP, y: 100 },
  { x: 160 - 2 * STEP, y: 100 },
  { x: 160 + 1.5 * STEP, y: 100 - 1.5 * R * 1.732 },
  { x: 160 - 1.5 * STEP, y: 100 + 1.5 * R * 1.732 },
];

/**
 * Hivemind's illustration: a honeycomb where every cell is a tool and the one
 * in the middle, in clay, is the memory they share.
 */
export function HivemindArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      fill="none"
      strokeWidth={2.5}
      strokeLinejoin="round"
      className={cn("block stroke-foreground", className)}
      style={{ backgroundColor: "hsl(var(--tint-0))" }}
    >
      {outer.map((cell) => (
        <polygon key={`${cell.x}-${cell.y}`} points={hexagon(cell.x, cell.y)} className="stroke-foreground/25" />
      ))}
      {ring.map((cell) => (
        <g key={`${cell.x}-${cell.y}`}>
          <polygon points={hexagon(cell.x, cell.y)} />
          <circle cx={cell.x} cy={cell.y} r={4} className="fill-foreground" stroke="none" />
        </g>
      ))}
      <polygon points={hexagon(160, 100)} className="fill-brand stroke-brand" />
    </svg>
  );
}
