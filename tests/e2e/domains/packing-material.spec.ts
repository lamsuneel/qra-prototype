import { expect, test } from "@playwright/test";

import {
  openDomain,
  PM_AR,
  flaggedCards,
  gateButton,
  goToSection,
  navigateToBatch,
  openParameter,
  sectionTabs,
  selectProfile,
} from "../helpers/auth";

const PARAMETERS = ["Identity", "Dimensions", "Barcode", "Weight", "COA"];

test.describe("Packing Material", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
  });

  test("the domain is reachable from the dashboard", async ({ page }) => {
    await openDomain(page, "Packing Material");

    await expect(page).toHaveURL(/\/batches\/packing-material$/);
    await expect(
      page.getByRole("heading", { name: "Packing Material — Review Queue" }),
    ).toBeVisible();
  });

  test("the queue lists PM batches in the site AR format", async ({ page }) => {
    await openDomain(page, "Packing Material");
    await page.getByRole("button", { name: "All" }).click();

    const numbers = await page.locator("tbody tr td:first-child").allInnerTexts();
    expect(numbers.length).toBeGreaterThan(0);
    for (const number of numbers) {
      expect(number.trim()).toMatch(/^07-PM-26-\d{4}$/);
    }
    expect(numbers.map((n) => n.trim())).toContain(PM_AR);
  });

  test("the Barcode Verifier section opens", async ({ page }) => {
    await navigateToBatch(page, PM_AR);
    await goToSection(page, "Barcode", "Barcode Verifier");

    await expect(gateButton(page)).toBeVisible();
    await expect(page.getByLabel("Breadcrumb")).toContainText("Barcode Verifier");
  });

  test("the verifier is named Axicon, nothing else", async ({ page }) => {
    await navigateToBatch(page, PM_AR);
    await goToSection(page, "Barcode", "Barcode Verifier");

    await expect(page.getByText("Axicon Barcode Verifier").first()).toBeVisible();

    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/Ascom/i);
    expect(text).not.toMatch(/BRC2002/i);
  });

  test("the whole workspace names no other verifier", async ({ page }) => {
    await navigateToBatch(page, PM_AR);

    for (const parameter of PARAMETERS) {
      await openParameter(page, parameter);
      const count = await sectionTabs(page).count();

      for (let index = 0; index < count; index += 1) {
        await sectionTabs(page).nth(index).click();
        await expect(gateButton(page)).toBeVisible();

        const text = await page.locator("body").innerText();
        expect(text).not.toMatch(/Ascom|BRC2002/i);
      }
    }
  });

  test("the print quality flag names grade C against a grade B minimum", async ({
    page,
  }) => {
    await navigateToBatch(page, PM_AR);
    await goToSection(page, "Barcode", "Barcode Verifier");

    const card = flaggedCards(page).first();
    await expect(
      card.getByText("Barcode print quality below specification grade", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(card).toContainText("Mean overall grade C (1.74) across five labels");
    await expect(card).toContainText("grade B or better");
  });

  test("the flag shows all five labels that were verified", async ({ page }) => {
    await navigateToBatch(page, PM_AR);
    await goToSection(page, "Barcode", "Barcode Verifier");

    const card = flaggedCards(page).first();
    await expect(
      card.getByText("Barcode verification — five labels, ISO/IEC 15416"),
    ).toBeVisible();
    await expect(card.locator("tbody tr")).toHaveCount(5);
    await expect(card.getByRole("columnheader", { name: "Overall grade" })).toBeVisible();
  });

  test("the verifier's own calibration check is compliant beside the flag", async ({
    page,
  }) => {
    await navigateToBatch(page, PM_AR);
    await goToSection(page, "Barcode", "Barcode Verifier");

    await expect(
      page.getByText("Verifier calibration check before use"),
    ).toBeVisible();
  });

  test("every PM section opens without error", async ({ page }) => {
    await navigateToBatch(page, PM_AR);

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
