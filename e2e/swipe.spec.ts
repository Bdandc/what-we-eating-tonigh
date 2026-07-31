import { expect, test, type Page } from "@playwright/test";
import { familyMeals } from "@/lib/wawet-data";

// A Thursday at noon (not the default takeaway Tuesday) and the takeaway Tuesday.
const THURSDAY = new Date(2026, 7, 6, 12, 0, 0);
const TUESDAY = new Date(2026, 7, 4, 12, 0, 0);

const isMobile = (name: string) => name === "mobile-chromium";

async function openToday(page: Page, now: Date = THURSDAY) {
  await page.clock.install({ time: now });
  await page.goto("/");
  await expect(page.getByTestId("today-card")).toBeVisible();
}

/** Mouse drag with intermediate moves so pointermove fires realistically. */
async function mouseDrag(page: Page, dx: number, dy = 0) {
  const card = page.getByTestId("today-card");
  const box = (await card.boundingBox())!;
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(startX + (dx * i) / 5, startY + (dy * i) / 5);
  }
  await page.mouse.up();
  // Let the deck's throw/entry animations finish: the virtual clock drives the
  // animation timeline, so without this the outgoing overlay never clears.
  await page.clock.runFor(600);
}

/** Touch drag via CDP Input.dispatchTouchEvent (Playwright's Touchscreen is tap-only). */
async function touchDrag(page: Page, dx: number, dy = 0) {
  const card = page.getByTestId("today-card");
  const box = (await card.boundingBox())!;
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: startX, y: startY }],
  });
  for (let i = 1; i <= 5; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: startX + (dx * i) / 5, y: startY + (dy * i) / 5 }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
  await page.clock.runFor(600);
}

test("precondition: default family pool has more than one meal", () => {
  expect(familyMeals.length).toBeGreaterThan(1);
});

test.describe("mouse swipe (desktop project)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(isMobile(testInfo.project.name), "desktop-only mouse path");
  });

  test("a left drag past the threshold shuffles once", async ({ page }) => {
    await openToday(page);
    const before = await page.getByTestId("meal-name").textContent();
    await mouseDrag(page, -100);
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
    await expect(page.getByTestId("meal-name")).not.toHaveText(before ?? "");
  });

  test("a right drag also shuffles (direction-agnostic)", async ({ page }) => {
    await openToday(page);
    await mouseDrag(page, 100);
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
  });

  test("a sub-threshold drag does nothing", async ({ page }) => {
    await openToday(page);
    const before = await page.getByTestId("meal-name").textContent();
    await mouseDrag(page, -30);
    await expect(page.getByTestId("shuffle-count")).toHaveText("0/3");
    await expect(page.getByTestId("meal-name")).toHaveText(before ?? "");
  });

  test("a vertical-dominant drag does nothing", async ({ page }) => {
    await openToday(page);
    await mouseDrag(page, -70, 80);
    await expect(page.getByTestId("shuffle-count")).toHaveText("0/3");
  });

  test("swipes stop at the 3/3 cap", async ({ page }) => {
    await openToday(page);
    await mouseDrag(page, -100);
    await mouseDrag(page, -100);
    await mouseDrag(page, -100);
    await expect(page.getByTestId("shuffle-count")).toHaveText("3/3");
    const capped = await page.getByTestId("meal-name").textContent();
    await mouseDrag(page, -100);
    await expect(page.getByTestId("shuffle-count")).toHaveText("3/3");
    await expect(page.getByTestId("meal-name")).toHaveText(capped ?? "");
  });

  test("a drag starting on the nested shuffle button neither swipes nor clicks; a tap still shuffles once", async ({ page }) => {
    await openToday(page);
    const button = page.getByRole("button", { name: /shuffle suggestion/i });
    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(box.x + box.width / 2 - i * 20, box.y + box.height / 2);
    }
    await page.mouse.up();
    await expect(page.getByTestId("shuffle-count")).toHaveText("0/3");
    await button.click();
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
  });

  test("release outside the card still evaluates (pointer capture held)", async ({ page }) => {
    await openToday(page);
    const card = page.getByTestId("today-card");
    const box = (await card.boundingBox())!;
    const startX = box.x + 30;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(startX - i * 25, startY);
    }
    await page.mouse.up();
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
    // The suppressed post-drag click must not eat the NEXT legitimate tap.
    await page.getByTestId("kids-pill").click();
    await expect(page.getByTestId("kids-pill")).toHaveText("Family suggestion");
  });

  test("the takeaway card ignores drags", async ({ page }) => {
    await openToday(page, TUESDAY);
    await expect(page.getByTestId("today-card")).toHaveAttribute("data-variant", "takeaway");
    await mouseDrag(page, -100);
    await expect(page.getByTestId("today-card")).toHaveAttribute("data-variant", "takeaway");
  });
});

test.describe("touch swipe (mobile project, CDP)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), "touch path runs on mobile-chromium only");
  });

  test("a touch drag past the threshold shuffles once", async ({ page }) => {
    await openToday(page);
    const before = await page.getByTestId("meal-name").textContent();
    await touchDrag(page, -100);
    await expect(page.getByTestId("shuffle-count")).toHaveText("1/3");
    await expect(page.getByTestId("meal-name")).not.toHaveText(before ?? "");
  });

  test("a vertical-dominant touch drag does not shuffle", async ({ page }) => {
    await openToday(page);
    await touchDrag(page, -70, 80);
    await expect(page.getByTestId("shuffle-count")).toHaveText("0/3");
  });
});
