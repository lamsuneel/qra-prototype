import { expect, test } from "@playwright/test";

import {
  openDomain,
  ST_AR,
  flaggedCards,
  gateButton,
  goToSection,
  navigateToBatch,
  openParameter,
  sectionTabs,
  selectProfile,
} from "../helpers/auth";

const PARAMETERS = [
  "Chamber Conditions",
  "Assay",
  "Related Substances",
  "Water Content",
  "Dissolution",
  "Appearance",
];

test.describe("Stability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
  });

  test("the domain is reachable from the dashboard", async ({ page }) => {
    await openDomain(page, "Stability");

    await expect(page).toHaveURL(/\/batches\/stability$/);
    await expect(
      page.getByRole("heading", { name: "Stability — Review Queue" }),
    ).toBeVisible();
  });

  test("the queue lists stability batches in the site AR format", async ({ page }) => {
    await openDomain(page, "Stability");
    await page.getByRole("button", { name: "All" }).click();

    const numbers = await page.locator("tbody tr td:first-child").allInnerTexts();
    expect(numbers.length).toBeGreaterThan(0);
    for (const number of numbers) {
      expect(number.trim()).toMatch(/^07-ST-26-\d{4}$/);
    }
    expect(numbers.map((n) => n.trim())).toContain(ST_AR);
  });

  test("the workspace opens on the stability parameters", async ({ page }) => {
    await navigateToBatch(page, ST_AR);

    for (const parameter of PARAMETERS) {
      await expect(
        page.locator("nav").filter({ hasText: "Test Parameters" }).first()
          .locator("button:not([aria-label])")
          .filter({ hasText: parameter }),
      ).toHaveCount(1);
    }
  });

  /*
   * The chamber is read before any result, because storage outside the
   * qualified condition is what the impurity trend at six months turns on.
   */
  test("the chamber excursion is flagged", async ({ page }) => {
    await navigateToBatch(page, ST_AR);
    await goToSection(page, "Chamber Conditions", "Stability Chamber");

    const card = flaggedCards(page)
      .filter({ hasText: "Temperature excursion" })
      .first();

    await expect(card).toBeVisible();
    await expect(card.getByText("FLAGGED — Storage Excursion")).toBeVisible();
    await expect(card).toContainText("96 hours");
    await expect(card).toContainText("March 2026");
  });

  test("the chamber section draws the recorded conditions", async ({ page }) => {
    await navigateToBatch(page, ST_AR);
    await goToSection(page, "Chamber Conditions", "Stability Chamber");

    await expect(page.locator("svg.recharts-surface").first()).toBeVisible();
  });

  test("the related substances result is flagged out of trend against the limit", async ({
    page,
  }) => {
    await navigateToBatch(page, ST_AR);
    await goToSection(page, "Related Substances", "Related Substances Trend");

    const card = flaggedCards(page).first();
    await expect(card).toContainText("0.21 %");
    await expect(card).toContainText("not more than 0.20 %");
  });

  test("the impurity flag shows the trend across all three timepoints", async ({
    page,
  }) => {
    await navigateToBatch(page, ST_AR);
    await goToSection(page, "Related Substances", "Related Substances Trend");

    const card = flaggedCards(page).first();
    await expect(card).toContainText("0.08 %");
    await expect(card).toContainText("0.12 %");
    await expect(card).toContainText("0.21 %");
  });

  /* The two findings are connected: the investigation has to cover both. */
  test("the impurity flag points back at the chamber excursion", async ({ page }) => {
    await navigateToBatch(page, ST_AR);
    await goToSection(page, "Related Substances", "Related Substances Trend");

    await expect(flaggedCards(page).first()).toContainText("excursion");
  });

  test("every stability section opens without error", async ({ page }) => {
    await navigateToBatch(page, ST_AR);

    for (const parameter of PARAMETERS) {
      await openParameter(page, parameter);
      const count = await sectionTabs(page).count();
      expect(count).toBeGreaterThan(0);

      for (let index = 0; index < count; index += 1) {
        await sectionTabs(page).nth(index).click();
        await expect(gateButton(page)).toBeVisible();
      }
    }
  });
});
