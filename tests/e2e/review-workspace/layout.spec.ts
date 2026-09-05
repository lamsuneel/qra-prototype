import { expect, test } from "@playwright/test";

import {
  DEMO_AR,
  goToSection,
  DEMO_PRODUCT,
  gateButton,
  openDemoBatch,
  parameterTabs,
  rightPanel,
  sectionTabs,
  sidebar,
} from "../helpers/auth";

const PARAMETERS = ["Assay", "RS", "Disso", "KF", "LCMS"];

test.describe("Review workspace layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
  });

  test("three columns are visible — sidebar, content, right panel", async ({ page }) => {
    await expect(sidebar(page)).toBeVisible();
    await expect(page.getByText("What QRA checked").first()).toBeVisible();
    await expect(rightPanel(page)).toBeVisible();
  });

  test("the sidebar lists every test parameter", async ({ page }) => {
    await expect(parameterTabs(page)).toHaveCount(PARAMETERS.length);

    for (const shortName of PARAMETERS) {
      await expect(
        parameterTabs(page).filter({ hasText: shortName }).first(),
      ).toBeVisible();
    }
  });

  /*
   * Red where the parameter carries an exception, green where it does not.
   * The dot is derived from the entries themselves, so a parameter can never
   * read green while something inside it is flagged.
   */
  test("each parameter carries a status dot, red only where it has exceptions", async ({
    page,
  }) => {
    const tabs = parameterTabs(page);

    for (let index = 0; index < (await tabs.count()); index += 1) {
      const tab = tabs.nth(index);
      const dot = tab.locator("span.rounded-full").first();
      await expect(dot).toBeVisible();

      const colour = await dot.evaluate((el) => getComputedStyle(el).backgroundColor);
      const text = await tab.innerText();
      const flagged = /\d/.test(text.replace(/[^\d]/g, ""));

      expect(colour).toBe(flagged ? "rgb(192, 0, 0)" : "rgb(55, 86, 35)");
    }
  });

  test("the active parameter is highlighted", async ({ page }) => {
    const active = parameterTabs(page).filter({ hasText: "Assay" }).first();
    await expect(active).toHaveClass(/border-l-navy/);
    await expect(active).toHaveClass(/font-semibold/);
  });

  test("the sections of the active parameter are listed", async ({ page }) => {
    await expect(sidebar(page).getByText("Sections")).toBeVisible();
    await expect(sectionTabs(page).first()).toBeVisible();
    expect(await sectionTabs(page).count()).toBeGreaterThan(1);
  });

  test("the right panel shows sections reviewed and the exception count", async ({
    page,
  }) => {
    const panel = rightPanel(page);
    await expect(panel.getByText(/What.s Left/)).toBeVisible();
    await expect(panel.getByText("Sections", { exact: true })).toBeVisible();
    await expect(panel.getByText("Exceptions", { exact: true })).toBeVisible();

    const text = await panel.innerText();
    expect(text).toMatch(/0\s*\/\s*34/);
    expect(text).toMatch(/\b8\b/);
  });

  test("the breadcrumb names the whole path down to the section", async ({ page }) => {
    const trail = page.getByLabel("Breadcrumb");

    await expect(trail.getByText("QA Dashboard")).toBeVisible();
    await expect(trail.getByText("Finished Product")).toBeVisible();
    await expect(trail.getByText(`${DEMO_AR} ${DEMO_PRODUCT}`)).toBeVisible();
    await expect(trail.getByText("Assay — Chemicals")).toBeVisible();
  });

  test("a breadcrumb link navigates — Finished Product opens the batch list", async ({
    page,
  }) => {
    await page.getByLabel("Breadcrumb").getByText("Finished Product").click();

    await expect(page).toHaveURL(/\/batches\/finished-product$/);
    await expect(
      page.getByRole("heading", { name: "Finished Product — Review Queue" }),
    ).toBeVisible();
  });

  test("the last breadcrumb is not a link", async ({ page }) => {
    const trail = page.getByLabel("Breadcrumb");
    await expect(
      trail.getByRole("button", { name: "Assay — Chemicals" }),
    ).toHaveCount(0);
  });

  test("the bottom bar offers Previous, the gate, and Next", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^Previous Section/ })).toBeVisible();
    await expect(gateButton(page)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Next Section/ })).toBeVisible();

    /* Assay Chemicals carries a flag, so the gate starts closed. */
    await expect(gateButton(page)).toBeDisabled();
  });

  /* Attendance leads every parameter, so search lands one section in. */
  test("Previous Section is disabled only on the very first section", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: /^Previous Section/ })).toBeEnabled();

    await goToSection(page, "Assay", "Attendance Verification");
    await expect(page.getByRole("button", { name: /^Previous Section/ })).toBeDisabled();
  });

  test("the AR number sits at the top right of the content area", async ({ page }) => {
    const header = page.locator("div.sticky").filter({ hasText: "Specification" }).first();
    await expect(header.getByText(DEMO_AR)).toBeVisible();
  });

  test("the section header names the specification and the STP reference", async ({
    page,
  }) => {
    const header = page.locator("div.sticky").filter({ hasText: "Specification" }).first();

    await expect(header).toContainText("Specification v3.2");
    await expect(header).toContainText("STP-AMX-ASSAY-003");
  });

  test("the section header names the section and its specification badge", async ({
    page,
  }) => {
    const header = page.locator("div.sticky").filter({ hasText: "Specification" }).first();

    await expect(header.getByText("Assay — Chemicals")).toBeVisible();
    await expect(header.getByText("v3.2 Current")).toBeVisible();
  });

  test("the browser tab names the batch and the product line", async ({ page }) => {
    await expect(page).toHaveTitle(
      `${DEMO_AR} — Assay | QRA — Quality Review Assistant`,
    );
  });
});
