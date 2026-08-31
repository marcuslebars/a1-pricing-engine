// @a1/pricing-engine — the single source of truth for A1 Marine pricing.
//
//   Marine Care  (a1marinecare.ca): calculateTotal / calculateGelcoat / ... + CARE
//   Marine Storage (a1marinestorage.ca): calculateQuote + STORAGE
//
// All prices live in ./pricing.config.json.
//
// Values are re-exported explicitly (not `export *`) so they are detectable by
// Node's CommonJS named-export lexer when the built CJS package is imported from
// an ESM context (the storage server runs this way).

// ── Marine Care ──────────────────────────────────────────────────────────────
export {
  SERVICE_STARTING_RATE_BY_SLUG,
  getServiceStartingRateBySlug,
  getServiceStartingPriceLabel,
  calculateGelcoat,
  calculateExterior,
  calculateInterior,
  calculateCeramic,
  calculateGraphene,
  calculateWetSanding,
  calculateBottomPainting,
  calculateVinyl,
  calculateWeeklyMaintenance,
  calculateBiweeklyMaintenance,
  calculateTotal,
} from "./marine-care";
export type * from "./marine-care";

// ── Config views ─────────────────────────────────────────────────────────────
export { CARE, STORAGE, RAW_CONFIG } from "./config";
export type * from "./config";

// ── Storage engine ───────────────────────────────────────────────────────────
export { calculateQuote } from "./storage";
export type * from "./storage";

// ── Transport bands ──────────────────────────────────────────────────────────
// Band DISTANCE boundaries live here, not in consuming repos: a km threshold
// decides what a customer pays, so it is a pricing rule like any other.
export {
  TRANSPORT_BANDS,
  transportBandForDistanceKm,
  transportBandInfoForDistanceKm,
  transportBandInfo,
} from "./transport";
export type * from "./transport";

// ── Money helpers ────────────────────────────────────────────────────────────
export { perFootCents, applyMinimum, discountCents, additionalEngineUnitCents, formatCents } from "./money";
