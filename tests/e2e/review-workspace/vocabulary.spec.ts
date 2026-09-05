import { expect, test, type Page } from "@playwright/test";

import {
  gateButton,
  navigateToBatch,
  openParameter,
  sectionTabs,
  selectProfile,
} from "../helpers/auth";

/**
 * QRA never states a disposition. It reports what it compared and what it
 * found; whether the batch is released is the reviewer's decision and the
 * approver's signature, made in the site's own systems.
 *
 * The one place the site's own vocabulary is allowed through is the LIMS
 * inactivation workflow — "Inactivation Approved (×2)" describes that record, not
 * the outcome of a review — so those phrases are cut out before the sweep.
 */

const PERMITTED = [
  /Inactivation:?\s*(Approved \(×2\)|Approved|Initiated — Pending Approval|Initiated)/gi,
  /Pending Second Approval/gi,
  /Inactivation status\s*(Approved|Initiated|Pending Second Approval)/gi,
  /Inactivation approval date\s*[^\n]*/gi,
  /Reason for inactivation[^\n]*/gi,
  /Both approvals required per[^\n]*/gi,
  /(Approved|Initiated) by\s*[^\n]*/gi,
  /second QC Section In-Charge approval[^\n]*/gi,
  /approvals? (required|recorded)[^\n]*/gi,
  /Pending Approval/gi,
  /\bPending\b/gi,
  /* The site's own rule identifiers for acceptability entries, and the
     state they name. Not disposition language: PASS-TIA-01 is what the
     SOP calls that rule, and renaming it here would break the trace back
     to the document. */
  /PASS-TIA-\d{2}/g,
  /conditional pass conditions/gi,
];

const scrub = (text: string): string =>
  PERMITTED.reduce((carry, pattern) => carry.replace(pattern, " "), text);

/**
 * Every section of the demo batch, with every entry opened.
 *
 * The expanding is done inside the page rather than through the driver: one
 * round trip per section instead of three per entry, which is the difference
 * between a sweep that finishes and one that does not.
 */
async function sweepWorkspace(page: Page): Promise<string> {
  const collected: string[] = [];

  for (const parameter of ["Assay", "RS", "Disso", "KF", "LCMS"]) {
    await openParameter(page, parameter);
    const sections = await sectionTabs(page).count();

    for (let index = 0; index < sections; index += 1) {
      await sectionTabs(page).nth(index).click();
      await expect(gateButton(page)).toBeVisible();

      collected.push(
        ...(await page.evaluate(async () => {
          const settle = () => new Promise((done) => window.setTimeout(done, 60));
          const read = () =>
            (document.querySelector("main") ?? document.body).innerText;

          const texts: string[] = [read()];

          /* Compliant and needs-verification entries, one at a time. */
          const rows = Array.from(
            document.querySelectorAll<HTMLElement>('[role="button"][aria-expanded]'),
          );
          for (const row of rows) {
            row.click();
            await settle();
            texts.push(read());
          }

          /* Flagged cards, reopened where opening a row closed them. */
          const cards = Array.from(
            document.querySelectorAll<HTMLElement>("div.border-l-flagged-text"),
          );
          for (const card of cards) {
            const reopen = Array.from(card.querySelectorAll<HTMLElement>("button")).find(
              (button) => /View evidence/.test(button.textContent ?? ""),
            );
            if (reopen) {
              reopen.click();
              await settle();
            }
            texts.push(read());
          }

          return texts;
        })),
      );
    }
  }

  return collected.join("\n");
}

test.describe.configure({ mode: "serial" });

test.describe("Vocabulary across the review workspace", () => {
  let corpus = "";
  let scrubbed = "";

  /* Twenty-four sections, every entry opened — this is a slow read. */
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(600_000);
    const page = await browser.newPage();
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
    await navigateToBatch(page, "07-FP-26-0122");

    corpus = await sweepWorkspace(page);
    scrubbed = scrub(corpus);
    await page.close();
  });

  test("the sweep actually covered the workspace", () => {
    expect(corpus.length).toBeGreaterThan(50_000);
    expect(corpus).toMatch(/what qra checked/i);
    expect(corpus).toMatch(/karl fischer/i);
    expect(corpus).toMatch(/genotoxic impurity/i);
    expect(corpus).toMatch(/tablet processing workstation/i);
  });

  /* ---- banned ----------------------------------------------------------- */

  test('"Approved" appears only in the LIMS inactivation record', () => {
    expect(corpus).toMatch(/Inactivation Approved \(×2\)/);
    expect(scrubbed).not.toMatch(/\bapproved\b/i);
  });

  test('"Approve" is not a button label or a status', () => {
    expect(scrubbed).not.toMatch(/\bapprove\b/i);
  });

  test('"Released" is not used as a status', () => {
    expect(scrubbed).not.toMatch(/\breleased\b/i);
  });

  test('"Pass" is not used as a standalone status word', () => {
    expect(scrubbed).not.toMatch(/\bpass\b/i);
  });

  test('"Passed" does not appear', () => {
    expect(scrubbed).not.toMatch(/\bpassed\b/i);
  });

  test('"Pending" appears only against an inactivation approval', () => {
    expect(scrubbed).not.toMatch(/\bpending\b/i);
  });

  test('"Recommend" does not appear', () => {
    expect(scrubbed).not.toMatch(/\brecommend(s|ed|ation)?\b/i);
  });

  test('"Suggests release" does not appear', () => {
    expect(scrubbed).not.toMatch(/suggests?\s+release/i);
    expect(scrubbed).not.toMatch(/\bfit for release\b/i);
  });

  test("no banned name appears anywhere", () => {
    expect(corpus).not.toMatch(/Aurobindo|Shrikrishna|Satyajit/i);
  });

  /* ---- required --------------------------------------------------------- */

  test('"Compliant" is the word used for a passing entry', () => {
    expect(corpus).toMatch(/\bcompliant\b/i);
  });

  test('"Flagged" is the word used for a failing entry', () => {
    expect(corpus).toMatch(/FLAGGED — /);
    expect(corpus).toMatch(/FLAGGED — Action Required|FLAGGED — OOS Result/);
  });

  test('"Needs Verification" is the word used for an amber entry', () => {
    expect(corpus).toMatch(/\bneeds verification\b/i);
    expect(corpus).toMatch(/verify against worksheet/i);
  });

  test('"Reviewed" is the word used for section completion', () => {
    expect(corpus).toMatch(/\bmark section reviewed\b/i);
  });

  test('"Authorise Review" is the approver\'s action, never "Approve"', async ({
    page,
  }) => {
    await page.goto("/");
    await selectProfile(page, "Rajesh Kumar");

    await expect(
      page.getByRole("heading", { name: "Reviews Awaiting Authorisation" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Open" }).first().click();
    await page.waitForURL(/\/authorise\/07-/);

    await expect(page.getByRole("button", { name: "Authorise Review" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Approve$/ })).toHaveCount(0);

    const text = scrub(await page.locator("body").innerText());
    expect(text).not.toMatch(/\bapprove(d)?\b/i);
  });

  test('"Review Authorised" is the final sign-off status', async ({ page }) => {
    await page.goto("/");
    await selectProfile(page, "Rajesh Kumar");

    await page.getByRole("button", { name: "Open" }).first().click();
    await page.waitForURL(/\/authorise\/07-/);

    await page.getByRole("button", { name: "Authorise Review" }).click();
    await page.getByRole("button", { name: "Confirm Authorisation" }).click();

    await expect(page.getByText("Review Authorised")).toBeVisible();
  });
});
