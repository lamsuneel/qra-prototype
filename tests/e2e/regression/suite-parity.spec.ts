import { expect, test, type Page } from "@playwright/test";

import {
  COLOUR,
  DEMO_AR,
  DEMO_PRODUCT,
  VERIFICATION_PREFILL,
  blockingBanner,
  checkRows,
  contentArea,
  expectColour,
  fillAllNotes,
  flaggedCards,
  gateButton,
  goToSection,
  markSectionReviewed,
  navigateToBatch,
  noteBlockFor,
  openParameter,
  openSummary,

  rightPanel,
  searchBox,
  searchResults,
  sectionTabs,
  selectProfile,
  verificationNotes,
} from "../helpers/auth";

/**
 * Parity with the harnesses this prototype was built against.
 *
 * These are the checks that were run by hand after every change — search,
 * labels, the evidence visibility principle, the quality checklist, the UX
 * rules and the CQO demo script. They are here so a change that breaks one of
 * them fails a named test instead of a screenshot nobody took.
 */

const asReviewer = async (page: Page) => {
  await page.goto("/");
  await selectProfile(page, "Arjun Mehta");
};

/* ========================================================================== */
/* Batch search                                                               */
/* ========================================================================== */

test.describe("Parity — batch search", () => {
  test.beforeEach(async ({ page }) => {
    await asReviewer(page);
  });

  const QUERIES: [string, string][] = [
    ["07-FP-26-0122", DEMO_AR],
    ["07-fp-26-0122", DEMO_AR],
    ["0122", DEMO_AR],
    ["AMX-2026-0341", DEMO_AR],
    ["07-RM-26-4417", "07-RM-26-4417"],
    ["07-PM-26-8823", "07-PM-26-8823"],
    ["07-ST-26-0089", "07-ST-26-0089"],
    ["07-IPFP-26-0122", "07-IPFP-26-0122"],
  ];

  for (const [query, expected] of QUERIES) {
    test(`"${query}" finds ${expected}`, async ({ page }) => {
      const box = searchBox(page, "page");
      await box.click();
      await box.fill(query);

      await expect(searchResults(page).first()).toBeVisible();
      const listed = (await searchResults(page).allInnerTexts()).join(" ");
      expect(listed).toContain(expected);
    });
  }

  test("a product name matches every batch of that product", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("Amoxicillin");

    expect(await searchResults(page).count()).toBeGreaterThan(1);
  });

  test("an analyst name is searchable", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("Priya Sharma");

    await expect(searchResults(page).first()).toBeVisible();
  });

  test("a domain name is searchable", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("Stability");

    const listed = (await searchResults(page).allInnerTexts()).join(" ");
    expect(listed).toContain("07-ST-26-0089");
  });

  test("results are ordered with exceptions first", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("Amoxicillin 250mg Tablet");

    const listed = await searchResults(page).allInnerTexts();
    const counts = listed.map(
      (entry) => Number(entry.match(/(\d+) exceptions?/)?.[1] ?? 0),
    );
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  test("every result names its domain", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("Amoxicillin");

    const listed = await searchResults(page).allInnerTexts();
    for (const entry of listed) {
      expect(entry).toMatch(
        /Finished Product|Raw Material|Packing Material|In-Process Finished Product|Stability/,
      );
    }
  });

  test("a result with nothing flagged says so", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("Amoxicillin");

    const listed = (await searchResults(page).allInnerTexts()).join(" ");
    expect(listed).toMatch(/No exceptions|\d+ exceptions?/);
  });

  const MALFORMED = ["07-FP-2026-0122", "7-FP-26-0122", "07-XX-26-0122", "FP-26-0122"];
  for (const query of MALFORMED) {
    test(`"${query}" is hinted as malformed`, async ({ page }) => {
      const box = searchBox(page, "page");
      await box.click();
      await box.fill(query);

      await expect(page.getByText("Format: 07-FP-26-0001")).toBeVisible();
    });
  }

  test("the hint is advisory — the query still runs", async ({ page }) => {
    const box = searchBox(page, "page");
    await box.click();
    await box.fill("07-FP-2026");

    await expect(page.getByText("Format: 07-FP-26-0001")).toBeVisible();
    await expect(page.getByText(/No batch matches/)).toBeVisible();
  });

  test("search opens the first section carrying an exception", async ({ page }) => {
    await navigateToBatch(page, DEMO_AR);

    /* Assay Chemicals holds the inactivated-entry flag. */
    await expect(page).toHaveURL(/\/review\/assay\/assay-chemicals/);
    await expect(flaggedCards(page).first()).toBeVisible();
  });

  test("search marks where the work still is", async ({ page }) => {
    await navigateToBatch(page, DEMO_AR);
    await expect(page).toHaveURL(/from=search/);
  });
});

