import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared moves for the QRA suite.
 *
 * QRA keeps every piece of state in React memory — no cookies, no storage, no
 * backend. A full page load therefore drops the profile and bounces back to
 * the selector, so nothing here navigates by URL after signing in: every step
 * goes through the app the way a reviewer would.
 */

export const DEMO_AR = "07-FP-26-0122";
export const DEMO_PRODUCT = "Amoxicillin 250mg Tablet";

export const RM_AR = "07-RM-26-4417";
export const PM_AR = "07-PM-26-8823";
export const ST_AR = "07-ST-26-0089";
export const IPFP_AR = "07-IPFP-26-0122";

/** The Tailwind utility that carries each state's colour. */
export const COLOUR = {
  compliant: "compliant-text",
  flagged: "flagged-text",
  warn: "warn-text",
} as const;

/**
 * Assert that an element's colour is the one a named state uses.
 *
 * Compared against a probe carrying the same Tailwind utility rather than
 * against a literal: v4 emits some theme colours as oklab and others as rgb,
 * so the only stable reference is what that utility itself computes to on
 * this page.
 */
export async function expectColour(
  page: Page,
  locator: Locator,
  property: "borderLeftColor" | "color" | "backgroundColor",
  state: (typeof COLOUR)[keyof typeof COLOUR],
) {
  const prefix = property === "borderLeftColor" ? "border-l" : "text";
  const expected = await page.evaluate(
    ([className, key]) => {
      const probe = document.createElement("div");
      probe.className = `${className} border-l-4 border-solid`;
      probe.style.position = "absolute";
      probe.style.opacity = "0";
      document.body.appendChild(probe);
      const value = getComputedStyle(probe)[key as "color"];
      probe.remove();
      return value;
    },
    [`${prefix}-${state}`, property] as const,
  );

  /*
   * Polled rather than read once: these rows animate their colour, and a
   * sample taken mid-transition comes back as the interpolated oklab rather
   * than the value the row settles on.
   */
  await expect.poll(() => colourOf(locator, property)).toBe(expected);
}

/** One computed colour, verbatim — for backgrounds written as a literal hex. */
export async function colourOf(
  locator: Locator,
  property: "borderLeftColor" | "backgroundColor" | "color",
): Promise<string> {
  return locator.evaluate(
    (el, key) => getComputedStyle(el)[key as "color"],
    property,
  );
}

export type ProfileName = "Arjun Mehta" | "Priya Sharma" | "Rajesh Kumar" | "CQO";

/** Where each role lands after signing in. */
const LANDING: Record<ProfileName, RegExp> = {
  "Arjun Mehta": /\/dashboard$/,
  "Priya Sharma": /\/dashboard$/,
  "Rajesh Kumar": /\/authorise$/,
  CQO: /\/management$/,
};

/* -------------------------------------------------------------------------- */
/* Signing in                                                                 */
/* -------------------------------------------------------------------------- */

export async function selectProfile(page: Page, profileName: ProfileName) {
  if (!/\/$|localhost:3100\/?$/.test(page.url())) {
    await page.goto("/");
  }
  await expect(profileCard(page, profileName)).toBeVisible();
  await profileCard(page, profileName).click();
  await page.waitForURL(LANDING[profileName]);
  await page.waitForLoadState("networkidle");
}

export function profileCard(page: Page, profileName: ProfileName): Locator {
  return page.getByRole("button", {
    name: new RegExp(`^Select profile: ${profileName},`),
  });
}

export async function switchProfile(page: Page) {
  await page.getByRole("button", { name: "Switch Profile" }).click();
  await page.waitForURL(/localhost:3100\/$/);
}

/* -------------------------------------------------------------------------- */
/* Getting to a batch                                                         */
/* -------------------------------------------------------------------------- */

/** The search box on the page body, or the one in the navbar. */
export function searchBox(page: Page, where: "page" | "nav" = "page"): Locator {
  const boxes = page.getByRole("combobox", {
    name: "Search batches by AR number, product or batch number",
  });
  /* The navbar's is rendered first in the DOM on every screen that has both. */
  return where === "nav" ? boxes.first() : boxes.last();
}

export function searchResults(page: Page): Locator {
  return page.getByRole("option");
}

/**
 * Search for a batch and open it. Lands on the first section carrying an
 * exception, which is where the app deliberately sends a reviewer.
 */
