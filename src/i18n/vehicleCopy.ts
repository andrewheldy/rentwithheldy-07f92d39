import type { TFunction } from "i18next";
import type { Vehicle } from "@/hooks/useVehicles";
import { normalizeLocale } from "./config";

export function vehicleCopyKey(
  vehicle: Pick<Vehicle, "year" | "make" | "model" | "color">,
): string {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.color]
    .join("-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function labelKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Localize descriptive copy while leaving vehicle facts untouched. */
export function localizeVehicle(
  vehicle: Vehicle,
  t: TFunction,
  language: string,
): Vehicle {
  const key = vehicleCopyKey(vehicle);
  const descriptionFallback =
    normalizeLocale(language) === "en"
      ? vehicle.description
      : t("vehicleCopy.fallbackDescription");
  return {
    ...vehicle,
    color: t(`vehicleCopy.colors.${labelKey(vehicle.color)}`, {
      defaultValue: vehicle.color,
    }),
    description: t(`vehicleCopy.descriptions.${key}`, {
      defaultValue: descriptionFallback,
    }),
  };
}
