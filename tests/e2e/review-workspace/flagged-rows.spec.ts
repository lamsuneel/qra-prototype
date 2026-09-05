import { expect, test } from "@playwright/test";

import {
  COLOUR,
  blockingBanner,
  colourOf,
  expectColour,
  flaggedCards,
  gateButton,
  goToSection,
  openDemoBatch,
} from "../helpers/auth";

const TEMPLATES = [
  "Reviewed — found satisfactory",
  "Exception noted — investigation initiated",
  "Deviation raised",
] as const;

/**
 * KF Titrator carries two flagged entries — an excess reanalysis and an
 * out-of-order audit trail — which is what makes it the section to test the
 * gate against: one note is never enough.
 */
test.describe("Flagged rows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
    await goToSection(page, "KF", "KF Titrator");
  });

  test("a flagged card has a red left border", async ({ page }) => {
    const card = flaggedCards(page).first();
    await expect(card).toBeVisible();

    await expectColour(page, card, "borderLeftColor", COLOUR.flagged);
  });

  test("a flagged card is red, not amber or green", async ({ page }) => {
    const card = flaggedCards(page).first();
    expect(await colourOf(card, "backgroundColor")).toBe("rgb(254, 242, 242)");
  });

  /* The reviewer has to act on it, so nothing about it is hidden. */
  test("the first flagged card is open on arrival", async ({ page }) => {
    const card = flaggedCards(page).first();
    await expect(card.getByRole("button", { name: /Hide evidence/ })).toBeVisible();
    await expect(card.getByText("Why flagged")).toBeVisible();
  });

  test("a flagged card shows the evidence structure plus why, action and observation", async ({
    page,
  }) => {
    const card = flaggedCards(page).first();

    await expect(card.getByText(/FLAGGED —/)).toBeVisible();
    await expect(card.getByText("What QRA checked")).toBeVisible();
    await expect(card.getByText("Actual", { exact: true })).toBeVisible();
    await expect(card.getByText("Expected", { exact: true })).toBeVisible();
    await expect(card.getByText("Comparison performed")).toBeVisible();

    await expect(card.getByText("Why flagged")).toBeVisible();
    await expect(card.getByText("Required action")).toBeVisible();
    await expect(card.getByText("Reviewer observation")).toBeVisible();

    /* Why flagged names the rule and the document it comes from. */
    expect(await card.innerText()).toMatch(/STP-AMX-KF-001|SOP-INST-004/);
  });

  test("the note field is present and editable", async ({ page }) => {
    const field = flaggedCards(page).first().locator("textarea").first();

    await expect(field).toBeVisible();
    await expect(field).toBeEditable();
    await field.fill("Discussed with the analyst.");
    await expect(field).toHaveValue("Discussed with the analyst.");
  });

  test("the observation templates sit above the note field", async ({ page }) => {
    const card = flaggedCards(page).first();

    for (const template of TEMPLATES) {
      await expect(card.getByRole("button", { name: template })).toBeVisible();
    }
    await expect(card.getByRole("button", { name: "Custom note" })).toBeVisible();
  });

  for (const template of TEMPLATES) {
    test(`the "${template}" template fills the note field`, async ({ page }) => {
      const card = flaggedCards(page).first();
      await card.getByRole("button", { name: template }).click();

      await expect(card.locator("textarea").first()).toHaveValue(template);
      await expect(card.getByRole("button", { name: template })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  }

  test("Custom note clears the field and puts the caret in it", async ({ page }) => {
    const card = flaggedCards(page).first();
    await card.getByRole("button", { name: TEMPLATES[0] }).click();
    await expect(card.locator("textarea").first()).toHaveValue(TEMPLATES[0]);

    await card.getByRole("button", { name: "Custom note" }).click();
    await expect(card.locator("textarea").first()).toHaveValue("");
    await expect(card.locator("textarea").first()).toBeFocused();
  });

  test("a template is a starting point, not locked text", async ({ page }) => {
    const card = flaggedCards(page).first();
    const field = card.locator("textarea").first();

    await card.getByRole("button", { name: TEMPLATES[1] }).click();
    await field.fill(`${TEMPLATES[1]} — DEV-2026-0311 raised.`);

    await expect(field).toHaveValue(`${TEMPLATES[1]} — DEV-2026-0311 raised.`);
    await expect(field).toBeEditable();
  });

  test("typing straight into the field works without touching a template", async ({
    page,
  }) => {
    const card = flaggedCards(page).first();
    const field = card.locator("textarea").first();

    await field.click();
    await page.keyboard.type("Second determination justified by the conditioning error.");

    await expect(field).toHaveValue(
      "Second determination justified by the conditioning error.",
    );
    for (const template of TEMPLATES) {
      await expect(card.getByRole("button", { name: template })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
  });

  test("the gate is shut while no note has been recorded", async ({ page }) => {
    await expect(gateButton(page)).toBeDisabled();
    await expect(blockingBanner(page)).toContainText(
      /still need your (note|attention)|add your observation note/,
    );
  });

  test("the gate stays shut while any flag is unnoted", async ({ page }) => {
    const cards = flaggedCards(page);
    await expect(cards).toHaveCount(3);

    const first = cards.first();
    await first.getByRole("button", { name: TEMPLATES[0] }).click();
    await first.getByRole("button", { name: "Confirm" }).click();
    await expect(first.getByText("Noted", { exact: true })).toBeVisible();

    await expect(gateButton(page)).toBeDisabled();
    await expect(blockingBanner(page)).toContainText(/of \d+ entries still need/);
  });

  test("the gate opens only once every flagged entry carries a note", async ({
    page,
  }) => {
    const cards = flaggedCards(page);
    const count = await cards.count();

    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);

      /* Recording one observation leaves the other card collapsed, so it is
         reopened before it can be written on. */
      if ((await card.locator("textarea").count()) === 0) {
        await card.getByRole("button", { name: /View evidence/ }).click();
        await expect(card.locator("textarea").first()).toBeVisible();
      }

      await card.getByRole("button", { name: TEMPLATES[0] }).click();
      await card.getByRole("button", { name: "Confirm" }).click();
      await expect(card.getByText("Noted", { exact: true })).toBeVisible();

      if (index < count - 1) await expect(gateButton(page)).toBeDisabled();
    }

    /* The section also carries two acceptability conditions, so noting the
       flags is necessary and not yet sufficient. */
    for (const box of await page.getByRole("checkbox").all()) await box.check();

    await expect(gateButton(page)).toBeEnabled();
    await expect(gateButton(page)).not.toHaveClass(/opacity-40/);
  });

  test("a recorded observation is shown back, not left in the field", async ({
    page,
  }) => {
    const card = flaggedCards(page).first();
    await card.getByRole("button", { name: TEMPLATES[2] }).click();
    await card.getByRole("button", { name: "Confirm" }).click();

    await expect(card.getByText(`“${TEMPLATES[2]}”`)).toBeVisible();
    await expect(card.getByText("Observation recorded")).toBeVisible();
  });

  /*
   * Only one entry is open at a time, so opening a compliant row collapses a
   * flagged card. Without a way back the gate would be unsatisfiable.
   */
  test("a collapsed flagged card can always be reopened", async ({ page }) => {
    const card = flaggedCards(page).first();
    await card.getByRole("button", { name: /Hide evidence/ }).click();

    await expect(card.locator("textarea")).toHaveCount(0);
    await expect(card.getByRole("button", { name: /View evidence/ })).toBeVisible();

    await card.getByRole("button", { name: /View evidence/ }).click();
    await expect(card.locator("textarea").first()).toBeVisible();
  });

  test("the flag names its exception type", async ({ page }) => {
    await goToSection(page, "LCMS", "LCMS System");
    const card = flaggedCards(page).first();

    await expect(card.getByText("FLAGGED — OOS Result")).toBeVisible();
    await expect(card.getByText("Requires OOS investigation per site SOP")).toBeVisible();
  });
});
