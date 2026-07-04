// Integer-cent money helpers. All storage math stays in integer cents; rounding
// happens here (nearest cent) and only here.

/** Per-foot subtotal in cents, rounded to the nearest cent. */
export function perFootCents(rateCents: number, lengthFt: number): number {
  return Math.round(rateCents * lengthFt);
}

/** Floor a service amount at its minimum. */
export function applyMinimum(amountCents: number, minimumCents: number): number {
  return Math.max(amountCents, minimumCents);
}

/** Percentage discount in cents, rounded to the nearest cent. */
export function discountCents(eligibleCents: number, discountPct: number): number {
  return Math.round((eligibleCents * discountPct) / 100);
}

/** Unit price for an additional engine (e.g. 75% of the base engine rate). */
export function additionalEngineUnitCents(baseRateCents: number, multiplier: number): number {
  return Math.round(baseRateCents * multiplier);
}

/** Format integer cents as a CAD string, e.g. 118800 -> "$1,188.00". */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = (abs % 100).toString().padStart(2, "0");
  const grouped = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${grouped}.${remainder}`;
}
