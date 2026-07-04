"use strict";
// @a1/pricing-engine — the single source of truth for A1 Marine pricing.
//
//   Marine Care  (a1marinecare.ca): calculateTotal / calculateGelcoat / ... + CARE
//   Marine Storage (a1marinestorage.ca): calculateQuote + STORAGE
//
// All prices live in ./pricing.config.json.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCents = exports.additionalEngineUnitCents = exports.discountCents = exports.applyMinimum = exports.perFootCents = void 0;
__exportStar(require("./config"), exports);
__exportStar(require("./marine-care"), exports);
__exportStar(require("./storage"), exports);
var money_1 = require("./money");
Object.defineProperty(exports, "perFootCents", { enumerable: true, get: function () { return money_1.perFootCents; } });
Object.defineProperty(exports, "applyMinimum", { enumerable: true, get: function () { return money_1.applyMinimum; } });
Object.defineProperty(exports, "discountCents", { enumerable: true, get: function () { return money_1.discountCents; } });
Object.defineProperty(exports, "additionalEngineUnitCents", { enumerable: true, get: function () { return money_1.additionalEngineUnitCents; } });
Object.defineProperty(exports, "formatCents", { enumerable: true, get: function () { return money_1.formatCents; } });
