// The old-engine gate for CSS. Coherent GT renders like Chrome 49 and is
// staying there, so every stylesheet the renderer ships is held to it by a
// linter rather than by a list someone has to remember.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import postcss from "postcss";
import doiuse from "doiuse";

const ENGINE = ["chrome 49"];

// caniuse ids the gate does not hold the renderer to, each with its reason.
// Keep this list short: every entry is a hole in the gate.
const IGNORED = [
  // caniuse calls Chrome 49's overflow "partial" because it lacks
  // `overflow: clip` and the two-value form. `overflow: hidden` is CSS 2.
  "css-overflow",
];

async function unsupported(file) {
  const found = [];
  await postcss([
    doiuse({ browsers: ENGINE, ignore: IGNORED, onFeatureUsage: (usage) => found.push(usage) }),
  ]).process(readFileSync(file, "utf8"), { from: file });
  return found.map((u) => `${file}:${u.usage.source.start.line} ${u.featureData.title}`);
}

const stylesheets = readdirSync("renderer")
  .filter((f) => f.endsWith(".css"))
  .map((f) => `renderer/${f}`);

for (const file of stylesheets) {
  test(`${file} uses nothing Chrome 49 cannot render`, async () => {
    assert.deepEqual(await unsupported(file), []);
  });
}

// A gate that cannot fail is not a gate. These are features the SimNavLog
// web app uses today and the engine lacks.
test("the gate refuses the features the web app's stylesheet relies on", async () => {
  const found = (await unsupported("test/old-engine-refuses.css")).join("\n");

  // doiuse names :where() under :is(), and `inset` under Logical Properties.
  for (const feature of ["Grid", "gap", ":has()", ":is()", "Logical Properties"]) {
    assert.match(
      found,
      new RegExp(feature.replace(/[()]/g, "\\$&"), "i"),
      `the gate missed ${feature}`
    );
  }
});
