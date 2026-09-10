import { expect, test, type Page } from "@playwright/test";
import { freshState } from "@/lib/wawet-state";

// A Thursday at noon (not the default takeaway Tuesday).
const THURSDAY = new Date(2026, 7, 6, 12, 0, 0);

const isMobile = (name: string) => name === "mobile-chromium";

/** Open Today with a known dish dealt so recipe assertions are deterministic. */
async function openWithKnownDish(page: Page, path = "/") {
  const state = freshState(THURSDAY);
  state.today.suggestionId = "spaghetti-bolognese";
  await page.clock.install({ time: THURSDAY });
  await page.addInitScript(
    (value) => window.localStorage.setItem("wawet-state-v1", value),
    JSON.stringify(state),
  );
  await page.goto(path);
}

test.describe("recipe page", () => {
  test("card link opens the dish recipe and Back returns to Today", async ({ page }) => {
    await openWithKnownDish(page);
    await page.getByTestId("recipe-link").click();
    await expect(page).toHaveURL(/\/recipe\/spaghetti-bolognese$/);
    await expect(page.getByRole("heading", { name: "Spaghetti Bolognese" })).toBeVisible();
    const steps = page.getByTestId("recipe-steps").locator("li");
    await expect(steps).toHaveCount(6);
    await expect(page.getByTestId("recipe-ingredients")).toContainText("Beef mince");
    await page.getByTestId("recipe-back").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("today-card")).toBeVisible();
  });

  test("a swipe RELEASED over the link shuffles and does NOT navigate", async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "desktop-only mouse path");
    await openWithKnownDish(page);
    // Gestures that START on a link never begin (by design: the pointer-down
    // handler ignores interactive elements). The risky path is a drag that
    // starts on card body and RELEASES over the link: the post-drag click
    // suppression must swallow it.
    const link = page.getByTestId("recipe-link");
    const box = (await link.boundingBox())!;
    const endX = box.x + box.width / 2;
    const endY = box.y + box.height / 2;
    const startX = endX + 100; // card body, right of the small left-aligned link
    await page.mouse.move(startX, endY);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      // Decisively past the 60px threshold with 2:1 axis dominance.
      await page.mouse.move(startX - (100 * i) / 5, endY);
    }
    await page.mouse.up();
    await page.clock.runFor(600);
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
    await expect(page).toHaveURL(/\/$/);
  });

  test("My Meals built-in row opens the recipe and Back returns to My Meals", async ({ page }) => {
    await openWithKnownDish(page, "/meals");
    await page.getByTestId("recipe-lasagna-night").click();
    await expect(page).toHaveURL(/\/recipe\/lasagna-night\?from=meals$/);
    await expect(page.getByRole("heading", { name: "Lasagna" })).toBeVisible();
    await expect(page.getByTestId("recipe-steps").locator("li").first()).toBeVisible();
    await page.getByTestId("recipe-back").click();
    await expect(page).toHaveURL(/\/meals$/);
  });

  test("direct URL entry gets a Back that goes to Today", async ({ page }) => {
    await openWithKnownDish(page, "/recipe/fish-pie");
    await expect(page.getByRole("heading", { name: "Fish Pie" })).toBeVisible();
    await page.getByTestId("recipe-back").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("today-card")).toBeVisible();
  });

  test("junk from-values fall back to Today", async ({ page }) => {
    await openWithKnownDish(page, "/recipe/fish-pie?from=javascript:alert(1)");
    await expect(page.getByRole("heading", { name: "Fish Pie" })).toBeVisible();
    await expect(page.getByTestId("recipe-back")).toHaveAttribute("href", "/");
  });

  test("unknown id shows the no-longer-exists fallback", async ({ page }) => {
    await openWithKnownDish(page, "/recipe/not-a-real-dish");
    await expect(page.getByText("That meal no longer exists.")).toBeVisible();
  });

  test("Hide toggle still works now that built-in rows carry links", async ({ page }) => {
    await openWithKnownDish(page, "/meals");
    await page.getByTestId("toggle-carbonara").click();
    await expect(page.getByTestId("toggle-carbonara")).toHaveText("Show");
    const hidden = await page.evaluate(
      () => JSON.parse(window.localStorage.getItem("wawet-state-v1") ?? "{}").hiddenSeededMeals,
    );
    expect(hidden).toContain("carbonara");
  });
});
