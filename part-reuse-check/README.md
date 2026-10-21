# Part Reuse Check — Prototype

A single-page web app for Google hardware engineers. Guided search over the
October 2026 GPN snapshot that makes finding an existing fastener easier than
creating a new GPN.

> **Prototype — not connected to any Google system.** Nothing you do in the UI
> leaves the browser tab. No backend, no auth, no persistence, no network calls
> at runtime.

## Setup

```
npm install
npm run build:fixture   # one-off ETL: data/*.csv → src/fixtures/*.json
npm run dev             # open http://127.0.0.1:5173/
```

That is the whole setup. The fixture is committed, so you can skip
`build:fixture` after the first run unless the CSVs change.

### Scripts

| command                | what it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Vite dev server at `http://127.0.0.1:5173/`           |
| `npm run build`        | type-check + production bundle in `dist/`             |
| `npm test`             | Vitest unit + integration suite                       |
| `npm run build:fixture`| Re-run the ETL to regenerate `src/fixtures/*.json`    |

## What this prototype is not

Lifted from `docs/REQUIREMENTS.md` §1 so whoever demos it can answer "is this
connected to our data?" correctly.

- Not connected to any Google system, dashboard, or API.
- Not a data-cleaning tool. Engineers using it are searching for a part,
  not fixing records.
- Not an ML system. No model is called at runtime. Attribute extraction is
  deterministic rules.
- Not a production app: no auth, no persistence, no deployment, no multi-user,
  no analytics.

## Data

- `data/set01.csv` + `data/set02.csv` — the October 2026 GPN snapshot
  (two sheets, ~15k rows).
- `scripts/build-fixture.ts` reads both, merges by normalised GPN, filters to
  fastener part types (Bolts & Screws, Nut, Washers), runs the extractor, and
  writes:
  - `src/fixtures/parts.json` — one record per in-scope GPN
  - `src/fixtures/vocab.json` — per-attribute dropdown vocabulary
  - `src/fixtures/clusters.json` — duplicate clusters (shared MPN,
    identical description), with conflicts marked
- The build prints a summary (`distinct GPNs`, `in scope`, families, phases,
  cluster counts, attribute coverage %). The spec's two hard gates are
  **1,045 in-scope records** and **44 shared-MPN clusters covering 82 GPNs**;
  both are hit by the current builder.

## The three rules that govern all matching

Baked into `src/engine/`. An implementation that violates any of these is wrong.

- **R1 — An unstated attribute is unknown, never a match.** M3 does not imply
  0.5 pitch.
- **R2 — Filtering is inclusive; scoring is strict.** A record with a `null`
  for an answered attribute **stays in the pool** and is reported as
  _unknown_. Only records that **state** a different value are excluded. A
  "strict mode" toggle on the Scope step flips this.
- **R3 — Nothing is ever declared interchangeable by the app.** Verdicts are
  `match`, `review`, or `different`. A `match` means every attribute you
  asked for is stated in the record and equal; it does not mean parts are
  interchangeable. That is an engineer's call.

## Demo script

### 1. Happy path

Family **screw** → Thread **M3** → Pitch **0.5** → Length **8** → Head
**pan** → Drive **phillips** → Material **steel** → Finish **zinc plated**
→ Integral washer **none**/skip → Scope (default) → Review → Run search.

> Expected: `07052664` surfaces as a `match`. `07022596` and `1106617` appear
> below as `review` / `different` and are visible on the Results screen.

### 2. Skip path

Same query, but **skip** pitch, material, and finish.

> Expected: a larger pool. `07052664` still first; `07022596` is promoted to
> `review` on the skipped attributes but stays `different` on integral
> washer.

### 3. Compare

Tick `07052664` and `07022596` on the Results screen, click **Compare**.

> Expected: a side-by-side table. Unknowns render with a distinct marker
> (not a tick, not a blank cell). The washer row is marked as differing.

### 4. Duplicate cluster

Run a query that returns `1106617`. A **DuplicateNotice** appears under the
result listing the cluster's GPNs with the shared manufacturer part number as
evidence. A **Flag to data owner** button logs it to the in-memory flag log.

### 5. Conflict cluster

Run a query that returns `07070024`.

> Expected: a notice naming the material conflict with `07082586`, and
> wording that explicitly says the members **may** describe the same part —
> never "duplicate confirmed".

### 6. Dead end

Family **screw** → Thread **M3** → Pitch **0.35**.

> Expected: the Dead-End screen. Query echo lists what was searched, the
> nearest misses name pitch as the disqualifier, and a copyable new-GPN
> request record is rendered on screen with a copy-to-clipboard button. The
> screen says the request is **not** sent anywhere.

## Open questions

Carry these into the demo — they're unresolved with Google and the prototype
should be presented alongside them, not as if they were settled.

- Is Mfr. Part Number curated or free entry? The whole duplicate feature rests
  on it.
- Are drive type, head type, finish, and integral washer hard requirements or
  application-dependent? The prototype currently treats all four as
  disqualifying when stated.
- Is the free-text description the system of record, or does parametric
  attribute data exist upstream? If it exists, the entire extraction layer is
  unnecessary.
- Who is authorised to declare two GPNs interchangeable, and does an
  approved-substitute list already exist?
- May the app write anything back? **Flag to data owner** and **Request a
  new GPN** are mocked because we do not know.

## Repository layout

```
part-reuse-check/
├── data/                       CSV snapshot (read only by the builder)
├── scripts/
│   ├── build-fixture.ts        ETL entry point
│   └── lib/                    normalize, extract, vocab, clusters
├── src/
│   ├── types.ts                frozen contract
│   ├── fixtures/*.json         generated, committed
│   ├── engine/                 pure functions: candidates, match, rank, steps
│   ├── state/                  reducer + context + selectors
│   ├── components/
│   │   ├── common/             PrototypeBanner, VerdictBadge, OptionCombobox
│   │   ├── wizard/             WizardScreen, AttributeStep, Scope/ReviewStep, ProgressRail
│   │   ├── results/            ResultsScreen, ResultCard, ExcludedSummary, DuplicateNotice
│   │   ├── compare/            CompareScreen, CompareRow
│   │   ├── deadend/            DeadEndScreen, NewGpnRequest
│   │   └── flags/              FlagLogPanel
│   ├── styles/app.css          single stylesheet with design tokens
│   ├── App.tsx                 screen switch
│   └── main.tsx                mount
└── docs/REQUIREMENTS.md, ARCHITECTURE.md, TASKS.md   (originals from Week 4)
```
