import { describe, it, expect } from "vitest";
import { calculateQuote, type QuoteItemInput } from "../src/index";

const storage = (lengthFt: number): QuoteItemInput => ({ serviceId: "outdoor_storage", lengthFt });
const wrap = (lengthFt: number): QuoteItemInput => ({ serviceId: "shrink_wrap", lengthFt });

describe("storage engine — brief check cases (exact, to the cent)", () => {
  it("24ft bowrider, Winter Ready → $1,800.00 à-la-carte, $1,656.00 after 8%", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      hullType: "bowrider",
      bundleId: "winter_ready",
      items: [storage(24), wrap(24)],
    });
    expect(r.lineItems.find((l) => l.serviceId === "outdoor_storage")!.amountCents).toBe(120000);
    expect(r.lineItems.find((l) => l.serviceId === "shrink_wrap")!.amountCents).toBe(60000);
    expect(r.aLaCarteSubtotalCents).toBe(180000);
    expect(r.bundleSavingsCents).toBe(14400);
    expect(r.subtotalCents).toBe(165600);
  });

  it("22ft pontoon, outboard x1, Winter Ready Plus → $2,277.00 à-la-carte, $2,049.30 after 10%", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      hullType: "pontoon",
      bundleId: "winter_ready_plus",
      items: [storage(22), wrap(22), { serviceId: "winterization_outboard", engineType: "outboard", engineCount: 1 }],
    });
    // Hull surcharge applies to storage + wrap (flagged), NOT winterization.
    expect(r.lineItems.find((l) => l.serviceId === "outdoor_storage")!.amountCents).toBe(127600); // (50+8)*22
    expect(r.lineItems.find((l) => l.serviceId === "shrink_wrap")!.amountCents).toBe(72600); // (25+8)*22
    expect(r.lineItems.find((l) => l.serviceId === "winterization_outboard")!.amountCents).toBe(27500);
    expect(r.aLaCarteSubtotalCents).toBe(227700);
    expect(r.bundleSavingsCents).toBe(22770);
    expect(r.subtotalCents).toBe(204930);
  });

  it("14ft runabout, storage only → below minimum → $750.00", () => {
    const r = calculateQuote({ serviceLine: "storage", items: [storage(14)] });
    const line = r.lineItems[0];
    expect(line.amountCents).toBe(75000);
    expect(line.detail.minimumApplied).toBe(true);
    expect(r.subtotalCents).toBe(75000);
    expect(r.bundle).toBeNull();
  });

  it("28ft cruiser, twin inboards, Full Care → $3,816.00 à-la-carte, $3,358.08 after 12%", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      hullType: "cruiser",
      bundleId: "full_care",
      items: [
        storage(28),
        wrap(28),
        { serviceId: "winterization_inboard", engineType: "inboard", engineCount: 2 },
        { serviceId: "fall_detail", lengthFt: 28 },
        { serviceId: "spring_commissioning" },
      ],
    });
    const win = r.lineItems.find((l) => l.serviceId === "winterization_inboard")!;
    expect(win.amountCents).toBe(77900); // 44500 + 33400 (445×0.75=333.75 → $334, rounded to whole $)
    expect(win.detail.additionalEngineUnitCents).toBe(33400);
    expect(win.detail.engineCount).toBe(2);
    expect(r.lineItems.find((l) => l.serviceId === "fall_detail")!.amountCents).toBe(67200); // cruiser: no surcharge (rate unchanged)
    expect(r.aLaCarteSubtotalCents).toBe(381600);
    expect(r.bundleSavingsCents).toBe(45792);
    expect(r.subtotalCents).toBe(335808);
  });
});

