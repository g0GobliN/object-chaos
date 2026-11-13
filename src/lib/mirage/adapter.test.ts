import { describe, expect, it } from "vitest";

import { adaptMirage, MIRAGE_GRID } from "./adapter";

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

  it("treats an unparseable response as an error rather than empty success", () => {
    expect(() => adaptMirage("not json", 100, 100, 0)).toThrow(/malformed/i);
  });
});