export async function navigateToBatch(
  page: Page,
  arNumber: string,
  where: "page" | "nav" = "page",
) {
  const box = searchBox(page, where);
  await box.click();
  await box.fill(arNumber);
  await expect(searchResults(page).first()).toBeVisible();
  await box.press("Enter");
  await page.waitForURL(/\/review\//);
  await expect(gateButton(page)).toBeVisible();
}

/**
 * One domain card on the dashboard, by name.
 *
 * Addressed through its accessible name because "Finished Product" is a
 * substring of "In-Process Finished Product" — matching on the text inside
 * the card would find both.
 */
export function domainCard(page: Page, name: string): Locator {
  return page.getByRole("button", {
    name: new RegExp(`^Open ${name} review queue`),
  });
}

export async function openDomain(page: Page, name: string) {
  await domainCard(page, name).click();
  await page.waitForURL(/\/batches\/[a-z-]+$/);
}

/** Sign in as a reviewer and open the demo batch in one step. */
export async function openDemoBatch(page: Page, arNumber: string = DEMO_AR) {
  await selectProfile(page, "Arjun Mehta");
  await navigateToBatch(page, arNumber);
}

/* -------------------------------------------------------------------------- */
/* Inside the review workspace                                                */
/* -------------------------------------------------------------------------- */

export function sidebar(page: Page): Locator {
  return page.locator("nav").filter({ hasText: "Test Parameters" }).first();
}

export function rightPanel(page: Page): Locator {
  return page.locator("aside").filter({ hasText: /What.s Left/ }).first();
}

export function gateButton(page: Page): Locator {
  return page.getByRole("button", {
    name: /^(Mark Section Reviewed|Section Reviewed)$/,
  });
}

export function parameterTabs(page: Page): Locator {
  /* The parameter list sits above the "Sections" heading; section buttons all
     carry an aria-label, parameter buttons do not. */
  return sidebar(page).locator("button:not([aria-label])");
}

export function sectionTabs(page: Page): Locator {
  return sidebar(page).locator('button[aria-label^="Open section"]');
}

/** Rows that are not flagged — compliant, or waiting on a verification. */
export function checkRows(page: Page): Locator {
  return page.locator('[role="button"][aria-expanded]');
}

export function flaggedCards(page: Page): Locator {
  return page.locator("div.border-l-flagged-text");
}

export async function openParameter(page: Page, shortName: string) {
  const before = page.url();
  await parameterTabs(page).filter({ hasText: shortName }).first().click();
  await expect(sectionTabs(page).first()).toBeVisible();

  /*
   * The section list belongs to the parameter, so reading it before the route
   * has swapped returns the previous parameter's sections — and a count from
   * the wrong list sends the caller clicking at a section that is not there.
   * Clicking the parameter already open changes nothing, so a settled URL is
   * an answer too.
   */
  for (let attempt = 0; attempt < 25 && page.url() === before; attempt += 1) {
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(200);
}

export async function openSection(page: Page, sectionName: string) {
  await sectionTabs(page)
    .filter({ has: page.locator(`text="${sectionName}"`) })
    .first()
    .click();
  await expect(gateButton(page)).toBeVisible();
  await page.waitForTimeout(250);
}

/** Open one named section of one named parameter. */
export async function goToSection(page: Page, shortName: string, sectionName: string) {
  await openParameter(page, shortName);
  await openSection(page, sectionName);
}

/* -------------------------------------------------------------------------- */
/* Notes and the gate                                                         */
/* -------------------------------------------------------------------------- */

export const VERIFICATION_PLACEHOLDER =
  "Confirm manual verification against LIMS worksheet...";

export const VERIFICATION_PREFILL =
  "Manually verified against LIMS worksheet — quantity confirmed.";

export function verificationNotes(page: Page): Locator {
  return page.getByPlaceholder(VERIFICATION_PLACEHOLDER);
}

/**
 * Write and confirm an observation against every entry in the section that
 * the gate is waiting on — flagged entries and entries QRA could not
 * conclude alike.
 */
/**
 * Answer everything the section's gate is waiting on.
 *
 * Four different things can hold it, and they are answered four different
 * ways: a flagged entry wants an observation, an entry QRA could not conclude
 * wants the same, an unusable result wants a PNC number, and an acceptability
 * rule wants a condition confirmed. A helper that only knew about the first
 * two left sections permanently shut and made a completed review impossible.
 */
export async function fillAllNotes(page: Page, note = "Reviewed — found satisfactory") {
  const gate = gateButton(page);

  /* Nothing outstanding: skip the work rather than probing for it. Most
     sections are in this state, and the difference over a whole batch is
     minutes. */
  if (await gate.isEnabled()) return;

  /* Conditions first — a checkbox is the cheapest thing to satisfy, and
     ticking one can open the gate on its own. */
  const conditions = page.getByRole("checkbox");
  for (let index = 0; index < (await conditions.count()); index += 1) {
    const box = conditions.nth(index);
    if (!(await box.isChecked())) await box.check();
  }

  /* An unusable result takes a PNC number, not a sentence. */
  const pncFields = page.getByPlaceholder("e.g. PNC-2026-0089");
  for (let index = 0; index < (await pncFields.count()); index += 1) {
    const field = pncFields.nth(index);
    if (!(await field.isVisible())) continue;
    await field.fill("PNC-2026-0089");
    await page.getByRole("button", { name: "Record PNC", exact: true }).first().click();
    await expect(page.getByText("PNC recorded").first()).toBeVisible();
  }

  const cards = flaggedCards(page);
  for (let index = 0; index < (await cards.count()); index += 1) {
    const card = cards.nth(index);
    if ((await card.getByText("Noted", { exact: true }).count()) > 0) continue;

    /* Only one entry stays open at a time, so a card whose panel was closed
       by opening another has to be reopened before it can be written on. */
    if ((await card.locator("textarea").count()) === 0) {
      const reopen = card.getByRole("button", { name: /View evidence/ });
      if ((await reopen.count()) === 0) continue;
      await reopen.click();
      await expect(card.locator("textarea").first()).toBeVisible();
    }

    await card.locator("textarea").first().fill(note);
    await card.getByRole("button", { name: "Confirm", exact: true }).first().click();
    await expect(card.getByText("Noted", { exact: true })).toBeVisible();
  }

  const verifications = verificationNotes(page);
  for (let index = 0; index < (await verifications.count()); index += 1) {
    const field = verifications.nth(index);
    if (!(await field.isVisible())) continue;
    await field.fill(VERIFICATION_PREFILL);
    await noteBlockFor(field)
      .getByRole("button", { name: "Confirm", exact: true })
      .click();
  }

  /* Border-limit rows carry a note field with no prefill of their own. */
  const trendNotes = page.getByPlaceholder(
    "Record the stability or trend evaluation for this result...",
  );
  for (let index = 0; index < (await trendNotes.count()); index += 1) {
    const field = trendNotes.nth(index);
    if (!(await field.isVisible())) continue;
    await field.fill("Trend reviewed against the prior timepoints — no adverse shift.");
    await noteBlockFor(field)
      .getByRole("button", { name: "Confirm", exact: true })
      .click();
  }
}

export function noteBlockFor(field: Locator): Locator {
  return field.locator("xpath=ancestor::div[2]");
}

export async function markSectionReviewed(page: Page) {
  const gate = gateButton(page);
  await expect(gate).toBeEnabled();
  await gate.click();
  await expect(page.getByRole("button", { name: "Section Reviewed" })).toBeVisible();
}

export async function goToNextSection(page: Page) {
  await page.getByRole("button", { name: /^Next Section/ }).click();
  await page.waitForTimeout(400);
}

/**
 * Walk every reachable section of the open batch, answer whatever its gate is
 * waiting on, mark it reviewed, and land on the Review Summary.
 *
 * Written to be quick about the sections that want nothing, because most of
 * them do: a batch of thirty-four is mostly Next.
 */
export async function completeReview(page: Page) {
  for (let guard = 0; guard < 60; guard += 1) {
    await fillAllNotes(page);

    const gate = gateButton(page);
    if (await gate.isEnabled()) {
      await gate.click();
      await expect(
        page.getByRole("button", { name: "Section Reviewed" }),
      ).toBeVisible();
    }

    const next = page.getByRole("button", { name: /^(Next Section|View Summary)/ });
    const last = /View Summary/.test(await next.innerText());
    const before = page.url();

    await next.click();
    if (last) {
      await page.waitForURL(/\/summary$/);
      return;
    }

    await expect.poll(() => page.url(), { timeout: 10_000 }).not.toBe(before);
  }

  throw new Error("completeReview did not reach the summary within 60 sections");
}


/** The gate's explanation as it appears on the bar, not in the tooltip. */
export function blockingBanner(page: Page): Locator {
  return page.locator("div.bg-warn-bg.px-6").first();
}

/** The scrolling middle column, excluding the sidebar and the right panel. */
export function contentArea(page: Page): Locator {
  return page.locator("div.flex-1.overflow-y-auto").first();
}

/** Leave the workspace for the Review Summary. */
export async function openSummary(page: Page) {
  await page.getByRole("button", { name: /^View Summary$/ }).click();
  await page.waitForURL(/\/summary$/);
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

/** Console errors and uncaught exceptions, collected from now on. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

export async function bodyText(page: Page): Promise<string> {
  return (await page.locator("body").innerText()).replace(/\s+/g, " ");
}
