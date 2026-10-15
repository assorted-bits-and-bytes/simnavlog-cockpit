// A screenshot per fixture per width. A changed pixel fails the run, and the
// new image lands in test-results/ beside the baseline, so a review can see
// what moved.
import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { WIDTHS } from "../harness/widths.js";

const harness = `file://${resolve("harness/index.html")}`;
const fixtures = readdirSync("fixtures")
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

for (const fixture of fixtures) {
  for (const width of WIDTHS) {
    test(`${fixture} at ${width.id}`, async ({ page }) => {
      await page.setViewportSize({ width: width.px + 40, height: 800 });
      await page.goto(`${harness}?fixture=${fixture}&width=${width.id}`);
      await expect(page.locator("#stage")).toHaveScreenshot(`${fixture}--${width.id}.png`);
    });
  }
}
