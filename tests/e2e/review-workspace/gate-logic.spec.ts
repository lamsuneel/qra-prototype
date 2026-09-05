import { expect, test } from "@playwright/test";

import {
  blockingBanner,
  fillAllNotes,
  flaggedCards,
  gateButton,
  goToSection,
  markSectionReviewed,
  openDemoBatch,
  rightPanel,
  sectionTabs,
  verificationNotes,
} from "../helpers/auth";

test.describe("Mark Section Reviewed gate", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
  });

  test("a section with a flag arrives with the gate shut", async ({ page }) => {
    await goToSection(page, "Assay", "Chemicals");

    await expect(flaggedCards(page).first()).toBeVisible();
    await expect(gateButton(page)).toBeDisabled();
  });

  test("a section needing verification arrives with the gate shut", async ({ page }) => {
    await goToSection(page, "Disso", "Chemicals");

    await expect(verificationNotes(page)).toHaveCount(1);
    await expect(gateButton(page)).toBeDisabled();
  });

  test("a fully compliant section arrives with the gate open", async ({ page }) => {
    await goToSection(page, "RS", "Standards");

    await expect(flaggedCards(page)).toHaveCount(0);
    await expect(verificationNotes(page)).toHaveCount(0);
    await expect(gateButton(page)).toBeEnabled();
  });

  test("a shut gate does nothing when clicked", async ({ page }) => {
    await goToSection(page, "Assay", "Chemicals");
    const before = page.url();

    await gateButton(page).click({ force: true });
    await page.waitForTimeout(400);

    expect(page.url()).toBe(before);
    await expect(gateButton(page)).toHaveText("Mark Section Reviewed");
    await expect(
      sectionTabs(page).filter({ hasText: "Chemicals" }).first().getByText("✓"),
    ).toHaveCount(0);
  });

  test("the bar says what is blocking, not just that something is", async ({ page }) => {
    await goToSection(page, "Assay", "Chemicals");

    await expect(blockingBanner(page)).toContainText(
      /Open the flagged entry .* and add your observation note/,
    );
    await expect(blockingBanner(page)).toContainText("Acetonitrile");
  });

  test("filling every required note opens the gate", async ({ page }) => {
    await goToSection(page, "Assay", "Chemicals");
    await expect(gateButton(page)).toBeDisabled();

    await fillAllNotes(page);
    await expect(gateButton(page)).toBeEnabled();
  });

  test("marking a section reviewed records it and stays put", async ({ page }) => {
    await goToSection(page, "RS", "Standards");
    await markSectionReviewed(page);

    await expect(page.getByRole("button", { name: "Section Reviewed" })).toBeDisabled();
    await expect(
      page.locator("div.sticky").filter({ hasText: "Specification" }).getByText("Reviewed"),
    ).toBeVisible();
  });

  test("a reviewed section is ticked in the sidebar", async ({ page }) => {
    await goToSection(page, "RS", "Standards");
    await markSectionReviewed(page);

    const tab = sectionTabs(page).filter({ hasText: "Standards" }).first();
    await expect(tab.getByText("✓")).toBeVisible();
  });

  test("the What's Left count rises as sections are reviewed", async ({ page }) => {
    const panel = rightPanel(page);
    await expect(panel.locator("div.text-xl").first()).toContainText("0");

    await goToSection(page, "RS", "Standards");
    await markSectionReviewed(page);
    await expect(panel.locator("div.text-xl").first()).toContainText("1");

    await goToSection(page, "RS", "Instruments");
    await markSectionReviewed(page);
    await expect(panel.locator("div.text-xl").first()).toContainText("2");
  });

  test("the total never changes as sections are reviewed", async ({ page }) => {
    const panel = rightPanel(page);
    await expect(panel).toContainText("/ 34");

    await goToSection(page, "RS", "Standards");
    await markSectionReviewed(page);
    await expect(panel).toContainText("/ 34");
  });

  test("Next Section advances without marking anything reviewed", async ({ page }) => {
    await goToSection(page, "RS", "Standards");
    const before = page.url();

    await page.getByRole("button", { name: /^Next Section/ }).click();
    await expect(page).not.toHaveURL(before);
    await expect(page.getByRole("button", { name: "Mark Section Reviewed" })).toBeVisible();

    await page.getByRole("button", { name: /^Previous Section/ }).click();
    await expect(page).toHaveURL(before);
    await expect(page.getByRole("button", { name: "Mark Section Reviewed" })).toBeVisible();
  });

  test("Previous Section walks back across parameter boundaries", async ({ page }) => {
    await goToSection(page, "RS", "Attendance Verification");
    await page.getByRole("button", { name: /^Previous Section/ }).click();

    /* Attendance leads RS, so the section before it is Assay's last. */
    await expect(page).toHaveURL(/\/review\/assay\//);
  });

  test("a note survives navigating away and back", async ({ page }) => {
    await goToSection(page, "KF", "KF Titrator");

    const card = flaggedCards(page).first();
    await card.locator("textarea").first().fill("Confirmed against the Tiamo export.");
    await card.getByRole("button", { name: "Confirm" }).click();
    await expect(card.getByText("Noted", { exact: true })).toBeVisible();

    await goToSection(page, "KF", "Chemicals");
    await goToSection(page, "KF", "KF Titrator");

    await expect(
      flaggedCards(page).first().getByText('“Confirmed against the Tiamo export.”'),
    ).toBeVisible();
  });

  test("a verification note also survives navigating away and back", async ({ page }) => {
    await goToSection(page, "Disso", "Chemicals");
    await fillAllNotes(page);
    await expect(gateButton(page)).toBeEnabled();

    await goToSection(page, "Disso", "Standards");
    await goToSection(page, "Disso", "Chemicals");

    await expect(page.getByText("Noted", { exact: true })).toBeVisible();
    await expect(gateButton(page)).toBeEnabled();
  });

  test("a section marked reviewed stays reviewed after navigating away", async ({
    page,
  }) => {
    await goToSection(page, "RS", "Standards");
    await markSectionReviewed(page);

    await goToSection(page, "RS", "Instruments");
    await goToSection(page, "RS", "Standards");

    await expect(page.getByRole("button", { name: "Section Reviewed" })).toBeVisible();
  });
});
