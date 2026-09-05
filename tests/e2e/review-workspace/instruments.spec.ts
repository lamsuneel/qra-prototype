import { expect, test } from "@playwright/test";

import {
  checkRows,
  flaggedCards,
  gateButton,
  goToSection,
  openDemoBatch,
  openParameter,
  parameterTabs,
  sectionTabs,
} from "../helpers/auth";

test.describe("Instruments and their data sources", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
  });

  /*
   * Analyst qualification is checked at the site, but not here: the reviewer
   * reads an instrument's calibration state, and mixing a person's training
   * record into it confuses two different checks.
   */
  test("the Instruments section says nothing about analyst qualification", async ({
    page,
  }) => {
    for (const parameter of ["Assay", "RS", "Disso", "KF", "LCMS"]) {
      await goToSection(page, parameter, "Instruments");

      const rows = checkRows(page);
      for (let index = 0; index < (await rows.count()); index += 1) {
        await rows.nth(index).click();
        const text = await page.locator("main, body").first().innerText();
        expect(text.toLowerCase()).not.toContain("analyst qualification");
        expect(text.toLowerCase()).not.toContain("qualification status");
      }
    }
  });

  test("an instrument entry names its ID, calibration status and dates", async ({
    page,
  }) => {
    await goToSection(page, "Assay", "Instruments");
    const row = checkRows(page).first();
    await row.click();

    const panel = await row.innerText();
    expect(panel).toContain("Instrument ID");
    expect(panel).toContain("BAL-2024-003");
    expect(panel).toContain("Calibration status");
    expect(panel).toContain("Calibrated — within interval");
    expect(panel).toContain("Last calibrated");
    expect(panel).toContain("Calibration due");
  });

  test("every instrument row carries a calibration due badge", async ({ page }) => {
    await goToSection(page, "Assay", "Instruments");
    const rows = checkRows(page);

    for (let index = 0; index < (await rows.count()); index += 1) {
      await expect(
        rows.nth(index).getByText(/Cal\. due|Calibration overdue/),
      ).toBeVisible();
    }
  });

  /*
   * Column injection life is held in LIMS, not in the chromatography data
   * system — so the column's source badge is Caliber LIMS even though the
   * chromatograms beside it come from Empower.
   */
  test("the column's source is Caliber LIMS, not Empower", async ({ page }) => {
    await goToSection(page, "RS", "Column");

    const row = checkRows(page).first();
    await expect(row.getByText("Caliber LIMS", { exact: true })).toBeVisible();
    expect(await row.innerText()).not.toContain("Empower");
  });

  test("the chromatography system stays on Waters Empower", async ({ page }) => {
    await goToSection(page, "Assay", "Chromatography");

    const system = checkRows(page).filter({ hasText: "Chromatography system" }).first();
    await expect(system.getByText("Waters Empower", { exact: true })).toBeVisible();
  });

  /*
   * There are no custom fields in Empower at this site, so system suitability
   * values are keyed into LIMS by the analyst. Only the SST parameters move —
   * the chromatograms themselves are still Empower's.
   */
  test("system suitability values are sourced as manual LIMS entry", async ({ page }) => {
    await goToSection(page, "Assay", "Chromatography");

    const sst = checkRows(page).filter({ hasText: "System suitability" });
    expect(await sst.count()).toBeGreaterThan(0);

    for (let index = 0; index < (await sst.count()); index += 1) {
      await expect(
        sst.nth(index).getByText("Caliber LIMS — Manual Entry", { exact: true }),
      ).toBeVisible();
    }

    await expect(
      page.getByText(
        "SST values entered manually into Caliber LIMS by analyst. Source: LIMS worksheet.",
      ),
    ).toBeVisible();
  });

  test("an overdue calibration is a flagged entry, not an amber one", async ({
    page,
  }) => {
    await goToSection(page, "Disso", "Instruments");

    const card = flaggedCards(page).filter({ hasText: "UV Spectrophotometer" }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText("FLAGGED — Calibration Gap")).toBeVisible();
    await expect(card.getByText(/Calibration overdue \d+d/)).toBeVisible();
  });

  /* ---- The KF exception count, entry by entry ---------------------------- */

  test("KF Titrator is listed as a section of its own", async ({ page }) => {
    await openParameter(page, "KF");

    await expect(
      sectionTabs(page).filter({ hasText: "KF Titrator" }),
    ).toHaveCount(1);
  });

  test("KF Titrator carries every KF exception", async ({ page }) => {
    await goToSection(page, "KF", "KF Titrator");

    /* Excess reanalysis, an out-of-order audit trail, and a reprocessed
       determination without a PNC behind it. */
    await expect(flaggedCards(page)).toHaveCount(3);
    await expect(
      sectionTabs(page).filter({ hasText: "KF Titrator" }).first(),
    ).toHaveAttribute("aria-label", "Open section KF Titrator, 3 flagged");
  });

  test("KF Chemicals contributes nothing to the count", async ({ page }) => {
    await goToSection(page, "KF", "Chemicals");

    await expect(flaggedCards(page)).toHaveCount(0);
    await expect(checkRows(page).filter({ hasText: "Needs Verification" })).toHaveCount(0);
    await expect(gateButton(page)).toBeEnabled();

    const rows = checkRows(page);
    for (let index = 0; index < (await rows.count()); index += 1) {
      await expect(rows.nth(index).getByText("Compliant", { exact: true })).toBeVisible();
    }
  });

  test("the KF badge is made of the KF Titrator flags alone", async ({ page }) => {
    await openParameter(page, "KF");

    const badge = parameterTabs(page).filter({ hasText: "KF" }).first();
    await expect(badge).toContainText("3");

    const labels = await sectionTabs(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute("aria-label") ?? ""),
    );
    const flagged = labels.filter((label) => /flagged/.test(label));

    expect(flagged).toEqual(["Open section KF Titrator, 3 flagged"]);
  });

  /*
   * The second KF exception is derived rather than written: the Tiamo audit
   * trail records the weight being added before the analysis started, and an
   * out-of-order sequence is a finding whatever the result says.
   */
  test("the second KF exception comes from the audit trail sequence", async ({
    page,
  }) => {
    await goToSection(page, "KF", "KF Titrator");

    const card = flaggedCards(page)
      .filter({ hasText: "Result — Karl Fischer Titration" })
      .first();
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: /View evidence/ }).click();

    /* The steps of the timeline, not the sentence in Why flagged that
       quotes them. */
    await expect(card.getByText("Conditioning started", { exact: true })).toBeVisible();
    await expect(card.getByText("Weight added", { exact: true })).toBeVisible();
    await expect(card.getByText("Analysis started", { exact: true })).toBeVisible();
  });

  test("the LCMS section is the only source of the LCMS exception", async ({ page }) => {
    await openParameter(page, "LCMS");

    const labels = await sectionTabs(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute("aria-label") ?? ""),
    );

    expect(labels.filter((label) => /flagged/.test(label))).toEqual([
      "Open section LCMS System, 1 flagged",
    ]);
  });
});
