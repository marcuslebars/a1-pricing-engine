export interface BoatDetails {
    length: number;
    type: string;
    location: string;
}
export interface ContactInfo {
    fullName: string;
    email: string;
    phone: string;
}
export interface GelcoatConfig {
    area: "hull" | "topsides" | "bowrider" | "fullboat";
    radarArch: boolean;
    hardTop: boolean;
    spotWetSanding: number;
    heavyOxidation: boolean;
}
export interface ExteriorConfig {
    tier: "refresh" | "standard" | "deep" | "restoration";
    teakCleaning: boolean;
    canvasCleaning: boolean;
    fenderCleaning: boolean;
    exteriorOzone: boolean;
}
export interface InteriorConfig {
    tier: "refresh" | "standard" | "deep" | "restoration";
    moldRemediation: boolean;
    mattressShampoo: boolean;
    headDeepClean: boolean;
    galleyDeepClean: boolean;
    petHairRemoval: boolean;
    ozoneInterior: boolean;
    photos?: File[];
    photoConfirmation?: boolean;
}
export interface CeramicConfig {
    secondLayer: boolean;
    teakCeramic: boolean;
    interiorCeramic: boolean;
}
export interface GrapheneConfig {
    secondLayer: boolean;
    teakGraphene: boolean;
}
export interface WetSandingConfig {
    deepScratchRepair: boolean;
    spotWetSanding: number;
}
export interface BottomPaintingConfig {
    secondCoat: boolean;
    oldPaintRemoval: boolean;
    heavyGrowthRemoval: boolean;
    blisterRepair: boolean;
}
export interface VinylConfig {
    service: "removal" | "install" | "both";
    customDesign: boolean;
}
export interface MaintenancePlanConfig {
    cadence: "weekly" | "biweekly";
}
export interface ServiceSelections {
    gelcoat?: GelcoatConfig;
    exterior?: ExteriorConfig;
    interior?: InteriorConfig;
    ceramic?: CeramicConfig;
    graphene?: GrapheneConfig;
    wetSanding?: WetSandingConfig;
    bottomPainting?: BottomPaintingConfig;
    vinyl?: VinylConfig;
    weeklyMaintenance?: MaintenancePlanConfig;
    biweeklyMaintenance?: MaintenancePlanConfig;
}
export interface PricingResult {
    subtotal: number;
    breakdown: string[];
    requiresManualReview: boolean;
    reviewReasons: string[];
}
export declare const SERVICE_STARTING_RATE_BY_SLUG: Record<string, number>;
export declare function getServiceStartingRateBySlug(slug: string): number | null;
export declare function getServiceStartingPriceLabel(slug: string): string;
export declare function calculateGelcoat(length: number, config: GelcoatConfig): PricingResult;
export declare function calculateExterior(length: number, config: ExteriorConfig): PricingResult;
export declare function calculateInterior(length: number, boatType: string, config: InteriorConfig): PricingResult;
export declare function calculateCeramic(length: number, config: CeramicConfig): PricingResult;
export declare function calculateGraphene(length: number, config: GrapheneConfig): PricingResult;
export declare function calculateWetSanding(length: number, config: WetSandingConfig): PricingResult;
export declare function calculateBottomPainting(length: number, config: BottomPaintingConfig): PricingResult;
export declare function calculateVinyl(length: number, config: VinylConfig): PricingResult;
export declare function calculateWeeklyMaintenance(length: number): PricingResult;
export declare function calculateBiweeklyMaintenance(length: number): PricingResult;
export declare function calculateTotal(length: number, boatType: string, services: ServiceSelections): PricingResult;
