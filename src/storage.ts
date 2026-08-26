// A1 Marine Storage pricing engine.
//
// Public interface (per project brief):
//   calculateQuote({ serviceLine: "storage", items: [{ serviceId, lengthFt?,
//     engineType?, engineCount?, options? }], hullType?, bundleId? }) -> QuoteResult
//
// Rules (all parameterized from pricing.config.json, all integer-cent math):
//   • per_foot:        max(rate x lengthFt, minimum), then + hull surcharge if flagged
//   • flat:            flat rate
//   • flat_per_engine: engine 1 at full rate; engines 2+ at the configured multiplier
//   • per_unit:        rate x quantity (batteries, PWCs, transport trips, vessel-months)
//   • per_km:          rate x distanceKm (transport beyond the furthest band)
//   • hull surcharge:  pontoon/tritoon, per-foot, on hullSurchargeEligible services only
//   • bundles:         discount % applied to the combined eligible total; the à-la-carte
//                      total and the savings are always returned
//
// Money is in integer cents throughout; callers round only at display.

import { STORAGE, type StorageService } from "./config";
import { perFootCents, applyMinimum, discountCents, additionalEngineUnitCents, formatCents } from "./money";

export type EngineType = "outboard" | "sterndrive" | "inboard";

// Guards against zero / absurd inputs.
const MAX_LENGTH_FT = 100;
const MAX_ENGINES = 8;
const MAX_QUANTITY = 20;
const MAX_DISTANCE_KM = 2000;

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

function requirePositiveLength(item: QuoteItemInput): number {
  const len = item.lengthFt;
  if (typeof len !== "number" || !Number.isFinite(len) || len <= 0) {
    throw new RangeError(`"${item.serviceId}" requires a positive boat length (got ${String(len)}).`);
  }
  if (len > MAX_LENGTH_FT) {
    throw new RangeError(`"${item.serviceId}" length ${len}ft exceeds the ${MAX_LENGTH_FT}ft maximum.`);
  }
  return len;
}

function requireEngineCount(item: QuoteItemInput): number {
  const count = item.engineCount ?? 1;
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`"${item.serviceId}" requires an engine count >= 1 (got ${String(item.engineCount)}).`);
  }
  if (count > MAX_ENGINES) {
    throw new RangeError(`"${item.serviceId}" engine count ${count} exceeds the ${MAX_ENGINES} maximum.`);
  }
  return count;
}

function requirePositiveQuantity(item: QuoteItemInput, max: number): number {
  const qty = item.quantity ?? 1;
  if (!Number.isInteger(qty) || qty < 1) {
    throw new RangeError(`"${item.serviceId}" requires a quantity >= 1 (got ${String(item.quantity)}).`);
  }
  if (qty > max) {
    throw new RangeError(`"${item.serviceId}" quantity ${qty} exceeds the ${max} maximum.`);
  }
  return qty;
}

function requirePositiveDistance(item: QuoteItemInput, max: number): number {
  const km = item.distanceKm;
  if (typeof km !== "number" || !Number.isFinite(km) || km <= 0) {
    throw new RangeError(`"${item.serviceId}" requires a positive distanceKm (got ${String(km)}).`);
  }
  if (km > max) {
    throw new RangeError(`"${item.serviceId}" distance ${km}km exceeds the ${max}km maximum.`);
  }
  return km;
}

function hullSurchargePerFoot(hullType: string | undefined, eligible: boolean): number {
  if (!eligible || !hullType) return 0;
  return STORAGE.hullSurcharges[hullType]?.perFootCents ?? 0;
}

