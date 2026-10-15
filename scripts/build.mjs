// Two bundles, both plain IIFEs a page loads with a <script> tag:
//
//   dist/simnavlog-renderer.js  the library, as the global SimNavLogRenderer
//   dist/harness.js             the harness, with every fixture inside
//
// es2017 is the SDK sample's own target, and a syntax esbuild cannot lower
// to it fails the build: the JS half of the old-engine gate.
import { build } from "esbuild";

const common = { bundle: true, format: "iife", target: "es2017", logLevel: "warning" };

await build({
  ...common,
  entryPoints: ["renderer/index.js"],
  globalName: "SimNavLogRenderer",
  outfile: "dist/simnavlog-renderer.js",
});

await build({ ...common, entryPoints: ["harness/harness.js"], outfile: "dist/harness.js" });
