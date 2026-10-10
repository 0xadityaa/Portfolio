import { DATA } from "@/data/resume";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** Shared social card: a title, an optional kicker line, and the site name. */
export function renderOgImage({ title, kicker }: { title: string; kicker?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#faf9f5",
          color: "#141413",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#b8532f" }}>
          {kicker ?? DATA.role}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 48 ? 64 : 80,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #dedcd1",
            paddingTop: 28,
            fontSize: 28,
            color: "#5e5d59",
          }}
        >
          <span>{DATA.name}</span>
          <span>0xadityaa.dev</span>
        </div>
      </div>
    ),
    ogSize
  );
}
