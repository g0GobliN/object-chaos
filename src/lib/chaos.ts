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

/** Canonical origin. Link unfurlers require absolute URLs, not paths. */
export const SITE_ORIGIN = "https://objectchaos.freebuff.page";

export const SOCIAL_IMAGE = `${SITE_ORIGIN}/brand/og.jpg`;

export function pageHead(title: string, description: string, path = "/") {
  return {
    meta: [
      { title: `${title} — OBJECT CHAOS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — OBJECT CHAOS` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_ORIGIN}${path}` },
      { property: "og:image", content: SOCIAL_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SOCIAL_IMAGE },
    ],
  };
}