function computeLine(item: QuoteItemInput, hullType: string | undefined): QuoteLineItem {
  const svc = STORAGE.services[item.serviceId];
  if (!svc) {
    throw new Error(`Unknown storage service: "${item.serviceId}".`);
  }

  if (svc.type === "flat") {
    return {
      serviceId: item.serviceId,
      label: svc.label,
      description: svc.label,
      quantity: 1,
      unitPriceCents: svc.rateCents,
      amountCents: svc.rateCents,
      bundleEligible: false,
      detail: { type: "flat", rateCents: svc.rateCents },
    };
  }

  if (svc.type === "flat_per_engine") {
    const count = requireEngineCount(item);
    const addUnit = additionalEngineUnitCents(svc.rateCents, svc.additionalEngineMultiplier);
    const amount = svc.rateCents + (count - 1) * addUnit;
    const description =
      count > 1
        ? `${svc.label} — engine 1 ${formatCents(svc.rateCents)} + ${count - 1} add'l @ ${Math.round(
            svc.additionalEngineMultiplier * 100,
          )}% (${formatCents(addUnit)} ea)`
        : svc.label;
    return {
      serviceId: item.serviceId,
      label: svc.label,
      description,
      quantity: 1,
      unitPriceCents: amount,
      amountCents: amount,
      bundleEligible: false,
      detail: {
        type: "flat_per_engine",
        rateCents: svc.rateCents,
        engineType: item.engineType ?? null,
        engineCount: count,
        additionalEngineMultiplier: svc.additionalEngineMultiplier,
        additionalEngineUnitCents: addUnit,
      },
    };
  }

  if (svc.type === "per_unit") {
    const qty = requirePositiveQuantity(item, svc.maxQuantity ?? MAX_QUANTITY);
    const amount = svc.rateCents * qty;
    const description = qty > 1 ? `${svc.label} — ${qty} × ${formatCents(svc.rateCents)}/${svc.unitLabel}` : svc.label;
    return {
      serviceId: item.serviceId,
      label: svc.label,
      description,
      quantity: 1,
      unitPriceCents: amount,
      amountCents: amount,
      bundleEligible: false,
      detail: { type: "per_unit", rateCents: svc.rateCents, unitCount: qty },
    };
  }

  if (svc.type === "per_km") {
    const km = requirePositiveDistance(item, svc.maxDistanceKm ?? MAX_DISTANCE_KM);
    const amount = Math.round(svc.rateCents * km);
    return {
      serviceId: item.serviceId,
      label: svc.label,
      description: `${svc.label} — ${km} km × ${formatCents(svc.rateCents)}/km`,
      quantity: 1,
      unitPriceCents: amount,
      amountCents: amount,
      bundleEligible: false,
      detail: { type: "per_km", rateCents: svc.rateCents, distanceKm: km },
    };
  }

  if (svc.type === "tiered_by_length") {
    const tierLen = requirePositiveLength(item);
    const tier = svc.tiers.find((t) => t.maxFt == null || tierLen <= t.maxFt) ?? svc.tiers[svc.tiers.length - 1];
    return {
      serviceId: item.serviceId,
      label: svc.label,
      description: `${svc.label} — ${tierLen}ft (${formatCents(tier.rateCents)})`,
      quantity: 1,
      unitPriceCents: tier.rateCents,
      amountCents: tier.rateCents,
      bundleEligible: false,
      detail: { type: "tiered_by_length", rateCents: tier.rateCents, lengthFt: tierLen },
    };
  }

  // per_foot
  const len = requirePositiveLength(item);
  if (svc.maxLengthFt != null && len > svc.maxLengthFt) {
    throw new RangeError(`"${item.serviceId}" is not available above ${svc.maxLengthFt}ft (got ${len}ft).`);
  }
  const raw = perFootCents(svc.rateCents, len);
  const base = applyMinimum(raw, svc.minimumCents);
  const minimumApplied = raw < svc.minimumCents;
  const surchargePerFoot = hullSurchargePerFoot(hullType, svc.hullSurchargeEligible === true);
  const hullSurchargeCents = perFootCents(surchargePerFoot, len);
  const amount = base + hullSurchargeCents;

  let description = minimumApplied
    ? `${svc.label} — ${len}ft (minimum ${formatCents(svc.minimumCents)})`
    : `${svc.label} — ${len}ft × ${formatCents(svc.rateCents)}/ft`;
  if (hullSurchargeCents > 0) {
    description += ` + ${hullType} surcharge ${formatCents(surchargePerFoot)}/ft`;
  }

  return {
    serviceId: item.serviceId,
    label: svc.label,
    description,
    quantity: 1,
    unitPriceCents: amount,
    amountCents: amount,
    bundleEligible: false,
    detail: {
      type: "per_foot",
      rateCents: svc.rateCents,
      lengthFt: len,
      minimumCents: svc.minimumCents,
      minimumApplied,
      hullSurchargePerFootCents: surchargePerFoot,
      hullSurchargeCents,
    },
  };
}

/** Expand a bundle's service list, resolving `winterization_*` to the item actually chosen. */
function resolveBundleServices(bundleId: string, items: QuoteItemInput[]): string[] {
  const bundle = STORAGE.bundles[bundleId];
  if (!bundle) throw new Error(`Unknown bundle: "${bundleId}".`);
  return bundle.services.flatMap((serviceId) => {
    if (serviceId === "winterization_*") {
      // Resolve to ALL winterization lines in the cart, so bundle eligibility is
      // order-independent and every winterization line the customer chose is
      // discounted (matches "bundle discount applies to the combined eligible total").
      const winIds = items.filter((it) => it.serviceId.startsWith("winterization_")).map((it) => it.serviceId);
      if (winIds.length === 0) {
        throw new Error(`Bundle "${bundle.label}" requires a winterization service in the item list.`);
      }
      return winIds;
    }
    return [serviceId];
  });
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  if (!input || input.serviceLine !== "storage") {
    throw new Error(`calculateQuote expects serviceLine "storage".`);
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error(`calculateQuote requires a non-empty items array.`);
  }

  const lineItems = input.items.map((item) => computeLine(item, input.hullType));

  let bundle: QuoteBundleResult | null = null;
  if (input.bundleId) {
    const def = STORAGE.bundles[input.bundleId];
    if (!def) throw new Error(`Unknown bundle: "${input.bundleId}".`);
    const eligibleIds = new Set(resolveBundleServices(input.bundleId, input.items));

    // Every service the bundle calls for must be present in the quote.
    for (const required of eligibleIds) {
      if (!lineItems.some((l) => l.serviceId === required)) {
        throw new Error(`Bundle "${def.label}" requires service "${required}", which is not in the item list.`);
      }
    }

    let eligibleSubtotalCents = 0;
    for (const line of lineItems) {
      if (eligibleIds.has(line.serviceId)) {
        line.bundleEligible = true;
        eligibleSubtotalCents += line.amountCents;
      }
    }
    bundle = {
      id: input.bundleId,
      label: def.label,
      discountPct: def.discountPct,
      eligibleSubtotalCents,
      discountCents: discountCents(eligibleSubtotalCents, def.discountPct),
    };
  }

  const aLaCarteSubtotalCents = lineItems.reduce((sum, l) => sum + l.amountCents, 0);
  const bundleSavingsCents = bundle ? bundle.discountCents : 0;
  const subtotalCents = aLaCarteSubtotalCents - bundleSavingsCents;

  return {
    currency: "CAD",
    hullType: input.hullType ?? null,
    hullSurchargePerFootCents: hullSurchargePerFoot(input.hullType, true),
    lineItems,
    bundle,
    aLaCarteSubtotalCents,
    bundleSavingsCents,
    subtotalCents,
    totalCents: subtotalCents,
  };
}
