import { expect, test, type Page } from "@playwright/test";
import { familyMeals, kidsMeals, mealById } from "@/lib/wawet-data";
import { freshState, todayLocalDate } from "@/lib/wawet-state";

// A Thursday at noon (never the default takeaway Tuesday).
const THURSDAY = new Date(2026, 7, 6, 12, 0, 0);
// The default takeaway day.
const TUESDAY = new Date(2026, 7, 4, 12, 0, 0);

/** Expected deterministic suggestions for a given fake "now". */
function expected(now: Date) {
  const s = freshState(now);
  return {
    family: mealById[s.today.suggestionId],
    kids: mealById[s.today.kidsSuggestionId],
  };
}

/**
 * Open the Today screen with every pantry item already ticked and a known
 * mapped meal as tonight's suggestion, so the pantry flow can be driven from
 * the UI. Returns the seeded meal.
 */
async function openWithFullPantry(page: Page, now: Date) {
  const meal = familyMeals.find((m) => m.ingredients.length > 0)!;
  const state = freshState(now);
  for (const id of Object.keys(state.pantry)) state.pantry[id] = true;
  state.today.suggestionId = meal.id;
  await page.clock.install({ time: now });
  await page.addInitScript(
    (value) => window.localStorage.setItem("wawet-state-v1", value),
    JSON.stringify(state),
  );
  await page.goto("/");
  return meal;
}

async function openAt(page: Page, now: Date, path = "/") {
  await page.clock.install({ time: now });
  await page.goto(path);
}

test.describe("today screen", () => {
  test("renders the deterministic daily suggestion", async ({ page }) => {
    await openAt(page, THURSDAY);
    const card = page.getByTestId("today-card");
    await expect(card).toHaveAttribute("data-variant", "normal");
    await expect(page.getByTestId("meal-name")).toHaveText(expected(THURSDAY).family.name);
    await expect(page.getByTestId("shuffle-count")).toHaveText("0/3");
  });

  test("shuffles change the meal, count up, and cap at 3", async ({ page }) => {
    await openAt(page, THURSDAY);
    const name = page.getByTestId("meal-name");
    const shuffleButton = page.getByRole("button", { name: /shuffle/i });
    let previous = await name.textContent();
    for (let n = 1; n <= 3; n++) {
      await shuffleButton.click();
      await expect(page.getByTestId("shuffle-count")).toHaveText(`${n}/3`);
      await expect(name).not.toHaveText(previous ?? "");
      previous = await name.textContent();
    }
    await expect(shuffleButton).toBeDisabled();
  });

  test("suggestion survives a reload (stored ids are truth)", async ({ page }) => {
    await openAt(page, THURSDAY);
    await page.getByRole("button", { name: /shuffle/i }).click();
    const shuffled = await page.getByTestId("meal-name").textContent();
    await page.reload();
    await expect(page.getByTestId("meal-name")).toHaveText(shuffled ?? "");
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
  });

  test("shuffle button keeps keyboard focus across shuffles", async ({ page }) => {
    await openAt(page, THURSDAY);
    const button = page.getByRole("button", { name: /shuffle suggestion/i });
    await button.click();
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
    await expect(button).toBeFocused();
  });

  test("kids pill swaps to the kids suggestion and back", async ({ page }) => {
    await openAt(page, THURSDAY);
    const pill = page.getByTestId("kids-pill");
    await expect(pill).toHaveText("Kids suggestion");
    await pill.click();
    // A view toggle is not a shuffle: no card gets thrown off the deck.
    await expect(page.locator(".card-out")).toHaveCount(0);
    await expect(page.getByTestId("meal-name")).toHaveText(expected(THURSDAY).kids.name);
    await expect(pill).toHaveText("Family suggestion");
    await pill.click();
    await expect(page.getByTestId("meal-name")).toHaveText(expected(THURSDAY).family.name);
  });
});

test.describe("takeaway day", () => {
  test("shows the takeaway card with no shuffle control, skips, and restores", async ({ page }) => {
    await openAt(page, TUESDAY);
    const card = page.getByTestId("today-card");
    await expect(card).toHaveAttribute("data-variant", "takeaway");
    await expect(card).toContainText("Takeaway");
    await expect(card).toContainText("Tuesday");
    await expect(page.getByRole("button", { name: /shuffle/i })).toHaveCount(0);
    await expect(page.getByTestId("kids-pill")).toHaveCount(0);

    await page.getByRole("button", { name: "Skip Takeaway tonight" }).click();
    await expect(page.getByTestId("today-card")).toHaveAttribute("data-variant", "normal");
    await expect(page.getByTestId("kids-pill")).toBeVisible();

    await page.getByRole("button", { name: /takeaway day · Restore/ }).click();
    await expect(page.getByTestId("today-card")).toHaveAttribute("data-variant", "takeaway");
  });
});

