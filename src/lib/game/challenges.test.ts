import { describe, expect, it } from "vitest";

import type { Analysis, DetectedObject } from "../mirage/adapter";
import { buildChallenges } from "./challenges";

function object(id: string, name: string, extra: Partial<DetectedObject> = {}): DetectedObject {
  return {
    id,
    name,
    confidence: 0.8,
    box: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
    area: 0.04,
    centerX: 0.2,
    centerY: 0.2,
    ...extra,
  };
}

function analysis(objects: DetectedObject[], textLines: string[] = []): Analysis {
  return { scene: {}, objects, textLines, width: 768, height: 512, inferenceMs: 1000 };
}

describe("buildChallenges", () => {
  const desk = analysis([
    object("object_1", "cup", { color: "white", material: "ceramic", area: 0.02 }),
    object("object_2", "keyboard", { color: "black", material: "plastic", area: 0.2 }),
    object("object_3", "notebook", { color: "white", area: 0.08 }),
    object("object_4", "plant", { color: "green", area: 0.05 }),
  ]);

  it("only generates challenges that can be scored", () => {
    for (const challenge of buildChallenges(desk, 3)) {
      expect(challenge.answerIds.length).toBeGreaterThan(0);
      expect(challenge.answerIds.length).toBeLessThan(desk.objects.length);
    }
  });

  it("never claims every object satisfies a challenge", () => {
    for (const challenge of buildChallenges(desk, 10)) {
      expect(challenge.answerCount).toBeLessThan(desk.objects.length);
    }
  });

  it("does not ask about guessed colours or materials the player cannot check", () => {
    const challenges = buildChallenges(desk, 10);
    expect(
      challenges.some((challenge) => /made of|something (white|black|green)/.test(challenge.text)),
    ).toBe(false);
  });

  it("asks for detected objects by name", () => {
    const challenges = buildChallenges(desk, 10).map((challenge) => challenge.text);
    expect(challenges).toContain("Find the plant.");
    expect(challenges).toContain("Find the keyboard.");
  });

  it("does not repeat the same question twice in one photo", () => {
    const texts = buildChallenges(desk, 10).map((challenge) => challenge.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("puts challenges this tab has already seen last", () => {
    const all = buildChallenges(desk, 10).map((challenge) => challenge.id);
    const fresh = buildChallenges(desk, 3, [all[0]!]).map((challenge) => challenge.id);
    expect(fresh[0]).not.toBe(all[0]);
    expect(fresh).toHaveLength(3);
  });

  it("is deterministic for the same photo", () => {
    const first = buildChallenges(desk, 3).map((challenge) => challenge.id);
    const second = buildChallenges(desk, 3).map((challenge) => challenge.id);
    expect(first).toEqual(second);
  });

  it("refuses to generate a game from fewer than two objects", () => {
    expect(buildChallenges(analysis([object("object_1", "cup")]))).toEqual([]);
    expect(buildChallenges(analysis([]))).toEqual([]);
  });

  it("uses detected text to ask about objects with words on them", () => {
    const withText = analysis(
      [object("object_1", "sign", { area: 0.1 }), object("object_2", "tree", { area: 0.3 })],
      ["STOP"],
    );
    const challenges = buildChallenges(withText, 10);
    expect(challenges.some((challenge) => challenge.kind === "text")).toBe(true);
  });
});
