// Transport band resolution.
//
// The flat transport services are priced per trip by distance band. This module
// owns WHERE ONE BAND ENDS AND THE NEXT BEGINS, so consumers never author a
// threshold of their own — a km boundary decides what a customer pays, which
// makes it a pricing rule and puts it here with every other one.
//
// Boundaries are read from each service's `bandMaxKm`, so changing a band edge
// is a config change like any rate change, not a code change.

import { STORAGE, type StoragePerUnitService } from "./config";

export type TransportBand = "local" | "regional" | "extended" | "beyond";

/** Ordered nearest-first. The order the bands are checked in. */
const FLAT_BAND_SERVICE_IDS = ["transport_local", "transport_regional", "transport_extended"] as const;

export interface TransportBandInfo {
  band: TransportBand;
  /** Engine service id, or null for `beyond` — which has no flat rate. */
  serviceId: string | null;
  label: string;
  /** Inclusive lower bound, one-way km from the yard. */
  minKm: number;
  /** Inclusive upper bound, or null for the open-ended top band. */
  maxKm: number | null;
  /** Per-trip price, or null for `beyond`. */
  rateCents: number | null;
  /** Set only on `beyond`: the per-km rate it is quoted at instead. */
  perKmRateCents?: number;
}

function perUnit(id: string): StoragePerUnitService {
  const svc = STORAGE.services[id];
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
export const TRANSPORT_BANDS: TransportBandInfo[] = (() => {
  const out: TransportBandInfo[] = [];
  let min = 0;

  for (const id of FLAT_BAND_SERVICE_IDS) {
    const svc = perUnit(id);
    if (svc.bandMaxKm == null) {
      throw new Error(`transport: "${id}" has no bandMaxKm — band boundaries must be configured`);
    }
    out.push({
      band: id.replace("transport_", "") as TransportBand,
      serviceId: id,
      label: svc.label,
      minKm: min,
      maxKm: svc.bandMaxKm,
      rateCents: svc.rateCents,
    });
    min = svc.bandMaxKm;
  }

  const beyond = STORAGE.services.transport_beyond_per_km;
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
export function transportBandForDistanceKm(km: number): TransportBand {
  if (!Number.isFinite(km) || km < 0) {
    throw new RangeError(`transport: distance must be a non-negative number (got ${String(km)})`);
  }
  for (const info of TRANSPORT_BANDS) {
    if (info.maxKm == null || km <= info.maxKm) return info.band;
  }
  return "beyond";
}

/** Full band info for a distance, including range and price, for display. */
export function transportBandInfoForDistanceKm(km: number): TransportBandInfo {
  const band = transportBandForDistanceKm(km);
  return TRANSPORT_BANDS.find((b) => b.band === band)!;
}

/** Band info by name, for a band resolved some other way (e.g. a town lookup). */
export function transportBandInfo(band: TransportBand): TransportBandInfo {
  const info = TRANSPORT_BANDS.find((b) => b.band === band);
  if (!info) throw new Error(`transport: unknown band "${band}"`);
  return info;
}