test.describe("pantry", () => {
  test("unticking a needed ingredient re-picks the suggestion on save, for free", async ({ page }) => {
    const meal = await openWithFullPantry(page, THURSDAY);
    await expect(page.getByTestId("meal-name")).toHaveText(meal.name);

    await page.getByRole("link", { name: "Don't have the ingredients?" }).click();
    await page.getByTestId(`chip-${meal.ingredients[0]}`).click();
    await page.getByTestId("save-pantry").click();

    await expect(page.getByTestId("meal-name")).not.toHaveText(meal.name);
    await expect(page.getByTestId("shuffle-count")).toHaveText("0/3");
  });

  test("leaving without saving keeps tonight's dish AND discards the draft", async ({ page }) => {
    const meal = await openWithFullPantry(page, THURSDAY);
    await page.getByRole("link", { name: "Don't have the ingredients?" }).click();
    const chip = page.getByTestId(`chip-${meal.ingredients[0]}`);
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByTestId("meal-name")).toHaveText(meal.name);
    // The unsaved tick was discarded, not silently persisted.
    await page.getByRole("link", { name: "Don't have the ingredients?" }).click();
    await expect(page.getByTestId(`chip-${meal.ingredients[0]}`)).toHaveAttribute("aria-pressed", "true");
  });

  test("a pantry that matches only one family meal still shuffles (extended deal + notice)", async ({ page }) => {
    const state = freshState(THURSDAY);
    for (const id of Object.keys(state.pantry)) state.pantry[id] = false;
    for (const id of ["fish", "chips", "garden-peas"]) state.pantry[id] = true;
    state.today.suggestionId = "fish-and-chips";
    await page.clock.install({ time: THURSDAY });
    await page.addInitScript(
      (value) => window.localStorage.setItem("wawet-state-v1", value),
      JSON.stringify(state),
    );
    await page.goto("/");
    await expect(page.getByTestId("meal-name")).toHaveText("Fish and Chips");
    await expect(page.getByTestId("fallback-notice")).toHaveCount(0);
    const button = page.getByRole("button", { name: /shuffle suggestion/i });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
    await expect(page.getByTestId("meal-name")).not.toHaveText("Fish and Chips");
    // The dealt meal came from beyond the eligible pool: the card says so,
    // and the notice links straight to the pantry.
    await expect(page.getByTestId("fallback-notice")).toBeVisible();
    await page.getByTestId("fallback-notice").click();
    await expect(page.getByRole("heading", { name: "What do you have?" })).toBeVisible();
  });

  test("adds a custom item via the sheet, persists it, and rejects duplicates", async ({ page }) => {
    await openAt(page, THURSDAY, "/pantry");
    await page.getByTestId("add-item").click();
    await page.getByTestId("ingredient-name").fill("Halloumi");
    await page.getByRole("radio", { name: "Veg" }).click();
    await page.getByTestId("save-ingredient").click();
    // Veg has grown past the 8-chip fold; custom items append after the seeded
    // ones, so expand the category before asserting.
    await page.getByTestId("see-more-veg").click();
    await expect(page.getByRole("button", { name: "Halloumi" })).toBeVisible();

    await page.reload();
    await page.getByTestId("see-more-veg").click();
    await expect(page.getByRole("button", { name: "Halloumi" })).toBeVisible();

    await page.getByTestId("add-item").click();
    await page.getByTestId("ingredient-name").fill("halloumi");
    await page.getByTestId("save-ingredient").click();
    await expect(page.getByTestId("ingredient-error")).toContainText("already have");
  });

  test("shows all seeded categories and chips toggle visually", async ({ page }) => {
    await openAt(page, THURSDAY, "/pantry");
    for (const label of ["Proteins", "Veg", "Carbs & sides", "Dairy & tins"]) {
      await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
    }
    const chip = page.getByTestId("chip-chicken");
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("settings", () => {
  test("takeaway day change applies to today; kids toggle hides the pill; reset restores shuffles", async ({ page }) => {
    await openAt(page, THURSDAY, "/settings");

    // Make Thursday the takeaway day -> today's card flips to takeaway.
    await page.getByTestId("takeaway-Thursday").click();
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByTestId("today-card")).toHaveAttribute("data-variant", "takeaway");

    // Turn takeaway off again, burn a shuffle, then reset it in settings.
    await page.getByRole("link", { name: /Settings/ }).click();
    await page.getByTestId("takeaway-none").click();
    await page.getByRole("link", { name: "Back" }).click();
    await page.getByRole("button", { name: /shuffle/i }).click();
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
    await page.getByRole("link", { name: /Settings/ }).click();
    await page.getByTestId("reset-shuffles").click();
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByTestId("shuffle-count")).toHaveText("0/3");

    // Kids toggle off -> pill disappears.
    await page.getByRole("link", { name: /Settings/ }).click();
    await page.getByTestId("kids-toggle").click();
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByTestId("kids-pill")).toHaveCount(0);
  });
});

test.describe("state integrity", () => {
  test("today's date in storage matches the (mocked) local date", async ({ page }) => {
    await openAt(page, THURSDAY);
    await expect(page.getByTestId("meal-name")).toBeVisible();
    const stored = await page.evaluate(() => window.localStorage.getItem("wawet-state-v1"));
    const parsed = JSON.parse(stored ?? "{}");
    expect(parsed.today?.date).toBe(todayLocalDate(THURSDAY));
    expect(parsed.version).toBe(1);
  });

  test("family and kids suggestion pools never overlap", () => {
    const familyIds = new Set(familyMeals.map((m) => m.id));
    expect(kidsMeals.some((m) => familyIds.has(m.id))).toBe(false);
  });
});
