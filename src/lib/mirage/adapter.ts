import type { MirageRaw, MirageRawObject } from "./types";

export type DetectedObject = {
  id: string;
  name: string;
  /** Raw model confidence, 0..1. */
  confidence: number;
  /** Normalised to the analysed image, 0..1, origin top-left. */
  box: { x: number; y: number; width: number; height: number };
  /** Derived, normalised helpers used by the games. */
  area: number;
  centerX: number;
  centerY: number;
  color?: string;
  material?: string;
  /** Model's own coarse location label, e.g. "top right". */
  position?: string;
};

export type Scene = {
  setting?: string;
  surface?: string;
  lighting?: string;
  style?: string;
};

export type Analysis = {
  scene: Scene;
  objects: DetectedObject[];
  textLines: string[];
  /** Dimensions the inference actually ran at. */
  width: number;
  height: number;
  inferenceMs: number;
};

const BACKGROUND_NAMES = new Set([
  "background",
  "wall",
  "floor",
  "ground",
  "ceiling",
  "sky",
  "room",
  "surface",
  "table top",
  "desk",
  "table",
  "countertop",
  "photo",
  "image",
  "picture",
  "illustration",
]);

/**
 * A detection this large is the scene itself, not a thing you can tap. It also
 * covers every other box, so it would swallow every tap in the game.
 */
const MAX_TAPPABLE_AREA = 0.6;

/**
 * Below this the model is guessing: a wall clock comes back as "teapot", a
 * bench as "chair". Those boxes are hidden rather than shown as facts.
 */
export const MIN_CONFIDENCE = 0.45;

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Mirage reports boxes on a fixed 1000x1000 grid, independent of the input
 * resolution: the same photo analysed at 768px and 1536px returns identical
 * coordinates. Dividing by the image size (the obvious guess) shifts every box.
 */
export const MIRAGE_GRID = 1000;

function normalizeBox(raw: MirageRawObject) {
  const bbox = Array.isArray(raw.bbox) ? raw.bbox : [];
  if (bbox.length < 4) return undefined;
  const [x1, y1, x2, y2] = bbox.map((value) => Number(value));
  if (![x1, y1, x2, y2].every((value) => Number.isFinite(value))) return undefined;

  const left = Math.min(x1 ?? 0, x2 ?? 0);
  const top = Math.min(y1 ?? 0, y2 ?? 0);
  const right = Math.max(x1 ?? 0, x2 ?? 0);
  const bottom = Math.max(y1 ?? 0, y2 ?? 0);

  const x = clamp01(left / MIRAGE_GRID);
  const y = clamp01(top / MIRAGE_GRID);
  const boxWidth = clamp01((right - left) / MIRAGE_GRID);
  const boxHeight = clamp01((bottom - top) / MIRAGE_GRID);
  if (boxWidth <= 0 || boxHeight <= 0) return undefined;

  return { box: { x, y, width: boxWidth, height: boxHeight } };
}

function iou(a: DetectedObject, b: DetectedObject): number {
  const left = Math.max(a.box.x, b.box.x);
  const top = Math.max(a.box.y, b.box.y);
  const right = Math.min(a.box.x + a.box.width, b.box.x + b.box.width);
  const bottom = Math.min(a.box.y + a.box.height, b.box.y + b.box.height);
  const overlap = Math.max(0, right - left) * Math.max(0, bottom - top);
  if (overlap === 0) return 0;
  const union = a.area + b.area - overlap;
  return union > 0 ? overlap / union : 0;
}

function sameThing(a: DetectedObject, b: DetectedObject): boolean {
  const namesMatch = a.name.toLowerCase() === b.name.toLowerCase();
  if (namesMatch) return iou(a, b) >= 0.35;
  // The model sometimes labels the same box "cup", "coffee cup" and "mug".
  const words = (name: string) => new Set(name.toLowerCase().split(/\s+/).filter(Boolean));
  const [aWords, bWords] = [words(a.name), words(b.name)];
  const shared = [...aWords].some((word) => bWords.has(word));
  return shared && iou(a, b) >= 0.6;
}

