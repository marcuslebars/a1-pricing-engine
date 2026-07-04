"use strict";
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
//   • hull surcharge:  pontoon/tritoon, per-foot, on hullSurchargeEligible services only
//   • bundles:         discount % applied to the combined eligible total; the à-la-carte
//                      total and the savings are always returned
//
// Money is in integer cents throughout; callers round only at display.
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateQuote = calculateQuote;
const config_1 = require("./config");
const money_1 = require("./money");
// Guards against zero / absurd inputs.
const MAX_LENGTH_FT = 100;
const MAX_ENGINES = 8;
function requirePositiveLength(item) {
    const len = item.lengthFt;
    if (typeof len !== "number" || !Number.isFinite(len) || len <= 0) {
        throw new RangeError(`"${item.serviceId}" requires a positive boat length (got ${String(len)}).`);
    }
    if (len > MAX_LENGTH_FT) {
        throw new RangeError(`"${item.serviceId}" length ${len}ft exceeds the ${MAX_LENGTH_FT}ft maximum.`);
    }
    return len;
}
function requireEngineCount(item) {
    const count = item.engineCount ?? 1;
    if (!Number.isInteger(count) || count < 1) {
        throw new RangeError(`"${item.serviceId}" requires an engine count >= 1 (got ${String(item.engineCount)}).`);
    }
    if (count > MAX_ENGINES) {
        throw new RangeError(`"${item.serviceId}" engine count ${count} exceeds the ${MAX_ENGINES} maximum.`);
    }
    return count;
}
function hullSurchargePerFoot(hullType, eligible) {
    if (!eligible || !hullType)
        return 0;
    return config_1.STORAGE.hullSurcharges[hullType]?.perFootCents ?? 0;
}
function computeLine(item, hullType) {
    const svc = config_1.STORAGE.services[item.serviceId];
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
        const addUnit = (0, money_1.additionalEngineUnitCents)(svc.rateCents, svc.additionalEngineMultiplier);
        const amount = svc.rateCents + (count - 1) * addUnit;
        const description = count > 1
            ? `${svc.label} — engine 1 ${(0, money_1.formatCents)(svc.rateCents)} + ${count - 1} add'l @ ${Math.round(svc.additionalEngineMultiplier * 100)}% (${(0, money_1.formatCents)(addUnit)} ea)`
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
    // per_foot
    const len = requirePositiveLength(item);
    if (svc.maxLengthFt != null && len > svc.maxLengthFt) {
        throw new RangeError(`"${item.serviceId}" is not available above ${svc.maxLengthFt}ft (got ${len}ft).`);
    }
    const raw = (0, money_1.perFootCents)(svc.rateCents, len);
    const base = (0, money_1.applyMinimum)(raw, svc.minimumCents);
    const minimumApplied = raw < svc.minimumCents;
    const surchargePerFoot = hullSurchargePerFoot(hullType, svc.hullSurchargeEligible === true);
    const hullSurchargeCents = (0, money_1.perFootCents)(surchargePerFoot, len);
    const amount = base + hullSurchargeCents;
    let description = minimumApplied
        ? `${svc.label} — ${len}ft (minimum ${(0, money_1.formatCents)(svc.minimumCents)})`
        : `${svc.label} — ${len}ft × ${(0, money_1.formatCents)(svc.rateCents)}/ft`;
    if (hullSurchargeCents > 0) {
        description += ` + ${hullType} surcharge ${(0, money_1.formatCents)(surchargePerFoot)}/ft`;
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
function resolveBundleServices(bundleId, items) {
    const bundle = config_1.STORAGE.bundles[bundleId];
    if (!bundle)
        throw new Error(`Unknown bundle: "${bundleId}".`);
    return bundle.services.flatMap((serviceId) => {
        if (serviceId === "winterization_*") {
            const winItem = items.find((it) => it.serviceId.startsWith("winterization_"));
            if (!winItem) {
                throw new Error(`Bundle "${bundle.label}" requires a winterization service in the item list.`);
            }
            return [winItem.serviceId];
        }
        return [serviceId];
    });
}
function calculateQuote(input) {
    if (!input || input.serviceLine !== "storage") {
        throw new Error(`calculateQuote expects serviceLine "storage".`);
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
        throw new Error(`calculateQuote requires a non-empty items array.`);
    }
    const lineItems = input.items.map((item) => computeLine(item, input.hullType));
    let bundle = null;
    if (input.bundleId) {
        const def = config_1.STORAGE.bundles[input.bundleId];
        if (!def)
            throw new Error(`Unknown bundle: "${input.bundleId}".`);
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
            discountCents: (0, money_1.discountCents)(eligibleSubtotalCents, def.discountPct),
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
