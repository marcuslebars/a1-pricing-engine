import { describe, it, expect } from "vitest";
import { calculateQuote, type QuoteItemInput } from "../src/index";

const storage = (lengthFt: number): QuoteItemInput => ({ serviceId: "outdoor_storage", lengthFt });
const wrap = (lengthFt: number): QuoteItemInput => ({ serviceId: "shrink_wrap", lengthFt });

describe("storage engine — brief check cases (exact, to the cent)", () => {
  it("24ft bowrider, Winter Ready → $1,536.00 à-la-carte, $1,413.12 after 8%", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      hullType: "bowrider",
      bundleId: "winter_ready",
      items: [storage(24), wrap(24)],
    });
    expect(r.lineItems.find((l) => l.serviceId === "outdoor_storage")!.amountCents).toBe(110400);
    expect(r.lineItems.find((l) => l.serviceId === "shrink_wrap")!.amountCents).toBe(43200);
    expect(r.aLaCarteSubtotalCents).toBe(153600);
    expect(r.bundleSavingsCents).toBe(12288);
    expect(r.subtotalCents).toBe(141312);
  });

  it("22ft pontoon, outboard x1, Winter Ready Plus → $1,985.00 à-la-carte, $1,786.50 after 10%", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      hullType: "pontoon",
      bundleId: "winter_ready_plus",
      items: [storage(22), wrap(22), { serviceId: "winterization_outboard", engineType: "outboard", engineCount: 1 }],
    });
    // Hull surcharge applies to storage + wrap (flagged), NOT winterization.
    expect(r.lineItems.find((l) => l.serviceId === "outdoor_storage")!.amountCents).toBe(118800); // (46+8)*22
    expect(r.lineItems.find((l) => l.serviceId === "shrink_wrap")!.amountCents).toBe(57200); // (18+8)*22
    expect(r.lineItems.find((l) => l.serviceId === "winterization_outboard")!.amountCents).toBe(22500);
    expect(r.aLaCarteSubtotalCents).toBe(198500);
    expect(r.bundleSavingsCents).toBe(19850);
    expect(r.subtotalCents).toBe(178650);
  });

  it("14ft runabout, storage only → below minimum → $690.00", () => {
    const r = calculateQuote({ serviceLine: "storage", items: [storage(14)] });
    const line = r.lineItems[0];
    expect(line.amountCents).toBe(69000);
    expect(line.detail.minimumApplied).toBe(true);
    expect(r.subtotalCents).toBe(69000);
    expect(r.bundle).toBeNull();
  });

  it("28ft cruiser, twin inboards, Full Care → $3,420.25 à-la-carte, $3,009.82 after 12%", () => {
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
    expect(win.amountCents).toBe(69125); // 39500 + round(39500*0.75)=29625
    expect(win.detail.additionalEngineUnitCents).toBe(29625);
    expect(win.detail.engineCount).toBe(2);
    expect(r.lineItems.find((l) => l.serviceId === "fall_detail")!.amountCents).toBe(67200); // cruiser: no surcharge
    expect(r.aLaCarteSubtotalCents).toBe(342025);
    expect(r.bundleSavingsCents).toBe(41043);
    expect(r.subtotalCents).toBe(300982);
  });
});

describe("storage engine — rules & edge cases", () => {
  it("per-foot minimum floors a short boat (shrink wrap 14ft → $270.00)", () => {
    const r = calculateQuote({ serviceLine: "storage", items: [wrap(14)] });
    expect(r.lineItems[0].amountCents).toBe(27000);
    expect(r.lineItems[0].detail.minimumApplied).toBe(true);
  });

  it("tritoon hull surcharge is $10/ft on flagged services", () => {
    const r = calculateQuote({ serviceLine: "storage", hullType: "tritoon", items: [storage(20)] });
    // max(4600*20, 69000)=92000 + 1000*20=20000
    expect(r.lineItems[0].amountCents).toBe(112000);
    expect(r.hullSurchargePerFootCents).toBe(1000);
  });

  it("hull surcharge never applies to non-flagged services (fall detail on a pontoon)", () => {
    const r = calculateQuote({ serviceLine: "storage", hullType: "pontoon", items: [{ serviceId: "fall_detail", lengthFt: 20 }] });
    expect(r.lineItems[0].amountCents).toBe(48000); // 2400*20, no surcharge
    expect(r.lineItems[0].detail.hullSurchargeCents).toBe(0);
  });

  it("multi-engine winterization bills engine 2+ at the configured 75% (triple outboard)", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      items: [{ serviceId: "winterization_outboard", engineCount: 3 }],
    });
    // 22500 + 2 * round(22500*0.75)=22500 + 2*16875 = 56250
    expect(r.lineItems[0].amountCents).toBe(56250);
  });

  it("pontoon + bundle combine correctly (surcharge in the eligible base, then discounted)", () => {
    const r = calculateQuote({
      serviceLine: "storage",
      hullType: "pontoon",
      bundleId: "winter_ready",
      items: [storage(24), wrap(24)],
    });
    // storage (46+8)*24=129600, wrap (18+8)*24=62400 => 192000; -8% = 176640
    expect(r.aLaCarteSubtotalCents).toBe(192000);
    expect(r.bundleSavingsCents).toBe(15360);
    expect(r.subtotalCents).toBe(176640);
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
    expect(ok.lineItems[0].amountCents).toBe(204000); // 8500*24
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
    expect(r.bundle!.eligibleSubtotalCents).toBe(153600);
    expect(r.subtotalCents).toBe(141312 + 204000);
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
    // À-la-carte 382125 → 12% off the full eligible total → 336270, regardless of item order.
    expect(a.subtotalCents).toBe(336270);
    expect(b.subtotalCents).toBe(336270);
    expect(a.lineItems.filter((l) => l.serviceId.startsWith("winterization_")).every((l) => l.bundleEligible)).toBe(true);
  });
});
