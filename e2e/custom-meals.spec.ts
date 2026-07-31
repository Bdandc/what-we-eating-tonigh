import { expect, test } from "@playwright/test";

// A Thursday at noon (not the default takeaway Tuesday).
const THURSDAY = new Date(2026, 7, 6, 12, 0, 0);

test("add a custom meal in Settings, it persists, appears on the card when suggested, and can be removed", async ({ page }) => {
  await page.clock.install({ time: THURSDAY });
  await page.goto("/settings");

  // Add "Shopska Salad" needing Tomato + Cucumber.
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
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

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

  // Remove the meal in Settings.
  await page.getByRole("link", { name: /Settings/ }).click();
  await page.getByRole("button", { name: "Remove Shopska Salad" }).click();
  await expect(page.getByText("Shopska Salad")).toHaveCount(0);
});
