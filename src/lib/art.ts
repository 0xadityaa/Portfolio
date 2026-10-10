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

/** Contour rings around two peaks, like a trail map. */
export function contours(seed: string, rings = 9) {
  const random = rng(hash(seed));
  const peaks = [
    { x: 110, y: 95, size: 1 },
    { x: 235, y: 150, size: 0.7 },
  ];
  return peaks.flatMap((peak) => {
    const a = random() * 6.28;
    const b = random() * 6.28;
    return Array.from({ length: Math.round(rings * peak.size) }, (_, ring) => {
      const radius = 10 + ring * 13;
      const points: string[] = [];
      for (let step = 0; step <= 72; step++) {
        const t = (step / 72) * Math.PI * 2;
        const wobble = 1 + 0.14 * Math.sin(3 * t + a) + 0.09 * Math.sin(5 * t + b + ring * 0.25);
        points.push(
          `${(peak.x + Math.cos(t) * radius * wobble * 1.25).toFixed(1)} ${(peak.y + Math.sin(t) * radius * wobble).toFixed(1)}`
        );
      }
      return `M${points.join("L")}Z`;
    });
  });
}
