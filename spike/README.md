# The EFB spike (#206)

One app, one look. It answers the four questions nothing published answers,
before any real EFB code is written:

1. Does `fetch()` return a body from inside an EFB app?
2. What are the EFB viewport's pixel dimensions?
3. Where is the engine's JS and CSS feature line?
4. How long is one edit-to-visible cycle?

The app draws its results **on the tablet**, as a table and as one JSON
block. No Coherent debugger is needed to read them. The same block also goes
to the console, prefixed `SIMNAVLOG_PROBE`, if a debugger is attached anyway.

## Files

| File | What |
|---|---|
| `probe.js` | The probe. ES5 plus Promise, so it parses on the engine it measures |
| `index.html` | The probe in an ordinary browser: the baseline to read the EFB's answers against |
| `efb/src/` | The EFB app around it, in the shape of the SDK's TemplateApp |

## Run it in the browser first

Open `index.html` from disk. Every row should be green, and the CORS fetch
should report `status 200 … openapi 3.1.0`.

## Build it for the EFB

It reuses the MSFS 2024 SDK's **EFB TemplateApp** sample, because that
sample's `package.json` points at the SDK's own `efb_api` and vendored
`msfs-sdk`: the app cannot be built outside the SDK.

1. Copy the sample's `TemplateApp` folder beside itself as `SimNavLogProbe`
   (it must stay a sibling of `efb_api/` and `vendor/`, which its
   `package.json` references as `../`).
2. Replace its `src/` with this kit's `efb/src/`, and copy `probe.js` into
   that `src/`.
3. In its `build.js`, change two lines:

   ```js
   entryPoints: ["src/SimNavLogProbe.tsx"],
   define: { BASE_URL: `"coui://html_ui/efb_ui/efb_apps/SimNavLogProbe"` },
   ```

4. `npm install`, then `npm run build`. If the TypeScript typecheck fails, set
   `TYPECHECKING=false` in `.env`. That is a finding: note the error.
5. Package it the way the sample's own README says, with the app folder
   renamed. Open DevMode, run **Build All**, and start a flight in the DA62.

If any step differs from the sample's instructions, the sample wins. Write
down the difference, because it is a finding too.

## What to record

Open **SimNavLog probe** on the EFB three times:

- on the 8.3″ tablet;
- on the 10.9″ tablet;
- with the EFB as a 2D panel (pop-out).

A photo of each screen is enough. The `env` rows answer question 2, the `js`,
`css`, `svg` and `font` rows answer question 3, and the `net` rows answer
question 1.

- **`net`, the CORS row.** Green with a byte count means the epic is on.
- **`net`, the control row.** It should read "refused as expected". If it says
  "NOT refused", the engine does not enforce CORS. That is good news for us,
  but it changes what the CORS row proves.
- **`storage`, "previous run".** Restart the sim and open the app again. If
  the row shows the first run's timestamp, `localStorage` survives a restart.
  The pairing token depends on that.

## Question 4: time one edit

1. In `efb/src/ProbePage.tsx`, change `const BUILD = "1"` to `"2"`.
2. Start a stopwatch.
3. Do the **least** you believe is needed:
   - `npm run build`, copy `dist/`, then Ctrl+R in the Coherent debugger; or
   - a DevMode rebuild; or
   - a sim restart.
4. Stop when the heading reads `build 2`.
5. Write down the steps that were actually needed, and the time.

If it takes over two minutes, the offline harness (#197) is not a nicety.
