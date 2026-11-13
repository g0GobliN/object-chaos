import type { Analysis, DetectedObject } from "../mirage/adapter";

export type Roast = {
  text: string;
  lines: string[];
  score: number;
};

type Rule = {
  match: (object: DetectedObject) => boolean;
  line: (object: DetectedObject) => string;
};

const RULES: Rule[] = [
  {
    match: (o) => /cable|wire|charger|cord/.test(o.name.toLowerCase()),
    line: () => "Your cables are forming a government.",
  },
  {
    match: (o) => /mug|cup|glass|bottle/.test(o.name.toLowerCase()),
    line: (o) => `That ${o.name.toLowerCase()} has survived three economic crises.`,
  },
  {
    match: (o) => /plant|flower|leaf|cactus/.test(o.name.toLowerCase()),
    line: () => "The plant is the only one here with its life together.",
  },
  {
    match: (o) => /keyboard/.test(o.name.toLowerCase()),
    line: () => "That keyboard has heard things it can never unhear.",
  },
  {
    match: (o) => /notebook|book|paper|folder/.test(o.name.toLowerCase()),
    line: () => "The notebook is collecting evidence.",
  },
  {
    match: (o) => /mouse/.test(o.name.toLowerCase()),
    line: () => "The mouse is the only thing here that knows where it is going.",
  },
  {
    match: (o) => /scissors|knife/.test(o.name.toLowerCase()),
    line: () => "The scissors have clearly been thinking about it.",
  },
  {
    match: (o) => /phone|tablet/.test(o.name.toLowerCase()),
    line: () => "That phone is face down, which is the only way it copes.",
  },
  {
    match: (o) => /person|man|woman|child|crowd/.test(o.name.toLowerCase()),
    line: () => "Someone here is trying very hard to look busy.",
  },
  {
    match: (o) => o.material === "wood" && o.area > 0.2,
    line: () => "The wooden thing has been load-bearing for years and nobody has thanked it.",
  },
];

const GENERIC = [
  (o: DetectedObject) =>
    `A ${o.color ?? "mysterious"} ${o.name.toLowerCase()} with main-character energy.`,
  (o: DetectedObject) => `The ${o.name.toLowerCase()} is not lost. It is hiding.`,
  (o: DetectedObject) =>
    `That ${o.name.toLowerCase()} has been in the same spot so long it counts as furniture.`,
  (o: DetectedObject) => `The ${o.name.toLowerCase()} would like everyone to calm down.`,
];

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) {
    result ^= char.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return Math.abs(result);
}

function pick<T>(items: T[], seed: number): T | undefined {
  if (items.length === 0) return undefined;
  return items[seed % items.length];
}

/**
 * Deterministic, local roast: no model call, no invented facts about the user.
 * Only detected objects, their attributes and their count are used.
 */
export function buildRoast(analysis: Analysis): Roast {
  const objects = analysis.objects;
  const seed = hash(objects.map((object) => object.name.toLowerCase()).join("|"));
  const names = objects.map((object) => object.name.toLowerCase());
  const duplicates = names.length - new Set(names).size;
  const cables = names.filter((name) => /cable|wire|charger|cord/.test(name)).length;
  const cups = names.filter((name) => /cup|mug|glass|bottle/.test(name)).length;

  const lines: string[] = [];
  const place = analysis.scene.surface ?? analysis.scene.setting ?? "surface";
  lines.push(
    objects.length === 0
      ? "Nothing was found, which is its own kind of chaos."
      : `Your ${place} is a crime scene with ${objects.length} witnesses.`,
  );

  const matched: string[] = [];
  for (const object of objects) {
    const rule = RULES.find((candidate) => candidate.match(object));
    const line = rule ? rule.line(object) : pick(GENERIC, seed + matched.length)?.(object);
    if (line && !matched.includes(line)) matched.push(line);
    if (matched.length === 2) break;
  }
  if (matched.length === 0 && objects[0]) {
    const fallback = `${objects[0].name} is here. That is the whole update.`;
    matched.push(fallback);
  }
  lines.push(...matched);

  if (cups >= 2) lines.push(`${cups} drinking vessels. This is a hydration situation, not a desk.`);
  if (duplicates > 0)
    lines.push(
      `${duplicates} of these ${duplicates === 1 ? "is" : "are"} doing the same job. None will admit it.`,
    );

  const score = Math.max(
    20,
    Math.min(
      99,
      35 +
        Math.min(objects.length, 15) * 3 +
        duplicates * 4 +
        cables * 6 +
        (analysis.textLines.length > 0 ? 3 : 0),
    ),
  );

  return { text: lines.join(" "), lines, score };
}
