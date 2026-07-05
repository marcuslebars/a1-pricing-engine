export { SERVICE_STARTING_RATE_BY_SLUG, getServiceStartingRateBySlug, getServiceStartingPriceLabel, calculateGelcoat, calculateExterior, calculateInterior, calculateCeramic, calculateGraphene, calculateWetSanding, calculateBottomPainting, calculateVinyl, calculateWeeklyMaintenance, calculateBiweeklyMaintenance, calculateTotal, } from "./marine-care";
export type * from "./marine-care";
export { CARE, STORAGE, RAW_CONFIG } from "./config";
export type * from "./config";
export { calculateQuote } from "./storage";
export type * from "./storage";
export { perFootCents, applyMinimum, discountCents, additionalEngineUnitCents, formatCents } from "./money";
