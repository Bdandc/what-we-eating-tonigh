import { expect, test } from "@playwright/test";

// A Thursday at noon (not the default takeaway Tuesday).
const THURSDAY = new Date(2026, 7, 6, 12, 0, 0);

test("add a custom meal via My Meals, it persists, appears on the card when suggested, and can be edited and deleted", async ({ page }) => {
  await page.clock.install({ time: THURSDAY });
  await page.goto("/settings");

  // Settings links to the My Meals page; add "Shopska Salad" there.
  await page.getByTestId("view-meals").click();
  await expect(page.getByRole("heading", { name: "My Meals" })).toBeVisible();
  await expect(page.getByTestId("no-meals")).toBeVisible();
  await page.getByTestId("add-meal").click();
  await page.getByTestId("meal-name-input").fill("Shopska Salad");
  await page.getByTestId("meal-description-input").fill("Tomato, cucumber, and lots of cheese on top.");
  await page.getByRole("radio", { name: "Family" }).click();
  await page.getByRole("button", { name: "Tomatoes", exact: true }).click();
  await page.getByRole("button", { name: "Cucumber", exact: true }).click();
  await page.getByTestId("save-meal").click();
  await expect(page.getByText("Shopska Salad")).toBeVisible();

  // Persists across reload.
  await page.reload();
  await expect(page.getByText("Shopska Salad")).toBeVisible();

  // Duplicate name (vs seeded) rejected with inline error.
  await page.getByTestId("add-meal").click();
  await page.getByTestId("meal-name-input").fill("lasagna");
  await page.getByTestId("save-meal").click();
  await expect(page.getByTestId("meal-error")).toContainText("already have");
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "My Meals" })).toBeVisible();

  // Edit: open the meal, rename it, save, and see the update in the list.
  await page.getByText("Shopska Salad").click();
  await expect(page.getByRole("heading", { name: "Edit meal" })).toBeVisible();
  await page.getByTestId("meal-name-input").fill("Shopska Deluxe");
  await page.getByTestId("save-meal").click();
  await expect(page.getByText("Shopska Deluxe")).toBeVisible();
  // Rename back so the pantry-gating part below keeps its name expectations.
  await page.getByText("Shopska Deluxe").click();
  await page.getByTestId("meal-name-input").fill("Shopska Salad");
  await page.getByTestId("save-meal").click();
  await expect(page.getByText("Shopska Salad")).toBeVisible();

  // Force the custom meal to be tonight's suggestion (valid id, so parseState
  // keeps it) and check the Today card renders it — the resolveMeal path.
  const mealId = await page.evaluate(() => {
    const state = JSON.parse(window.localStorage.getItem("wawet-state-v1") ?? "{}");
    const id = state.customMeals[0].id as string;
    state.today.suggestionId = id;
    // The meal needs both of these ticked to stay eligible across the reload.
    state.pantry.tomato = true;
    state.pantry.cucumber = true;
    window.localStorage.setItem("wawet-state-v1", JSON.stringify(state));
    return id;
  });
  expect(mealId).toMatch(/^m-/);
  await page.goto("/");
  await expect(page.getByTestId("meal-name")).toHaveText("Shopska Salad");

  // Untick an ingredient it needs and SAVE -> the eligible pool still has the
  // pre-filled staple meals, so the dish re-picks deterministically, for free.
  await page.getByRole("link", { name: "Don't have the ingredients?" }).click();
  await page.getByTestId("chip-tomato").click();
  await page.getByTestId("save-pantry").click();
  await expect(page.getByTestId("meal-name")).not.toHaveText("Shopska Salad");
  await expect(page.getByTestId("shuffle-count")).toHaveText("0/3");

  // Delete via the edit page's trash icon.
  await page.getByRole("link", { name: /Settings/ }).click();
  await page.getByTestId("view-meals").click();
  await page.getByText("Shopska Salad").click();
  // Two-tap confirm: first arms, second deletes.
  await page.getByTestId("delete-meal").click();
  await expect(page.getByTestId("delete-meal")).toHaveAttribute("data-armed", "true");
  await page.getByTestId("delete-meal").click();
  await expect(page.getByRole("heading", { name: "My Meals" })).toBeVisible();
  await expect(page.getByTestId("no-meals")).toBeVisible();
});

test("the legacy /settings/add-meal route redirects to /meals/add", async ({ page }) => {
  await page.goto("/settings/add-meal");
  await page.waitForURL("**/meals/add");
  await expect(page.getByRole("heading", { name: "Add meal" })).toBeVisible();
});
