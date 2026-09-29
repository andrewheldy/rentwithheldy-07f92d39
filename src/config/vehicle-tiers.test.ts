import { describe, expect, it } from "vitest";
import {
  SORTED_VEHICLE_TIERS,
  normalizeStoredVehicleCategory,
  recommendVehicleTier,
} from "./vehicle-tiers";
import { VEHICLE_CATEGORIES } from "@/lib/acquisition-leads";

describe("vehicle tiers", () => {
  it("orders Delivery → Standard → Comfort → XL and matches the submission enum", () => {
    expect(SORTED_VEHICLE_TIERS.map((tier) => tier.id)).toEqual(["delivery", "standard", "comfort", "xl"]);
    expect([...VEHICLE_CATEGORIES]).toEqual(["delivery", "standard", "comfort", "xl"]);
  });

  it("never offers a luxury / black-car tier", () => {
    const text = JSON.stringify(SORTED_VEHICLE_TIERS).toLowerCase();
    expect(text).not.toMatch(/black|premier|luxury|chauffeur/);
  });

  it("only comfort and xl carry eligibility disclaimers", () => {
    expect(SORTED_VEHICLE_TIERS.filter((tier) => tier.disclaimer).map((tier) => tier.id)).toEqual(["comfort", "xl"]);
  });

  it("recommends a tier from earlier answers", () => {
    expect(recommendVehicleTier(["delivery_apps"], ["delivery:doordash"])).toBe("delivery");
    expect(recommendVehicleTier(["uber"], ["uber:delivery"])).toBe("delivery");
    expect(recommendVehicleTier(["uber", "lyft"], ["uber:uberx", "lyft:standard"])).toBe("standard");
    expect(recommendVehicleTier(["uber", "delivery_apps"], ["uber:uberx", "delivery:spark"])).toBe("standard");
    expect(recommendVehicleTier(["uber"], ["uber:uber_comfort"])).toBe("comfort");
    expect(recommendVehicleTier(["lyft"], ["lyft:extra_comfort"])).toBe("comfort");
    expect(recommendVehicleTier(["uber", "lyft"], ["uber:uberxl", "lyft:standard"])).toBe("xl");
    expect(recommendVehicleTier(["lyft"], ["lyft:xl"])).toBe("xl");
    expect(recommendVehicleTier(["not_sure"], [])).toBeNull();
  });

  it("maps retired stored values onto current tiers", () => {
    expect(normalizeStoredVehicleCategory("everyday")).toBe("standard");
    expect(normalizeStoredVehicleCategory("xl")).toBe("xl");
    expect(normalizeStoredVehicleCategory("premium")).toBe("");
    expect(normalizeStoredVehicleCategory("")).toBe("");
  });
});
