/**
 * Catalogue consistency check.
 *
 * The pantry only works if it is wired to the meals in both directions:
 * every meal names ingredients that exist, and every ingredient gates at
 * least one meal. Without this, items silently become ticks that do nothing,
 * which is exactly how the first catalogue drifted to 13 dead items out of 18.
 *
 * Run with `npm run check:catalogue`.
 */
import {
  LIKELY_STOCKED,
  familyMeals,
  kidsMeals,
  meals,
  seededIngredients,
} from "../src/lib/wawet-data";

const problems: string[] = [];
const known = new Set(seededIngredients.map((i) => i.id));
const used = new Set(meals.flatMap((m) => m.ingredients));

// 1. No meal may reference an ingredient that does not exist.
for (const meal of meals) {
  for (const id of meal.ingredients) {
    if (!known.has(id)) problems.push(`${meal.name} needs unknown ingredient "${id}"`);
  }
}

// 2. No ingredient may be unreachable: a tick that changes nothing is worse
//    than no tick at all, because it teaches the user the filter is broken.
for (const ing of seededIngredients) {
  if (!used.has(ing.id)) problems.push(`"${ing.name}" is not needed by any meal`);
}

// 3. Every meal must name a hero item, or it ignores the pantry entirely.
for (const meal of meals) {
  if (meal.ingredients.length === 0) problems.push(`${meal.name} has no ingredients, so it always qualifies`);
  if (meal.ingredients.length > 3) problems.push(`${meal.name} needs ${meal.ingredients.length} items and will rarely qualify`);
}

// 4. Duplicate ids break mealById and the pantry map silently.
const dupe = (values: string[]) =>
  values.filter((v, i) => values.indexOf(v) !== i);
for (const id of dupe(meals.map((m) => m.id))) problems.push(`duplicate meal id "${id}"`);
for (const id of dupe(seededIngredients.map((i) => i.id))) problems.push(`duplicate ingredient id "${id}"`);
for (const name of dupe(seededIngredients.map((i) => i.name.toLowerCase()))) {
  problems.push(`duplicate ingredient name "${name}"`);
}

// 5. Shuffle needs at least two options in each pool.
if (familyMeals.length < 2) problems.push("family pool needs at least 2 meals");
if (kidsMeals.length < 2) problems.push("kids pool needs at least 2 meals");

// 6. The pre-filled staples must exist and must make the first run useful:
//    both pools need at least two meals fully covered by LIKELY_STOCKED.
const likely = new Set(LIKELY_STOCKED);
for (const id of LIKELY_STOCKED) {
  if (!known.has(id)) problems.push(`LIKELY_STOCKED names unknown ingredient "${id}"`);
}
const coveredBy = (pool: typeof meals) =>
  pool.filter((m) => m.ingredients.every((i) => likely.has(i))).length;
if (coveredBy(familyMeals) < 2) problems.push("LIKELY_STOCKED covers fewer than 2 family meals");
if (coveredBy(kidsMeals) < 2) problems.push("LIKELY_STOCKED covers fewer than 2 kids meals");

const perIngredient = seededIngredients
  .map((i) => ({ name: i.name, count: meals.filter((m) => m.ingredients.includes(i.id)).length }))
  .sort((a, b) => a.count - b.count);

console.log(`ingredients: ${seededIngredients.length}`);
console.log(`meals: ${meals.length} (${familyMeals.length} family, ${kidsMeals.length} kids)`);
console.log(`avg hero items per meal: ${(meals.reduce((n, m) => n + m.ingredients.length, 0) / meals.length).toFixed(2)}`);
console.log(`first-run coverage: ${coveredBy(familyMeals)} family, ${coveredBy(kidsMeals)} kids meals from pre-filled staples`);
console.log(`thinnest coverage: ${perIngredient.slice(0, 3).map((i) => `${i.name} (${i.count})`).join(", ")}`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log("\ncatalogue is consistent");