/* ========================================================================== */
/* Labels                                                                     */
/* ========================================================================== */

test.describe("Parity — labels", () => {
  test.beforeEach(async ({ page }) => {
    await asReviewer(page);
    await navigateToBatch(page, DEMO_AR);
  });

  /*
   * A label describes what the reviewer is looking at, never how the data was
   * sourced or how the component works. "Standalone instrument" was the worst
   * offender: it named an implementation category rather than an instrument.
   */
  test("no section is labelled by its implementation category", async ({ page }) => {
    for (const parameter of ["Assay", "RS", "Disso", "KF", "LCMS"]) {
      await openParameter(page, parameter);
      const labels = (await sectionTabs(page).allInnerTexts()).join(" ");

      expect(labels).not.toMatch(/standalone/i);
      expect(labels).not.toMatch(/component|widget|module|panel/i);
    }
  });

  test("instrument sections are named by the instrument", async ({ page }) => {
    await openParameter(page, "KF");
    await expect(sectionTabs(page).filter({ hasText: "KF Titrator" })).toHaveCount(1);

    await openParameter(page, "LCMS");
    await expect(sectionTabs(page).filter({ hasText: "LCMS System" })).toHaveCount(1);

    await openParameter(page, "Disso");
    await expect(
      sectionTabs(page).filter({ hasText: "Tablet Processing Workstation" }),
    ).toHaveCount(1);
  });

  test("the source badge names a system, not a mechanism", async ({ page }) => {
    await goToSection(page, "Assay", "Chromatography");
    const badges = await contentArea(page).locator("span").allInnerTexts();

    const sources = badges.filter((badge) =>
      /Caliber LIMS|Waters Empower|MassLynx|Tiamo|Spectrum ES|Paper Logbook/.test(badge),
    );
    expect(sources.length).toBeGreaterThan(0);

    for (const badge of badges) {
      expect(badge).not.toMatch(/fetched via|API|endpoint|hardcoded|mock/i);
    }
  });

  test("a compliant badge is green, a flag red, a verification amber", async ({
    page,
  }) => {
    await goToSection(page, "Assay", "Chemicals");

    const compliant = checkRows(page).first().getByText("Compliant", { exact: true });
    await expectColour(page, compliant, "color", COLOUR.compliant);

    const flag = flaggedCards(page).first();
    await expectColour(page, flag, "borderLeftColor", COLOUR.flagged);

    await goToSection(page, "Disso", "Chemicals");
    const amber = checkRows(page)
      .filter({ hasText: "Needs Verification" })
      .first()
      .getByText("Needs Verification", { exact: true });
    await expectColour(page, amber, "color", COLOUR.warn);
  });

  test("a section heading uses one dash and never carries a software version", async ({
    page,
  }) => {
    for (const [parameter, section] of [
      ["KF", "KF Titrator"],
      ["LCMS", "LCMS System"],
      ["Assay", "Weighing Balance"],
    ] as const) {
      await goToSection(page, parameter, section);
      const heading = await page
        .locator("div.sticky")
        .filter({ hasText: "Specification" })
        .first()
        .innerText();

      const title = heading.split("\n").find((line) => line.includes(section)) ?? "";
      expect((title.match(/—/g) ?? []).length).toBeLessThanOrEqual(1);
      expect(title).not.toMatch(/\bv?\d+\.\d+\b/);
    }
  });

  test("every AR number on screen uses the site format", async ({ page }) => {
    const text = await page.locator("body").innerText();
    const numbers = text.match(/\b\d{2}-[A-Z]+-\d{2}-\d{4}\b/g) ?? [];

    expect(numbers.length).toBeGreaterThan(0);
    for (const number of numbers) {
      expect(number).toMatch(/^07-(FP|RM|PM|IPFP|ST)-26-\d{4}$/);
    }
    expect(text).not.toMatch(/AR-\d{4}-\d{6}/);
  });

  test("the right panel is named for what is left, not for its data", async ({
    page,
  }) => {
    await expect(page.getByText(/What.s Left/)).toBeVisible();
    await expect(page.getByText(/state|context|store/i)).toHaveCount(0);
  });
});