/**
 * Converts Mirage's JSON into the app schema. Never invents a detection: objects
 * without a usable box, name or score are dropped, and duplicates of the same
 * region are merged keeping the highest score.
 */
export function adaptMirage(
  rawJson: string,
  width: number,
  height: number,
  inferenceMs: number,
): Analysis {
  let parsed: MirageRaw;
  try {
    parsed = JSON.parse(rawJson) as MirageRaw;
  } catch {
    throw new Error("Mirage returned malformed JSON");
  }

  const candidates: DetectedObject[] = [];
  for (const [index, raw] of (parsed.objects ?? []).entries()) {
    const name = clean(raw.name);
    const geometry = normalizeBox(raw);
    if (!name || !geometry) continue;

    const score = Number(raw.score);
    const confidence = Number.isFinite(score) ? clamp01(score) : 0;
    const area = geometry.box.width * geometry.box.height;
    if (area < 0.0015) continue;

    const color = clean(raw.description?.color);
    const material = clean(raw.description?.material);
    const position = clean(raw.position);

    candidates.push({
      id: `object_${index + 1}`,
      name,
      confidence,
      ...geometry,
      area,
      centerX: geometry.box.x + geometry.box.width / 2,
      centerY: geometry.box.y + geometry.box.height / 2,
      ...(color ? { color } : {}),
      ...(material ? { material } : {}),
      ...(position ? { position } : {}),
    });
  }

  const kept: DetectedObject[] = [];
  for (const candidate of candidates.sort((a, b) => b.confidence - a.confidence)) {
    const duplicate = kept.find((existing) => sameThing(existing, candidate));
    if (!duplicate) kept.push(candidate);
  }

  const objects = finaliseObjects(kept);

  const textLines = (parsed.text ?? [])
    .map((line) => clean(line.text))
    .filter((line): line is string => Boolean(line))
    .slice(0, 12);

  const scene: Scene = {};
  const setting = clean(parsed.scene?.setting);
  const surface = clean(parsed.scene?.surface);
  const lighting = clean(parsed.scene?.lighting);
  const style = clean(parsed.scene?.style);
  if (setting) scene.setting = setting;
  if (surface) scene.surface = surface;
  if (lighting) scene.lighting = lighting;
  if (style) scene.style = style;

  return {
    scene,
    objects,
    textLines,
    width,
    height,
    inferenceMs,
  };
}

/**
 * Drops guesses, scene-sized boxes and background detections, then gives the
 * survivors fresh ids.
 */
function finaliseObjects(kept: DetectedObject[]): DetectedObject[] {
  return kept
    .filter((object) => object.confidence >= MIN_CONFIDENCE)
    .filter((object) => object.area < MAX_TAPPABLE_AREA)
    .filter((object) => !BACKGROUND_NAMES.has(object.name.toLowerCase()))
    .map((object, index) => ({ ...object, id: `object_${index + 1}` }));
}

/**
 * Combines two passes over the same photo (a fast one and a detailed one).
 * Mirage returns boxes on a fixed 1000-unit grid, so coordinates from both
 * passes are already comparable regardless of the resolution each pass saw.
 * The same object found twice is kept once, with the more confident label.
 */
export function mergeAnalyses(primary: Analysis, extra: Analysis): Analysis {
  const pool = [...primary.objects, ...extra.objects].sort((a, b) => b.confidence - a.confidence);
  const kept: DetectedObject[] = [];
  for (const candidate of pool) {
    const duplicate = kept.find(
      (existing) => sameThing(existing, candidate) || iou(existing, candidate) >= 0.55,
    );
    if (!duplicate) kept.push(candidate);
  }

  return {
    scene: { ...extra.scene, ...primary.scene },
    objects: finaliseObjects(kept),
    textLines: [...new Set([...primary.textLines, ...extra.textLines])].slice(0, 12),
    width: primary.width,
    height: primary.height,
    inferenceMs: primary.inferenceMs + extra.inferenceMs,
  };
}