// 2026 storage rate increase: outdoor $46→$50/ft, shrink $18→$25/ft, winterization
// +$50 each (outboard $275, sterndrive $400, inboard $445); minimums outdoor $750 /
// shrink $375; additional engines round to whole dollars. These lock the exact
// scenarios signed off for the change.
describe("storage engine — 2026 rate increase (acceptance)", () => {
  const amt = (id: string, L: number) =>
    calculateQuote({ serviceLine: "storage", items: [{ serviceId: id, lengthFt: L }] }).lineItems[0].amountCents;
  const winAmt = (id: string, et: "outboard" | "sterndrive" | "inboard", n = 1) =>
    calculateQuote({ serviceLine: "storage", items: [{ serviceId: id, engineType: et, engineCount: n }] }).lineItems[0];

  it("outdoor storage at $50/ft — 18/24/30/38 ft", () => {
    expect(amt("outdoor_storage", 18)).toBe(90000);
    expect(amt("outdoor_storage", 24)).toBe(120000);
    expect(amt("outdoor_storage", 30)).toBe(150000);
    expect(amt("outdoor_storage", 38)).toBe(190000);
  });

  it("shrink wrap at $25/ft — 18/24/30/38 ft", () => {
    expect(amt("shrink_wrap", 18)).toBe(45000);
    expect(amt("shrink_wrap", 24)).toBe(60000);
    expect(amt("shrink_wrap", 30)).toBe(75000);
    expect(amt("shrink_wrap", 38)).toBe(95000);
  });

  it("winterization single-engine flat rates: $275 / $400 / $445", () => {
    expect(winAmt("winterization_outboard", "outboard").amountCents).toBe(27500);
    expect(winAmt("winterization_sterndrive", "sterndrive").amountCents).toBe(40000);
    expect(winAmt("winterization_inboard", "inboard").amountCents).toBe(44500);
  });

  it("twin sterndrive: $400 + $300 (×0.75) = $700", () => {
    const l = winAmt("winterization_sterndrive", "sterndrive", 2);
    expect(l.amountCents).toBe(70000);
    expect(l.detail.additionalEngineUnitCents).toBe(30000);
  });

  it("additional-engine unit rounds to whole dollars: outboard $206, inboard $334", () => {
    expect(winAmt("winterization_outboard", "outboard", 2).detail.additionalEngineUnitCents).toBe(20600);
    expect(winAmt("winterization_inboard", "inboard", 2).detail.additionalEngineUnitCents).toBe(33400);
  });

  it("new minimums floor a 14ft boat: outdoor $750, shrink $375", () => {
    const o = calculateQuote({ serviceLine: "storage", items: [storage(14)] }).lineItems[0];
    expect(o.amountCents).toBe(75000);
    expect(o.detail.minimumApplied).toBe(true);
    const w = calculateQuote({ serviceLine: "storage", items: [wrap(14)] }).lineItems[0];
    expect(w.amountCents).toBe(37500);
    expect(w.detail.minimumApplied).toBe(true);
  });

  it("24ft sterndrive combined (storage + wrap + winterization) = $2,200 à-la-carte", () => {
    const cart: QuoteItemInput[] = [storage(24), wrap(24), { serviceId: "winterization_sterndrive", engineType: "sterndrive", engineCount: 1 }];
    expect(calculateQuote({ serviceLine: "storage", items: cart }).aLaCarteSubtotalCents).toBe(220000);
  });

  it("Winter Ready Plus (10%) on the 3-service cart = $1,980", () => {
    const cart: QuoteItemInput[] = [storage(24), wrap(24), { serviceId: "winterization_sterndrive", engineType: "sterndrive", engineCount: 1 }];
    expect(calculateQuote({ serviceLine: "storage", bundleId: "winter_ready_plus", items: cart }).subtotalCents).toBe(198000);
  });

  it("Full Care (12%) on the full 5-service cart = $3,041 à-la-carte, $2,676.08 after", () => {
    const cart: QuoteItemInput[] = [
      storage(24),
      wrap(24),
      { serviceId: "winterization_sterndrive", engineType: "sterndrive", engineCount: 1 },
      { serviceId: "fall_detail", lengthFt: 24 },
      { serviceId: "spring_commissioning" },
    ];
    const r = calculateQuote({ serviceLine: "storage", bundleId: "full_care", items: cart });
    expect(r.aLaCarteSubtotalCents).toBe(304100);
    expect(r.bundleSavingsCents).toBe(36492);
    expect(r.subtotalCents).toBe(267608);
  });
});

