export type TransportBand = "local" | "regional" | "extended" | "beyond";
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
/**
 * Every transport band, nearest first, with its distance range and price.
 *
 * Built from config so a UI can render "Local · 0–25 km · $150/trip" entirely
 * from engine data — the numbers, the label and the range all come from here.
 */
export declare const TRANSPORT_BANDS: TransportBandInfo[];
/**
 * The band a one-way distance falls into.
 *
 * Upper bounds are INCLUSIVE: exactly 25 km is local, not regional. Boundary
 * customers should get the cheaper band — the distance is an estimate, and
 * rounding a borderline case against the customer is the wrong default.
 */
export declare function transportBandForDistanceKm(km: number): TransportBand;
/** Full band info for a distance, including range and price, for display. */
export declare function transportBandInfoForDistanceKm(km: number): TransportBandInfo;
/** Band info by name, for a band resolved some other way (e.g. a town lookup). */
export declare function transportBandInfo(band: TransportBand): TransportBandInfo;
