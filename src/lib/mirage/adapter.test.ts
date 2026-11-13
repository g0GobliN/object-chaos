import { describe, expect, it } from "vitest";

import { adaptMirage, mergeAnalyses, MIRAGE_GRID } from "./adapter";

const inference = (objects: unknown[]) =>
  JSON.stringify({
    scene: { setting: "desk", surface: "wooden desk" },
    objects,
    text: [{ text: "HELLO" }],
  });

describe("adaptMirage", () => {
  it("normalises boxes from Mirage's 1000-unit grid", () => {
    const analysis = adaptMirage(
      inference([
        {
          id: 1,
          name: "cup",
          score: 0.8,
          bbox: [100, 50, 300, 250],
          description: { color: "white" },
        },
      ]),
      1000,
      500,
      42,
    );

    expect(analysis.objects).toHaveLength(1);
    const [cup] = analysis.objects;
    expect(cup?.box).toEqual({ x: 0.1, y: 0.05, width: 0.2, height: 0.2 });
    expect(cup?.centerX).toBeCloseTo(0.2);
    expect(cup?.centerY).toBeCloseTo(0.15);
    expect(cup?.color).toBe("white");
    expect(analysis.scene.surface).toBe("wooden desk");
    expect(analysis.textLines).toEqual(["HELLO"]);
    expect(analysis.inferenceMs).toBe(42);
  });

  it("returns identical boxes whatever resolution the image was analysed at", () => {
    const json = inference([{ id: 1, name: "cup", score: 0.8, bbox: [100, 50, 300, 250] }]);
    const at768 = adaptMirage(json, 768, 512, 10);
    const at1536 = adaptMirage(json, 1536, 1024, 10);
    expect(at768.objects[0]?.box).toEqual(at1536.objects[0]?.box);
    expect(MIRAGE_GRID).toBe(1000);
  });

  it("drops objects without a usable box or name instead of inventing one", () => {
    const analysis = adaptMirage(
      inference([
        { id: 1, name: "ghost", score: 0.9 },
        { id: 2, score: 0.5, bbox: [0, 0, 10, 10] },
        { id: 3, name: "sliver", score: 0.5, bbox: [0, 0, 1, 1] },
      ]),
      1000,
      1000,
      1,
    );

    expect(analysis.objects).toHaveLength(0);
  });

  it("merges duplicates of the same region and keeps the best score", () => {
    const analysis = adaptMirage(
      inference([
        { id: 1, name: "cup", score: 0.62, bbox: [100, 100, 300, 300] },
        { id: 2, name: "cup", score: 0.91, bbox: [105, 102, 298, 305] },
        { id: 3, name: "plant", score: 0.7, bbox: [600, 100, 800, 400] },
      ]),
      1000,
      1000,
      1,
    );

    expect(analysis.objects.map((object) => object.name)).toEqual(["cup", "plant"]);
    expect(analysis.objects[0]?.confidence).toBe(0.91);
  });

  it("hides low-confidence guesses instead of labelling them as objects", () => {
    const analysis = adaptMirage(
      inference([
        { id: 1, name: "teapot", score: 0.44, bbox: [700, 100, 800, 220] },
        { id: 2, name: "chair", score: 0.54, bbox: [100, 400, 400, 900] },
      ]),
      768,
      512,
      1,
    );

    expect(analysis.objects.map((object) => object.name)).toEqual(["chair"]);
  });

  it("drops the scene-sized box so it cannot swallow every tap", () => {
    const analysis = adaptMirage(
      inference([
        { id: 1, name: "desk", score: 0.5, bbox: [3, 9, 995, 984] },
        { id: 2, name: "cup", score: 0.8, bbox: [380, 110, 530, 400] },
      ]),
      768,
      512,
      1,
    );

    expect(analysis.objects.map((object) => object.name)).toEqual(["cup"]);
  });

  it("drops a whole-frame detection even when its label is not a background word", () => {
    const analysis = adaptMirage(
      inference([
        { id: 1, name: "backpack", score: 0.9, bbox: [0, 0, 1000, 900] },
        { id: 2, name: "keys", score: 0.6, bbox: [100, 700, 240, 820] },
      ]),
      1000,
      1000,
      1,
    );

    expect(analysis.objects.map((object) => object.name)).toEqual(["keys"]);
  });

  it("merges a fast pass and a closer pass without duplicating what both found", () => {
    const fast = adaptMirage(
      inference([
        { id: 1, name: "chair", score: 0.6, bbox: [100, 100, 400, 400] },
        { id: 2, name: "plant", score: 0.5, bbox: [600, 100, 900, 500] },
      ]),
      768,
      512,
      1000,
    );
    const closer = adaptMirage(
      inference([
        { id: 1, name: "chair", score: 0.8, bbox: [105, 102, 398, 404] },
        { id: 2, name: "cup", score: 0.7, bbox: [200, 600, 300, 700] },
      ]),
      1024,
      683,
      2000,
    );

    const merged = mergeAnalyses(fast, closer);
    expect(merged.objects.map((object) => object.name)).toEqual(["chair", "cup", "plant"]);
    expect(merged.objects.find((object) => object.name === "chair")?.confidence).toBe(0.8);
    expect(merged.objects.map((object) => object.id)).toEqual(["object_1", "object_2", "object_3"]);
    expect(merged.inferenceMs).toBe(3000);
  });

  it("keeps the extra objects a closer pass found and drops merged scene boxes", () => {
    const fast = adaptMirage(
      inference([{ id: 1, name: "cup", score: 0.5, bbox: [300, 300, 450, 500] }]),
      768,
      512,
      100,
    );
    const closer = adaptMirage(
      inference([
        { id: 1, name: "desk", score: 0.9, bbox: [0, 0, 1000, 1000] },
        { id: 2, name: "keys", score: 0.6, bbox: [500, 600, 650, 700] },
      ]),
      1024,
      683,
      100,
    );

    const merged = mergeAnalyses(fast, closer);
    expect(merged.objects.map((object) => object.name).sort()).toEqual(["cup", "keys"]);
  });

  it("treats an unparseable response as an error rather than empty success", () => {
    expect(() => adaptMirage("not json", 100, 100, 0)).toThrow(/malformed/i);
  });
});
