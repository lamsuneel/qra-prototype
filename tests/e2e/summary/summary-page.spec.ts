import { expect, test } from "@playwright/test";

import {
  DEMO_AR,
  DEMO_PRODUCT,
  completeReview,
  fillAllNotes,
  gateButton,
  goToSection,
  markSectionReviewed,
  openDemoBatch,
  openSummary,
} from "../helpers/auth";

test.describe("Review Summary", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await openDemoBatch(page);
    /* Begin the review — one section carried through end to end. */
    await goToSection(page, "Assay", "Chemicals");
    await fillAllNotes(page);
    await markSectionReviewed(page);
  });

  test("the summary is reachable once a review has begun", async ({ page }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    await expect(page).toHaveURL(new RegExp(`/batches/${DEMO_AR}/summary$`));
    await expect(page.getByRole("heading", { name: "Review Summary" })).toBeVisible();
  });

  test("it is built from three sections", async ({ page }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    await expect(page.getByRole("heading", { name: "What I Reviewed" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What I Found" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What Happens Next" })).toBeVisible();
  });

  test("What I Reviewed names the batch, the specification and the sources", async ({
    page,
  }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    const section = page.locator("section").filter({ hasText: "What I Reviewed" });
    await expect(section).toContainText(DEMO_AR);
    await expect(section).toContainText(DEMO_PRODUCT);
    await expect(section).toContainText("5 parameters · 34 sections");
    await expect(section).toContainText("v3.2");
    await expect(section).toContainText("Data sources:");
  });

  test("the Evidence Record ID is shown", async ({ page }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    await expect(page.getByText("Evidence Record ID")).toBeVisible();
    await expect(page.getByText("QRA-07260122-001")).toBeVisible();
    await expect(page.getByText("Audit Retrievability")).toBeVisible();
  });

  test("both actions are offered, and Export waits on authorisation", async ({
    page,
  }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    await expect(
      page.getByRole("button", { name: "Submit for Authorisation" }),
    ).toBeVisible();

    const exportButton = page.getByRole("button", { name: "Export Review Record" });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeDisabled();
    await expect(exportButton).toHaveAttribute(
      "title",
      "Available once the review is authorised",
    );
  });

  test("What I Found matches the exception count in the workspace", async ({ page }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    const found = page.locator("section").filter({ hasText: "What I Found" });
    await expect(found.getByText("8 exceptions")).toBeVisible();

    /* Each one is listed with the section it came from. */
    await expect(found.getByText(/^Exception 1 —/)).toBeVisible();
    await expect(found.getByText(/^Exception 8 —/)).toBeVisible();
  });

  test("an exception carries the note the reviewer wrote", async ({ page }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    const found = page.locator("section").filter({ hasText: "What I Found" });
    await expect(found.getByText(/Reviewed — found satisfactory/)).toBeVisible();
    await expect(found.getByText("No reviewer note recorded yet.").first()).toBeVisible();
  });

  test("Submit stays shut while sections remain unreviewed", async ({ page }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    await expect(
      page.getByRole("button", { name: "Submit for Authorisation" }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        "Every section must be marked as reviewed before the review can be submitted.",
      ),
    ).toBeVisible();
    await expect(page.getByText(/1 \/ 34 sections reviewed/)).toBeVisible();
  });

  test("Submit opens once every section is reviewed", async ({ page }) => {
    /* completeReview walks 34 sections — extended timeout required. */
    test.setTimeout(900_000);
    await completeReview(page);

    await expect(page.getByText(/34 \/ 34 sections reviewed/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Submit for Authorisation" }),
    ).toBeEnabled();
  });

  test("Back to Review returns to the workspace", async ({ page }) => {
    await goToSection(page, "LCMS", "LCMS System");
    await openSummary(page);

    await page.getByRole("button", { name: /Back to Review/ }).click();
    await page.waitForURL(/\/review\//);
    await expect(gateButton(page)).toBeVisible();
  });
});
