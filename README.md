# Anvil Ledger

An internal web app for Anvil Nutrition's board and leadership: why contribution margin 3 (CM3) collapsed from FY24 to FY26, and the plan that brings it back to break-even in Q4 FY27 and positive in FY28.

Live at https://anvil-board-room.vercel.app. Every push to `main` deploys there automatically.

It is a static site: `index.html`, one stylesheet and plain JavaScript modules. There is no build step, no server code, no framework and no third-party script. The only runtime request outside the site is Google Fonts (Inter and Newsreader), with system fallbacks.

## Run it locally

ES modules need to be served over HTTP; opening `index.html` straight from the file system will not run the app. From this folder:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. Any static server works (`npx serve`, `caddy file-server`, and so on).

## Host it

Upload the folder as-is to any static host: Vercel, Netlify, S3 with CloudFront, or an internal web server.

- No build command; the output directory is the folder itself.
- Access control belongs to the host (company sign-in). The app has no login.
- `index.html` carries `<meta name="robots" content="noindex, nofollow">`. On Vercel, `vercel.json` also sends an `X-Robots-Tag: noindex, nofollow` header on every response; on other hosts, add that header if you can.
- Files you can leave out of the upload: `tests/`, `package.json`, `README.md`. On Vercel, `.vercelignore` already leaves out `tests/` and `README.md`.
- With the GitHub repository connected to the Vercel project, every push to `main` deploys to production.

## Update the numbers

Every number in the app comes from one data module, and every formula from one model module.

| What | Where |
| --- | --- |
| Data-room figures, each with its unit and source code (A to L, Calc, Model, Ext) | `js/data.js` |
| "Data as of" date, used on every screen | `AS_OF` in `js/data.js` |
| Plan inputs (lever ranges, backstop, FY28 CM2 by case, Plant X terms, cash items, caps) | `PLAN` in `js/data.js` |
| Formulas, as pure functions of those inputs | `js/model.js` |
| Rounding and formats (Indian digit grouping, crore, lakh, true minus sign) | `js/format.js` |

After changing a number or a formula, run the tests (Node 18 or later):

```bash
npm test
```

The tests reproduce every published test value from unrounded inputs at display precision: the Q4 FY27 bands by branch and backstop, the FY28 cases at 25% and 28% marketing, the Plant X presets and the 90 t cliff, the cash planner at both dates, the format lab, the quick-commerce check and the CM3 bridge.

Text on screens lives with each screen in `js/ui/screens/`. A number that appears in screen copy must also have a drawer entry (`register(...)` in the same file) so its source chip can open it.

## How the code is organised

- **Data** (`js/data.js`): the data-room appendix and plan inputs.
- **Model** (`js/model.js`): every formula as a pure function. Results are unrounded.
- **State** (`js/state.js`): the shared scenario, URL sync, browser storage and the lever tracker.
- **UI** (`js/ui/`): the shell (top bar, target meter, navigation, drawer, search), shared components, hand-built SVG charts, and one module per screen.

## Links and saved state

The scenario travels in the URL, so a copied link opens the same view. A scenario in the URL wins over anything saved in the browser.

| Parameter | Meaning |
| --- | --- |
| `b` | Branch: `mkt` (marketing step-up) or `cm2` (costs inside CM2) |
| `c` | Case: `cautious`, `central`, `favourable` or `custom` |
| `l2`, `l3`, `l4b`, `l7` | Lever slider values, when the case is custom |
| `f` | FY28 case, when the case is custom |
| `bs` | Backstop: `1` on, `0` off |
| `up` | `1` shows the uncounted L4a upside |
| `m` | FY28 marketing, % of NR |
| `px` | Plant X preset (`fy26`, `even89`, `hold92`, `floor70`) or four tonnes joined by `_` |
| `imp`, `gst`, `tub`, `rel`, `s27`, `s28` | Cash planner settings |
| `mg`, `qt`, `qd` | Format-lab margin; quick-commerce take rate and discount |
| `item` | The open source drawer |
| `tab` | The Data and method tab |

The browser keeps the last scenario, tracker edits, the theme and the navigation width in `localStorage` (keys starting `anvil.`). Everything still works when storage is blocked; the tracker's Export CSV and Import CSV pass edits between people until a shared backend exists.

## Accessibility and support

Built to WCAG 2.2 AA: keyboard use throughout (sliders take arrow keys, Shift plus arrow for ten steps, Home and End), a visible focus ring, landmarks and a skip link, one heading level 1 per screen, chart titles and descriptions with a table view and CSV for every chart, polite announcements of the meter and live headlines, and reduced motion honoured. Supports current Chrome, Edge, Safari and Firefox, at widths from 360 px.
