"use strict";
// @a1/pricing-engine — the single source of truth for A1 Marine pricing.
//
//   Marine Care  (a1marinecare.ca): calculateTotal / calculateGelcoat / ... + CARE
//   Marine Storage (a1marinestorage.ca): calculateQuote + STORAGE
//
// All prices live in ./pricing.config.json.
//
// Values are re-exported explicitly (not `export *`) so they are detectable by
// Node's CommonJS named-export lexer when the built CJS package is imported from
// an ESM context (the storage server runs this way).
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCents = exports.additionalEngineUnitCents = exports.discountCents = exports.applyMinimum = exports.perFootCents = exports.calculateQuote = exports.RAW_CONFIG = exports.STORAGE = exports.CARE = exports.calculateTotal = exports.calculateBiweeklyMaintenance = exports.calculateWeeklyMaintenance = exports.calculateVinyl = exports.calculateBottomPainting = exports.calculateWetSanding = exports.calculateGraphene = exports.calculateCeramic = exports.calculateInterior = exports.calculateExterior = exports.calculateGelcoat = exports.getServiceStartingPriceLabel = exports.getServiceStartingRateBySlug = exports.SERVICE_STARTING_RATE_BY_SLUG = void 0;
// ── Marine Care ──────────────────────────────────────────────────────────────
var marine_care_1 = require("./marine-care");
Object.defineProperty(exports, "SERVICE_STARTING_RATE_BY_SLUG", { enumerable: true, get: function () { return marine_care_1.SERVICE_STARTING_RATE_BY_SLUG; } });
Object.defineProperty(exports, "getServiceStartingRateBySlug", { enumerable: true, get: function () { return marine_care_1.getServiceStartingRateBySlug; } });
Object.defineProperty(exports, "getServiceStartingPriceLabel", { enumerable: true, get: function () { return marine_care_1.getServiceStartingPriceLabel; } });
Object.defineProperty(exports, "calculateGelcoat", { enumerable: true, get: function () { return marine_care_1.calculateGelcoat; } });
Object.defineProperty(exports, "calculateExterior", { enumerable: true, get: function () { return marine_care_1.calculateExterior; } });
Object.defineProperty(exports, "calculateInterior", { enumerable: true, get: function () { return marine_care_1.calculateInterior; } });
Object.defineProperty(exports, "calculateCeramic", { enumerable: true, get: function () { return marine_care_1.calculateCeramic; } });
Object.defineProperty(exports, "calculateGraphene", { enumerable: true, get: function () { return marine_care_1.calculateGraphene; } });
Object.defineProperty(exports, "calculateWetSanding", { enumerable: true, get: function () { return marine_care_1.calculateWetSanding; } });
Object.defineProperty(exports, "calculateBottomPainting", { enumerable: true, get: function () { return marine_care_1.calculateBottomPainting; } });
Object.defineProperty(exports, "calculateVinyl", { enumerable: true, get: function () { return marine_care_1.calculateVinyl; } });
Object.defineProperty(exports, "calculateWeeklyMaintenance", { enumerable: true, get: function () { return marine_care_1.calculateWeeklyMaintenance; } });
Object.defineProperty(exports, "calculateBiweeklyMaintenance", { enumerable: true, get: function () { return marine_care_1.calculateBiweeklyMaintenance; } });
Object.defineProperty(exports, "calculateTotal", { enumerable: true, get: function () { return marine_care_1.calculateTotal; } });
// ── Config views ─────────────────────────────────────────────────────────────
var config_1 = require("./config");
Object.defineProperty(exports, "CARE", { enumerable: true, get: function () { return config_1.CARE; } });
Object.defineProperty(exports, "STORAGE", { enumerable: true, get: function () { return config_1.STORAGE; } });
Object.defineProperty(exports, "RAW_CONFIG", { enumerable: true, get: function () { return config_1.RAW_CONFIG; } });
// ── Storage engine ───────────────────────────────────────────────────────────
var storage_1 = require("./storage");
Object.defineProperty(exports, "calculateQuote", { enumerable: true, get: function () { return storage_1.calculateQuote; } });
// ── Money helpers ────────────────────────────────────────────────────────────
var money_1 = require("./money");
Object.defineProperty(exports, "perFootCents", { enumerable: true, get: function () { return money_1.perFootCents; } });
Object.defineProperty(exports, "applyMinimum", { enumerable: true, get: function () { return money_1.applyMinimum; } });
Object.defineProperty(exports, "discountCents", { enumerable: true, get: function () { return money_1.discountCents; } });
Object.defineProperty(exports, "additionalEngineUnitCents", { enumerable: true, get: function () { return money_1.additionalEngineUnitCents; } });
Object.defineProperty(exports, "formatCents", { enumerable: true, get: function () { return money_1.formatCents; } });
