import type { Analysis, DetectedObject } from "../mirage/adapter";

export type ChallengeKind =
  "color" | "material" | "position" | "size" | "category" | "text" | "name";

export type Challenge = {
  id: string;
  text: string;
  kind: ChallengeKind;
  /** Objects that satisfy the challenge. Never empty. */
  answerIds: string[];
  /** How many detected objects satisfy it. */
  answerCount: number;
};

const CATEGORIES: Array<{ id: string; phrase: string; words: string[] }> = [
  {
    id: "kitchen",
    phrase: "Find something that belongs in a kitchen.",
    words: ["cup", "mug", "glass", "bottle", "bowl", "plate", "kettle", "teapot", "spoon", "fork"],
  },
  {
    id: "computer",
    phrase: "Find something you could type on.",
    words: ["keyboard", "laptop", "tablet", "phone", "monitor", "computer"],
  },
  {
    id: "reading",
    phrase: "Find something with pages.",
    words: ["notebook", "book", "paper", "magazine", "document", "folder", "card"],
  },
  {
    id: "seating",
    phrase: "Find something you could sit on.",
    words: ["chair", "stool", "sofa", "couch", "bed", "bench"],
  },
  {
    id: "alive",
    phrase: "Find something that is alive.",
    words: ["plant", "flower", "tree", "cactus", "leaf", "herb", "pet", "cat", "dog"],
  },
];

function hasWord(object: DetectedObject, words: string[]): boolean {
  const name = object.name.toLowerCase();
  return words.some((word) => name.includes(word));
}

function tally(objects: DetectedObject[], matches: (object: DetectedObject) => boolean): string[] {
  return objects.filter(matches).map((object) => object.id);
}

/**
 * Builds challenges that can actually be scored from the detections: every
 * challenge has at least one matching object and at least one object that does
 * not match, so the player always makes a real choice.
 */
export function buildChallenges(analysis: Analysis, limit = 3, seen: string[] = []): Challenge[] {
  const objects = analysis.objects;
  if (objects.length < 2) return [];

  const candidates: Challenge[] = [];
  const texts = new Set<string>();
  const push = (challenge: Omit<Challenge, "answerCount">) => {
    const answerCount = challenge.answerIds.length;
    if (answerCount === 0 || answerCount >= objects.length) return;
    if (texts.has(challenge.text)) return;
    texts.add(challenge.text);
    candidates.push({ ...challenge, answerCount });
  };

  // Only ask about things the model actually located, by name. Guessed
  // colours, materials and "smallest object" prompts are not visually
  // checkable, so the player cannot tell what the game is asking for.
  const byName = new Map<string, DetectedObject[]>();
  for (const object of objects) {
    const key = object.name.toLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), object]);
  }
  for (const [name, group] of byName) {
    push({
      id: `find_${name.replace(/\s+/g, "_")}`,
      kind: "name",
      text: `Find the ${name}.`,
      answerIds: group.map((object) => object.id),
    });
  }

  const halves: Array<{ id: string; text: string; test: (object: DetectedObject) => boolean }> = [
    { id: "top", text: "Find something in the top half.", test: (o) => o.centerY < 0.5 },
    { id: "bottom", text: "Find something in the bottom half.", test: (o) => o.centerY >= 0.5 },
    { id: "left", text: "Find something on the left side.", test: (o) => o.centerX < 0.5 },
    { id: "right", text: "Find something on the right side.", test: (o) => o.centerX >= 0.5 },
  ];
  for (const half of halves) {
    push({
      id: `position_${half.id}`,
      kind: "position",
      text: half.text,
      answerIds: tally(objects, half.test),
    });
  }

  for (const category of CATEGORIES) {
    push({
      id: `category_${category.id}`,
      kind: "category",
      text: category.phrase,
      answerIds: tally(objects, (object) => hasWord(object, category.words)),
    });
  }

  if (analysis.textLines.length > 0) {
    push({
      id: "text_any",
      kind: "text",
      text: "Find something with words on it.",
      answerIds: tally(objects, (object) =>
        hasWord(object, [
          "text",
          "sign",
          "label",
          "logo",
          "screen",
          "book",
          "notebook",
          "card",
          "poster",
        ]),
      ),
    });
  }

  for (const [name, group] of byName) {
    if (group.length < 2) continue;
    push({
      id: `count_${name.replace(/\s+/g, "_")}`,
      kind: "name",
      text: `Find one of the ${group.length} ${name}s.`,
      answerIds: group.map((object) => object.id),
    });
  }

  // Deterministic ordering: shuffle by a stable key so a photo always plays the same way.
  const rank = (challenge: Challenge) => {
    let hash = 0;
    for (const char of challenge.id) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
    return hash;
  };
  // Challenges this tab has already asked come last, so a new photo does not
  // replay the same three questions before showing anything new.
  const alreadySeen = new Set(seen);
  candidates.sort((a, b) => {
    const seenA = alreadySeen.has(a.id) ? 1 : 0;
    const seenB = alreadySeen.has(b.id) ? 1 : 0;
    return seenA - seenB || rank(a) - rank(b);
  });

  const picked: Challenge[] = [];
  const usedKinds = new Set<ChallengeKind>();
  for (const candidate of candidates) {
    if (picked.length >= limit) break;
    if (usedKinds.has(candidate.kind)) continue;
    picked.push(candidate);
    usedKinds.add(candidate.kind);
  }
  for (const candidate of candidates) {
    if (picked.length >= limit) break;
    if (!picked.includes(candidate)) picked.push(candidate);
  }

  return picked;
}
