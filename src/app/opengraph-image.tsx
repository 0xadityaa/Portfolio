import { DATA } from "@/data/resume";
import { ogSize, renderOgImage } from "@/lib/og";

export const alt = `${DATA.name}, ${DATA.role}`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({ title: DATA.name });
}
