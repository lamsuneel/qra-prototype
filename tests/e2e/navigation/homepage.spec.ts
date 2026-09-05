import { expect, test } from "@playwright/test";

import { domainCard, openDomain, searchBox, selectProfile } from "../helpers/auth";

const ACTIVE_DOMAINS = [
  "Finished Product",
  "Raw Material",
  "Packing Material",
  "In-Process Finished Product",
  "Stability",
];

const COMING_SOON = [
  "Microbiology",
  "Hold Study",
  "Semi-Finished Product",
  "Protocol for RA Submission",
];

test.describe("QA Review Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await selectProfile(page, "Arjun Mehta");
  });

  test("shows exactly five active domain cards", async ({ page }) => {
    const cards = page.locator('main button[aria-label^="Open "]');
    await expect(cards).toHaveCount(ACTIVE_DOMAINS.length);

    for (const name of ACTIVE_DOMAINS) {
      await expect(domainCard(page, name)).toHaveCount(1);
    }
  });

  for (const name of COMING_SOON) {
    /*
     * A coming-soon card is a plain div, not a disabled button — nothing about
     * it should offer itself to the pointer or the keyboard as something to
     * open, which a disabled button still does to a screen reader.
     */
    test(`${name} is marked Coming Soon and is not clickable`, async ({ page }) => {
      const card = page.locator("main div").filter({
        has: page.getByText(name, { exact: true }),
      });

      await expect(card.first()).toBeVisible();
      await expect(
        page.getByLabel(`${name} — coming soon, not yet available for review`),
      ).toBeVisible();

      await expect(domainCard(page, name)).toHaveCount(0);
    });
  }

  test("Microbiology names where its parameters are actually reviewed", async ({
    page,
  }) => {
    await expect(
      page.getByText("Parameters reviewed under FP and Stability AR numbers"),
    ).toBeVisible();
  });

  test("each active domain card shows batch count, flagged count and SLA status", async ({
    page,
  }) => {
    const cards = page.locator('main button[aria-label^="Open "]');

    for (let index = 0; index < (await cards.count()); index += 1) {
      const card = cards.nth(index);
      const text = await card.innerText();

      expect(text).toMatch(/\d+\s*\n?\s*batch(es)? to review/);
      expect(text).toMatch(/\d+ flagged/);
      expect(text).toMatch(/within SLA|approaching|SLA breached/i);
    }
  });

  test("SLA badge colours match their state", async ({ page }) => {
    const cards = page.locator('main button[aria-label^="Open "]');
    const tones = {
      green: "rgb(55, 86, 35)",
      amber: "rgb(197, 90, 17)",
      red: "rgb(192, 0, 0)",
    };

    for (let index = 0; index < (await cards.count()); index += 1) {
      const card = cards.nth(index);
      const note = card.locator("span").last();
      const label = await note.innerText();
      const colour = await note.evaluate((el) => getComputedStyle(el).color);

      if (/within SLA/i.test(label)) expect(colour).toBe(tones.green);
      else if (/approaching/i.test(label)) expect(colour).toBe(tones.amber);
      else expect(colour).toBe(tones.red);
    }
  });

  test("the navbar AR search is visible and focusable", async ({ page }) => {
    const box = searchBox(page, "nav");
    await expect(box).toBeVisible();
    await box.click();
    await expect(box).toBeFocused();
  });

  test("the page AR search is visible and focusable", async ({ page }) => {
    const box = searchBox(page, "page");
    await expect(box).toBeVisible();
    await box.click();
    await expect(box).toBeFocused();
    await expect(box).toHaveAttribute(
      "placeholder",
      /Search AR number \(e\.g\. 07-FP-26-0001\)/,
    );
  });

  test("clicking a domain card opens that review queue", async ({ page }) => {
    await openDomain(page, "Finished Product");

    await expect(page).toHaveURL(/\/batches\/finished-product$/);
    await expect(
      page.getByRole("heading", { name: "Finished Product — Review Queue" }),
    ).toBeVisible();
  });

  test("Recent Activity references only seeded batches", async ({ page }) => {
    const activity = await page
      .locator("section")
      .filter({ hasText: "Recent Activity" })
      .innerText();

    const referenced = activity.match(/07-[A-Z]+-\d{2}-\d{4}/g) ?? [];
    const seeded = [
      "07-FP-26-0122",
      "07-FP-26-0121",
      "07-FP-26-0120",
      "07-RM-26-4417",
      "07-PM-26-8823",
      "07-IPFP-26-0122",
      "07-ST-26-0089",
    ];

    for (const ar of referenced) expect(seeded).toContain(ar);
  });
});
