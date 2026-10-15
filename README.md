# SimNavLog cockpit

Draws a [SimNavLog](https://simnavlog.com) nav log inside Microsoft Flight
Simulator: on the MSFS 2024 EFB tablet, and in an in-game panel.

**For flight simulation only.** Nothing here is for real-world navigation.
SimNavLog is developed by a non-pilot, and its figures are not aviation-grade.

The engine MSFS draws HTML with (Coherent GT) reports itself as Chrome 49 and
stays there. The live SimNavLog page cannot run in it, so this repository
holds a small renderer instead. The renderer has no framework and no runtime
dependencies, and it draws a plan from one JSON payload. That payload is
SimNavLog's _render projection_, `GET /api/v1/plans/:id/render`, and it is
described by SimNavLog's OpenAPI document.

MIT, so another kneeboard or EFB author can render a SimNavLog nav log
without asking.

| Directory   | What                                                      | State                                                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spike/`    | Probe: what the EFB's engine can do                       | ready to run ([#206](https://github.com/assorted-bits-and-bytes/simnavlog/issues/206))                                                                                                                                                          |
| `renderer/` | The library: payload in, DOM out                          | skeleton ([#197](https://github.com/assorted-bits-and-bytes/simnavlog/issues/197)); the card is [#198](https://github.com/assorted-bits-and-bytes/simnavlog/issues/198)/[#199](https://github.com/assorted-bits-and-bytes/simnavlog/issues/199) |
| `harness/`  | Draws a fixture at a chosen width, in an ordinary browser | ready                                                                                                                                                                                                                                           |
| `fixtures/` | Golden payloads: real plans, ids replaced                 | two                                                                                                                                                                                                                                             |
| `panel/`    | The in-game toolbar panel                                 | [#205](https://github.com/assorted-bits-and-bytes/simnavlog/issues/205)                                                                                                                                                                         |
| `efb/`      | The MSFS 2024 EFB app                                     | [#207](https://github.com/assorted-bits-and-bytes/simnavlog/issues/207)                                                                                                                                                                         |

## Using the renderer

```html
<link rel="stylesheet" href="renderer/renderer.css" />
<script src="dist/simnavlog-renderer.js"></script>
<script>
  SimNavLogRenderer.render(document.getElementById("navlog"), payload);
</script>
```

`payload` is the JSON SimNavLog serves. Every figure in it is already
computed, and every unit is named in its `fields` descriptor, so the renderer
only places things. It never does arithmetic.

## Development

Node from `.nvmrc`, and Docker for the screenshot tests. The renderer itself
has no runtime dependencies. The five dev dependencies are pinned exactly.

```bash
nvm use                       # node 24
npm ci
npm run build                 # dist/: the renderer, and the harness with its fixtures
xdg-open harness/index.html   # pick a fixture and a width; no server needed
npm test                      # the old-engine gate
npm run test:screens          # screenshot every fixture at every width, compare exactly
npm run test:screens:update   # accept new pixels, then review the PNG diff in git
npm run format
```

**The old-engine gate.** Coherent GT renders like Chrome 49. `npm test` runs
`doiuse` over every stylesheet in `renderer/` against `chrome 49`, and fails
on anything that engine lacks. A test proves the gate refuses Grid, flex
`gap`, `:has()`, `:where()` and `inset`. esbuild bundles the JS to `es2017`,
the MSFS SDK sample's own target, and fails on syntax it cannot lower.

**Screenshots** run in the `mcr.microsoft.com/playwright` image whose
version matches `@playwright/test`, locally and in CI alike, so the
comparison can be exact: one changed pixel fails it. The EFB widths in
`harness/widths.js` are provisional until the spike measures the tablet.

**Fixtures** are real plans from SimNavLog's API, with their ids replaced.
Add a `.json` to `fixtures/` and to `fixtures/index.js`. The screenshot
tests pick it up by itself.

Third-party material: the _Just Another Hand_ font, Apache-2.0, is re-encoded
from the woff2 that SimNavLog serves. Its licence travels with it.
