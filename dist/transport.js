"use strict";
// Transport band resolution.
//
// The flat transport services are priced per trip by distance band. This module
// owns WHERE ONE BAND ENDS AND THE NEXT BEGINS, so consumers never author a
// threshold of their own — a km boundary decides what a customer pays, which
// makes it a pricing rule and puts it here with every other one.
//
// Boundaries are read from each service's `bandMaxKm`, so changing a band edge
// is a config change like any rate change, not a code change.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSPORT_BANDS = void 0;
exports.transportBandForDistanceKm = transportBandForDistanceKm;
exports.transportBandInfoForDistanceKm = transportBandInfoForDistanceKm;
exports.transportBandInfo = transportBandInfo;
const config_1 = require("./config");
/** Ordered nearest-first. The order the bands are checked in. */
const FLAT_BAND_SERVICE_IDS = ["transport_local", "transport_regional", "transport_extended"];
function perUnit(id) {
    const svc = config_1.STORAGE.services[id];
    if (!svc || svc.type !== "per_unit") {
        throw new Error(`transport: "${id}" is not a per_unit service`);
    }
    return svc;
}
/**
 * Every transport band, nearest first, with its distance range and price.
 *
 * Built from config so a UI can render "Local · 0–25 km · $150/trip" entirely
 * from engine data — the numbers, the label and the range all come from here.
 */
exports.TRANSPORT_BANDS = (() => {
    const out = [];
    let min = 0;
    for (const id of FLAT_BAND_SERVICE_IDS) {
        const svc = perUnit(id);
        if (svc.bandMaxKm == null) {
            throw new Error(`transport: "${id}" has no bandMaxKm — band boundaries must be configured`);
        }
        out.push({
            band: id.replace("transport_", ""),
            serviceId: id,
            label: svc.label,
            minKm: min,
            maxKm: svc.bandMaxKm,
            rateCents: svc.rateCents,
        });
        min = svc.bandMaxKm;
    }
    const beyond = config_1.STORAGE.services.transport_beyond_per_km;
    out.push({
        band: "beyond",
        // No flat service: beyond the furthest band it is quoted per km, or by hand.
        serviceId: null,
        label: beyond?.label ?? "Transport — beyond extended band",
        minKm: min,
        maxKm: null,
        rateCents: null,
        perKmRateCents: beyond && "rateCents" in beyond ? beyond.rateCents : undefined,
    });
    return out;
})();
/**
 * The band a one-way distance falls into.
 *
 * Upper bounds are INCLUSIVE: exactly 25 km is local, not regional. Boundary
 * customers should get the cheaper band — the distance is an estimate, and
 * rounding a borderline case against the customer is the wrong default.
 */
function transportBandForDistanceKm(km) {
    if (!Number.isFinite(km) || km < 0) {
        throw new RangeError(`transport: distance must be a non-negative number (got ${String(km)})`);
    }
    for (const info of exports.TRANSPORT_BANDS) {
        if (info.maxKm == null || km <= info.maxKm)
            return info.band;
    }
    return "beyond";
}
/** Full band info for a distance, including range and price, for display. */
function transportBandInfoForDistanceKm(km) {
    const band = transportBandForDistanceKm(km);
    return exports.TRANSPORT_BANDS.find((b) => b.band === band);
}
/** Band info by name, for a band resolved some other way (e.g. a town lookup). */
function transportBandInfo(band) {
    const info = exports.TRANSPORT_BANDS.find((b) => b.band === band);
    if (!info)
        throw new Error(`transport: unknown band "${band}"`);
    return info;
}
