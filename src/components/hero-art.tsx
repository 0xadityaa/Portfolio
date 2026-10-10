import { cn } from "@/lib/utils";

/**
 * The home page illustration: a small isometric structure going up block by
 * block, with one clay block still on its way down to its place. Drawn by
 * hand as a height map, for "how things are built from the ground up".
 */

// Blocks per plot, back row first.
const HEIGHTS = [
  [3, 2, 1, 0, 0, 0],
  [2, 4, 2, 1, 0, 0],
  [1, 3, 2, 1, 1, 0],
  [1, 1, 2, 1, 0, 0],
  [0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0],
];
// The block being placed, and how far above its plot it hovers.
const PLACING = { row: 4, col: 3, lift: 1.8 };

const HALF_W = 24;
const HALF_H = 12;
const RISE = 22;

const ink = (percent: number) =>
  `color-mix(in srgb, hsl(var(--foreground)) ${percent}%, hsl(var(--card)))`;
const clay = (percent: number) =>
  `color-mix(in srgb, hsl(var(--brand)) ${percent}%, hsl(var(--card)))`;

/** Screen position of the top corner of a block's lid. `level` counts from the ground. */
function origin(row: number, col: number, level: number) {
  return { x: (row - col) * HALF_W, y: (row + col) * HALF_H - level * RISE };
}

function Block({ row, col, level, tone }: { row: number; col: number; level: number; tone: (p: number) => string }) {
  const { x, y } = origin(row, col, level + 1);
  const lid = `${x},${y} ${x + HALF_W},${y + HALF_H} ${x},${y + 2 * HALF_H} ${x - HALF_W},${y + HALF_H}`;
  const left = `${x - HALF_W},${y + HALF_H} ${x},${y + 2 * HALF_H} ${x},${y + 2 * HALF_H + RISE} ${x - HALF_W},${y + HALF_H + RISE}`;
  const right = `${x + HALF_W},${y + HALF_H} ${x},${y + 2 * HALF_H} ${x},${y + 2 * HALF_H + RISE} ${x + HALF_W},${y + HALF_H + RISE}`;
  return (
    <g>
      <polygon points={left} fill={tone(tone === clay ? 62 : 10)} />
      <polygon points={right} fill={tone(tone === clay ? 44 : 4)} />
      <polygon points={lid} fill={tone(tone === clay ? 88 : 18)} />
    </g>
  );
}

export function HeroArt({ className }: { className?: string }) {
  const size = HEIGHTS.length;
  // Paint back to front so nearer blocks cover the ones behind.
  const plots = HEIGHTS.flatMap((line, row) => line.map((height, col) => ({ row, col, height }))).sort(
    (a, b) => a.row + a.col - (b.row + b.col)
  );
  const landing = origin(PLACING.row, PLACING.col, HEIGHTS[PLACING.row][PLACING.col]);
  const hover = HEIGHTS[PLACING.row][PLACING.col] + PLACING.lift;

  return (
    <svg
      viewBox="-162 -86 324 252"
      aria-hidden
      className={cn("block bg-card", className)}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* The plot grid on the ground. */}
      <g fill="none" stroke={ink(16)} strokeWidth={1}>
        {Array.from({ length: size + 1 }, (_, n) => {
          const a = origin(n, 0, 0);
          const b = origin(n, size, 0);
          const c = origin(0, n, 0);
          const d = origin(size, n, 0);
          return (
            <path key={n} d={`M${a.x} ${a.y}L${b.x} ${b.y}M${c.x} ${c.y}L${d.x} ${d.y}`} />
          );
        })}
      </g>

      <g stroke={ink(58)} strokeWidth={1.2}>
        {plots.flatMap(({ row, col, height }) =>
          Array.from({ length: height }, (_, level) => (
            <Block key={`${row}-${col}-${level}`} row={row} col={col} level={level} tone={ink} />
          ))
        )}
      </g>

      {/* Guides from the hovering block down to where it lands. */}
      <g fill="none" stroke="hsl(var(--brand))" strokeWidth={1.2} strokeDasharray="2 5">
        {[-HALF_W, 0, HALF_W].map((dx) => {
          const dy = dx === 0 ? 2 * HALF_H : HALF_H;
          return (
            <path
              key={dx}
              d={`M${landing.x + dx} ${landing.y + dy - (PLACING.lift - 1) * RISE}V${landing.y + dy}`}
            />
          );
        })}
      </g>
      <g stroke="hsl(var(--brand))" strokeWidth={1.2}>
        <Block row={PLACING.row} col={PLACING.col} level={hover} tone={clay} />
      </g>
    </svg>
  );
}
