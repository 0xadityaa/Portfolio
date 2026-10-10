import Link from "next/link";

interface Topic {
  name: string;
  detail: string;
  href: string;
}

const NODE_W = 168;
const NODE_H = 56;
const TOPIC_X = 300;
const TOPIC_Y = [24, 132, 240];
const BUS_X = 212;

/**
 * The site drawn as the kind of system Aditya builds: one producer, an event
 * bus, three topics. Each topic is a link. The moving dots are CSS (see
 * .event-dot in globals.css) and stop for reduced motion.
 */
export function SystemDiagram({ topics }: { topics: Topic[] }) {
  const wires = TOPIC_Y.map((y) => {
    const mid = y + NODE_H / 2;
    return `M148 160 H${BUS_X} V${mid} H${TOPIC_X}`;
  });

  return (
    <svg
      viewBox="0 0 480 320"
      role="img"
      aria-label="Diagram of this site as an event-driven system: Aditya publishes to an event bus with three topics, work, projects and posts."
      className="h-auto w-full"
      fill="none"
    >
      <rect x={BUS_X - 14} y={8} width={28} height={304} rx={14} className="fill-card stroke-border" />
      <text
        x={BUS_X}
        y={160}
        transform={`rotate(-90 ${BUS_X} 160)`}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground font-mono text-[10px] uppercase tracking-[0.2em]"
      >
        event bus
      </text>

      {wires.map((d) => (
        <path key={d} d={d} className="stroke-border" strokeWidth={1.5} strokeDasharray="3 5" />
      ))}
      {wires.map((d, index) => (
        <circle
          key={`dot-${d}`}
          r={3.5}
          className="event-dot fill-brand"
          style={{ offsetPath: `path("${d}")`, animationDelay: `${index * 0.9}s` }}
        />
      ))}

      <g>
        <rect x={8} y={132} width={140} height={NODE_H} rx={10} className="fill-background stroke-brand" strokeWidth={1.5} />
        <text x={24} y={154} className="fill-muted-foreground font-mono text-[10px] uppercase tracking-[0.14em]">
          producer
        </text>
        <text x={24} y={173} className="fill-foreground font-mono text-[13px]">
          0xadityaa
        </text>
      </g>

      {topics.slice(0, 3).map((topic, index) => (
        <Link key={topic.name} href={topic.href} className="diagram-node" aria-label={`${topic.name}: ${topic.detail}`}>
          <rect
            x={TOPIC_X}
            y={TOPIC_Y[index]}
            width={NODE_W}
            height={NODE_H}
            rx={10}
            className="fill-background stroke-border transition-colors"
            strokeWidth={1.5}
          />
          <text x={TOPIC_X + 16} y={TOPIC_Y[index] + 23} className="fill-foreground font-mono text-[13px]">
            {topic.name}
          </text>
          <text x={TOPIC_X + 16} y={TOPIC_Y[index] + 41} className="fill-muted-foreground font-mono text-[10px]">
            {topic.detail}
          </text>
          <path
            d={`M${TOPIC_X + NODE_W - 24} ${TOPIC_Y[index] + 28}h8m-3 -3l3 3l-3 3`}
            className="stroke-muted-foreground transition-colors"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Link>
      ))}
    </svg>
  );
}
