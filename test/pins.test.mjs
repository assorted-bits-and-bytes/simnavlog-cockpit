// The Playwright version is written twice: the package that runs the tests,
// and the image CI runs them in. Baselines are exact, so the two must agree
// or CI compares against pixels another browser build drew.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CI's Playwright image matches the pinned @playwright/test", () => {
  const pinned = JSON.parse(readFileSync("package.json", "utf8")).devDependencies[
    "@playwright/test"
  ];
  const image = readFileSync(".github/workflows/ci.yml", "utf8").match(/playwright:v([\d.]+)-/)[1];

  assert.equal(image, pinned);
});
