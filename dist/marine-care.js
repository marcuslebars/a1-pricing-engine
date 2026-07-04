"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_STARTING_RATE_BY_SLUG = void 0;
exports.getServiceStartingRateBySlug = getServiceStartingRateBySlug;
exports.getServiceStartingPriceLabel = getServiceStartingPriceLabel;
exports.calculateGelcoat = calculateGelcoat;
exports.calculateExterior = calculateExterior;
exports.calculateInterior = calculateInterior;
exports.calculateCeramic = calculateCeramic;
exports.calculateGraphene = calculateGraphene;
exports.calculateWetSanding = calculateWetSanding;
exports.calculateBottomPainting = calculateBottomPainting;
exports.calculateVinyl = calculateVinyl;
exports.calculateWeeklyMaintenance = calculateWeeklyMaintenance;
exports.calculateBiweeklyMaintenance = calculateBiweeklyMaintenance;
exports.calculateTotal = calculateTotal;
const config_1 = require("./config");
// All prices are sourced from pricing.config.json via the CARE loader — this
// module holds the formulas and the customer-facing breakdown copy only.
exports.SERVICE_STARTING_RATE_BY_SLUG = config_1.CARE.startingRatesBySlug;
function getServiceStartingRateBySlug(slug) {
    return exports.SERVICE_STARTING_RATE_BY_SLUG[slug] ?? null;
}
function getServiceStartingPriceLabel(slug) {
    const rate = getServiceStartingRateBySlug(slug);
    return rate === null ? "Custom quote" : `From $${rate}/ft`;
}
function getBoatTypeDisplayName(shortValue) {
    const mapping = {
        bowrider: "Open Bow / Bowrider",
        cuddy: "Cuddy Cabin",
        cruiser: "Cruiser (Single Cabin)",
        express: "Express Cruiser",
        yacht: "Yacht / Multi-Cabin",
        sailboat: "Sailboat",
        pontoon: "Pontoon",
        other: "Other",
    };
    return mapping[shortValue.toLowerCase()] || shortValue;
}
function getGelcoatRate(length, area) {
    const bands = config_1.CARE.gelcoat.rateBands[area];
    for (const band of bands) {
        if (band.maxFt === null || length <= band.maxFt) {
            return band.rate;
        }
    }
    return bands[bands.length - 1].rate;
}
function calculateGelcoat(length, config) {
    const breakdown = [];
    const reviewReasons = [];
    let subtotal = 0;
    let baseServiceSubtotal = 0;
    const hullRate = getGelcoatRate(length, "hull");
    const topsidesRate = getGelcoatRate(length, "topsides");
    if (config.area === "hull") {
        const hullPrice = length * hullRate;
        breakdown.push(`Hull: ${length}ft × $${hullRate}/ft = $${hullPrice.toFixed(2)}`);
        baseServiceSubtotal = hullPrice;
    }
    else if (config.area === "topsides") {
        const topsidesPrice = length * topsidesRate;
        breakdown.push(`Topsides: ${length}ft × $${topsidesRate}/ft = $${topsidesPrice.toFixed(2)}`);
        baseServiceSubtotal = topsidesPrice;
    }
    else if (config.area === "fullboat") {
        const hullPrice = length * hullRate;
        const topsidesPrice = length * topsidesRate;
        breakdown.push(`Hull: ${length}ft × $${hullRate}/ft = $${hullPrice.toFixed(2)}`);
        breakdown.push(`Topsides: ${length}ft × $${topsidesRate}/ft = $${topsidesPrice.toFixed(2)}`);
        baseServiceSubtotal = hullPrice + topsidesPrice;
    }
    else if (config.area === "bowrider") {
        const hullPrice = length * hullRate;
        const adjustedTopsidesPrice = length * topsidesRate * config_1.CARE.gelcoat.bowriderTopsidesFactor;
        breakdown.push(`Hull: ${length}ft × $${hullRate}/ft = $${hullPrice.toFixed(2)}`);
        breakdown.push(`Topsides (Bowrider 40% reduction): ${length}ft × $${topsidesRate}/ft × ${config_1.CARE.gelcoat.bowriderTopsidesFactor} = $${adjustedTopsidesPrice.toFixed(2)}`);
        baseServiceSubtotal = hullPrice + adjustedTopsidesPrice;
    }
    let oxidationCharge = 0;
    if (config.heavyOxidation) {
        oxidationCharge = baseServiceSubtotal * (config_1.CARE.gelcoat.heavyOxidationSurchargePct / 100);
        breakdown.push(`Heavy Oxidation Surcharge (+${config_1.CARE.gelcoat.heavyOxidationSurchargePct}%): $${oxidationCharge.toFixed(2)}`);
    }
    subtotal = baseServiceSubtotal + oxidationCharge;
    if (config.radarArch) {
        subtotal += config_1.CARE.gelcoat.addons.radarArch;
        breakdown.push(`Arch / Radar Arch: $${config_1.CARE.gelcoat.addons.radarArch.toFixed(2)}`);
    }
    if (config.hardTop) {
        subtotal += config_1.CARE.gelcoat.addons.hardTop;
        breakdown.push(`Hard Top: $${config_1.CARE.gelcoat.addons.hardTop.toFixed(2)}`);
    }
    if (config.spotWetSanding > 0) {
        const sandingCost = config.spotWetSanding * config_1.CARE.gelcoat.spotWetSandingPerArea;
        subtotal += sandingCost;
        breakdown.push(`Spot Wet Sanding (${config.spotWetSanding} areas): $${sandingCost.toFixed(2)}`);
    }
    return {
        subtotal,
        breakdown,
        requiresManualReview: reviewReasons.length > 0,
        reviewReasons,
    };
}
function calculateExterior(length, config) {
    const breakdown = [];
    let subtotal = 0;
    const baseRate = config_1.CARE.exterior.baseRatePerFoot;
    const multiplier = config_1.CARE.exterior.tierMultipliers[config.tier];
    const basePrice = length * baseRate * multiplier;
    breakdown.push(`Exterior ${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)}: ${length}ft × $${baseRate}/ft × ${multiplier} = $${basePrice.toFixed(2)}`);
    subtotal = basePrice;
    if (config.teakCleaning) {
        subtotal += config_1.CARE.exterior.addons.teakCleaning;
        breakdown.push(`Teak Cleaning: $${config_1.CARE.exterior.addons.teakCleaning.toFixed(2)}`);
    }
    if (config.canvasCleaning) {
        subtotal += config_1.CARE.exterior.addons.canvasCleaning;
        breakdown.push(`Canvas Cleaning: $${config_1.CARE.exterior.addons.canvasCleaning.toFixed(2)}`);
    }
    if (config.fenderCleaning) {
        subtotal += config_1.CARE.exterior.addons.fenderCleaning;
        breakdown.push(`Fender Cleaning: $${config_1.CARE.exterior.addons.fenderCleaning.toFixed(2)}`);
    }
    if (config.exteriorOzone) {
        subtotal += config_1.CARE.exterior.addons.exteriorOzone;
        breakdown.push(`Exterior Ozone: $${config_1.CARE.exterior.addons.exteriorOzone.toFixed(2)}`);
    }
    return { subtotal, breakdown, requiresManualReview: false, reviewReasons: [] };
}
function calculateInterior(length, boatType, config) {
    const breakdown = [];
    const reviewReasons = [];
    let subtotal = 0;
    const boatTypeDisplay = getBoatTypeDisplayName(boatType);
    if (length > config_1.CARE.interior.manualReview.maxLengthFt) {
        reviewReasons.push(`Boat over ${config_1.CARE.interior.manualReview.maxLengthFt}ft requires manual review`);
    }
    if (config.tier === "restoration") {
        reviewReasons.push("Restoration tier requires manual review");
    }
    if (boatTypeDisplay === "Yacht / Multi-Cabin" && (config.tier === "deep" || config.tier === "restoration")) {
        reviewReasons.push("Yacht with Deep Clean or Restoration requires manual review");
    }
    if (reviewReasons.length > 0) {
        return { subtotal: 0, breakdown, requiresManualReview: true, reviewReasons };
    }
    const baseRate = config_1.CARE.interior.baseRatePerFoot;
    const tierMultiplier = config_1.CARE.interior.tierMultipliers[config.tier];
    const boatTypeMultiplier = config_1.CARE.interior.boatTypeMultipliers[boatTypeDisplay] || 1.0;
    const calculatedBase = length * baseRate * boatTypeMultiplier * tierMultiplier;
    let interiorAddOnsTotal = 0;
    if (config.moldRemediation) {
        interiorAddOnsTotal += config_1.CARE.interior.addons.moldRemediation;
        breakdown.push(`Advanced Mold & Mildew Remediation: $${config_1.CARE.interior.addons.moldRemediation.toFixed(2)}`);
    }
    if (config.petHairRemoval) {
        interiorAddOnsTotal += config_1.CARE.interior.addons.petHairRemoval;
        breakdown.push(`Heavy Pet Hair Removal: $${config_1.CARE.interior.addons.petHairRemoval.toFixed(2)}`);
    }
    if (config.mattressShampoo) {
        interiorAddOnsTotal += config_1.CARE.interior.addons.mattressShampoo;
        breakdown.push(`Cabin Mattress / Cushion Shampoo: $${config_1.CARE.interior.addons.mattressShampoo.toFixed(2)}`);
    }
    if (config.headDeepClean) {
        interiorAddOnsTotal += config_1.CARE.interior.addons.headDeepClean;
        breakdown.push(`Head (Bathroom) Deep Clean: $${config_1.CARE.interior.addons.headDeepClean.toFixed(2)}`);
    }
    if (config.galleyDeepClean) {
        interiorAddOnsTotal += config_1.CARE.interior.addons.galleyDeepClean;
        breakdown.push(`Galley Deep Clean: $${config_1.CARE.interior.addons.galleyDeepClean.toFixed(2)}`);
    }
    if (config.ozoneInterior) {
        interiorAddOnsTotal += config_1.CARE.interior.addons.ozoneInterior;
        breakdown.push(`Ozone Odor Treatment: $${config_1.CARE.interior.addons.ozoneInterior.toFixed(2)}`);
    }
    const lowEstimate = calculatedBase * config_1.CARE.interior.estimateRange.low + interiorAddOnsTotal;
    const highEstimate = calculatedBase * config_1.CARE.interior.estimateRange.high + interiorAddOnsTotal;
    breakdown.unshift(`Interior ${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)} (${boatTypeDisplay}): $${lowEstimate.toFixed(0)} – $${highEstimate.toFixed(0)}`);
    subtotal = calculatedBase + interiorAddOnsTotal;
    return { subtotal, breakdown, requiresManualReview: false, reviewReasons: [] };
}
function calculateCeramic(length, config) {
    const breakdown = [];
    let subtotal = 0;
    const basePrice = length * config_1.CARE.ceramic.baseRatePerFoot;
    breakdown.push(`Ceramic Coating: ${length}ft × $${config_1.CARE.ceramic.baseRatePerFoot}/ft = $${basePrice.toFixed(2)}`);
    subtotal = basePrice;
    if (config.secondLayer) {
        const secondLayerCost = length * config_1.CARE.ceramic.perFootAddons.secondLayer;
        subtotal += secondLayerCost;
        breakdown.push(`Second Layer: ${length}ft × $${config_1.CARE.ceramic.perFootAddons.secondLayer}/ft = $${secondLayerCost.toFixed(2)}`);
    }
    if (config.teakCeramic) {
        subtotal += config_1.CARE.ceramic.addons.teakCeramic;
        breakdown.push(`Teak Ceramic: $${config_1.CARE.ceramic.addons.teakCeramic.toFixed(2)}`);
    }
    if (config.interiorCeramic) {
        subtotal += config_1.CARE.ceramic.addons.interiorCeramic;
        breakdown.push(`Interior Ceramic: $${config_1.CARE.ceramic.addons.interiorCeramic.toFixed(2)}`);
    }
    return { subtotal, breakdown, requiresManualReview: false, reviewReasons: [] };
}
function calculateGraphene(length, config) {
    const breakdown = [];
    let subtotal = 0;
    const basePrice = length * config_1.CARE.graphene.baseRatePerFoot;
    breakdown.push(`Graphene Coating: ${length}ft × $${config_1.CARE.graphene.baseRatePerFoot}/ft = $${basePrice.toFixed(2)}`);
    subtotal = basePrice;
    if (config.secondLayer) {
        const secondLayerCost = length * config_1.CARE.graphene.perFootAddons.secondLayer;
        subtotal += secondLayerCost;
        breakdown.push(`Second Layer: ${length}ft × $${config_1.CARE.graphene.perFootAddons.secondLayer}/ft = $${secondLayerCost.toFixed(2)}`);
    }
    if (config.teakGraphene) {
        subtotal += config_1.CARE.graphene.addons.teakGraphene;
        breakdown.push(`Teak Graphene: $${config_1.CARE.graphene.addons.teakGraphene.toFixed(2)}`);
    }
    return { subtotal, breakdown, requiresManualReview: false, reviewReasons: [] };
}
function calculateWetSanding(length, config) {
    const breakdown = [];
    let subtotal = 0;
    const basePrice = length * config_1.CARE.wetSanding.baseRatePerFoot;
    breakdown.push(`Wet Sanding & Paint/Gelcoat Correction: ${length}ft × $${config_1.CARE.wetSanding.baseRatePerFoot}/ft = $${basePrice.toFixed(2)}`);
    subtotal = basePrice;
    if (config.deepScratchRepair) {
        subtotal += config_1.CARE.wetSanding.addons.deepScratchRepair;
        breakdown.push(`Deep Scratch Repair: $${config_1.CARE.wetSanding.addons.deepScratchRepair.toFixed(2)}`);
    }
    if (config.spotWetSanding > 0) {
        const sandingCost = config.spotWetSanding * config_1.CARE.wetSanding.spotWetSandingPerArea;
        subtotal += sandingCost;
        breakdown.push(`Spot Wet Sanding (${config.spotWetSanding} areas): $${sandingCost.toFixed(2)}`);
    }
    return { subtotal, breakdown, requiresManualReview: false, reviewReasons: [] };
}
function calculateBottomPainting(length, config) {
    const breakdown = [];
    const reviewReasons = [];
    let subtotal = 0;
    const basePrice = length * config_1.CARE.bottomPainting.baseRatePerFoot;
    breakdown.push(`Bottom Painting: ${length}ft × $${config_1.CARE.bottomPainting.baseRatePerFoot}/ft = $${basePrice.toFixed(2)}`);
    subtotal = basePrice;
    if (config.secondCoat) {
        const secondCoatCost = length * config_1.CARE.bottomPainting.perFootAddons.secondCoat;
        subtotal += secondCoatCost;
        breakdown.push(`2nd Coat: ${length}ft × $${config_1.CARE.bottomPainting.perFootAddons.secondCoat}/ft = $${secondCoatCost.toFixed(2)}`);
    }
    if (config.oldPaintRemoval) {
        const removalCost = length * config_1.CARE.bottomPainting.perFootAddons.oldPaintRemoval;
        subtotal += removalCost;
        breakdown.push(`Old Paint Removal: ${length}ft × $${config_1.CARE.bottomPainting.perFootAddons.oldPaintRemoval}/ft = $${removalCost.toFixed(2)}`);
    }
    if (config.heavyGrowthRemoval) {
        subtotal += config_1.CARE.bottomPainting.addons.heavyGrowthRemoval;
        breakdown.push(`Heavy Growth Removal: $${config_1.CARE.bottomPainting.addons.heavyGrowthRemoval.toFixed(2)}`);
    }
    if (config.blisterRepair) {
        reviewReasons.push("Blister repair requires manual review");
    }
    return {
        subtotal,
        breakdown,
        requiresManualReview: config.blisterRepair,
        reviewReasons,
    };
}
function calculateVinyl(length, config) {
    const breakdown = [];
    let subtotal = 0;
    const rates = config_1.CARE.vinyl.ratesPerFoot;
    const basePrice = length * rates[config.service];
    const serviceName = config.service === "both" ? "Removal + Install" : config.service === "removal" ? "Removal Only" : "Install Only";
    breakdown.push(`Vinyl ${serviceName}: ${length}ft × $${rates[config.service]}/ft = $${basePrice.toFixed(2)}`);
    subtotal = basePrice;
    if (config.customDesign) {
        subtotal += config_1.CARE.vinyl.addons.customDesign;
        breakdown.push(`Custom Design: $${config_1.CARE.vinyl.addons.customDesign.toFixed(2)}`);
    }
    return { subtotal, breakdown, requiresManualReview: false, reviewReasons: [] };
}
function calculateWeeklyMaintenance(length) {
    const subtotal = length * config_1.CARE.weeklyMaintenance.ratePerFoot;
    return {
        subtotal,
        breakdown: [
            `Weekly Service: ${length}ft × $${config_1.CARE.weeklyMaintenance.ratePerFoot}/ft = $${subtotal.toFixed(2)}`,
            "Includes: pressure wash, wipe down, chrome polish, and window cleaning.",
        ],
        requiresManualReview: false,
        reviewReasons: [],
    };
}
function calculateBiweeklyMaintenance(length) {
    const subtotal = length * config_1.CARE.biweeklyMaintenance.ratePerFoot;
    return {
        subtotal,
        breakdown: [
            `Bi-Weekly Service: ${length}ft × $${config_1.CARE.biweeklyMaintenance.ratePerFoot}/ft = $${subtotal.toFixed(2)}`,
            "Includes: pressure wash, wipe down, chrome polish, and window cleaning.",
        ],
        requiresManualReview: false,
        reviewReasons: [],
    };
}
function calculateTotal(length, boatType, services) {
    let grandTotal = 0;
    const allBreakdown = [];
    const allReviewReasons = [];
    let requiresReview = false;
    if (services.gelcoat) {
        const result = calculateGelcoat(length, services.gelcoat);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Gelcoat Restoration ---", ...result.breakdown);
        if (result.requiresManualReview) {
            requiresReview = true;
            allReviewReasons.push(...result.reviewReasons);
        }
    }
    if (services.exterior) {
        const result = calculateExterior(length, services.exterior);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Exterior Detailing ---", ...result.breakdown);
    }
    if (services.interior) {
        const result = calculateInterior(length, boatType, services.interior);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Interior Detailing ---", ...result.breakdown);
        if (result.requiresManualReview) {
            requiresReview = true;
            allReviewReasons.push(...result.reviewReasons);
        }
    }
    if (services.ceramic) {
        const result = calculateCeramic(length, services.ceramic);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Ceramic Coating ---", ...result.breakdown);
    }
    if (services.graphene) {
        const result = calculateGraphene(length, services.graphene);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Graphene Coating ---", ...result.breakdown);
    }
    if (services.wetSanding) {
        const result = calculateWetSanding(length, services.wetSanding);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Wet Sanding & Paint/Gelcoat Correction ---", ...result.breakdown);
    }
    if (services.bottomPainting) {
        const result = calculateBottomPainting(length, services.bottomPainting);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Bottom Painting ---", ...result.breakdown);
        if (result.requiresManualReview) {
            requiresReview = true;
            allReviewReasons.push(...result.reviewReasons);
        }
    }
    if (services.vinyl) {
        const result = calculateVinyl(length, services.vinyl);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Vinyl Services ---", ...result.breakdown);
    }
    if (services.weeklyMaintenance) {
        const result = calculateWeeklyMaintenance(length);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Weekly Service ---", ...result.breakdown);
    }
    if (services.biweeklyMaintenance) {
        const result = calculateBiweeklyMaintenance(length);
        grandTotal += result.subtotal;
        allBreakdown.push("--- Bi-Weekly Service ---", ...result.breakdown);
    }
    return {
        subtotal: grandTotal,
        breakdown: allBreakdown,
        requiresManualReview: requiresReview,
        reviewReasons: allReviewReasons,
    };
}
