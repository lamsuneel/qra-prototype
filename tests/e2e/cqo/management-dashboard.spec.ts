import { expect, test } from "@playwright/test";

import { openDomain, selectProfile, switchProfile } from "../helpers/auth";

/** One panel on the dashboard — a KPI card, a chart, or a table. */
const panel = (page: import("@playwright/test").Page, heading: string) =>
  page.locator("div.rounded-lg").filter({ hasText: heading }).first();

const KPIS = [
  "Avg Cycle Time",
  "Right First Time",
  "SLA Compliance",
  "Batches Reviewed",
];

/** The six types the chart and the Recurring Issues table both name. */
const EXCEPTION_TYPES = [
  "Related Substances",
  "Standards — expired or inactive",
  "LCMS — genotoxic impurity",
  "KF — determination count",
  "Instruments — calibration gap",
  "Chemicals — inactivated entry",
];

test.describe("CQO management dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await selectProfile(page, "CQO");
  });

  test("the CQO lands on Batch Review Performance, not the QA dashboard", async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/management$/);
    await expect(
      page.getByRole("heading", { name: "Batch Review Performance" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "QA Review Dashboard" }),
    ).toHaveCount(0);
  });

  test("row 1 — all four KPI cards", async ({ page }) => {
    for (const kpi of KPIS) {
      await expect(page.getByText(kpi, { exact: true })).toBeVisible();
    }
  });

  test("cycle time reads as a fall, against a stated target", async ({ page }) => {
    const card = panel(page, "Avg Cycle Time");

    await expect(card.getByText("1.8 days")).toBeVisible();
    await expect(card.getByText("↓ 42% vs prior quarter")).toBeVisible();
    await expect(card.getByText("Target: ≤ 2 days · ✓ On target")).toBeVisible();
  });

  test("Right First Time is a percentage against a named period", async ({ page }) => {
    const card = panel(page, "Right First Time");

    await expect(card.getByText("94.2%")).toBeVisible();
    await expect(card.getByText("up from 91.4% last month")).toBeVisible();
  });

  test("row 2 — both charts are drawn", async ({ page }) => {
    await expect(page.getByText("Cycle Time Trend")).toBeVisible();
    await expect(page.getByText("Exceptions by Test Parameter")).toBeVisible();
    await expect(page.locator("svg.recharts-surface")).toHaveCount(2);
  });

  test("the cycle time chart carries the 2-day SLA reference line", async ({ page }) => {
    const chart = panel(page, "Cycle Time Trend");

    /* The line itself is an SVG group with no box of its own; its label is
       what a reader actually sees. */
    await expect(chart.locator(".recharts-reference-line")).toHaveCount(1);
    await expect(chart.getByText("2d SLA")).toBeVisible();
    await expect(chart.getByText("2.0-day SLA")).toBeVisible();
  });

  /*
   * The bars over the target are amber and the ones at or under it green, so
   * the trend can be read without consulting the reference line.
   */
  test("bars above the target are amber and below it green", async ({ page }) => {
    const chart = panel(page, "Cycle Time Trend");
    const fills = await chart
      .locator(".recharts-bar-rectangle path")
      .evaluateAll((els) => els.map((el) => el.getAttribute("fill")));

    /* Mar–Jul run above 2.0 days; August is the first month at or below it. */
    expect(fills.slice(0, 5)).toEqual(Array(5).fill("#C55A11"));
    expect(fills[5]).toBe("#375623");
  });

  test("the exceptions chart names every test parameter type", async ({ page }) => {
    const chart = panel(page, "Exceptions by Test Parameter");

    for (const type of EXCEPTION_TYPES) {
      await expect(chart.getByText(type, { exact: true })).toBeVisible();
    }
  });

  test("row 3 — recurring issues, with occurrences and shares", async ({ page }) => {
    const issues = panel(page, "Recurring Review Issues");

    await expect(issues.getByText("Recurring Review Issues — August 2026")).toBeVisible();
    await expect(issues.getByText("Occurrences")).toBeVisible();

    for (const type of EXCEPTION_TYPES) {
      await expect(issues.getByRole("cell", { name: type })).toBeVisible();
    }
    await expect(issues.getByRole("cell", { name: "35%" })).toBeVisible();
    await expect(
      issues.getByText(
        "Related Substances accounts for more than a third of all 23 review exceptions raised this month.",
      ),
    ).toBeVisible();
  });

  /* The two panels have to use identical wording, or a reader has to work out
     whether a row and a bar mean the same thing. */
  test("the chart and the table name the issues identically", async ({ page }) => {
    const chart = panel(page, "Exceptions by Test Parameter");
    const table = panel(page, "Recurring Review Issues");

    for (const type of EXCEPTION_TYPES) {
      await expect(chart.getByText(type, { exact: true })).toBeVisible();
      await expect(table.getByRole("cell", { name: type })).toBeVisible();
    }
  });

  test("row 4 — open alerts, with severity differentiated", async ({ page }) => {
    const alerts = panel(page, "Open Alerts");

    await expect(alerts.getByText("SLA Breached — IPFP")).toBeVisible();
    await expect(alerts.getByText("Approaching SLA — Raw Material")).toBeVisible();

    const breached = alerts.locator("div.border-l-4").first();
    expect(await breached.evaluate((el) => getComputedStyle(el).borderLeftColor)).toBe(
      "rgb(192, 0, 0)",
    );

    const approaching = alerts.locator("div.border-l-4").nth(1);
    expect(await approaching.evaluate((el) => getComputedStyle(el).borderLeftColor)).toBe(
      "rgb(197, 90, 17)",
    );
  });

  test("the most urgent alert is ranked first", async ({ page }) => {
    const alerts = panel(page, "Open Alerts");
    const titles = await alerts.locator("div.border-l-4").allInnerTexts();

    expect(titles[0]).toContain("SLA Breached");
  });

  /* Nothing here measures a person. The footer says so in as many words. */
  test("the footer states what cycle time measures and what is not tracked", async ({
    page,
  }) => {
    await expect(
      page.getByText(
        "Cycle time measures total process time from review opened to authorisation. Individual reviewer activity is not tracked.",
      ),
    ).toBeVisible();
  });

  test("the dashboard names no individual reviewer", async ({ page }) => {
    const text = await page.locator("main").innerText();

    for (const name of ["Arjun Mehta", "Priya Sharma", "Anil Kulkarni"]) {
      expect(text).not.toContain(name);
    }
  });

  test("the CQO can reach a batch list from the dashboard", async ({ page }) => {
    await page.getByRole("button", { name: "QRA" }).click();
    await page.waitForURL(/\/dashboard$/);

    await openDomain(page, "Finished Product");
    await expect(page).toHaveURL(/\/batches\/finished-product$/);
  });

  test("the CQO can switch to a reviewer profile", async ({ page }) => {
    await switchProfile(page);
    await selectProfile(page, "Arjun Mehta");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "QA Review Dashboard" }),
    ).toBeVisible();
  });
});
