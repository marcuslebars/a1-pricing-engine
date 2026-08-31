import { describe, expect, it } from "vitest";

import {
  TRANSPORT_BANDS,
  transportBandForDistanceKm,
  transportBandInfo,
  transportBandInfoForDistanceKm,
} from "../src/transport";

/**
 * Ratified boundaries: local ≤25, regional ≤60, extended ≤120, beyond over.
 *
 * These live in the engine because a km threshold decides what a customer pays.
 * Consuming repos (the calculator, the voice tool, EmpireVu) must be able to
 * render a band row entirely from engine data rather than authoring a range.
 */
describe("band boundaries", () => {
  it("resolves each band at its midpoint", () => {
    expect(transportBandForDistanceKm(10)).toBe("local");
    expect(transportBandForDistanceKm(40)).toBe("regional");
    expect(transportBandForDistanceKm(90)).toBe("extended");
    expect(transportBandForDistanceKm(200)).toBe("beyond");
  });

  it("treats an upper bound as INCLUSIVE — the cheaper band wins a tie", () => {
    // The distance is an estimate; rounding a borderline customer into the more
    // expensive band is the wrong default.
    expect(transportBandForDistanceKm(25)).toBe("local");
    expect(transportBandForDistanceKm(60)).toBe("regional");
    expect(transportBandForDistanceKm(120)).toBe("extended");
  });

  it("steps up just past each edge", () => {
    expect(transportBandForDistanceKm(25.1)).toBe("regional");
    expect(transportBandForDistanceKm(60.1)).toBe("extended");
    expect(transportBandForDistanceKm(120.1)).toBe("beyond");
  });

  it("handles zero — the yard's own address", () => {
    expect(transportBandForDistanceKm(0)).toBe("local");
  });

  it("rejects a negative or non-finite distance rather than guessing a band", () => {
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => transportBandForDistanceKm(bad)).toThrow(/non-negative/);
    }
  });
});

describe("band table is renderable without local strings", () => {
  it("exposes range, label and price for every band", () => {
    expect(TRANSPORT_BANDS.map((b) => b.band)).toEqual(["local", "regional", "extended", "beyond"]);

    for (const info of TRANSPORT_BANDS) {
      expect(info.label.length).toBeGreaterThan(0);
      expect(typeof info.minKm).toBe("number");
    }
  });

  it("ranges are contiguous and non-overlapping", () => {
    for (let i = 0; i < TRANSPORT_BANDS.length - 1; i++) {
      expect(TRANSPORT_BANDS[i].maxKm).toBe(TRANSPORT_BANDS[i + 1].minKm);
    }
  });

  it("matches the ratified numbers", () => {
    expect(TRANSPORT_BANDS[0]).toMatchObject({ band: "local", minKm: 0, maxKm: 25, rateCents: 15000 });
    expect(TRANSPORT_BANDS[1]).toMatchObject({ band: "regional", minKm: 25, maxKm: 60, rateCents: 25000 });
    expect(TRANSPORT_BANDS[2]).toMatchObject({ band: "extended", minKm: 60, maxKm: 120, rateCents: 37500 });
  });

  it("BEYOND is open-ended, has no flat rate, and carries the per-km rate instead", () => {
    const beyond = transportBandInfo("beyond");
    expect(beyond.maxKm).toBeNull();
    // No flat price: a consumer that tries to bill a beyond trip gets null and
    // must fall back to a hand quote rather than inventing a total.
    expect(beyond.serviceId).toBeNull();
    expect(beyond.rateCents).toBeNull();
    expect(beyond.perKmRateCents).toBe(350);
  });

  it("prices rise with distance", () => {
    const flat = TRANSPORT_BANDS.filter((b) => b.rateCents != null);
    for (let i = 0; i < flat.length - 1; i++) {
      expect(flat[i].rateCents!).toBeLessThan(flat[i + 1].rateCents!);
    }
  });
});

describe("info lookups agree with the resolver", () => {
  it("info-for-distance matches band-for-distance", () => {
    for (const km of [0, 24, 25, 26, 59, 60, 61, 119, 120, 121, 500]) {
      expect(transportBandInfoForDistanceKm(km).band).toBe(transportBandForDistanceKm(km));
    }
  });

  it("every distance lands inside the band's own range", () => {
    for (const km of [0, 12, 25, 44, 60, 95, 120, 300]) {
      const info = transportBandInfoForDistanceKm(km);
      expect(km).toBeGreaterThanOrEqual(info.minKm);
      if (info.maxKm != null) expect(km).toBeLessThanOrEqual(info.maxKm);
    }
  });

  it("rejects an unknown band name", () => {
    expect(() => transportBandInfo("interstellar" as never)).toThrow(/unknown band/);
  });
});
