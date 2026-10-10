"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/**
 * The home page illustration: an isometric Rubik's cube that scrambles itself
 * and then, slowly, solves itself. A real cube model (27 cubies, layer turns)
 * drawn as SVG polygons. Still when off screen or when the visitor prefers
 * reduced motion.
 */

type Vec = [number, number, number];
type Move = { axis: 0 | 1 | 2; layer: -1 | 1; dir: -1 | 1 };
type Face = { n: Vec; tone: number };
type Cubie = { p: Vec; faces: Face[] };

const NORMALS: Vec[] = [
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, 1],
  [0, -1, 0],
  [-1, 0, 0],
  [0, 0, -1],
];

const ink = (percent: number) =>
  `color-mix(in srgb, hsl(var(--foreground)) ${percent}%, hsl(var(--background)))`;
const clay = (percent: number) =>
  `color-mix(in srgb, hsl(var(--brand)) ${percent}%, hsl(var(--background)))`;

// One colour per side of the cube, in the order of NORMALS: clay on top, ink elsewhere.
const TONES = [clay(88), ink(20), ink(8), clay(46), ink(34), ink(48)];
const BODY = "hsl(var(--background))";

const SCRAMBLE: Move[] = [
  { axis: 0, layer: 1, dir: 1 },
  { axis: 1, layer: 1, dir: 1 },
  { axis: 2, layer: 1, dir: -1 },
  { axis: 0, layer: -1, dir: 1 },
  { axis: 1, layer: -1, dir: -1 },
  { axis: 2, layer: -1, dir: 1 },
  { axis: 1, layer: 1, dir: 1 },
];

type Step = { wait: number } | { move: Move; duration: number };

// Hold solved, scramble briskly, pause, then undo the scramble one slow turn at a time.
const TIMELINE: Step[] = [
  { wait: 2600 },
  ...SCRAMBLE.map((move) => ({ move, duration: 620 })),
  { wait: 1000 },
  ...[...SCRAMBLE].reverse().flatMap((move): Step[] => [
    { move: { ...move, dir: -move.dir as -1 | 1 }, duration: 1500 },
    { wait: 280 },
  ]),
  { wait: 3200 },
];

function solved(): Cubie[] {
  const cubies: Cubie[] = [];
  for (const x of [-1, 0, 1])
    for (const y of [-1, 0, 1])
      for (const z of [-1, 0, 1]) {
        const p: Vec = [x, y, z];
        cubies.push({
          p,
          faces: NORMALS.map((n, tone) => ({
            n,
            // Only faces on the outside of the cube carry a colour.
            tone: p[0] * n[0] + p[1] * n[1] + p[2] * n[2] === 1 ? tone : -1,
          })),
        });
      }
  return cubies;
}

function rotate([x, y, z]: Vec, axis: number, angle: number): Vec {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  if (axis === 0) return [x, y * c - z * s, y * s + z * c];
  if (axis === 1) return [x * c + z * s, y, -x * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
}

const snap = (v: Vec): Vec => [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];

function applyMove(cubies: Cubie[], move: Move): Cubie[] {
  const angle = (move.dir * Math.PI) / 2;
  return cubies.map((cubie) =>
    cubie.p[move.axis] !== move.layer
      ? cubie
      : {
          p: snap(rotate(cubie.p, move.axis, angle)),
          faces: cubie.faces.map((face) => ({ ...face, n: snap(rotate(face.n, move.axis, angle)) })),
        }
  );
}

const SCALE = 38;
/** Isometric projection, looking down the (1, 1, 1) diagonal. */
const project = ([x, y, z]: Vec) =>
  `${((x - z) * 0.866 * SCALE).toFixed(1)},${(((x + z) * 0.5 - y) * SCALE).toFixed(1)}`;

function polygons(cubies: Cubie[], turning: { move: Move; angle: number } | null) {
  const out: { key: string; points: string; fill: string; depth: number }[] = [];
  cubies.forEach((cubie, index) => {
    const spin = (v: Vec) =>
      turning && cubie.p[turning.move.axis] === turning.move.layer
        ? rotate(v, turning.move.axis, turning.angle)
        : v;
    cubie.faces.forEach((face, f) => {
      const n = spin(face.n);
      // Skip faces pointing away from the viewer.
      if (n[0] + n[1] + n[2] <= 0.01) return;
      const [u, v] = [0, 1, 2].filter((axis) => face.n[axis] === 0);
      const corners = (
        [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ] as const
      ).map(([a, b]) => {
        const corner: Vec = [
          cubie.p[0] + face.n[0] * 0.5,
          cubie.p[1] + face.n[1] * 0.5,
          cubie.p[2] + face.n[2] * 0.5,
        ];
        corner[u] += a * 0.5;
        corner[v] += b * 0.5;
        return spin(corner);
      });
      const centre = spin([
        cubie.p[0] + face.n[0] * 0.5,
        cubie.p[1] + face.n[1] * 0.5,
        cubie.p[2] + face.n[2] * 0.5,
      ]);
      out.push({
        key: `${index}-${f}`,
        points: corners.map(project).join(" "),
        fill: face.tone < 0 ? BODY : TONES[face.tone],
        depth: centre[0] + centre[1] + centre[2],
      });
    });
  });
  // Paint far faces first.
  return out.sort((a, b) => a.depth - b.depth);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function HeroArt({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const cube = useRef<Cubie[]>(solved());
  const turning = useRef<{ move: Move; angle: number } | null>(null);
  const [, redraw] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    if (svg.current) observer.observe(svg.current);

    let frame = 0;
    let step = 0;
    let elapsed = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(now - last, 100);
      last = now;
      if (visible && !document.hidden) {
        elapsed += delta;
        const current = TIMELINE[step];
        const length = "wait" in current ? current.wait : current.duration;
        if ("move" in current) {
          const progress = Math.min(elapsed / length, 1);
          turning.current = { move: current.move, angle: ease(progress) * current.move.dir * (Math.PI / 2) };
          if (progress === 1) {
            cube.current = applyMove(cube.current, current.move);
            turning.current = null;
          }
          redraw((n) => n + 1);
        }
        if (elapsed >= length) {
          elapsed = 0;
          step = (step + 1) % TIMELINE.length;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svg}
      viewBox="-150 -117 300 234"
      aria-hidden
      className={cn("block overflow-visible", className)}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <g stroke={ink(60)} strokeWidth={1.2}>
        {polygons(cube.current, turning.current).map((polygon) => (
          <polygon key={polygon.key} points={polygon.points} fill={polygon.fill} />
        ))}
      </g>
    </svg>
  );
}
