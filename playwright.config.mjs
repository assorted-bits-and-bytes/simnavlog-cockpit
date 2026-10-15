import { defineConfig } from "@playwright/test";

// One project, one engine. The baselines carry no platform suffix because
// they are only ever taken in the pinned Playwright image (scripts/screens.sh).
// That image renders deterministically, so the comparison is exact: the
// default tolerance let a one-shade change of the ink colour through.
export default defineConfig({
  testDir: "test",
  testMatch: "*.spec.mjs",
  snapshotPathTemplate: "test/screens/{arg}{ext}",
  reporter: "line",
  expect: { toHaveScreenshot: { threshold: 0, maxDiffPixels: 0 } },
  use: { browserName: "chromium" },
});
