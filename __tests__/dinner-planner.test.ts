import { describe, it, expect } from "vitest";

// Extracted pure functions for testing (mirrors dinner-planner.tsx)
function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function getRandomMealId(
  mealIds: string[],
  currentMealId: string,
  mealLikes: Record<string, string[]>,
): string {
  const uniqueIds = [...new Set(mealIds)].filter((id) => id !== currentMealId);
  if (uniqueIds.length === 0) return currentMealId;
  const weighted = [...uniqueIds].sort((left, right) => {
    const rightScore = mealLikes[right]?.length ?? 0;
    const leftScore = mealLikes[left]?.length ?? 0;
    if (rightScore !== leftScore) return rightScore - leftScore;
    return Math.random() - 0.5;
  });
  return weighted[0];
}

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Curry Night")).toBe("curry-night");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  --hello--  ")).toBe("hello");
  });

  it("collapses multiple special chars into one hyphen", () => {
    expect(slugify("mac & cheese!")).toBe("mac-cheese");
  });

  it("truncates at 40 characters", () => {
    const long = "a".repeat(50);
    expect(slugify(long).length).toBe(40);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("getRandomMealId", () => {
  it("never returns the current meal", () => {
    const ids = ["pasta", "pizza", "curry"];
    for (let i = 0; i < 20; i++) {
      expect(getRandomMealId(ids, "pasta", {})).not.toBe("pasta");
    }
  });

  it("returns current meal when no alternatives exist", () => {
    expect(getRandomMealId(["pasta"], "pasta", {})).toBe("pasta");
  });

  it("returns current meal when all alternatives are duplicates of current", () => {
    expect(getRandomMealId(["pasta", "pasta", "pasta"], "pasta", {})).toBe("pasta");
  });

  it("prefers meals with more likes", () => {
    const ids = ["pasta", "pizza", "curry"];
    const likes: Record<string, string[]> = {
      pizza: ["mum", "dad", "kid"],
      curry: ["mum"],
    };
    // Run many times to confirm weighted bias toward pizza
    const counts: Record<string, number> = { pizza: 0, curry: 0 };
    for (let i = 0; i < 100; i++) {
      const result = getRandomMealId(ids, "pasta", likes);
      if (result in counts) counts[result]++;
    }
    expect(counts.pizza).toBeGreaterThan(counts.curry);
  });
});