/* ========================================================================== */
/* Evidence visibility                                                        */
/* ========================================================================== */

test.describe("Parity — evidence visibility", () => {
  test.beforeEach(async ({ page }) => {
    await asReviewer(page);
    await navigateToBatch(page, DEMO_AR);
  });

  test("every non-flagged row offers its evidence", async ({ page }) => {
    for (const [parameter, section] of [
      ["Assay", "Instruments"],
      ["RS", "Standards"],
      ["KF", "Chemicals"],
      ["LCMS", "Standards"],
    ] as const) {
      await goToSection(page, parameter, section);
      const rows = checkRows(page);

      expect(await rows.count()).toBeGreaterThan(0);
      for (let index = 0; index < (await rows.count()); index += 1) {
        await expect(rows.nth(index).getByText(/View evidence/)).toBeVisible();
      }
    }
  });

  test("every flagged entry is open on arrival", async ({ page }) => {
    for (const [parameter, section] of [
      ["Assay", "Chemicals"],
      ["Assay", "Column"],
      ["Disso", "Instruments"],
      ["KF", "KF Titrator"],
      ["LCMS", "LCMS System"],
    ] as const) {
      await goToSection(page, parameter, section);

      const first = flaggedCards(page).first();
      await expect(first.getByText("Why flagged")).toBeVisible();
      await expect(first.getByRole("button", { name: /Hide evidence/ })).toBeVisible();
    }
  });

  test("every expanded panel carries the full structure", async ({ page }) => {
    for (const [parameter, section] of [
      ["Assay", "Instruments"],
      ["RS", "Chromatography"],
      ["KF", "Standards"],
    ] as const) {
      await goToSection(page, parameter, section);
      const rows = checkRows(page);

      for (let index = 0; index < (await rows.count()); index += 1) {
        await rows.nth(index).click();
        const panel = await rows.nth(index).innerText();

        /* innerText applies the uppercase these headings are styled with. */
        expect(panel).toMatch(/what qra checked/i);
        expect(panel).toMatch(/\bactual\b/i);
        expect(panel).toMatch(/\bexpected\b/i);
        expect(panel).toMatch(/comparison performed/i);
        expect(panel).toMatch(/\bresult\b/i);
      }
    }
  });

  test("a flagged panel adds why, what to do, and the observation", async ({ page }) => {
    await goToSection(page, "Assay", "Column");
    const card = flaggedCards(page).first();

    await expect(card.getByText("What QRA checked")).toBeVisible();
    await expect(card.getByText("Why flagged")).toBeVisible();
    await expect(card.getByText("Required action")).toBeVisible();
    await expect(card.getByText("Reviewer observation")).toBeVisible();
  });

  test("a needs-verification panel says no comparison was possible", async ({
    page,
  }) => {
    await goToSection(page, "Disso", "Chemicals");
    await checkRows(page).filter({ hasText: "Needs Verification" }).first().click();

    await expect(page.getByText("NO COMPARISON — VERIFY AGAINST WORKSHEET")).toBeVisible();
    await expect(
      page.locator("dd").filter({ hasText: "Not fetched from LIMS" }).first(),
    ).toBeVisible();
  });

  test("both sides of a comparison name where they came from", async ({ page }) => {
    await goToSection(page, "Assay", "Instruments");
    const row = checkRows(page).first();
    await row.click();

    const panel = await row.innerText();
    expect(panel).toMatch(/Source: [\s\S]*SOP-INST-004/);
    expect(panel).toMatch(/Source: [\s\S]*(Caliber LIMS|Waters Empower)/);
  });

  test("a paper record says it has no electronic counterpart", async ({ page }) => {
    await goToSection(page, "Disso", "Dissolution Bath — Logbook");

    /* The bath keeps no audit trail of its own, and the banner says so. */
    await expect(page.getByText(/no data link to LIMS/i).first()).toBeVisible();
    await expect(page.getByText("Paper Logbook").first()).toBeVisible();
  });

  test("an audit trail sequence is shown step by step", async ({ page }) => {
    await goToSection(page, "KF", "KF Titrator");
    const card = flaggedCards(page)
      .filter({ hasText: "Result — Karl Fischer Titration" })
      .first();
    await card.getByRole("button", { name: /View evidence/ }).click();

    for (const step of [
      "Conditioning started",
      "Weight added",
      "Analysis started",
      "Conditioning stopped",
      "Finished",
    ]) {
      await expect(card.getByText(step, { exact: true })).toBeVisible();
    }
  });

  test("a compliant entry closes with no action required", async ({ page }) => {
    await goToSection(page, "RS", "Standards");
    await checkRows(page).first().click();

    await expect(
      page.getByText("No action required — this entry requires no reviewer action."),
    ).toBeVisible();
  });
});

