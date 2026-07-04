// @a1/pricing-engine — the single source of truth for A1 Marine pricing.
//
//   Marine Care  (a1marinecare.ca): calculateTotal / calculateGelcoat / ... + CARE
//   Marine Storage (a1marinestorage.ca): calculateQuote + STORAGE
//
// All prices live in ./pricing.config.json.

export * from "./config";
export * from "./marine-care";
export * from "./storage";
export {
  perFootCents,
  applyMinimum,
  discountCents,
  additionalEngineUnitCents,
  formatCents,
} from "./money";
