import { expect, test } from "@playwright/test";

import {
  COLOUR,
  checkRows,
  colourOf,
  expectColour,
  gateButton,
  goToSection,
  openDemoBatch,
} from "../helpers/auth";

/**
 * A compliant entry never asks the reviewer for anything. QRA did the
 * checking; the row's job is to show that the checking happened and to put
 * the evidence one click away.
 */
test.describe("Compliant rows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
    /* RS Standards is entirely compliant — one clean entry, no flags. */
    await goToSection(page, "RS", "Standards");
  });

  test("a compliant row carries a green tick", async ({ page }) => {
    const row = checkRows(page).first();
    await expect(row.getByText("✓")).toBeVisible();
    await expect(row.getByText("Compliant", { exact: true })).toBeVisible();

    await expectColour(page, row.getByText("✓"), "color", COLOUR.compliant);
  });

  test("compliant rows are collapsed on arrival", async ({ page }) => {
    const rows = checkRows(page);

    for (let index = 0; index < (await rows.count()); index += 1) {
      await expect(rows.nth(index)).toHaveAttribute("aria-expanded", "false");
    }
    await expect(page.getByText("What QRA checked")).toHaveCount(0);
  });

  /*
   * The control is always on the row, never revealed only by hovering — the
   * reviewer should not have to discover that the evidence exists. It sits at
   * low opacity until the row is hovered so it does not compete with the
   * reading.
   */
  test("View evidence is on every compliant row, quiet until hovered", async ({
    page,
  }) => {
    const rows = checkRows(page);

    for (let index = 0; index < (await rows.count()); index += 1) {
      const control = rows.nth(index).getByText(/View evidence/);
      await expect(control).toBeVisible();
      expect(await control.evaluate((el) => getComputedStyle(el).opacity)).toBe("0.4");
    }

    await rows.first().hover();
    await expect
      .poll(async () =>
        rows
          .first()
          .getByText(/View evidence/)
          .evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe("1");
  });

  test("clicking a compliant row expands its evidence", async ({ page }) => {
    const row = checkRows(page).first();
    await row.click();

    await expect(row).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("What QRA checked")).toBeVisible();
    await expect(row.getByText(/Hide evidence/)).toBeVisible();
  });

  test("clicking again collapses it", async ({ page }) => {
    const row = checkRows(page).first();
    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "true");

    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("What QRA checked")).toHaveCount(0);
  });

  test("only one entry stays open at a time", async ({ page }) => {
    await goToSection(page, "Assay", "Instruments");
    const rows = checkRows(page);

    await rows.nth(0).click();
    await expect(rows.nth(0)).toHaveAttribute("aria-expanded", "true");

    await rows.nth(1).click();
    await expect(rows.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(rows.nth(0)).toHaveAttribute("aria-expanded", "false");
  });

  /* The evidence visibility principle, field by field. */
  test("an expanded compliant row shows the full evidence structure", async ({
    page,
  }) => {
    const row = checkRows(page).first();
    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "true");

    await expect(page.getByText("What QRA checked")).toBeVisible();
    await expect(page.getByText("Actual", { exact: true })).toBeVisible();
    await expect(page.getByText("Expected", { exact: true })).toBeVisible();
    await expect(page.getByText("Comparison performed")).toBeVisible();
    await expect(page.getByText("Result", { exact: true })).toBeVisible();
    await expect(
      page.getByText("No action required — this entry requires no reviewer action."),
    ).toBeVisible();

    /* Both sides of the comparison name where they came from. */
    const panel = await row.innerText();
    expect(panel).toMatch(/Source:/);
  });

  test("an expanded compliant row is green, not amber or red", async ({ page }) => {
    const rows = checkRows(page);
    const outer = rows.first().locator("xpath=..");

    await rows.first().click();
    await expect(rows.first()).toHaveAttribute("aria-expanded", "true");

    await expectColour(page, outer, "borderLeftColor", COLOUR.compliant);
    expect(await colourOf(outer, "backgroundColor")).toBe("rgb(240, 253, 244)");
  });

  test("a compliant row has no note field", async ({ page }) => {
    const row = checkRows(page).first();
    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "true");

    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.getByText("Reviewer observation")).toHaveCount(0);
  });

  test("a section of compliant rows alone does not hold the gate shut", async ({
    page,
  }) => {
    await expect(gateButton(page)).toBeEnabled();

    /* Expanding evidence is a reading action and changes nothing. */
    await checkRows(page).first().click();
    await expect(gateButton(page)).toBeEnabled();
  });

  test("a compliant row can be opened from the keyboard", async ({ page }) => {
    const row = checkRows(page).first();
    await row.focus();
    await page.keyboard.press("Enter");

    await expect(row).toHaveAttribute("aria-expanded", "true");
  });
});
