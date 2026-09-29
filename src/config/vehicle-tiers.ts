/**
 * Single source of truth for the Drive for Work vehicle tiers.
 * Ids are stable stored values (form payloads, database, analytics).
 * name / description / disclaimer are translation keys in the `acquisition`
 * namespace; platform names are proper nouns and stay as-is. Do not list specific
 * vehicle models here: we do not guarantee a particular car.
 */
export const VEHICLE_TIER_IDS = ["delivery", "standard", "comfort", "xl"] as const;
export type VehicleTierId = (typeof VEHICLE_TIER_IDS)[number];

/** Either a proper noun rendered as-is, or a translation key. */
export type TierLabel = string | { i18nKey: string };

export interface VehicleTier {
  id: VehicleTierId;
  name: string;
  description: string;
  /** Translated description of the vehicle types in this tier (no specific models). */
  similarVehicles: string;
  intendedPlatforms: TierLabel[];
  intendedRideCategories: TierLabel[];
  disclaimer?: string;
  sortOrder: number;
}

const key = (id: VehicleTierId, field: string) => `driver.options.vehicleCategories.${id}.${field}`;
const OTHER_DELIVERY: TierLabel = { i18nKey: "driver.steps.vehicleCategory.platformLabels.otherDelivery" };
const DELIVERY_APPS: TierLabel = { i18nKey: "driver.steps.vehicleCategory.platformLabels.deliveryApps" };
const STANDARD_RIDESHARE: TierLabel = { i18nKey: "driver.steps.vehicleCategory.platformLabels.standardRideshare" };

export const VEHICLE_TIERS: readonly VehicleTier[] = [
  {
    id: "delivery",
    name: key("delivery", "label"),
    description: key("delivery", "description"),
    similarVehicles: key("delivery", "similar"),
    intendedPlatforms: ["Uber Eats", "DoorDash", "Instacart", "Spark", OTHER_DELIVERY],
    intendedRideCategories: [],
    sortOrder: 1,
  },
  {
    id: "standard",
    name: key("standard", "label"),
    description: key("standard", "description"),
    similarVehicles: key("standard", "similar"),
    intendedPlatforms: ["Uber", "Lyft", DELIVERY_APPS],
    intendedRideCategories: ["UberX", "Lyft Standard"],
    sortOrder: 2,
  },
  {
    id: "comfort",
    name: key("comfort", "label"),
    description: key("comfort", "description"),
    similarVehicles: key("comfort", "similar"),
    intendedPlatforms: ["Uber", "Lyft"],
    intendedRideCategories: ["UberX", "Lyft Standard", "Uber Comfort", "Lyft Extra Comfort"],
    disclaimer: key("comfort", "disclaimer"),
    sortOrder: 3,
  },
  {
    id: "xl",
    name: key("xl", "label"),
    description: key("xl", "description"),
    similarVehicles: key("xl", "similar"),
    intendedPlatforms: ["Uber", "Lyft", DELIVERY_APPS],
    intendedRideCategories: ["UberXL", "Lyft XL", STANDARD_RIDESHARE],
    disclaimer: key("xl", "disclaimer"),
    sortOrder: 4,
  },
];

export const SORTED_VEHICLE_TIERS = [...VEHICLE_TIERS].sort((a, b) => a.sortOrder - b.sortOrder);

/** "Best for" chips: ride categories first, then non-Uber/Lyft platforms (e.g. delivery apps). */
export function tierBestFor(tier: VehicleTier): TierLabel[] {
  const extra = tier.intendedPlatforms.filter(
    (platform) => typeof platform !== "string" || (platform !== "Uber" && platform !== "Lyft"),
  );
  return [...tier.intendedRideCategories, ...extra];
}

/**
 * Suggest a tier from the earlier work questions. The driver can always override.
 * XL > Comfort > Standard > Delivery.
 */
export function recommendVehicleTier(
  platforms: readonly string[],
  platformSubtypes: readonly string[],
): VehicleTierId | null {
  const has = (subtype: string) => platformSubtypes.includes(subtype);
  if (has("uber:uberxl") || has("lyft:xl")) return "xl";
  if (has("uber:uber_comfort") || has("lyft:extra_comfort")) return "comfort";
  if (
    has("uber:uberx") ||
    has("lyft:standard") ||
    has("uber:not_sure") ||
    has("lyft:not_sure") ||
    (platforms.includes("lyft") && platformSubtypes.every((item) => !item.startsWith("lyft:")))
  ) {
    return "standard";
  }
  if (platforms.includes("delivery_apps") || has("uber:delivery")) return "delivery";
  return null;
}

/** Map values from older saved drafts onto the current tiers ("" = ask again). */
export function normalizeStoredVehicleCategory(value: string): string {
  if ((VEHICLE_TIER_IDS as readonly string[]).includes(value)) return value;
  if (value === "everyday") return "standard";
  return "";
}
