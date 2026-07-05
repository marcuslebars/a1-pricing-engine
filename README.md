# @a1/pricing-engine

Single source of truth for **A1 Marine** pricing, consumed by both sites:

- **A1 Marine Care** (a1marinecare.ca) — detailing / coatings calculators (`calculateTotal`, `calculateGelcoat`, …) + the `CARE` config view.
- **A1 Marine Storage** (a1marinestorage.ca) — the seasonal storage engine (`calculateQuote`) + the `STORAGE` config view.

Every price lives in [`src/pricing.config.json`](src/pricing.config.json), organized by service line (`marine_care`, `coatings`, `storage`). Change a price there and both sites update.

## Units
- `marine_care` / `coatings` amounts are whole **CAD dollars** (they match the live Marine Care quote tool exactly — the consuming app's golden tests enforce byte-identical output).
- `storage` amounts are integer **CAD cents**. The storage engine does all math in integer cents and rounds only at display.

## Public API
```ts
import { calculateQuote, calculateTotal, CARE, STORAGE, formatCents } from "@a1/pricing-engine";

// Storage:
calculateQuote({
  serviceLine: "storage",
  hullType: "pontoon",
  bundleId: "winter_ready_plus",
  items: [
    { serviceId: "outdoor_storage", lengthFt: 22 },
    { serviceId: "shrink_wrap", lengthFt: 22 },
    { serviceId: "winterization_outboard", engineType: "outboard", engineCount: 1 },
  ],
}); // -> itemized QuoteResult (per-line, minimums, hull surcharge, bundle discount, à-la-carte total, savings, subtotal)
```

## Develop
```
npm install
npm test        # engine unit tests (incl. the four contract check-cases)
npm run build   # tsc -> dist/ (CommonJS + .d.ts) and copies pricing.config.json into dist/
```
`dist/` is committed so consumers work without a build step. **After editing anything in `src/`, run `npm run build` and commit `dist/`.**

## How the two sites consume it
Single canonical source — no vendored copies.

- **During development** (this machine): a local file link, e.g. in each site's `package.json`:
  ```json
  "@a1/pricing-engine": "file:../../a1-pricing-engine"
  ```
- **For deploy** (current): each site pins the published tag over HTTPS:
  ```json
  "@a1/pricing-engine": "git+https://github.com/marcuslebars/a1-pricing-engine.git#v1.0.0"
  ```
  npm (Marine Care) and pnpm (Marine Storage) both resolve git dependencies natively; the pinned tag keeps deploys reproducible. **Consistency between the two sites comes from this version pin — there are no vendored/synced copies, and no drift-test is needed.**

## Directory layout for local development

The `file:` link (used only when hacking on the engine locally) is `../../a1-pricing-engine`, so clone the three repos as siblings with the engine **two directories above each app's `package.json`**:

```
<workspace>/
├── a1-pricing-engine/                     # this repo
├── a1marinecare-main (1)/
│   └── a1marinecare-main/                 # Care app  → ../../a1-pricing-engine
└── a1marinestorage-main/
    └── a1marinestorage-main/              # Storage app → ../../a1-pricing-engine
```

Local-dev loop:

1. In the consuming app, switch the dependency to `"@a1/pricing-engine": "file:../../a1-pricing-engine"` and install.
2. Edit `src/`, then **`npm run build`** here (the built `dist/` is committed and is what consumers load).
3. Run `npm test` here (engine unit tests incl. the four storage contract check-cases).

## Release a new version

1. `npm run build` + `npm test`, commit `src/` **and** `dist/`.
2. `git push && git tag vX.Y.Z && git push origin vX.Y.Z`.
3. Bump the `#vX.Y.Z` pin in each site's `package.json` and reinstall. On the Care side the golden suite must still pass exact-match.

(If your checkout isn't double-nested like the shipped downloads, adjust the `../` count in the `file:` path so it points at this repo.)
