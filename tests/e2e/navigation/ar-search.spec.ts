import { expect, test } from "@playwright/test";

import {
  openDomain,
  DEMO_AR,
  DEMO_PRODUCT,
  RM_AR,
  navigateToBatch,
  searchBox,
  searchResults,
  selectProfile,
} from "../helpers/auth";

test.describe("AR number search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
  });

  test("searching the demo AR opens the Finished Product workspace", async ({
    page,
  }) => {
    await navigateToBatch(page, DEMO_AR);

    await expect(page).toHaveURL(new RegExp(`/batches/${DEMO_AR}/review/`));
    await expect(page.getByText("Finished Product")).toBeVisible();
    await expect(page.locator("header").first().getByText(DEMO_PRODUCT)).toBeVisible();
  });

  test("searching a Raw Material AR opens the Raw Material workspace", async ({
    page,
  }) => {
    await navigateToBatch(page, RM_AR);

    await expect(page).toHaveURL(new RegExp(`/batches/${RM_AR}/review/`));
    await expect(
      page.getByRole("link", { name: "Raw Material" }).or(page.getByText("Raw Material")),
    ).toBeTruthy();
  });

  test("the navbar search gives the same result as the page search", async ({
    page,
  }) => {
    await navigateToBatch(page, DEMO_AR, "nav");
    const fromNav = page.url();

    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
    await navigateToBatch(page, DEMO_AR, "page");

    expect(page.url()).toBe(fromNav);
  });

  test("the search on a batch list page works the same way", async ({ page }) => {
    await openDomain(page, "Raw Material");
    await expect(page).toHaveURL(/\/batches\/raw-material$/);

    await navigateToBatch(page, DEMO_AR, "page");
    await expect(page).toHaveURL(new RegExp(`/batches/${DEMO_AR}/review/`));
  });

  /*
   * The hint is advisory: the query still runs, because search matches product
   * and batch number too. It only appears for something that reads as an
   * attempt at an AR number — a hyphen and a digit — and gets it wrong.
   */
  test("a malformed AR number shows the format hint", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("07-FP-2026-122");

    await expect(page.getByText("Format: 07-FP-26-0001")).toBeVisible();
  });

  test("a plain product name gets no format hint", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("Amoxicillin");

    await expect(page.getByText(/^Format:/)).toHaveCount(0);
    await expect(searchResults(page).first()).toBeVisible();
  });

  test("a well-formed AR number that does not exist shows a not-found message", async ({
    page,
  }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("07-FP-26-9999");

    await expect(page.getByText("No batch matches \u201c07-FP-26-9999\u201d.")).toBeVisible();
    await expect(searchResults(page)).toHaveCount(0);
  });

  test("search is case-insensitive", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill(DEMO_AR.toLowerCase());

    await expect(searchResults(page).first()).toContainText(DEMO_AR);
  });

  test("Enter opens the highlighted result", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill(DEMO_AR);
    await expect(searchResults(page).first()).toBeVisible();
    await box.press("Enter");

    await expect(page).toHaveURL(new RegExp(`/batches/${DEMO_AR}/review/`));
  });

  test("arrow keys move the highlight before Enter opens it", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("Amoxicillin");
    await expect(searchResults(page).nth(1)).toBeVisible();

    await box.press("ArrowDown");
    await expect(searchResults(page).nth(1)).toHaveAttribute("aria-selected", "true");

    const second = await searchResults(page).nth(1).innerText();
    await box.press("Enter");
    await page.waitForURL(/\/review\/|\/summary$/);

    expect(second).toContain(page.url().match(/07-[A-Z]+-\d{2}-\d{4}/)?.[0] ?? "");
  });

  test("a result names the product and the domain before it is opened", async ({
    page,
  }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill(DEMO_AR);

    const first = searchResults(page).first();
    await expect(first).toContainText(DEMO_AR);
    await expect(first).toContainText(DEMO_PRODUCT);
    await expect(first).toContainText("Finished Product");
    await expect(first).toContainText(/\d+ exceptions|No exceptions/);
  });

  test("a partial AR number finds the batch", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("0122");

    await expect(searchResults(page).first()).toBeVisible();
    const listed = await searchResults(page).allInnerTexts();
    expect(listed.join(" ")).toContain(DEMO_AR);
  });

  test("Escape closes the result list", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill(DEMO_AR);
    await expect(searchResults(page).first()).toBeVisible();

    await box.press("Escape");
    await expect(searchResults(page)).toHaveCount(0);
  });

  test("opening a result marks where the work still is", async ({ page }) => {
    await navigateToBatch(page, DEMO_AR);
    await expect(page).toHaveURL(/from=search/);
  });
});
