/** Deterministic generative art: the same seed string always draws the same picture. */

export function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** mulberry32: a small seeded random number generator. */
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CELL = 20;
const R = CELL / 2;

/** Truchet tiles: every cell holds two quarter arcs in one of two orientations. */
export function truchet(seed: string, cols: number, rows: number) {
  const random = rng(hash(seed));
  let base = "";
  let accent = "";
  const dots: { cx: number; cy: number }[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * CELL;
      const y = row * CELL;
      const arcs =
        random() < 0.5
          ? `M${x + R} ${y}A${R} ${R} 0 0 1 ${x} ${y + R}M${x + R} ${y + CELL}A${R} ${R} 0 0 1 ${x + CELL} ${y + R}`
          : `M${x + R} ${y}A${R} ${R} 0 0 0 ${x + CELL} ${y + R}M${x} ${y + R}A${R} ${R} 0 0 1 ${x + R} ${y + CELL}`;
      if (random() < 0.16) accent += arcs;
      else base += arcs;
      if (random() < 0.05) dots.push({ cx: x + R, cy: y + R });
    }
  }
  return { base, accent, dots, tint: hash(seed) % 6, width: cols * CELL, height: rows * CELL };
}

const WEAVE_CELL = 40;

/**
 * Woven ribbons: each cell fans three concentric quarter arcs out of one
 * corner and a single arc out of the opposite one. Arc ends always land on
 * the same points of a cell edge, so ribbons run on from cell to cell.
 */
export function weave(seed: string, cols: number, rows: number) {
  const random = rng(hash(seed));
  let base = "";
  let accent = "";
  const dots: { cx: number; cy: number }[] = [];

  const arc = (cx: number, cy: number, sx: number, sy: number, r: number) =>
    `M${cx + sx * r} ${cy}A${r} ${r} 0 0 ${sx * sy > 0 ? 1 : 0} ${cx} ${cy + sy * r}`;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const right = random() < 0.5;
      const bottom = random() < 0.5;
      const cx = (col + (right ? 1 : 0)) * WEAVE_CELL;
      const cy = (row + (bottom ? 1 : 0)) * WEAVE_CELL;
      const sx = right ? -1 : 1;
      const sy = bottom ? -1 : 1;

      const highlight = random() < 0.2;
      for (const r of [10, 20, 30]) {
        if (highlight && r === 20) accent += arc(cx, cy, sx, sy, r);
        else base += arc(cx, cy, sx, sy, r);
      }
      // The lone arc in the opposite corner.
      base += arc(cx + sx * WEAVE_CELL, cy + sy * WEAVE_CELL, -sx, -sy, 10);
      if (random() < 0.07) dots.push({ cx: cx + sx * WEAVE_CELL, cy: cy + sy * WEAVE_CELL });
    }
  }
  return { base, accent, dots, width: cols * WEAVE_CELL, height: rows * WEAVE_CELL };
}