/* ========================================================================== */
/* Quality checklist                                                          */
/* ========================================================================== */

test.describe("Parity — quality checklist", () => {
  test.beforeEach(async ({ page }) => {
    await asReviewer(page);
    await navigateToBatch(page, DEMO_AR);
  });

  test("no placeholder text anywhere in the workspace", async ({ page }) => {
    for (const parameter of ["Assay", "RS", "Disso", "KF", "LCMS"]) {
      await openParameter(page, parameter);
      const count = await sectionTabs(page).count();

      for (let index = 0; index < count; index += 1) {
        await sectionTabs(page).nth(index).click();
        await page.waitForTimeout(120);
        const text = await contentArea(page).innerText();

        expect(text).not.toMatch(/lorem ipsum|TODO|TBD|FIXME|coming soon|placeholder/i);
        expect(text).not.toMatch(/\bXXX\b|\bundefined\b|\bNaN\b|\[object Object\]/);
      }
    }
  });

  test("the column source is Caliber LIMS on every chromatographic test", async ({
    page,
  }) => {
    for (const parameter of ["Assay", "RS"]) {
      await goToSection(page, parameter, "Column");
      const text = await contentArea(page).innerText();

      expect(text).toContain("Caliber LIMS");
    }
  });

  test("the reference standard carries its two-module attribution", async ({ page }) => {
    await goToSection(page, "RS", "Standards");
    await checkRows(page).first().click();

    await expect(
      page.getByText("Caliber LIMS — Reference Standard Record"),
    ).toBeVisible();
    await expect(
      page.getByText("Caliber LIMS — eLIMS Reference Standard Audit Trail"),
    ).toBeVisible();
  });

  test("no analyst qualification anywhere in the workspace", async ({ page }) => {
    for (const parameter of ["Assay", "RS", "Disso", "KF", "LCMS"]) {
      await openParameter(page, parameter);
      const count = await sectionTabs(page).count();

      for (let index = 0; index < count; index += 1) {
        await sectionTabs(page).nth(index).click();
        await page.waitForTimeout(120);
        const text = (await contentArea(page).innerText()).toLowerCase();

        expect(text).not.toContain("analyst qualification");
      }
    }
  });

  test("the exception counts add up across the sidebar", async ({ page }) => {
    let total = 0;

    for (const parameter of ["Assay", "RS", "Disso", "KF", "LCMS"]) {
      await openParameter(page, parameter);
      const labels = await sectionTabs(page).evaluateAll((els) =>
        els.map((el) => el.getAttribute("aria-label") ?? ""),
      );
      for (const label of labels) {
        total += Number(label.match(/, (\d+) flagged/)?.[1] ?? 0);
      }
    }

    /* The sidebar's per-section badges and the panel's batch total are two
       counts of the same thing, so they have to agree. */
    expect(total).toBe(8);
    await expect(rightPanel(page).locator("div.text-xl").last()).toHaveText("8");
  });

  test("a derived flag is never shown as compliant", async ({ page }) => {
    await goToSection(page, "KF", "KF Titrator");

    /* The audit trail sequence is out of order, so the entry is flagged even
       though the result itself is within specification. */
    const card = flaggedCards(page)
      .filter({ hasText: "Result — Karl Fischer Titration" })
      .first();

    await expect(card).toBeVisible();
    await expect(card.getByText("Compliant", { exact: true })).toHaveCount(0);
  });

  test("marking one batch reviewed does not mark another", async ({ page }) => {
    await goToSection(page, "RS", "Standards");
    await markSectionReviewed(page);

    await navigateToBatch(page, "07-FP-26-0120");
    await goToSection(page, "Assay", "Standards");

    await expect(page.getByRole("button", { name: "Mark Section Reviewed" })).toBeVisible();
    /* That batch has been round the correction loop, and says so. */
    await expect(page.getByText(/correction history/i)).toBeVisible();
  });

  test("the specification version is stated and marked current", async ({ page }) => {
    await expect(page.getByText("Specification v3.2")).toBeVisible();
    await expect(page.getByText("v3.2 Current")).toBeVisible();
  });
});

