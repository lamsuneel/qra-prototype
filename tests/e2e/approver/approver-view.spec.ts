import { expect, test, type Page } from "@playwright/test";

import {
  DEMO_AR,
  completeReview,
  navigateToBatch,
  openSummary,
  selectProfile,
  switchProfile,
} from "../helpers/auth";

/**
 * A full review handed over.
 *
 * The reviewer's work has to survive the handover — the approver reads the
 * notes that were written against each exception — but the identity must not,
 * which is why switching profile clears who you are and nothing else.
 */
async function submitAsReviewer(page: Page) {
  await page.goto("/");
  await selectProfile(page, "Arjun Mehta");
  await navigateToBatch(page, DEMO_AR);
  await completeReview(page);

  await page.getByRole("button", { name: "Submit for Authorisation" }).click();
  await page.waitForURL(/\/dashboard$/);
}

async function openSubmission(page: Page) {
  await switchProfile(page);
  await selectProfile(page, "Rajesh Kumar");

  await page
    .locator("tbody tr")
    .filter({ hasText: DEMO_AR })
    .getByRole("button", { name: "Open" })
    .click();
  await page.waitForURL(new RegExp(`/authorise/${DEMO_AR}$`));
}

test.describe("Approver view", () => {
  test.beforeEach(async ({ page }) => {
    /* completeReview walks 34 sections — extended timeout required. */
    test.setTimeout(900_000);
    await submitAsReviewer(page);
    await openSubmission(page);
  });

  test("the queue shows the submission the reviewer sent", async ({ page }) => {
    await expect(page.getByText(DEMO_AR).first()).toBeVisible();
    await expect(page.getByText("Awaiting Authorisation").first()).toBeVisible();
  });

  test("the approver sees exceptions only, not the section checklists", async ({
    page,
  }) => {
    await expect(page.getByText("8 exceptions requiring attention")).toBeVisible();
    await expect(page.locator("article")).toHaveCount(8);

    /* None of the reviewer's machinery comes across. */
    await expect(page.getByText("What QRA checked")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Mark Section Reviewed/ })).toHaveCount(0);
    await expect(page.getByText("Compliant", { exact: true })).toHaveCount(0);
  });

  test("each exception carries the reviewer's note", async ({ page }) => {
    const first = page.locator("article").first();

    await expect(first.getByText(/^Exception 1$/)).toBeVisible();
    await expect(first.getByText(/"Reviewed — found satisfactory"/)).toBeVisible();
  });

  test("the decision panel is pinned above the exceptions", async ({ page }) => {
    const panel = page.locator("div.sticky").filter({ hasText: "Reviewing submission" });

    await expect(panel).toBeVisible();
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    await expect(panel.getByText(DEMO_AR)).toBeVisible();
  });

  test("both decisions are offered", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Authorise Review" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Send Back" })).toBeEnabled();
  });

  test("Authorise Review asks for confirmation rather than acting at once", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Authorise Review" }).click();

    await expect(page.getByRole("heading", { name: "Authorise Review?" })).toBeVisible();
    await expect(page.getByText(/with 8 documented exceptions/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Authorisation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    /* Nothing has changed until the second click. */
    await expect(page.getByText("Awaiting Authorisation").first()).toBeVisible();
  });

  test("cancelling the dialog leaves the submission undecided", async ({ page }) => {
    await page.getByRole("button", { name: "Authorise Review" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("heading", { name: "Authorise Review?" })).toHaveCount(0);
    await expect(page.getByText("Awaiting Authorisation").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Authorise Review" })).toBeEnabled();
  });

  test("confirming sets the batch to Review Authorised", async ({ page }) => {
    await page.getByRole("button", { name: "Authorise Review" }).click();
    await page.getByRole("button", { name: "Confirm Authorisation" }).click();

    await expect(page.getByText("Review Authorised")).toBeVisible();
    await expect(page.getByRole("button", { name: "Authorise Review" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Send Back" })).toBeDisabled();
  });

  test("Send Back cannot be completed without a reason", async ({ page }) => {
    await page.getByRole("button", { name: "Send Back" }).click();

    await expect(page.getByText("Reason for sending back")).toBeVisible();
    const confirm = page.getByRole("button", { name: "Send Back to Reviewer" });
    await expect(confirm).toBeDisabled();

    await page.locator("#return-reason").fill("   ");
    await expect(confirm).toBeDisabled();
  });

  test("Send Back with a reason returns the batch to the reviewer", async ({ page }) => {
    await page.getByRole("button", { name: "Send Back" }).click();
    await page
      .locator("#return-reason")
      .fill("The KF audit trail sequence needs the analyst's statement attached.");

    const confirm = page.getByRole("button", { name: "Send Back to Reviewer" });
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page.getByText("Returned to Reviewer")).toBeVisible();
  });

  test("Export Review Record opens once the review is authorised", async ({ page }) => {
    await page.getByRole("button", { name: "Authorise Review" }).click();
    await page.getByRole("button", { name: "Confirm Authorisation" }).click();
    await expect(page.getByText("Review Authorised")).toBeVisible();

    await switchProfile(page);
    await selectProfile(page, "Arjun Mehta");
    await navigateToBatch(page, DEMO_AR);
    await openSummary(page);

    await expect(
      page.getByRole("button", { name: "Export Review Record" }),
    ).toBeEnabled();
  });

  test("the queue is not emptied by one authorisation", async ({ page }) => {
    await page.getByRole("button", { name: "Authorise Review" }).click();
    await page.getByRole("button", { name: "Confirm Authorisation" }).click();
    await page.getByRole("button", { name: /Back to list/ }).click();
    await page.waitForURL(/\/authorise$/);

    /* A second batch was seeded already submitted, so an approver signing in
       cold never meets an empty screen. */
    expect(await page.locator("tbody tr").count()).toBeGreaterThan(1);
    await expect(page.getByText("07-FP-26-0121")).toBeVisible();
  });
});
