import { describe, expect, it } from "vitest";
import {
  AXIS_DOMINANCE,
  FOLLOW_LIMIT,
  OVERDRAG_FACTOR,
  PROMOTE_DISTANCE,
  ROTATION_FACTOR,
  SWIPE_THRESHOLD,
  dragOffset,
  dragProgress,
  dragRotation,
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
  it("follows the finger 1:1 up to the follow limit", () => {
    expect(dragOffset(40)).toBe(40);
    expect(dragOffset(-40)).toBe(-40);
    expect(dragOffset(FOLLOW_LIMIT)).toBe(FOLLOW_LIMIT);
  });

  it("resists but keeps moving past the follow limit", () => {
    const past = dragOffset(FOLLOW_LIMIT + 100);
    expect(past).toBeCloseTo(FOLLOW_LIMIT + 100 * OVERDRAG_FACTOR);
    expect(dragOffset(-(FOLLOW_LIMIT + 100))).toBeCloseTo(-past);
    // Monotonic: more finger travel always means more card travel.
    expect(dragOffset(FOLLOW_LIMIT + 101)).toBeGreaterThan(past);
  });
});

describe("dragProgress", () => {
  it("rises linearly to 1 at the promote distance, then clamps", () => {
    expect(dragProgress(0)).toBe(0);
    expect(dragProgress(PROMOTE_DISTANCE / 2)).toBeCloseTo(0.5);
    expect(dragProgress(PROMOTE_DISTANCE)).toBe(1);
    expect(dragProgress(PROMOTE_DISTANCE * 3)).toBe(1);
    expect(dragProgress(-PROMOTE_DISTANCE)).toBe(1);
  });

  it("a threshold-grade swipe has already visibly promoted the under-card", () => {
    expect(dragProgress(SWIPE_THRESHOLD)).toBeGreaterThanOrEqual(0.5);
  });
});

describe("dragRotation", () => {
  it("tilts proportionally to the visual offset, signed", () => {
    expect(dragRotation(100)).toBeCloseTo(dragOffset(100) * ROTATION_FACTOR);
    expect(dragRotation(-100)).toBeCloseTo(-dragRotation(100));
  });
});

describe("constants stay coherent", () => {
  it("threshold is reachable within the 1:1 follow zone", () => {
    expect(SWIPE_THRESHOLD).toBeLessThanOrEqual(FOLLOW_LIMIT);
    expect(AXIS_DOMINANCE).toBeGreaterThan(1);
    expect(PROMOTE_DISTANCE).toBeGreaterThanOrEqual(SWIPE_THRESHOLD);
  });
});