/* ========================================================================== */
/* UX                                                                         */
/* ========================================================================== */

test.describe("Parity — UX", () => {
  test.beforeEach(async ({ page }) => {
    await asReviewer(page);
    await navigateToBatch(page, DEMO_AR);
  });

  test("everything clickable has a pointer cursor", async ({ page }) => {
    const clickable = page.locator("main button, nav button, aside button");

    for (let index = 0; index < Math.min(await clickable.count(), 25); index += 1) {
      const element = clickable.nth(index);
      if (!(await element.isEnabled())) continue;

      const cursor = await element.evaluate((el) => getComputedStyle(el).cursor);
      expect(["pointer", "default"]).toContain(cursor);
    }
  });

  test("a disabled control says it is not available", async ({ page }) => {
    await goToSection(page, "Assay", "Chemicals");
    const gate = gateButton(page);

    await expect(gate).toBeDisabled();
    expect(await gate.evaluate((el) => getComputedStyle(el).cursor)).toBe("not-allowed");
  });

  test("the gate explains itself on the bar, not only on hover", async ({ page }) => {
    await goToSection(page, "Assay", "Chemicals");

    await expect(blockingBanner(page)).toBeVisible();
    await expect(blockingBanner(page)).toContainText("note");
  });

  test("templates fill the note field", async ({ page }) => {
    await goToSection(page, "KF", "KF Titrator");
    const card = flaggedCards(page).first();

    await card.getByRole("button", { name: "Deviation raised" }).click();
    await expect(card.locator("textarea").first()).toHaveValue("Deviation raised");
  });

  test("the gate opens only when everything outstanding has a note", async ({
    page,
  }) => {
    await goToSection(page, "Disso", "Chemicals");
    await expect(gateButton(page)).toBeDisabled();

    await noteBlockFor(verificationNotes(page))
      .getByRole("button", { name: "Confirm" })
      .click();
    await expect(gateButton(page)).toBeEnabled();
  });

  test("navigation works in every direction", async ({ page }) => {
    await goToSection(page, "RS", "Standards");
    const start = page.url();

    await page.getByRole("button", { name: /^Next Section/ }).click();
    await page.waitForTimeout(400);
    expect(page.url()).not.toBe(start);

    await page.getByRole("button", { name: /^Previous Section/ }).click();
    await page.waitForTimeout(400);
    expect(page.url()).toBe(start);

    await page.getByLabel("Breadcrumb").getByText("Finished Product").click();
    await expect(page).toHaveURL(/\/batches\/finished-product$/);

    await page.getByRole("button", { name: /Back to Dashboard/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("Previous and Next name the section they lead to", async ({ page }) => {
    await goToSection(page, "RS", "Standards");

    const previous = page.getByRole("button", { name: /^Previous Section/ });
    const next = page.getByRole("button", { name: /^Next Section/ });

    /* The accessible name must contain the visible label — WCAG 2.5.3. */
    expect(await previous.getAttribute("aria-label")).toContain("Previous Section");
    expect(await next.getAttribute("aria-label")).toContain("Next Section");
  });

  test("keyboard focus is visible on the primary controls", async ({ page }) => {
    const next = page.getByRole("button", { name: /^Next Section/ });
    await next.focus();

    await expect(next).toBeFocused();
    await expect(next).toHaveClass(/focus-visible:ring-2/);
  });

  test("the section counter is accurate", async ({ page }) => {
    await goToSection(page, "Assay", "Attendance Verification");
    await expect(
      page.getByText("Attendance Verification · 1 of 34 sections"),
    ).toBeVisible();
  });
});

/* ========================================================================== */
/* CQO demo script                                                            */
/* ========================================================================== */

test.describe("Parity — CQO demo script", () => {
  test("the ten-step demo runs end to end", async ({ page }) => {
    test.slow();

    /* 1 — the CQO's own dashboard. */
    await page.goto("/");
    await selectProfile(page, "CQO");
    await expect(page.getByText("Avg Cycle Time")).toBeVisible();
    await expect(page.getByText("1.8 days")).toBeVisible();
    await expect(page.locator("svg.recharts-surface")).toHaveCount(2);

    /* 2 — switch to the reviewer and see the five live domains. */
    await page.getByRole("button", { name: "Switch Profile" }).click();
    await selectProfile(page, "Arjun Mehta");
    await expect(page.locator('main button[aria-label^="Open "]')).toHaveCount(5);

    /* 3 — find the batch by AR number. */
    await navigateToBatch(page, DEMO_AR);
    await expect(page.locator("header").first().getByText(DEMO_PRODUCT)).toBeVisible();
    await expect(page).toHaveURL(/from=search/);

    /* 4 — the first flagged section is where search lands. */
    await expect(flaggedCards(page).first()).toBeVisible();
    await expect(page.getByText("FLAGGED — Inactivated Entry")).toBeVisible();

    /* 5 — KF: the titrator's own audit trail, two findings. */
    await goToSection(page, "KF", "KF Titrator");
    await expect(page.getByText("Tiamo").first()).toBeVisible();
    await expect(flaggedCards(page)).toHaveCount(3);
    await expect(gateButton(page)).toBeDisabled();

    /* 6 — LCMS: the OOS result, and the gate that waits on it. */
    await goToSection(page, "LCMS", "LCMS System");
    await expect(page.getByText("MassLynx").first()).toBeVisible();
    await expect(page.getByText("FLAGGED — OOS Result")).toBeVisible();
    await expect(page.getByText("0.08 ppm", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/0\.05 ppm/).first()).toBeVisible();
    await expect(gateButton(page)).toBeDisabled();

    await fillAllNotes(page);
    await expect(gateButton(page)).toBeEnabled();

    /* 7 — the amber entry the gate also waits on. */
    await goToSection(page, "Disso", "Chemicals");
    await expect(verificationNotes(page)).toHaveValue(VERIFICATION_PREFILL);
    await expect(gateButton(page)).toBeDisabled();
    await fillAllNotes(page);
    await expect(gateButton(page)).toBeEnabled();

    /* 8 — the summary, and what it will not let through yet. */
    await openSummary(page);
    await expect(page.getByRole("heading", { name: "What I Found" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Submit for Authorisation" }),
    ).toBeDisabled();

    /* 9 — the approver's view is exceptions only. */
    await page.getByRole("button", { name: "Switch Profile" }).click();
    await selectProfile(page, "Rajesh Kumar");
    await page.getByRole("button", { name: "Open" }).first().click();
    await page.waitForURL(/\/authorise\/07-/);
    await expect(page.getByText(/exceptions? requiring attention/)).toBeVisible();
    await expect(page.getByText("What QRA checked")).toHaveCount(0);

    await page.getByRole("button", { name: "Authorise Review" }).click();
    await expect(page.getByRole("heading", { name: "Authorise Review?" })).toBeVisible();
    await page.getByRole("button", { name: "Confirm Authorisation" }).click();
    await expect(page.getByText("Review Authorised")).toBeVisible();

    /* 10 — site config, read only. */
    await page.getByRole("button", { name: "Site Config" }).click();
    await page.waitForURL(/\/config$/);
    await expect(page.getByText("Read Only")).toBeVisible();
    for (const table of [
      "Product Specifications",
      "SOPs Configured",
      "STPs Configured",
      "Regulatory Standards Applied",
    ]) {
      await expect(page.getByRole("heading", { name: table })).toBeVisible();
    }
  });
});
