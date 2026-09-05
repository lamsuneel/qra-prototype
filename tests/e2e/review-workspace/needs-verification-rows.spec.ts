import { expect, test, type Page } from "@playwright/test";

import {
  COLOUR,
  VERIFICATION_PLACEHOLDER,
  VERIFICATION_PREFILL,
  blockingBanner,
  checkRows,
  colourOf,
  expectColour,
  gateButton,
  goToSection,
  noteBlockFor,
  openDemoBatch,
  verificationNotes,
} from "../helpers/auth";

/**
 * An amber entry asks the opposite of a flagged one. A chemical has no fixed
 * specification — it is checked against the quantity the worksheet prescribes
 * — so where LIMS did not return that figure QRA has nothing to compare
 * against, and says so rather than showing green.
 */

const amberRow = (page: Page) =>
  checkRows(page).filter({ hasText: "Needs Verification" }).first();

test.describe("Needs-verification rows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
    await goToSection(page, "Disso", "Chemicals");
  });

  test("the row carries an amber left border", async ({ page }) => {
    const outer = amberRow(page).locator("xpath=..");

    await expectColour(page, outer, "borderLeftColor", COLOUR.warn);
    expect(await colourOf(outer, "backgroundColor")).toBe("rgb(255, 248, 240)");
  });

  test("the row is labelled Needs Verification in amber", async ({ page }) => {
    const row = amberRow(page);
    const badge = row.getByText("Needs Verification", { exact: true });

    await expect(badge).toBeVisible();
    await expectColour(page, badge, "color", COLOUR.warn);
    await expect(row.getByText("⚠")).toBeVisible();
  });

  test("the row says what has to be verified and why", async ({ page }) => {
    const warning = amberRow(page).getByText(
      "Verify against worksheet: prescribed quantity not fetched from LIMS",
    );

    await expect(warning).toBeVisible();
    await expectColour(page, warning, "color", COLOUR.warn);
  });

  test("the section header counts the entries needing verification", async ({
    page,
  }) => {
    await expect(page.getByText("1 entry needs verification against the worksheet")).toBeVisible();
  });

  test("the evidence names the missing prescribed quantity", async ({ page }) => {
    await amberRow(page).click();

    await expect(page.getByText("Prescribed quantity (LIMS worksheet)")).toBeVisible();
    await expect(
      page.locator("dd").filter({ hasText: "Not fetched from LIMS" }).first(),
    ).toBeVisible();
  });

  test("the evidence shows no comparison was possible", async ({ page }) => {
    await amberRow(page).click();

    await expect(
      page.getByText("NO COMPARISON — VERIFY AGAINST WORKSHEET"),
    ).toBeVisible();
  });

  test("the evidence closes on Needs verification, not Compliant", async ({ page }) => {
    await amberRow(page).click();

    await expect(page.getByText("Needs verification").first()).toBeVisible();
    await expect(
      page.getByText("No action required — this entry requires no reviewer action."),
    ).toHaveCount(0);
  });

  /*
   * The field sits on the row rather than inside the evidence panel: the gate
   * waits on it, and nothing the gate waits on should be hidden behind a
   * click.
   */
  test("the row carries a reviewer observation field, visible while collapsed", async ({
    page,
  }) => {
    const field = verificationNotes(page);

    await expect(field).toHaveCount(1);
    await expect(field).toBeVisible();
    await expect(amberRow(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("the field starts with the check the reviewer is being asked to make", async ({
    page,
  }) => {
    await expect(verificationNotes(page)).toHaveValue(VERIFICATION_PREFILL);
    await expect(verificationNotes(page)).toHaveAttribute(
      "placeholder",
      VERIFICATION_PLACEHOLDER,
    );
  });

  test("the starting text is editable", async ({ page }) => {
    const field = verificationNotes(page);

    await field.fill("Checked against worksheet WS-2026-014 — 5 mL confirmed.");
    await expect(field).toHaveValue(
      "Checked against worksheet WS-2026-014 — 5 mL confirmed.",
    );
  });

  test("typing in the field does not toggle the row it sits on", async ({ page }) => {
    const row = amberRow(page);
    await expect(row).toHaveAttribute("aria-expanded", "false");

    await verificationNotes(page).click();
    await page.keyboard.type("Verified.");

    await expect(row).toHaveAttribute("aria-expanded", "false");
  });

  test("the field is amber, not red", async ({ page }) => {
    const heading = page.getByText("Reviewer observation").first();

    await expectColour(page, heading, "color", COLOUR.warn);
    expect(await colourOf(heading, "color")).not.toBe(
      await colourOf(page.locator("span.text-flagged-text").first(), "color"),
    );
  });

  test("the gate is shut until the verification is confirmed", async ({ page }) => {
    await expect(gateButton(page)).toBeDisabled();
    await expect(blockingBanner(page)).toContainText(
      "Confirm your worksheet verification of",
    );
  });

  test("the gate opens once the verification is recorded", async ({ page }) => {
    const field = verificationNotes(page);
    await noteBlockFor(field).getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("Noted", { exact: true })).toBeVisible();
    await expect(gateButton(page)).toBeEnabled();
  });

  test("an untouched field is not a silent confirmation", async ({ page }) => {
    /* The starting text is in the box, but nothing is recorded until Confirm
       is pressed — so the gate is still shut. */
    await expect(verificationNotes(page)).toHaveValue(VERIFICATION_PREFILL);
    await expect(gateButton(page)).toBeDisabled();
  });

  test("LCMS Chemicals behaves the same way", async ({ page }) => {
    await goToSection(page, "LCMS", "Chemicals");

    await expect(amberRow(page)).toBeVisible();
    await expect(verificationNotes(page)).toHaveValue(VERIFICATION_PREFILL);
    await expect(gateButton(page)).toBeDisabled();

    await noteBlockFor(verificationNotes(page))
      .getByRole("button", { name: "Confirm" })
      .click();
    await expect(gateButton(page)).toBeEnabled();
  });

  /*
   * Assay Chemicals runs the same quantity check, but LIMS returned both
   * figures for every entry there, so nothing in it is amber. Its flag is an
   * inactivated chemical, which is a different finding entirely.
   */
  test("Assay Chemicals runs the same check and has nothing outstanding", async ({
    page,
  }) => {
    await goToSection(page, "Assay", "Chemicals");

    await expect(checkRows(page).filter({ hasText: "Needs Verification" })).toHaveCount(0);
    await expect(verificationNotes(page)).toHaveCount(0);

    await checkRows(page).first().click();
    await expect(page.getByText("Prescribed quantity (LIMS worksheet)")).toBeVisible();
    await expect(page.getByText("NO COMPARISON — VERIFY AGAINST WORKSHEET")).toHaveCount(0);
  });

  test("KF Chemicals is fully compliant — no amber entry at all", async ({ page }) => {
    await goToSection(page, "KF", "Chemicals");

    await expect(checkRows(page).filter({ hasText: "Needs Verification" })).toHaveCount(0);
    await expect(verificationNotes(page)).toHaveCount(0);
    await expect(gateButton(page)).toBeEnabled();
  });
});
