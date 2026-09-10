import { type MealKind, seededIngredients } from "./wawet-data";
import { seededRecipeFor } from "./wawet-recipes";
import { CUSTOM_MEAL_ID_RE, type WawetState, resolveMeal } from "./wawet-state";

/**
 * The recipe page's single rendering contract. Both sources feed the same
 * shape: seeded dishes bring authored steps; custom meals bring [] today and
 * their own instructions once the field ships. steps.length decides between
 * the numbered list and the own-meal fallback line; there is no other branch.
 */
export type RecipeView = {
  name: string;
  kind: MealKind;
  serves?: number;
  time?: string;
  ingredients: { name: string; inPantry: boolean }[];
  steps: string[];
  /** Set for custom meals: the edit form route for the fallback line. */
  editHref?: string;
};

/** Seeded meal ids are lowercase kebab (verified across all 63; input hygiene
 * only, the prototype defense is Object.hasOwn inside seededRecipeFor). */
const SEEDED_ID_RE = /^[a-z0-9-]+$/;

export function buildRecipeView(state: WawetState, id: string): RecipeView | null {
  if (!SEEDED_ID_RE.test(id) && !CUSTOM_MEAL_ID_RE.test(id)) return null;

  const meal = resolveMeal(state, id);
  if (!meal) return null;

  const ingredientName = new Map<string, string>();
  for (const ing of seededIngredients) ingredientName.set(ing.id, ing.name);
  for (const ing of state.customIngredients) ingredientName.set(ing.id, ing.name);

  const ingredients = meal.ingredients
    .filter((ingId) => ingredientName.has(ingId))
    .map((ingId) => ({
      name: ingredientName.get(ingId) as string,
      // The exact-id tick check the meal form and pantry chips already use.
      inPantry: state.pantry[ingId] === true,
    }));

  const recipe = seededRecipeFor(id);
  if (recipe) {
    return {
      name: meal.name,
      kind: meal.kind,
      serves: recipe.serves,
      time: recipe.time,
      ingredients,
      steps: recipe.steps,
    };
  }

  return {
    name: meal.name,
    kind: meal.kind,
    ingredients,
    steps: [],
    editHref: `/meals/${id}`,
  };
}
