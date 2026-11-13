import desk from "@/assets/chaos-desk.jpg";
import { adaptMirage, type Analysis } from "@/lib/mirage/adapter";
import { SAMPLE_INFERENCE } from "@/lib/mirage/sample-analysis";

export const SAMPLE_PHOTO = desk;

/** Real recorded Mirage detections for the bundled sample desk. */
export const SAMPLE_ANALYSIS: Analysis = adaptMirage(
  SAMPLE_INFERENCE.json,
  SAMPLE_INFERENCE.width,
  SAMPLE_INFERENCE.height,
  SAMPLE_INFERENCE.ms,
);

export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — OBJECT CHAOS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — OBJECT CHAOS` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
