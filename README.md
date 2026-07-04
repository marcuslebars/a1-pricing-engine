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
- **For deploy**: push this folder to its own git repo and pin a tag in each site:
  ```json
  "@a1/pricing-engine": "github:<org>/a1-pricing-engine#v1.0.0"
  ```
  npm (Marine Care) and pnpm (Marine Storage) both resolve git dependencies natively; the pinned tag keeps deploys reproducible.
