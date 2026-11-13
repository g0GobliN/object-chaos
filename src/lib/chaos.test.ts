import { describe, expect, it } from "vitest";
import { isCorrectAnswer, challenges } from "./chaos";
describe("Mock object selection", () => {
  it("accepts a drinking vessel for the drink challenge", () => {
    expect(isCorrectAnswer(0, "mug")).toBe(true);
    expect(isCorrectAnswer(0, "bottle")).toBe(true);
    expect(isCorrectAnswer(0, "keyboard")).toBe(false);
  });
  it("accepts only the red notebook for the red challenge", () => {
    expect(challenges[1]?.text).toBe("Find something RED.");
    expect(isCorrectAnswer(1, "notebook")).toBe(true);
    expect(isCorrectAnswer(1, "mug")).toBe(false);
  });
  it("does not accept an answer after the last challenge", () => {
    expect(isCorrectAnswer(3, "headphones")).toBe(false);
  });
});
