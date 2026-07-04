export interface GelcoatBand {
    maxFt: number | null;
    rate: number;
}
export interface CareGelcoat {
    label: string;
    rateBands: {
        hull: GelcoatBand[];
        topsides: GelcoatBand[];
    };
    bowriderTopsidesFactor: number;
    heavyOxidationSurchargePct: number;
    addons: {
        radarArch: number;
        hardTop: number;
    };
    spotWetSandingPerArea: number;
}
export interface CareExterior {
    label: string;
    baseRatePerFoot: number;
    tierMultipliers: Record<string, number>;
    addons: {
        teakCleaning: number;
        canvasCleaning: number;
        fenderCleaning: number;
        exteriorOzone: number;
    };
}
export interface CareInterior {
    label: string;
    baseRatePerFoot: number;
    tierMultipliers: Record<string, number>;
    boatTypeMultipliers: Record<string, number>;
    estimateRange: {
        low: number;
        high: number;
    };
    addons: {
        moldRemediation: number;
        petHairRemoval: number;
        mattressShampoo: number;
        headDeepClean: number;
        galleyDeepClean: number;
        ozoneInterior: number;
    };
    manualReview: {
        maxLengthFt: number;
    };
}
export interface CareWetSanding {
    label: string;
    baseRatePerFoot: number;
    addons: {
        deepScratchRepair: number;
    };
    spotWetSandingPerArea: number;
}
export interface CareBottomPainting {
    label: string;
    baseRatePerFoot: number;
    perFootAddons: {
        secondCoat: number;
        oldPaintRemoval: number;
    };
    addons: {
        heavyGrowthRemoval: number;
    };
}
export interface CareVinyl {
    label: string;
    ratesPerFoot: {
        removal: number;
        install: number;
        both: number;
    };
    addons: {
        customDesign: number;
    };
}
export interface CareCeramic {
    label: string;
    baseRatePerFoot: number;
    perFootAddons: {
        secondLayer: number;
    };
    addons: {
        teakCeramic: number;
        interiorCeramic: number;
    };
}
export interface CareGraphene {
    label: string;
    baseRatePerFoot: number;
    perFootAddons: {
        secondLayer: number;
    };
    addons: {
        teakGraphene: number;
    };
}
export interface CareMaintenance {
    label: string;
    ratePerFoot: number;
}
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
export type StorageService = StoragePerFootService | StorageFlatService | StorageFlatPerEngineService;
export interface StorageBundle {
    label: string;
    services: string[];
    discountPct: number;
}
export interface StorageConfig {
    currency: string;
    services: Record<string, StorageService>;
    hullSurcharges: Record<string, {
        perFootCents: number;
    }>;
    bundles: Record<string, StorageBundle>;
    notes?: string;
}
/** Flat, typed view of every price the Marine Care quote tool needs (CAD dollars). */
export declare const CARE: {
    readonly startingRatesBySlug: Record<string, number>;
    readonly gelcoat: CareGelcoat;
    readonly exterior: CareExterior;
    readonly interior: CareInterior;
    readonly wetSanding: CareWetSanding;
    readonly bottomPainting: CareBottomPainting;
    readonly vinyl: CareVinyl;
    readonly weeklyMaintenance: CareMaintenance;
    readonly biweeklyMaintenance: CareMaintenance;
    readonly ceramic: CareCeramic;
    readonly graphene: CareGraphene;
};
/** The storage service line (CAD cents) consumed by the Marine Storage site. */
export declare const STORAGE: StorageConfig;
/** Raw config, exposed for tooling/debugging. */
export declare const RAW_CONFIG: {
    _meta: {
        description: string;
        units: string;
    };
    marine_care: {
        amountsIn: string;
        startingRatesBySlug: {
            "boat-detailing": number;
            "gelcoat-restoration": number;
            "ceramic-coating": number;
            "interior-detailing": number;
            "graphene-coating": number;
            "wet-sanding": number;
            "bottom-painting": number;
            "vinyl-removal": number;
            "weekly-maintenance-plan": number;
            "bi-weekly-maintenance-plan": number;
        };
        services: {
            gelcoat: {
                label: string;
                rateBands: {
                    hull: ({
                        maxFt: number;
                        rate: number;
                    } | {
                        maxFt: null;
                        rate: number;
                    })[];
                    topsides: ({
                        maxFt: number;
                        rate: number;
                    } | {
                        maxFt: null;
                        rate: number;
                    })[];
                };
                bowriderTopsidesFactor: number;
                heavyOxidationSurchargePct: number;
                addons: {
                    radarArch: number;
                    hardTop: number;
                };
                spotWetSandingPerArea: number;
            };
            exterior: {
                label: string;
                baseRatePerFoot: number;
                tierMultipliers: {
                    refresh: number;
                    standard: number;
                    deep: number;
                    restoration: number;
                };
                addons: {
                    teakCleaning: number;
                    canvasCleaning: number;
                    fenderCleaning: number;
                    exteriorOzone: number;
                };
            };
            interior: {
                label: string;
                baseRatePerFoot: number;
                tierMultipliers: {
                    refresh: number;
                    standard: number;
                    deep: number;
                    restoration: number;
                };
                boatTypeMultipliers: {
                    "Open Bow / Bowrider": number;
                    "Cuddy Cabin": number;
                    "Cruiser (Single Cabin)": number;
                    "Express Cruiser": number;
                    "Yacht / Multi-Cabin": number;
                };
                estimateRange: {
                    low: number;
                    high: number;
                };
                addons: {
                    moldRemediation: number;
                    petHairRemoval: number;
                    mattressShampoo: number;
                    headDeepClean: number;
                    galleyDeepClean: number;
                    ozoneInterior: number;
                };
                manualReview: {
                    maxLengthFt: number;
                };
            };
            wetSanding: {
                label: string;
                baseRatePerFoot: number;
                addons: {
                    deepScratchRepair: number;
                };
                spotWetSandingPerArea: number;
            };
            bottomPainting: {
                label: string;
                baseRatePerFoot: number;
                perFootAddons: {
                    secondCoat: number;
                    oldPaintRemoval: number;
                };
                addons: {
                    heavyGrowthRemoval: number;
                };
            };
            vinyl: {
                label: string;
                ratesPerFoot: {
                    removal: number;
                    install: number;
                    both: number;
                };
                addons: {
                    customDesign: number;
                };
            };
            weeklyMaintenance: {
                label: string;
                ratePerFoot: number;
            };
            biweeklyMaintenance: {
                label: string;
                ratePerFoot: number;
            };
        };
    };
    coatings: {
        amountsIn: string;
        services: {
            ceramic: {
                label: string;
                baseRatePerFoot: number;
                perFootAddons: {
                    secondLayer: number;
                };
                addons: {
                    teakCeramic: number;
                    interiorCeramic: number;
                };
            };
            graphene: {
                label: string;
                baseRatePerFoot: number;
                perFootAddons: {
                    secondLayer: number;
                };
                addons: {
                    teakGraphene: number;
                };
            };
        };
    };
    storage: {
        currency: string;
        services: {
            outdoor_storage: {
                type: string;
                rateCents: number;
                minimumCents: number;
                label: string;
                hullSurchargeEligible: boolean;
            };
            shrink_wrap: {
                type: string;
                rateCents: number;
                minimumCents: number;
                label: string;
                hullSurchargeEligible: boolean;
            };
            winterization_outboard: {
                type: string;
                rateCents: number;
                additionalEngineMultiplier: number;
                label: string;
            };
            winterization_sterndrive: {
                type: string;
                rateCents: number;
                additionalEngineMultiplier: number;
                label: string;
            };
            winterization_inboard: {
                type: string;
                rateCents: number;
                additionalEngineMultiplier: number;
                label: string;
            };
            fall_detail: {
                type: string;
                rateCents: number;
                minimumCents: number;
                label: string;
                hullSurchargeEligible: boolean;
            };
            spring_commissioning: {
                type: string;
                rateCents: number;
                label: string;
            };
            ceramic_upgrade: {
                type: string;
                rateCents: number;
                minimumCents: number;
                label: string;
                maxLengthFt: number;
                upsellOnly: boolean;
                hullSurchargeEligible: boolean;
            };
        };
        hullSurcharges: {
            pontoon: {
                perFootCents: number;
            };
            tritoon: {
                perFootCents: number;
            };
        };
        bundles: {
            winter_ready: {
                label: string;
                services: string[];
                discountPct: number;
            };
            winter_ready_plus: {
                label: string;
                services: string[];
                discountPct: number;
            };
            full_care: {
                label: string;
                services: string[];
                discountPct: number;
            };
        };
        notes: string;
    };
};
