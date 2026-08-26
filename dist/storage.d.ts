import { type StorageService } from "./config";
export type EngineType = "outboard" | "sterndrive" | "inboard";
export interface QuoteItemInput {
    serviceId: string;
    lengthFt?: number;
    engineType?: EngineType;
    engineCount?: number;
    /** Unit count for per_unit services (e.g. number of batteries). Defaults to 1. */
    quantity?: number;
    /** Distance in km for per_km services (transport beyond the extended band). */
    distanceKm?: number;
    options?: Record<string, unknown>;
}
export interface QuoteInput {
    serviceLine: "storage";
    items: QuoteItemInput[];
    hullType?: string;
    /** Optional selected bundle id (winter_ready | winter_ready_plus | full_care). */
    bundleId?: string;
}
export interface QuoteLineDetail {
    type: StorageService["type"];
    rateCents?: number;
    lengthFt?: number;
    minimumCents?: number;
    minimumApplied?: boolean;
    hullSurchargePerFootCents?: number;
    hullSurchargeCents?: number;
    engineType?: EngineType | null;
    engineCount?: number;
    additionalEngineMultiplier?: number;
    additionalEngineUnitCents?: number;
    /** Unit count for per_unit services (e.g. batteries). */
    unitCount?: number;
    /** Distance in km for per_km services. */
    distanceKm?: number;
}
export interface QuoteLineItem {
    serviceId: string;
    label: string;
    /** Jobber-ready: human-readable line description. */
    description: string;
    /** Jobber-ready: quantity (1 — the per-foot / per-engine math is folded into unit price). */
    quantity: number;
    /** Jobber-ready: unit price in cents (== amount, since quantity is 1). */
    unitPriceCents: number;
    /** Extended amount for this line, in cents. */
    amountCents: number;
    /** True when this line participates in the selected bundle's discount. */
    bundleEligible: boolean;
    detail: QuoteLineDetail;
}
export interface QuoteBundleResult {
    id: string;
    label: string;
    discountPct: number;
    eligibleSubtotalCents: number;
    discountCents: number;
}
export interface QuoteResult {
    currency: "CAD";
    hullType: string | null;
    hullSurchargePerFootCents: number;
    lineItems: QuoteLineItem[];
    bundle: QuoteBundleResult | null;
    /** Sum of all line amounts before any bundle discount. */
    aLaCarteSubtotalCents: number;
    /** Bundle discount amount (0 when no bundle). */
    bundleSavingsCents: number;
    /** Pre-HST total after bundle discount. */
    subtotalCents: number;
    /** Same as subtotalCents — HST is added at booking, not computed here. */
    totalCents: number;
}
export declare function calculateQuote(input: QuoteInput): QuoteResult;
