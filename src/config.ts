// Typed loader for the shared pricing config — the single source of truth.
//
// Two consumption views:
//   CARE     — marine_care + coatings service lines, amounts in whole CAD dollars
//              (matches the live Marine Care quote tool exactly).
//   STORAGE  — the storage service line, amounts in integer CAD cents.

import rawConfig from "./pricing.config.json";

// ── Marine Care (dollars) ────────────────────────────────────────────────────

export interface GelcoatBand {
  maxFt: number | null;
  rate: number;
}

export interface CareGelcoat {
  label: string;
  rateBands: { hull: GelcoatBand[]; topsides: GelcoatBand[] };
  bowriderTopsidesFactor: number;
  heavyOxidationSurchargePct: number;
  addons: { radarArch: number; hardTop: number };
  spotWetSandingPerArea: number;
}

export interface CareExterior {
  label: string;
  baseRatePerFoot: number;
  tierMultipliers: Record<string, number>;
  addons: { teakCleaning: number; canvasCleaning: number; fenderCleaning: number; exteriorOzone: number };
}

export interface CareInterior {
  label: string;
  baseRatePerFoot: number;
  tierMultipliers: Record<string, number>;
  boatTypeMultipliers: Record<string, number>;
  estimateRange: { low: number; high: number };
  addons: {
    moldRemediation: number;
    petHairRemoval: number;
    mattressShampoo: number;
    headDeepClean: number;
    galleyDeepClean: number;
    ozoneInterior: number;
  };
  manualReview: { maxLengthFt: number };
}

export interface CareWetSanding {
  label: string;
  baseRatePerFoot: number;
  addons: { deepScratchRepair: number };
  spotWetSandingPerArea: number;
}

export interface CareBottomPainting {
  label: string;
  baseRatePerFoot: number;
  perFootAddons: { secondCoat: number; oldPaintRemoval: number };
  addons: { heavyGrowthRemoval: number };
}

export interface CareVinyl {
  label: string;
  ratesPerFoot: { removal: number; install: number; both: number };
  addons: { customDesign: number };
}

export interface CareCeramic {
  label: string;
  baseRatePerFoot: number;
  perFootAddons: { secondLayer: number };
  addons: { teakCeramic: number; interiorCeramic: number };
}

export interface CareGraphene {
  label: string;
  baseRatePerFoot: number;
  perFootAddons: { secondLayer: number };
  addons: { teakGraphene: number };
}

export interface CareMaintenance {
  label: string;
  ratePerFoot: number;
}

// ── Storage (integer cents) ──────────────────────────────────────────────────

export interface StoragePerFootService {
  type: "per_foot";
  rateCents: number;
  minimumCents: number;
  label: string;
  hullSurchargeEligible?: boolean;
  maxLengthFt?: number;
  upsellOnly?: boolean;
}

export interface StorageFlatService {
  type: "flat";
  rateCents: number;
  label: string;
}

export interface StorageFlatPerEngineService {
  type: "flat_per_engine";
  rateCents: number;
  additionalEngineMultiplier: number;
  label: string;
}

/** Per-unit quantity pricing: rateCents × quantity (e.g. batteries at $100 each). */
export interface StoragePerUnitService {
  type: "per_unit";
  rateCents: number;
  /** Singular noun for one unit, e.g. "battery" — used in line descriptions. */
  unitLabel: string;
  label: string;
  /** Optional sanity cap on quantity. */
  maxQuantity?: number;
}

/**
 * Flat price selected by a boat-length tier — the engine picks the first tier
 * whose `maxFt` covers the boat length (a `null` maxFt is the open-ended top tier).
 */
export interface StorageTieredByLengthService {
  type: "tiered_by_length";
  tiers: { maxFt: number | null; rateCents: number }[];
  label: string;
}

/**
 * Distance pricing for transport beyond the furthest quoted band: rateCents × km.
 * Bands (local / regional / extended) are flat per-trip `per_unit` services; this
 * covers the "beyond — quoted per km" case only.
 */
export interface StoragePerKmService {
  type: "per_km";
  rateCents: number;
  label: string;
  /** Optional sanity cap on distance. */
  maxDistanceKm?: number;
}

export type StorageService =
  | StoragePerFootService
  | StorageFlatService
  | StorageFlatPerEngineService
  | StoragePerUnitService
  | StorageTieredByLengthService
  | StoragePerKmService;

export interface StorageBundle {
  label: string;
  services: string[];
  discountPct: number;
}

export interface StorageConfig {
  currency: string;
  services: Record<string, StorageService>;
  hullSurcharges: Record<string, { perFootCents: number }>;
  bundles: Record<string, StorageBundle>;
  notes?: string;
}

const config = rawConfig as unknown as {
  marine_care: {
    startingRatesBySlug: Record<string, number>;
    services: {
      gelcoat: CareGelcoat;
      exterior: CareExterior;
      interior: CareInterior;
      wetSanding: CareWetSanding;
      bottomPainting: CareBottomPainting;
      vinyl: CareVinyl;
      weeklyMaintenance: CareMaintenance;
      biweeklyMaintenance: CareMaintenance;
    };
  };
  coatings: {
    services: {
      ceramic: CareCeramic;
      graphene: CareGraphene;
    };
  };
  storage: StorageConfig;
};

/** Flat, typed view of every price the Marine Care quote tool needs (CAD dollars). */
export const CARE = {
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
} as const;

/** The storage service line (CAD cents) consumed by the Marine Storage site. */
export const STORAGE: StorageConfig = config.storage;

/** Raw config, exposed for tooling/debugging. */
export const RAW_CONFIG = rawConfig;
