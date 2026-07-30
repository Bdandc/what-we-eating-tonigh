import { describe, expect, it } from "vitest";
import {
  AXIS_DOMINANCE,
  DRAG_CAP,
  DRAG_FACTOR,
  SWIPE_THRESHOLD,
  dragOffset,
  evaluateSwipe,
} from "@/lib/swipe";

describe("evaluateSwipe", () => {
  it("triggers exactly at the raw-dx threshold boundary", () => {
    expect(evaluateSwipe(SWIPE_THRESHOLD - 1, 0)).toBe("none");
    expect(evaluateSwipe(SWIPE_THRESHOLD, 0)).toBe("shuffle");
    expect(evaluateSwipe(SWIPE_THRESHOLD + 1, 0)).toBe("shuffle");
  });

  it("is direction-agnostic", () => {
    expect(evaluateSwipe(-80, 0)).toBe("shuffle");
    expect(evaluateSwipe(80, 0)).toBe("shuffle");
  });

  it("requires horizontal dominance over vertical movement", () => {
    expect(evaluateSwipe(80, 39)).toBe("shuffle");
    expect(evaluateSwipe(80, 40)).toBe("none");
    expect(evaluateSwipe(80, 41)).toBe("none");
    expect(evaluateSwipe(-70, 80)).toBe("none");
  });

  it("dominance uses absolute values on both axes", () => {
    expect(evaluateSwipe(-80, -39)).toBe("shuffle");
    expect(evaluateSwipe(-80, -41)).toBe("none");
  });
});

describe("dragOffset", () => {
  it("scales by the resistance factor below the cap", () => {
    expect(dragOffset(40)).toBeCloseTo(40 * DRAG_FACTOR);
    expect(dragOffset(-40)).toBeCloseTo(-40 * DRAG_FACTOR);
  });

  it("caps the visual offset", () => {
    expect(dragOffset(500)).toBeCloseTo(DRAG_CAP * DRAG_FACTOR);
    expect(dragOffset(-500)).toBeCloseTo(-DRAG_CAP * DRAG_FACTOR);
  });

  it("keeps constants coherent (threshold reachable within the cap logic)", () => {
    expect(SWIPE_THRESHOLD).toBeLessThanOrEqual(DRAG_CAP);
    expect(AXIS_DOMINANCE).toBeGreaterThan(1);
  });
});
