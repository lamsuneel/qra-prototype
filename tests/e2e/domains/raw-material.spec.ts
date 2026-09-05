import { expect, test } from "@playwright/test";

import {
  openDomain,
  RM_AR,
  checkRows,
  flaggedCards,
  gateButton,
  goToSection,
  navigateToBatch,
  openParameter,
  parameterTabs,
  sectionTabs,
  selectProfile,
} from "../helpers/auth";

/** The Raw Material parameters, and the section each instrument sits under. */
const PARAMETERS = [
  "Identity",
  "Assay",
  "Water Content",
  "Particle Size",
  "Ion Chromatography",
  "Heavy Metals",
];

test.describe("Raw Material", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
  });

  test("the domain is reachable from the dashboard", async ({ page }) => {
    await openDomain(page, "Raw Material");

    await expect(page).toHaveURL(/\/batches\/raw-material$/);
    await expect(
      page.getByRole("heading", { name: "Raw Material — Review Queue" }),
    ).toBeVisible();
  });

  test("the queue lists RM batches in the site AR format", async ({ page }) => {
    await openDomain(page, "Raw Material");
    await page.getByRole("button", { name: "All" }).click();

    const numbers = await page.locator("tbody tr td:first-child").allInnerTexts();
    expect(numbers.length).toBeGreaterThan(0);
    for (const number of numbers) {
      expect(number.trim()).toMatch(/^07-RM-26-\d{4}$/);
    }
    expect(numbers.map((n) => n.trim())).toContain(RM_AR);
  });

  test("the workspace shows the Raw Material parameters", async ({ page }) => {
    await navigateToBatch(page, RM_AR);
    await expect(parameterTabs(page)).toHaveCount(PARAMETERS.length);

    for (const parameter of PARAMETERS) {
      await expect(parameterTabs(page).filter({ hasText: parameter })).toHaveCount(1);
    }
  });

  test("the FTIR section opens under Identity", async ({ page }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Identity", "FTIR Spectrometer");

    await expect(gateButton(page)).toBeVisible();
    await expect(page.getByText("Spectrum ES").first()).toBeVisible();
  });

  /*
   * FTIR results are read from Spectrum ES, which is the instrument's own
   * system — LIMS holds the sample record, not the spectrum. So the badge
   * names Spectrum ES alone.
   */
  test("FTIR data is attributed to Spectrum ES", async ({ page }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Identity", "FTIR Spectrometer");

    const card = flaggedCards(page).first();
    await expect(card.getByText("Spectrum ES", { exact: true })).toBeVisible();
  });

  test("the FTIR correlation flag names the reading and the threshold", async ({
    page,
  }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Identity", "FTIR Spectrometer");

    const card = flaggedCards(page).first();
    await expect(card).toContainText("0.942");
    await expect(card.getByText("Why flagged")).toBeVisible();
    await expect(card.getByText("Required action")).toBeVisible();
  });

  /*
   * The Qtegra ICP at this site does not write to LIMS: the run is
   * transcribed into the departmental logbook, so the section is a paper
   * record and says so rather than implying an electronic comparison.
   */
  test("Heavy Metals opens on the ICP-OES logbook, naming the Qtegra run", async ({
    page,
  }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Heavy Metals", "ICP-OES Results — Logbook");

    await expect(gateButton(page)).toBeVisible();
    await expect(page.getByText(/Qtegra/).first()).toBeVisible();
    await expect(page.getByText("Paper Logbook").first()).toBeVisible();
  });

  test("Particle Size opens on the Mastersizer", async ({ page }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Particle Size", "Particle Analyser");

    await expect(page.getByText("Mastersizer 3000").first()).toBeVisible();
  });

  test("Water Content opens on the KF titrator", async ({ page }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Water Content", "KF Titrator");

    await expect(page.getByText("Tiamo").first()).toBeVisible();
  });

  test("the Raw Material parameter set is exactly these six", async ({ page }) => {
    await navigateToBatch(page, RM_AR);
    const listed = (await parameterTabs(page).allInnerTexts()).map((entry) =>
      entry.replace(/\d+/g, "").trim(),
    );

    expect(listed).toEqual(PARAMETERS);
  });

  /*
   * Chloride and sulphate are limited on what they do downstream, not on the
   * molecule — so the entries say which, and the audit trail arrives as a PDF
   * in LIMS like the other non-CDS instruments here.
   */
  test("Ion Chromatography opens on the instrument and its audit trail", async ({
    page,
  }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Ion Chromatography", "Ion Chromatograph");

    await expect(page.getByText("Chloride content")).toBeVisible();
    await expect(page.getByText("Sulphate content")).toBeVisible();
    await expect(page.getByText("Magic Net").first()).toBeVisible();
    await expect(page.getByText("IC-2024-002").first()).toBeVisible();

    await goToSection(page, "Ion Chromatography", "Ion Chromatography Audit Trail");
    await expect(page.getByText("Error log and event log")).toBeVisible();
    await expect(page.getByText("Magic Net 4.2").first()).toBeVisible();
  });

  test("an ion chromatography entry says why its limit exists", async ({ page }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Ion Chromatography", "Ion Chromatograph");

    const row = checkRows(page).filter({ hasText: "Chloride content" }).first();
    await row.click();

    await expect(row).toContainText("stainless steel");
  });

  test("every RM section opens without error", async ({ page }) => {
    await navigateToBatch(page, RM_AR);

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

  test("the RM Chemicals section runs the same quantity check", async ({ page }) => {
    await navigateToBatch(page, RM_AR);
    await goToSection(page, "Assay", "Chemicals");

    await checkRows(page).first().click();
    await expect(page.getByText("Prescribed quantity (LIMS worksheet)")).toBeVisible();
  });
});
