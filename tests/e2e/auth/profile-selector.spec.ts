import { expect, test } from "@playwright/test";

import { profileCard, selectProfile, switchProfile } from "../helpers/auth";

/** Identity lives in the navbar; a name in a table or an activity line is not it. */
const navbar = (page: import("@playwright/test").Page) => page.locator("header");

test.describe("Profile selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("all four profiles are visible on the login screen", async ({ page }) => {
    await expect(profileCard(page, "Arjun Mehta")).toBeVisible();
    await expect(profileCard(page, "Priya Sharma")).toBeVisible();
    await expect(profileCard(page, "Rajesh Kumar")).toBeVisible();
    await expect(profileCard(page, "CQO")).toBeVisible();

    await expect(page.getByText("QA Analyst · Reviewer").first()).toBeVisible();
    await expect(page.getByText("GM-QA · Approver")).toBeVisible();
    await expect(page.getByText("Chief Quality Officer")).toBeVisible();
  });

  test("Arjun Mehta lands on the QA Review Dashboard as a reviewer", async ({ page }) => {
    await selectProfile(page, "Arjun Mehta");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "QA Review Dashboard" }),
    ).toBeVisible();
  });

  test("Priya Sharma also lands on the QA Review Dashboard", async ({ page }) => {
    await selectProfile(page, "Priya Sharma");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(navbar(page).getByText("Priya Sharma")).toBeVisible();
  });

  /*
   * The approver's starting screen is the authorisation queue, not the QA
   * dashboard: an approver has nothing to review, only submissions to decide
   * on, and /authorise redirects a reviewer away for the same reason.
   */
  test("Rajesh Kumar lands on the authorisation queue as an approver", async ({
    page,
  }) => {
    await selectProfile(page, "Rajesh Kumar");

    await expect(page).toHaveURL(/\/authorise$/);
    await expect(
      page.getByRole("heading", { name: "Reviews Awaiting Authorisation" }),
    ).toBeVisible();
  });

  test("CQO lands on the management dashboard", async ({ page }) => {
    await selectProfile(page, "CQO");

    await expect(page).toHaveURL(/\/management$/);
    await expect(
      page.getByRole("heading", { name: "Batch Review Performance" }),
    ).toBeVisible();
  });

  test("Switch Profile in the navbar returns to the profile selector", async ({
    page,
  }) => {
    await selectProfile(page, "Arjun Mehta");
    await switchProfile(page);

    await expect(page.getByText("Select your profile to continue")).toBeVisible();
    await expect(profileCard(page, "Arjun Mehta")).toBeVisible();
  });

  /*
   * Switching clears who you are, not what has been done: a submitted review
   * has to still be waiting when the approver signs in. What must not survive
   * is the identity — no name, no role badge, and no way past the selector.
   */
  test("after switching profile the previous identity is cleared", async ({ page }) => {
    await selectProfile(page, "Arjun Mehta");
    await expect(navbar(page).getByText("Arjun Mehta")).toBeVisible();

    await switchProfile(page);
    /* The selector has no navbar at all — there is no identity to show. */
    await expect(navbar(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Switch Profile" })).toHaveCount(0);

    await selectProfile(page, "Rajesh Kumar");
    await expect(navbar(page).getByText("Arjun Mehta")).toHaveCount(0);
    await expect(navbar(page).getByText("Rajesh Kumar")).toBeVisible();
  });

  test("profile name and role badge are visible in the navbar after signing in", async ({
    page,
  }) => {
    await selectProfile(page, "Arjun Mehta");

    await expect(navbar(page).getByText("Arjun Mehta")).toBeVisible();
    await expect(navbar(page).getByText("QA Analyst · Reviewer")).toBeVisible();
  });

  test("a deep link without a profile returns to the selector", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/localhost:3100\/$/);
    await expect(page.getByText("Select your profile to continue")).toBeVisible();
  });
});
