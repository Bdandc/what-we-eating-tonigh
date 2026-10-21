import { describe, expect, it } from "vitest";
import { deckLayerCount, swipesLeftLabel } from "@/lib/swipe";

describe("deckLayerCount", () => {
  it("maps shuffles remaining to back layers", () => {
    expect(deckLayerCount(0, 3)).toBe(3);
    expect(deckLayerCount(1, 3)).toBe(2);
    expect(deckLayerCount(2, 3)).toBe(1);
    expect(deckLayerCount(3, 3)).toBe(0);
  });

  it("clamps and tolerates bad input", () => {
    expect(deckLayerCount(5, 3)).toBe(0);
    expect(deckLayerCount(-2, 3)).toBe(3);
    expect(deckLayerCount(Number.NaN, 3)).toBe(0);
  });
});

describe("swipesLeftLabel", () => {
  it("words the remaining swipes", () => {
    expect(swipesLeftLabel(3)).toBe("3 swipes left");
    expect(swipesLeftLabel(1)).toBe("Last pick");
    expect(swipesLeftLabel(0)).toBe("No swipes left");
  });
});
