import { PostCover } from "@/components/post-cover";
import { hash } from "@/lib/art";
import { cn } from "@/lib/utils";

/**
 * A hand-drawn line illustration per project, keyed by repo name (lowercase).
 * Each says what the project does: a cut film strip, a branch graph, a chart.
 * A project without one falls back to a generated pattern.
 */
const ART: Record<string, React.ReactNode> = {
  // Long video cut into clips.
  clipper: (
    <>
      <rect x={56} y={58} width={100} height={64} rx={8} />
      <rect x={164} y={80} width={100} height={64} rx={8} />
      <path d="M98 78v24l20 -12zM206 100v24l20 -12z" className="fill-foreground" stroke="none" />
      <path d="M160 36v130" strokeDasharray="2 7" />
      <path d="M66 58v-8M86 58v-8M106 58v-8M126 58v-8M146 58v-8M174 144v8M194 144v8M214 144v8M234 144v8M254 144v8" />
    </>
  ),
  // A repository's history with a branch merged back in.
  gitbuddy: (
    <>
      <path d="M60 140H260M130 140C150 140 150 80 176 80H214C240 80 240 140 260 140" />
      {[60, 130, 196].map((x) => (
        <circle key={x} cx={x} cy={140} r={8} className="fill-[hsl(var(--tint))]" />
      ))}
      <circle cx={176} cy={80} r={8} className="fill-[hsl(var(--tint))]" />
      <circle cx={214} cy={80} r={8} className="fill-[hsl(var(--tint))]" />
      <circle cx={260} cy={140} r={9} className="fill-foreground" />
    </>
  ),
  // A knowledge graph with one answer lit up.
  graphragchat: (
    <>
      <path d="M92 66L152 108L104 150M152 108L214 70L236 140L152 108M214 70L270 52M104 150L60 128" />
      {[
        [92, 66],
        [104, 150],
        [214, 70],
        [236, 140],
        [270, 52],
        [60, 128],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={8} className="fill-[hsl(var(--tint))]" />
      ))}
      <circle cx={152} cy={108} r={13} className="fill-foreground" />
    </>
  ),
  // A price line and a question about it.
  finchat: (
    <>
      <path d="M62 50V150H262" />
      <path d="M78 134L110 112L138 122L172 84L204 98L246 58" />
      <circle cx={246} cy={58} r={6} className="fill-foreground" />
      <path d="M92 44h54a8 8 0 0 1 8 8v16a8 8 0 0 1 -8 8h-34l-12 10v-10h-8a8 8 0 0 1 -8 -8v-16a8 8 0 0 1 8 -8z" className="fill-[hsl(var(--tint))]" />
      <path d="M100 60h38" />
    </>
  ),
  // A corner of the board and a rook.
  "react-rooks": (
    <>
      <rect x={62} y={50} width={100} height={100} rx={4} />
      {[
        [62, 50],
        [112, 50],
        [87, 75],
        [137, 75],
        [62, 100],
        [112, 100],
        [87, 125],
        [137, 125],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={25} height={25} className="fill-foreground/25" stroke="none" />
      ))}
      <path d="M200 150h64M208 150v-12h48v12M214 138l4 -44h28l4 44M208 94h48v-22h-10v10h-9v-10h-10v10h-9v-10h-10z" />
    </>
  ),
  // Braces around a parse tree.
  "json-parser": (
    <>
      <path d="M96 44c-16 0 -18 8 -18 20v16c0 12 -6 18 -16 20c10 2 16 8 16 20v16c0 12 2 20 18 20M224 44c16 0 18 8 18 20v16c0 12 6 18 16 20c-10 2 -16 8 -16 20v16c0 12 -2 20 -18 20" />
      <path d="M160 70L132 108M160 70L188 108M188 108L172 142M188 108L206 142" />
      <circle cx={160} cy={70} r={8} className="fill-foreground" />
      {[
        [132, 108],
        [188, 108],
        [172, 142],
        [206, 142],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={7} className="fill-[hsl(var(--tint))]" />
      ))}
    </>
  ),
  // A signal going out from the browser.
  "byte-cast": (
    <>
      <path d="M160 118V160M138 160H182" />
      <circle cx={160} cy={110} r={8} className="fill-foreground" />
      <path d="M138 132a31 31 0 1 1 44 0M120 150a56 56 0 1 1 80 0M102 168a81 81 0 1 1 116 0" />
    </>
  ),
  // Candles on a paper-trading chart.
  "crypto-maniac": (
    <>
      <path d="M60 156H260" />
      {[
        [80, 96, 44, 80, 150, true],
        [112, 78, 40, 64, 128, false],
        [144, 92, 36, 78, 140, true],
        [176, 66, 44, 52, 122, false],
        [208, 54, 38, 42, 104, false],
        [240, 62, 30, 48, 106, true],
      ].map(([x, y, h, top, bottom, filled]) => (
        <g key={String(x)}>
          <path d={`M${x} ${top}V${bottom}`} />
          <rect
            x={Number(x) - 9}
            y={Number(y)}
            width={18}
            height={Number(h)}
            rx={3}
            className={filled ? "fill-foreground" : "fill-[hsl(var(--tint))]"}
          />
        </g>
      ))}
    </>
  ),
};

export function ProjectArt({ slug, className }: { slug: string; className?: string }) {
  const drawing = ART[slug.toLowerCase()];
  if (!drawing) return <PostCover seed={slug} cols={16} rows={10} className={className} />;

  const tint = `var(--tint-${hash(slug.toLowerCase()) % 6})`;
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      fill="none"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("block stroke-foreground", className)}
      style={{ backgroundColor: `hsl(${tint})`, ["--tint" as string]: tint }}
    >
      {drawing}
    </svg>
  );
}
