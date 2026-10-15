# SimNavLog cockpit

Draws a [SimNavLog](https://simnavlog.com) nav log inside Microsoft Flight
Simulator: on the MSFS 2024 EFB tablet, and in an in-game panel.

**For flight simulation only.** Nothing here is for real-world navigation.
SimNavLog is developed by a non-pilot, and its figures are not aviation-grade.

The engine MSFS draws HTML with (Coherent GT) reports itself as Chrome 49 and
stays there. The live SimNavLog page cannot run in it, so this repository
holds a small renderer instead. The renderer has no framework and no runtime
dependencies, and it draws a plan from one JSON payload. That payload is
SimNavLog's *render projection*, `GET /api/v1/plans/:id/render`, and it is
described by SimNavLog's OpenAPI document.

MIT, so another kneeboard or EFB author can render a SimNavLog nav log
without asking.

| Directory | What | State |
|---|---|---|
| `spike/` | Probe: what the EFB's engine can do | ready to run ([#206](https://github.com/assorted-bits-and-bytes/simnavlog/issues/206)) |
| `renderer/` | The library: payload in, DOM out | [#197](https://github.com/assorted-bits-and-bytes/simnavlog/issues/197) |
| `panel/` | The in-game toolbar panel | [#205](https://github.com/assorted-bits-and-bytes/simnavlog/issues/205) |
| `efb/` | The MSFS 2024 EFB app | [#207](https://github.com/assorted-bits-and-bytes/simnavlog/issues/207) |

Third-party material: the *Just Another Hand* font, Apache-2.0, is re-encoded
from the woff2 that SimNavLog serves. Its licence travels with it.
