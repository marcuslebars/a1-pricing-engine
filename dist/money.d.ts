/** Per-foot subtotal in cents, rounded to the nearest cent. */
export declare function perFootCents(rateCents: number, lengthFt: number): number;
/** Floor a service amount at its minimum. */
export declare function applyMinimum(amountCents: number, minimumCents: number): number;
/** Percentage discount in cents, rounded to the nearest cent. */
export declare function discountCents(eligibleCents: number, discountPct: number): number;
/**
 * Unit price for an additional engine (e.g. 75% of the base engine rate).
 *
 * The multiplier is applied as configured, then the result is rounded to the
 * nearest whole DOLLAR (not cent) so multi-engine winterization lines quote in
 * clean dollars — e.g. $275 × 0.75 = $206.25 → $206, $445 × 0.75 = $333.75 →
 * $334. ($400 × 0.75 = $300 is unaffected.) This rounds the OUTPUT only; the
 * 0.75 multiplier itself is unchanged.
 */
export declare function additionalEngineUnitCents(baseRateCents: number, multiplier: number): number;
/** Format integer cents as a CAD string, e.g. 118800 -> "$1,188.00". */
export declare function formatCents(cents: number): string;
