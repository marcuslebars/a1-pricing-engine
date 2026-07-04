"use strict";
// Integer-cent money helpers. All storage math stays in integer cents; rounding
// happens here (nearest cent) and only here.
Object.defineProperty(exports, "__esModule", { value: true });
exports.perFootCents = perFootCents;
exports.applyMinimum = applyMinimum;
exports.discountCents = discountCents;
exports.additionalEngineUnitCents = additionalEngineUnitCents;
exports.formatCents = formatCents;
/** Per-foot subtotal in cents, rounded to the nearest cent. */
function perFootCents(rateCents, lengthFt) {
    return Math.round(rateCents * lengthFt);
}
/** Floor a service amount at its minimum. */
function applyMinimum(amountCents, minimumCents) {
    return Math.max(amountCents, minimumCents);
}
/** Percentage discount in cents, rounded to the nearest cent. */
function discountCents(eligibleCents, discountPct) {
    return Math.round((eligibleCents * discountPct) / 100);
}
/** Unit price for an additional engine (e.g. 75% of the base engine rate). */
function additionalEngineUnitCents(baseRateCents, multiplier) {
    return Math.round(baseRateCents * multiplier);
}
/** Format integer cents as a CAD string, e.g. 118800 -> "$1,188.00". */
function formatCents(cents) {
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    const dollars = Math.floor(abs / 100);
    const remainder = (abs % 100).toString().padStart(2, "0");
    const grouped = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${sign}$${grouped}.${remainder}`;
}
