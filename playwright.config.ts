import { defineConfig } from "@playwright/test";

/**
 * QRA end-to-end configuration.
 *
 * The browser runs through the installed Edge channel rather than Playwright's
 * own Chromium: the cached download here is a build behind what this version
 * expects, and Edge is the same engine.
 *
 * Tests inside a file run in order — several of them walk a review from one
 * end to the other — but the files themselves are independent, because the
 * app keeps no server state at all.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/helpers/global-setup.ts",

  fullyParallel: false,
  workers: 4,
  retries: 1,

  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:3100",
    channel: "msedge",
    /* Wide enough for the right-hand panel and the navbar search, both of
       which are deliberately dropped on a narrow screen. */
    viewport: { width: 1600, height: 1000 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
});
