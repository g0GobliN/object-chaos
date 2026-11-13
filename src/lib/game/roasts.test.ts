import { describe, expect, it } from "vitest";

import type { Analysis, DetectedObject } from "../mirage/adapter";
import { buildRoast } from "./roasts";

function object(id: string, name: string, extra: Partial<DetectedObject> = {}): DetectedObject {
  return {
    id,
    name,
    confidence: 0.7,
    box: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
    area: 0.04,
    centerX: 0.2,
    centerY: 0.2,
    ...extra,
  };
}

function analysis(objects: DetectedObject[]): Analysis {
  return {
    scene: { setting: "desk", surface: "wooden desk" },
    objects,
    textLines: [],
    width: 768,
    height: 512,
    inferenceMs: 1200,
  };
}

describe("buildRoast", () => {
  it("is deterministic for the same detections", () => {
    const input = analysis([object("object_1", "cup"), object("object_2", "keyboard")]);
    expect(buildRoast(input)).toEqual(buildRoast(input));
  });

  it("mentions the real object count", () => {
    const roast = buildRoast(
      analysis([
        object("object_1", "cup"),
        object("object_2", "keyboard"),
        object("object_3", "plant"),
      ]),
    );
    expect(roast.text).toContain("3 witnesses");
  });

  it("uses the cable rule for cables", () => {
    const roast = buildRoast(analysis([object("object_1", "cable"), object("object_2", "cup")]));
    expect(roast.text).toMatch(/cables are forming a government/i);
  });

  it("keeps the chaos score inside 0..100", () => {
    const empty = buildRoast(analysis([]));
    const busy = buildRoast(
      analysis(Array.from({ length: 20 }, (_, index) => object(`object_${index}`, "cable"))),
    );
    expect(empty.score).toBeGreaterThanOrEqual(0);
    expect(busy.score).toBeLessThanOrEqual(100);
  });
});
