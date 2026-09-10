import { describe, expect, it } from "vitest";
import { meals } from "@/lib/wawet-data";
import { type Recipe, recipes, seededRecipeFor, validateRecipes } from "@/lib/wawet-recipes";
import { buildRecipeView } from "@/lib/recipe-view";
import { addCustomMeal, freshState, resolveMeal } from "@/lib/wawet-state";

const THURSDAY = new Date(2026, 6, 30, 12, 0, 0);

describe("recipe coverage (mirror of the CI catalogue check)", () => {
  it("every built-in meal has a well-formed recipe and nothing else does", () => {
    expect(validateRecipes(meals, recipes)).toEqual([]);
  });

  it("flags missing, orphaned, and malformed entries", () => {
    const sample: Record<string, Recipe> = {
      "spaghetti-bolognese": { serves: 4, time: "50 min", steps: ["Cook."] },
      "not-a-meal": { serves: 4, time: "10 min", steps: ["Cook."] },
      "chilli-con-carne": { serves: 0, time: "", steps: [] },
    };
    const problems = validateRecipes(meals, sample);
    expect(problems.some((p) => p.includes('"lasagna-night" has no recipe'))).toBe(true);
    expect(problems.some((p) => p.includes('"not-a-meal" matches no seeded meal'))).toBe(true);
    expect(problems.some((p) => p.includes('"chilli-con-carne" has no steps'))).toBe(true);
    expect(problems.some((p) => p.includes('"chilli-con-carne" serves fewer than 1'))).toBe(true);
    expect(problems.some((p) => p.includes('"chilli-con-carne" has no time'))).toBe(true);
    expect(problems.some((p) => p.includes("does not equal meal count"))).toBe(true);
  });

  it("flags em dashes in steps (UI copy rule)", () => {
    const sample: Record<string, Recipe> = Object.fromEntries(
      meals.map((m) => [m.id, { serves: 4, time: "10 min", steps: ["Fine step."] }]),
    );
    sample["spaghetti-bolognese"] = {
      serves: 4,
      time: "50 min",
      steps: ["Brown the mince — thoroughly."],
    };
    const problems = validateRecipes(meals, sample);
    expect(problems).toEqual(['recipe "spaghetti-bolognese" contains an em dash']);
  });
});

describe("seededRecipeFor (prototype-safe lookup)", () => {
  it("returns the recipe for a real seeded id", () => {
    expect(seededRecipeFor("spaghetti-bolognese")?.steps.length).toBeGreaterThan(0);
  });

  it.each(["toString", "constructor", "hasOwnProperty", "not-a-meal", ""])(
    "returns undefined for %j",
    (id) => {
      expect(seededRecipeFor(id)).toBeUndefined();
    },
  );
});

describe("buildRecipeView", () => {
  it("builds a seeded view with steps, serves, time, and pantry ticks", () => {
    const s = freshState(THURSDAY);
    const view = buildRecipeView(s, "spaghetti-bolognese");
    expect(view).not.toBeNull();
    if (!view) return;
    expect(view.name).toBe("Spaghetti Bolognese");
    expect(view.kind).toBe("family");
    expect(view.serves).toBe(4);
    expect(view.steps.length).toBeGreaterThanOrEqual(5);
    expect(view.editHref).toBeUndefined();
    // Hero items resolve to display names with a boolean tick each.
    expect(view.ingredients.map((i) => i.name)).toEqual(["Beef mince", "Pasta"]);
    for (const ing of view.ingredients) {
      expect(ing.inPantry).toBe(s.pantry[ing.name === "Pasta" ? "pasta" : "beef-mince"] === true);
    }
  });

  it("builds a custom view with no steps and an edit link (Phase 1 fallback)", () => {
    let s = freshState(THURSDAY);
    const added = addCustomMeal(s, { name: "Nikolay Special", kind: "family", ingredients: ["pasta"] });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    s = added.state;
    const custom = s.customMeals.find((m) => m.name === "Nikolay Special");
    expect(custom).toBeDefined();
    if (!custom) return;
    const view = buildRecipeView(s, custom.id);
    expect(view).not.toBeNull();
    if (!view) return;
    expect(view.steps).toEqual([]);
    expect(view.editHref).toBe(`/meals/${custom.id}`);
    expect(view.ingredients).toEqual([{ name: "Pasta", inPantry: s.pantry.pasta === true }]);
  });

  it("resolves a starter meal (custom pool) rather than treating it as unknown", () => {
    const s = freshState(THURSDAY);
    const starter = s.customMeals[0];
    const view = buildRecipeView(s, starter.id);
    expect(view?.name).toBe(starter.name);
    expect(view?.steps).toEqual([]);
  });

  it.each(["nope-not-real", "constructor", "toString", "__proto__", "m-not-a-uuid", "UPPER", "a/b"])(
    "returns null for unknown or hostile id %j",
    (id) => {
      const s = freshState(THURSDAY);
      expect(buildRecipeView(s, id)).toBeNull();
    },
  );

  it("resolveMeal itself is prototype-safe (URL ids reach it now)", () => {
    const s = freshState(THURSDAY);
    expect(resolveMeal(s, "constructor")).toBeNull();
    expect(resolveMeal(s, "toString")).toBeNull();
  });
});