describe("storage engine — rules & edge cases", () => {
  it("per-foot minimum floors a short boat (shrink wrap 14ft → $375.00)", () => {
    const r = calculateQuote({ serviceLine: "storage", items: [wrap(14)] });
    expect(r.lineItems[0].amountCents).toBe(37500);
    expect(r.lineItems[0].detail.minimumApplied).toBe(true);
  });

  it("tritoon hull surcharge is $10/ft on flagged services", () => {
    const r = calculateQuote({ serviceLine: "storage", hullType: "tritoon", items: [storage(20)] });
    // max(5000*20, 75000)=100000 + 1000*20=20000
    expect(r.lineItems[0].amountCents).toBe(120000);
    expect(r.hullSurchargePerFootCents).toBe(1000);
  });

  it("hull surcharge never applies to non-flagged services (fall detail on a pontoon)", () => {
    const r = calculateQuote({ serviceLine: "storage", hullType: "pontoon", items: [{ serviceId: "fall_detail", lengthFt: 20 }] });
    expect(r.lineItems[0].amountCents).toBe(48000); // 2400*20, no surcharge (fall detail rate unchanged)
    expect(r.lineItems[0].detail.hullSurchargeCents).toBe(0);
  });

  it("multi-engine winterization bills engine 2+ at the configured 75% (triple outboard)", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      items: [{ serviceId: "winterization_outboard", engineCount: 3 }],
    });
    // 27500 + 2 * (round(27500*0.75)=20600 → $206) = 27500 + 2*20600 = 68700
    expect(r.lineItems[0].amountCents).toBe(68700);
  });

  it("pontoon + bundle combine correctly (surcharge in the eligible base, then discounted)", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      hullType: "pontoon",
      bundleId: "winter_ready",
      items: [storage(24), wrap(24)],
    });
    // storage (50+8)*24=139200, wrap (25+8)*24=79200 => 218400; -8% = 200928
    expect(r.aLaCarteSubtotalCents).toBe(218400);
    expect(r.bundleSavingsCents).toBe(17472);
    expect(r.subtotalCents).toBe(200928);
  });

  it("always exposes the à-la-carte total and savings for the customer", () => {
    const r = calculateQuote({ serviceLine: "storage", bundleId: "winter_ready", items: [storage(30), wrap(30)] });
    expect(r.bundle).not.toBeNull();
    expect(r.bundle!.discountPct).toBe(8);
    expect(r.aLaCarteSubtotalCents).toBeGreaterThan(r.subtotalCents);
    expect(r.aLaCarteSubtotalCents - r.subtotalCents).toBe(r.bundleSavingsCents);
  });

  it("ceramic upgrade prices under the length cap but is rejected above it", () => {
    const ok = calculateQuote({ serviceLine: "storage", items: [{ serviceId: "ceramic_upgrade", lengthFt: 24 }] });
    expect(ok.lineItems[0].amountCents).toBe(204000); // 8500*24 (rate unchanged)
    expect(() =>
      calculateQuote({ serviceLine: "storage", items: [{ serviceId: "ceramic_upgrade", lengthFt: 30 }] }),
    ).toThrow(/not available above 26/);
  });

  it("ceramic upgrade is never bundle-eligible (not part of any bundle)", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      bundleId: "winter_ready",
      items: [storage(24), wrap(24), { serviceId: "ceramic_upgrade", lengthFt: 24 }],
    });
    const ceramic = r.lineItems.find((l) => l.serviceId === "ceramic_upgrade")!;
    expect(ceramic.bundleEligible).toBe(false);
    // Discount only on storage+wrap; ceramic added at full price.
    expect(r.bundle!.eligibleSubtotalCents).toBe(180000);
    expect(r.subtotalCents).toBe(165600 + 204000);
  });

  it("rejects zero / absurd / unknown inputs cleanly", () => {
    expect(() => calculateQuote({ serviceLine: "storage", items: [storage(0)] })).toThrow(/positive boat length/);
    expect(() => calculateQuote({ serviceLine: "storage", items: [storage(-5)] })).toThrow(/positive boat length/);
    expect(() => calculateQuote({ serviceLine: "storage", items: [storage(500)] })).toThrow(/maximum/);
    expect(() => calculateQuote({ serviceLine: "storage", items: [{ serviceId: "winterization_inboard", engineCount: 0 }] })).toThrow(/engine count/);
    expect(() => calculateQuote({ serviceLine: "storage", items: [{ serviceId: "not_a_service", lengthFt: 20 }] })).toThrow(/Unknown storage service/);
    expect(() => calculateQuote({ serviceLine: "storage", bundleId: "nope", items: [storage(24), wrap(24)] })).toThrow(/Unknown bundle/);
    expect(() => calculateQuote({ serviceLine: "storage", items: [] })).toThrow(/non-empty/);
    // A bundle whose required services are missing.
    expect(() => calculateQuote({ serviceLine: "storage", bundleId: "winter_ready_plus", items: [storage(24), wrap(24)] })).toThrow(/requires a winterization/);
  });

  it("bundle winterization_* resolves to ALL winterization lines (order-independent, all discounted)", () => {
    const build = (win: QuoteItemInput[]) =>
      calculateQuote({
        serviceLine: "storage",
        hullType: "cruiser",
        bundleId: "full_care",
        items: [storage(30), wrap(30), { serviceId: "fall_detail", lengthFt: 30 }, { serviceId: "spring_commissioning" }, ...win],
      });
    const a = build([{ serviceId: "winterization_inboard", engineCount: 2 }, { serviceId: "winterization_outboard", engineCount: 1 }]);
    const b = build([{ serviceId: "winterization_outboard", engineCount: 1 }, { serviceId: "winterization_inboard", engineCount: 2 }]);
    // À-la-carte 428900 → 12% off the full eligible total → 377432, regardless of item order.
    expect(a.subtotalCents).toBe(377432);
    expect(b.subtotalCents).toBe(377432);
    expect(a.lineItems.filter((l) => l.serviceId.startsWith("winterization_")).every((l) => l.bundleEligible)).toBe(true);
  });
});

