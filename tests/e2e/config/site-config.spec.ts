import { expect, test } from "@playwright/test";

import { selectProfile } from "../helpers/auth";

const TABLES = [
  "Product Specifications",
  "SOPs Configured",
  "STPs Configured",
  "Regulatory Standards Applied",
];

test.describe("Site Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
    await page.getByRole("button", { name: "Site Config" }).click();
    await page.waitForURL(/\/config$/);
  });

  test("the page loads at /config", async ({ page }) => {
    await expect(page).toHaveURL(/\/config$/);
    await expect(
      page.getByRole("heading", { name: "Site Configuration" }),
    ).toBeVisible();
  });

  test("it is badged Read Only", async ({ page }) => {
    await expect(page.getByText("Read Only")).toBeVisible();
  });

  /*
   * Nothing on this screen changes anything. The only control is the one that
   * expands the rules table, which is a reading action.
   */
  test("there are no edit controls anywhere", async ({ page }) => {
    await expect(page.locator("main input")).toHaveCount(0);
    await expect(page.locator("main textarea")).toHaveCount(0);
    await expect(page.locator("main select")).toHaveCount(0);
    await expect(page.locator("main form")).toHaveCount(0);

    const labels = await page.locator("main button").allInnerTexts();
    for (const label of labels) {
      expect(label).not.toMatch(/edit|save|delete|remove|add|update|new/i);
    }
  });

  for (const title of TABLES) {
    test(`the ${title} table is shown`, async ({ page }) => {
      const table = page.locator("section, div").filter({
        has: page.getByRole("heading", { name: title }),
      });

      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await expect(table.locator("tbody tr").first()).toBeVisible();
    });
  }

  test("the callout says every check traces to a named document", async ({ page }) => {
    await expect(
      page.getByText(
        "QRA is configured to this site SOPs, STPs, and product specifications. Every automated check in QRA traces back to a named document shown here. Configuration is managed by the QRA implementation team.",
      ),
    ).toBeVisible();
  });

  test("the rules table expands and collapses", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /Configured Rules — Amoxicillin/ });

    await expect(toggle).toBeVisible();
    await expect(toggle.getByText("Show")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Automated Check" })).toHaveCount(0);

    await toggle.click();
    await expect(page.getByRole("columnheader", { name: "Automated Check" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Source Document" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "What QRA Compares" }),
    ).toBeVisible();
    await expect(toggle.getByText("Hide")).toBeVisible();

    await toggle.click();
    await expect(page.getByRole("columnheader", { name: "Automated Check" })).toHaveCount(0);
  });

  test("every configured rule names the document it comes from", async ({ page }) => {
    await page.getByRole("button", { name: /Configured Rules — Amoxicillin/ }).click();

    /* Every table on this page is a section; this is the one whose first
       column is the automated check. */
    const rows = page
      .locator("section")
      .filter({ has: page.getByRole("columnheader", { name: "Automated Check" }) })
      .locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const document = await rows.nth(index).locator("td").nth(1).innerText();
      /* An SOP, an STP, a pharmacopoeial standard, or the product
         specification itself — but always a document with a name. */
      expect(document.trim()).toMatch(
        /^(SOP-|STP-|ICH |USP |[A-Z]{2,4} Specification)/,
      );
    }
  });

  test("an approver reaches the same screen with their own breadcrumb", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Switch Profile" }).click();
    await selectProfile(page, "Rajesh Kumar");
    await page.getByRole("button", { name: "Site Config" }).click();
    await page.waitForURL(/\/config$/);

    await expect(
      page.getByLabel("Breadcrumb").getByText("Authorisation Queue"),
    ).toBeVisible();
    await expect(page.getByText("Read Only")).toBeVisible();
  });
});
