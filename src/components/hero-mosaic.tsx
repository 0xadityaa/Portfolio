import { DATA } from "@/data/resume";
import Image from "next/image";

const glyph = {
  fill: "none",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "h-full w-full stroke-foreground",
};

/** Tiles that fit together: the portrait and the things Aditya builds, writes, plays and explores. */
const tiles = [
  {
    label: "builds",
    area: "col-span-2",
    tint: 2,
    art: (
      <svg viewBox="0 0 200 100" {...glyph}>
        <path d="M70 30L44 50L70 70M130 30L156 50L130 70M112 22L88 78" />
      </svg>
    ),
  },
  {
    label: "plays",
    area: "",
    tint: 5,
    art: (
      <svg viewBox="0 0 100 100" {...glyph}>
        <path d="M40 68V30L72 24V62" />
        <circle cx={32} cy={68} r={8} className="fill-foreground" />
        <circle cx={64} cy={62} r={8} className="fill-foreground" />
      </svg>
    ),
  },
  {
    label: "explores",
    area: "row-span-2",
    tint: 3,
    art: (
      <svg viewBox="0 0 100 200" {...glyph}>
        <circle cx={68} cy={52} r={11} />
        <path d="M8 150L38 96L54 122L68 104L94 150ZM30 110L38 96L46 110" />
        <path d="M14 168H88M26 182H76" />
      </svg>
    ),
  },
  {
    label: "connects",
    area: "",
    tint: 1,
    art: (
      <svg viewBox="0 0 100 100" {...glyph}>
        <path d="M28 30L52 54L76 34M52 54L40 78" />
        <circle cx={28} cy={30} r={7} style={{ fill: "hsl(var(--tint-1))" }} />
        <circle cx={76} cy={34} r={7} style={{ fill: "hsl(var(--tint-1))" }} />
        <circle cx={40} cy={78} r={7} style={{ fill: "hsl(var(--tint-1))" }} />
        <circle cx={52} cy={54} r={9} className="fill-foreground" />
      </svg>
    ),
  },
  {
    label: "writes",
    area: "col-span-2",
    tint: 4,
    art: (
      <svg viewBox="0 0 200 100" {...glyph}>
        <path d="M40 34H130M40 50H150M40 66H104" />
        <path d="M142 74L170 30L180 36L152 80L140 84Z" />
      </svg>
    ),
  },
];

export function HeroMosaic() {
  return (
    <div className="mosaic grid aspect-[4/3] grid-cols-4 grid-rows-3 gap-2.5 sm:gap-3">
      <div className="relative col-span-2 row-span-2 overflow-hidden rounded-full">
        <Image
          src={DATA.avatarUrl}
          alt={`Pixel art portrait of ${DATA.name}`}
          fill
          priority
          sizes="(min-width: 1024px) 224px, 50vw"
          className="object-cover"
        />
      </div>
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`overflow-hidden rounded-2xl ${tile.area}`}
          style={{ backgroundColor: `hsl(var(--tint-${tile.tint}))` }}
        >
          {tile.art}
        </div>
      ))}
    </div>
  );
}
