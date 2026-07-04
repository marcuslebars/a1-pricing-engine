"use strict";
// Typed loader for the shared pricing config — the single source of truth.
//
// Two consumption views:
//   CARE     — marine_care + coatings service lines, amounts in whole CAD dollars
//              (matches the live Marine Care quote tool exactly).
//   STORAGE  — the storage service line, amounts in integer CAD cents.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAW_CONFIG = exports.STORAGE = exports.CARE = void 0;
const pricing_config_json_1 = __importDefault(require("./pricing.config.json"));
const config = pricing_config_json_1.default;
/** Flat, typed view of every price the Marine Care quote tool needs (CAD dollars). */
exports.CARE = {
    startingRatesBySlug: config.marine_care.startingRatesBySlug,
    gelcoat: config.marine_care.services.gelcoat,
    exterior: config.marine_care.services.exterior,
    interior: config.marine_care.services.interior,
    wetSanding: config.marine_care.services.wetSanding,
    bottomPainting: config.marine_care.services.bottomPainting,
    vinyl: config.marine_care.services.vinyl,
    weeklyMaintenance: config.marine_care.services.weeklyMaintenance,
    biweeklyMaintenance: config.marine_care.services.biweeklyMaintenance,
    ceramic: config.coatings.services.ceramic,
    graphene: config.coatings.services.graphene,
};
/** The storage service line (CAD cents) consumed by the Marine Storage site. */
exports.STORAGE = config.storage;
/** Raw config, exposed for tooling/debugging. */
exports.RAW_CONFIG = pricing_config_json_1.default;
