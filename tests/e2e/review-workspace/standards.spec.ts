import { expect, test } from "@playwright/test";

import { checkRows, goToSection, openDemoBatch } from "../helpers/auth";

const USAGE_SOURCE = "Caliber LIMS — Reference Standard Record";
const POTENCY_SOURCE = "Caliber LIMS — eLIMS Reference Standard Audit Trail";

test.describe("Standards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
  });

  test("a working standard names its lot, expiry and quantity", async ({ page }) => {
    await goToSection(page, "Assay", "Standards");

    const row = checkRows(page).filter({ hasText: "Working Standard" }).first();
    await row.click();

    const panel = await row.innerText();
    expect(panel).toContain("WS-2024-41");
    expect(panel).toContain("Expiry date");
    expect(panel).toContain("31-Oct-2026");
    expect(panel).toContain("Prescribed quantity (LIMS worksheet)");
    expect(panel).toContain("Actual quantity used");
    expect(panel).toContain("24.8 mg");
  });

  test("a standard's quantity is compared, not assumed", async ({ page }) => {
    await goToSection(page, "Assay", "Standards");

    const row = checkRows(page).filter({ hasText: "Working Standard" }).first();
    await row.click();

    await expect(page.getByText("WITHIN TOLERANCE")).toBeVisible();
    await expect(page.getByText("NO COMPARISON — VERIFY AGAINST WORKSHEET")).toHaveCount(0);
  });

  test("the standard's source badge names Caliber LIMS", async ({ page }) => {
    await goToSection(page, "KF", "Standards");

    const row = checkRows(page).first();
    await expect(row.getByText("Caliber LIMS", { exact: true })).toBeVisible();
  });

  /*
   * Reference standard data comes out of two LIMS modules: the usage record
   * and the potency held in the eLIMS audit trail. Both are needed for a
   * complete review, so the panel names each rather than collapsing them.
   */
  test("a reference standard is attributed to both LIMS modules", async ({ page }) => {
    await goToSection(page, "RS", "Standards");

    const row = checkRows(page).filter({ hasText: "Reference Standard" }).first();
    await row.click();

    await expect(page.getByText("Usage data source")).toBeVisible();
    await expect(page.getByText(USAGE_SOURCE)).toBeVisible();
    await expect(page.getByText("Potency/assigned value source")).toBeVisible();
    await expect(page.getByText(POTENCY_SOURCE)).toBeVisible();
  });

  test("the section says both modules are required", async ({ page }) => {
    await goToSection(page, "RS", "Standards");

    await expect(
      page.getByText(
        "Reference standard data is sourced from two Caliber LIMS modules. Both are required for a complete review.",
      ),
    ).toBeVisible();
  });

  test("the two-module note appears wherever such a standard does", async ({ page }) => {
    for (const parameter of ["Assay", "RS", "LCMS"]) {
      await goToSection(page, parameter, "Standards");
      await expect(
        page.getByText("Reference standard data is sourced from two Caliber LIMS modules."),
      ).toBeVisible();
    }
  });

  test("the note is absent where the standard has a single source", async ({ page }) => {
    await goToSection(page, "KF", "Standards");

    await expect(
      page.getByText("Reference standard data is sourced from two Caliber LIMS modules."),
    ).toHaveCount(0);
  });

  /*
   * No standard in the demo batch is expired: every one is checked against
   * "active lot, expiry on or after analysis date" and passes. What the suite
   * can assert is that the criterion is stated and the expiry is shown, so an
   * expired lot would have somewhere to fail.
   */
  test("every standard is checked against an active-lot and expiry criterion", async ({
    page,
  }) => {
    for (const parameter of ["Assay", "RS", "Disso", "KF", "LCMS"]) {
      await goToSection(page, parameter, "Standards");
      const rows = checkRows(page);

      for (let index = 0; index < (await rows.count()); index += 1) {
        const row = rows.nth(index);
        const text = await row.innerText();
        /* The lot entries themselves. A section may also carry a check on how
           the lot was handled — a hygroscopic standard's open-window, for one
           — which is a different criterion and is not an expiry check. */
        if (!/^(Working|Reference|Water) Standard/m.test(text)) continue;

        expect(text).toMatch(/Active lot, expiry on or after analysis date/);
        await expect(row.getByText("Compliant", { exact: true })).toBeVisible();
      }
    }
  });

  test("the Standards section says nothing about analyst qualification", async ({
    page,
  }) => {
    for (const parameter of ["Assay", "RS", "Disso", "KF", "LCMS"]) {
      await goToSection(page, parameter, "Standards");

      const rows = checkRows(page);
      for (let index = 0; index < (await rows.count()); index += 1) {
        await rows.nth(index).click();
      }

      const text = (await page.locator("body").innerText()).toLowerCase();
      expect(text).not.toContain("analyst qualification");
      expect(text).not.toContain("qualification status");
    }
  });
});
