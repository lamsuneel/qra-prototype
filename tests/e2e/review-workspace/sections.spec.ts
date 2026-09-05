import { expect, test } from "@playwright/test";

import {
  gateButton,
  goToSection,
  openDemoBatch,
  openParameter,
  sectionTabs,
} from "../helpers/auth";

/** Every section of the demo batch, by the parameter it belongs to. */
const SECTIONS: Record<string, string[]> = {
  Assay: [
    "Attendance Verification",
    "Chemicals",
    "Standards",
    "Instruments",
    "Chromatography",
    "Column",
    "Weighing Balance",
    "Empower Audit Trail",
    "Assay Result",
  ],
  RS: [
    "Attendance Verification",
    "Chemicals",
    "Standards",
    "Instruments",
    "Chromatography",
    "Column",
    "Empower Audit Trail",
    "Related Substances Result",
  ],
  Disso: [
    "Attendance Verification",
    "Chemicals",
    "Standards",
    "Instruments",
    "Tablet Processing Workstation",
    "Dissolution Bath — Logbook",
  ],
  KF: [
    "Attendance Verification",
    "Chemicals",
    "Standards",
    "Instruments",
    "KF Titrator",
  ],
  LCMS: [
    "Attendance Verification",
    "Chemicals",
    "Standards",
    "Instruments",
    "LCMS System",
    "MassLynx Audit Trail",
  ],
};

test.describe("Sections of the demo batch", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
  });

  for (const [parameter, sections] of Object.entries(SECTIONS)) {
    test(`${parameter} lists exactly its ${sections.length} sections`, async ({
      page,
    }) => {
      await openParameter(page, parameter);
      await expect(sectionTabs(page)).toHaveCount(sections.length);

      const listed = await sectionTabs(page).allInnerTexts();
      for (const section of sections) {
        expect(listed.some((entry) => entry.includes(section))).toBe(true);
      }
    });

    for (const section of sections) {
      test(`${parameter} — ${section} opens`, async ({ page }) => {
        await goToSection(page, parameter, section);

        await expect(gateButton(page)).toBeVisible();
        await expect(page.getByLabel("Breadcrumb")).toContainText(section);
        await expect(page.locator("div.sticky").first()).toBeVisible();
      });
    }
  }

  test("the batch has thirty-four sections across five parameters", async ({
    page,
  }) => {
    let total = 0;
    for (const parameter of Object.keys(SECTIONS)) {
      await openParameter(page, parameter);
      total += await sectionTabs(page).count();
    }

    expect(total).toBe(34);
    await expect(page.locator("text=/of 34 sections/").first()).toBeVisible();
  });

  /*
   * A section that already opens with its parameter's name does not print it
   * twice, and "— Logbook" is dropped because the paper-record banner
   * immediately below names the logbook and its page.
   */
  test("a section heading uses one dash and never repeats the parameter", async ({
    page,
  }) => {
    await goToSection(page, "Disso", "Dissolution Bath — Logbook");
    const header = page.locator("div.sticky").filter({ hasText: "Specification" }).first();

    await expect(header.getByText("Dissolution Bath", { exact: true })).toBeVisible();
    expect(await header.innerText()).not.toContain("Dissolution — Dissolution Bath");
    expect(await header.innerText()).not.toContain("— Logbook");
  });

  test("a standalone instrument section names the instrument after the parameter", async ({
    page,
  }) => {
    await goToSection(page, "Disso", "Tablet Processing Workstation");
    const header = page.locator("div.sticky").filter({ hasText: "Specification" }).first();

    await expect(
      header.getByText("Dissolution — Tablet Processing Workstation"),
    ).toBeVisible();
  });

  test("a paper logbook section says the record is on paper", async ({ page }) => {
    await goToSection(page, "Disso", "Dissolution Bath — Logbook");

    await expect(page.getByText(/Paper Logbook/).first()).toBeVisible();
  });

  test("a standalone instrument section shows the analyst session and its export", async ({
    page,
  }) => {
    await goToSection(page, "KF", "KF Titrator");

    await expect(page.getByText("Tiamo").first()).toBeVisible();
    await expect(page.getByText(/Priya Sharma/).first()).toBeVisible();
    await expect(page.getByText(/\.pdf/).first()).toBeVisible();
  });
});