// v1.2.0 add-on services (additive, API-compatible): battery storage (per_unit,
// $100 ea), trailer storage (flat, $200 as of v1.3.0), spring wrap removal (tiered_by_length,
// $150 ≤26ft / $200 ≥27ft). All are add-ons OUTSIDE the bundles — never
// discounted, never required for a bundle.
describe("storage engine — v1.2.0 add-on services", () => {
  const battery = (quantity?: number): QuoteItemInput => ({ serviceId: "battery_storage", quantity });
  const wrapRemoval = (lengthFt: number): QuoteItemInput => ({ serviceId: "spring_wrap_removal", lengthFt });
  const oneAmt = (item: QuoteItemInput) => calculateQuote({ serviceLine: "storage", items: [item] }).lineItems[0];

  it("battery storage is $100 per battery (default 1 / 1 / 2 / 4)", () => {
    expect(oneAmt(battery()).amountCents).toBe(10000); // quantity defaults to 1
    expect(oneAmt(battery(1)).amountCents).toBe(10000);
    expect(oneAmt(battery(2)).amountCents).toBe(20000);
    expect(oneAmt(battery(4)).amountCents).toBe(40000);
    expect(oneAmt(battery(2)).detail.unitCount).toBe(2);
    expect(oneAmt(battery(2)).bundleEligible).toBe(false);
  });

  it("trailer storage is a flat $200 (v1.3.0 ratified rate, was $400)", () => {
    const line = oneAmt({ serviceId: "trailer_storage" });
    expect(line.amountCents).toBe(20000);
    expect(line.detail.type).toBe("flat");
    expect(line.bundleEligible).toBe(false);
  });

  it("spring wrap removal is $150 up to 26 ft (20 / 24 / 26)", () => {
    expect(oneAmt(wrapRemoval(20)).amountCents).toBe(15000);
    expect(oneAmt(wrapRemoval(24)).amountCents).toBe(15000);
    expect(oneAmt(wrapRemoval(26)).amountCents).toBe(15000);
  });

  it("spring wrap removal is $200 at 27 ft and over (27 / 30 / 38)", () => {
    expect(oneAmt(wrapRemoval(27)).amountCents).toBe(20000);
    expect(oneAmt(wrapRemoval(30)).amountCents).toBe(20000);
    expect(oneAmt(wrapRemoval(38)).amountCents).toBe(20000);
  });

  it("does not change any existing rate — storage $50/ft, shrink $25/ft, winterization $400", () => {
    expect(oneAmt(storage(24)).amountCents).toBe(120000);
    expect(oneAmt(wrap(24)).amountCents).toBe(60000);
    expect(oneAmt({ serviceId: "winterization_sterndrive", engineType: "sterndrive" }).amountCents).toBe(40000);
  });

  // 24 ft sterndrive: storage $1,200 + wrap $600 + winterization $400 + trailer
  // $200 + 2 batteries $200 + wrap removal (≤26) $150 = $2,750.
  // NOTE: this is a synthetic cart, NOT the runabout+Waverunner package — it
  // happened to total $2,950 while the trailer was $400. Unrelated to that quote.
  const fullCart: QuoteItemInput[] = [
    storage(24),
    wrap(24),
    { serviceId: "winterization_sterndrive", engineType: "sterndrive", engineCount: 1 },
    { serviceId: "trailer_storage" },
    battery(2),
    wrapRemoval(24),
  ];

  it("the full six-service cart totals $2,750 à-la-carte", () => {
    expect(calculateQuote({ serviceLine: "storage", items: fullCart }).aLaCarteSubtotalCents).toBe(275000);
  });

  it("Winter Ready Plus discounts ONLY the storage+wrap+winterization trio → $2,530", () => {
    const r = calculateQuote({ serviceLine: "storage", bundleId: "winter_ready_plus", items: fullCart });
    expect(r.bundle!.eligibleSubtotalCents).toBe(220000); // trio only
    expect(r.bundleSavingsCents).toBe(22000); // 10% of $2,200
    expect(r.subtotalCents).toBe(253000); // $2,750 − $220
    for (const id of ["trailer_storage", "battery_storage", "spring_wrap_removal"]) {
      expect(r.lineItems.find((l) => l.serviceId === id)!.bundleEligible).toBe(false);
    }
  });

  it("rejects an invalid battery quantity", () => {
    expect(() => calculateQuote({ serviceLine: "storage", items: [battery(0)] })).toThrow(/quantity/);
    expect(() => calculateQuote({ serviceLine: "storage", items: [{ serviceId: "battery_storage", quantity: 2.5 }] })).toThrow(/quantity/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// v1.3.0 — rates ratified for the 2026/27 season.
//
//   transport bands (per trip)   local $150 / regional $250 / extended $375
//   transport beyond band        $3.50/km (per_km)
//   trailer provided             $200/season  (rate change: was $400)
//   PWC storage                  $450/season/PWC
//   PWC winterization            $175/PWC
//   extended storage             $100 per vessel per month after April 30
//   oil change                   outboard $175/engine, PWC $150/PWC
//   battery storage              $100/battery (unchanged, shipped in v1.2.0)
// ─────────────────────────────────────────────────────────────────────────────
describe("storage engine — v1.3.0 ratified rates", () => {
  const one = (item: QuoteItemInput) =>
    calculateQuote({ serviceLine: "storage", items: [item] }).lineItems[0];

  it("transport bands price per trip", () => {
    expect(one({ serviceId: "transport_local" }).amountCents).toBe(15000);
    expect(one({ serviceId: "transport_regional" }).amountCents).toBe(25000);
    expect(one({ serviceId: "transport_extended" }).amountCents).toBe(37500);
  });

  it("transport bands scale by trip count (round trip = 2)", () => {
    expect(one({ serviceId: "transport_regional", quantity: 2 }).amountCents).toBe(50000);
  });

  it("transport beyond the extended band is $3.50/km", () => {
    const line = one({ serviceId: "transport_beyond_per_km", distanceKm: 120 });
    expect(line.amountCents).toBe(42000); // 120 × $3.50
    expect(line.detail.distanceKm).toBe(120);
  });

  it("per_km requires a positive, sane distance", () => {
    expect(() => one({ serviceId: "transport_beyond_per_km" })).toThrow(/distanceKm/);
    expect(() => one({ serviceId: "transport_beyond_per_km", distanceKm: 0 })).toThrow(/distanceKm/);
    expect(() => one({ serviceId: "transport_beyond_per_km", distanceKm: 5000 })).toThrow(/exceeds/);
  });

  it("PWC storage and winterization price per PWC", () => {
    expect(one({ serviceId: "pwc_storage" }).amountCents).toBe(45000);
    expect(one({ serviceId: "pwc_winterization" }).amountCents).toBe(17500);
    expect(one({ serviceId: "pwc_storage", quantity: 2 }).amountCents).toBe(90000);
  });

  it("oil changes: outboard $175/engine, PWC $150/PWC", () => {
    expect(one({ serviceId: "oil_change_outboard" }).amountCents).toBe(17500);
    expect(one({ serviceId: "oil_change_pwc" }).amountCents).toBe(15000);
    expect(one({ serviceId: "oil_change_outboard", quantity: 2 }).amountCents).toBe(35000);
  });

  it("extended storage is $100 per vessel-month after April 30", () => {
    expect(one({ serviceId: "extended_storage", quantity: 1 }).amountCents).toBe(10000);
    // 2 vessels × 3 months = 6 vessel-months.
    expect(one({ serviceId: "extended_storage", quantity: 6 }).amountCents).toBe(60000);
  });

  it("battery storage is unchanged at $100/battery", () => {
    expect(one({ serviceId: "battery_storage", quantity: 3 }).amountCents).toBe(30000);
  });

  // ── Golden fixture (a): the plan's 24ft anchor ────────────────────────────
  // 24ft × $50 storage + 24ft × $25 wrap + outboard winterization $275 = $2,075.
  it("GOLDEN (a): 24ft storage + wrap + outboard winterization = $2,075 subtotal", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      items: [
        { serviceId: "outdoor_storage", lengthFt: 24 },
        { serviceId: "shrink_wrap", lengthFt: 24 },
        { serviceId: "winterization_outboard", engineType: "outboard", engineCount: 1 },
      ],
    });
    expect(r.lineItems.map((l) => l.amountCents)).toEqual([120000, 60000, 27500]);
    expect(r.subtotalCents).toBe(207500);
  });

  // ── Golden fixture (d1): PWC-only ─────────────────────────────────────────
  it("GOLDEN (d1): PWC-only (storage + winterization) = $625 subtotal", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      items: [{ serviceId: "pwc_storage" }, { serviceId: "pwc_winterization" }],
    });
    expect(r.subtotalCents).toBe(62500);
  });

  // ── Golden fixture (d2): extended storage ─────────────────────────────────
  it("GOLDEN (d2): one vessel stored 2 months past April 30 = $200 subtotal", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      items: [{ serviceId: "extended_storage", quantity: 2 }],
    });
    expect(r.subtotalCents).toBe(20000);
  });
});
