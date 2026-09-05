import { expect, test } from "@playwright/test";

import {
  openDomain,
  DEMO_AR,
  collectErrors,
  goToSection,
  navigateToBatch,
  openSummary,
  selectProfile,
} from "../helpers/auth";

/**
 * Every screen, watched from before the first navigation.
 *
 * Two of QRA's worst defects were runtime-only — a route slug collision and a
 * section id collision — and both built cleanly. A console listener attached
 * before navigation is the check that would have caught them.
 */
test.describe("Console cleanliness", () => {
  test("the login screen is silent", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByText("Select your profile to continue")).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
  });

  test("the QA dashboard is silent", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");

    expect(errors).toEqual([]);
  });

  test("a domain batch list is silent", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
    await openDomain(page, "Finished Product");
    await page.waitForURL(/\/batches\/finished-product$/);

    expect(errors).toEqual([]);
  });

  for (const [parameter, section] of [
    ["Assay", "Chemicals"],
    ["KF", "Chemicals"],
    ["Disso", "Chemicals"],
    ["LCMS", "Chemicals"],
    ["Assay", "Instruments"],
    ["KF", "KF Titrator"],
    ["Disso", "Tablet Processing Workstation"],
  ] as const) {
    test(`${DEMO_AR} ${parameter} ${section} is silent`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto("/");
      await selectProfile(page, "Arjun Mehta");
      await navigateToBatch(page, DEMO_AR);
      await goToSection(page, parameter, section);

      /* Open every entry — a panel that throws only when expanded is still a
         defect the reviewer would meet. */
      const rows = page.locator('[role="button"][aria-expanded]');
      for (let index = 0; index < (await rows.count()); index += 1) {
        await rows.nth(index).click();
        await page.waitForTimeout(80);
      }

      expect(errors).toEqual([]);
    });
  }

  test("the review summary is silent", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
    await navigateToBatch(page, DEMO_AR);
    await openSummary(page);
    await expect(page.getByRole("heading", { name: "Review Summary" })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("the approver queue and a submission are silent", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await selectProfile(page, "Rajesh Kumar");
    await expect(
      page.getByRole("heading", { name: "Reviews Awaiting Authorisation" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Open" }).first().click();
    await page.waitForURL(/\/authorise\/07-/);
    await expect(page.getByText(/exceptions? requiring attention/)).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("the management dashboard is silent", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await selectProfile(page, "CQO");
    await expect(page.locator("svg.recharts-surface").first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
  });

  test("site config is silent, expanded and collapsed", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
    await page.getByRole("button", { name: "Site Config" }).click();
    await page.waitForURL(/\/config$/);

    const toggle = page.getByRole("button", { name: /Configured Rules/ });
    await toggle.click();
    await toggle.click();

    expect(errors).toEqual([]);
  });

  test("the other domain workspaces are silent", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");

    for (const ar of ["07-RM-26-4417", "07-PM-26-8823", "07-ST-26-0089", "07-IPFP-26-0122"]) {
      await navigateToBatch(page, ar);
      await page.waitForTimeout(300);
    }

    expect(errors).toEqual([]);
  });
});
