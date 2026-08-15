import { describe, expect, it } from "vitest";
import {
  DriverDemandSubmissionSchema,
  VehicleSupplySubmissionSchema,
  scoreDriverLead,
  toAcquisitionRow,
} from "./acquisition-leads";

const common = {
  firstName: "Alex",
  lastName: "Driver",
  phone: "5615550199",
  email: "alex@example.com",
  zipCode: "33301",
  source: "direct",
  campaign: null,
  referrer: null,
  landingPage: "/drive-for-work",
  website: "",
  startedAt: Date.now() - 10_000,
};

describe("driver-demand validation and scoring", () => {
  it("scores urgent, approved, funded long-term demand as hot", () => {
    expect(
      scoreDriverLead({
        needTimeline: "asap",
        weeklyBudget: "400_499",
        driverStatus: "currently_driving",
        expectedDuration: "long_term",
      }),
    ).toBe("hot");
  });

  it("scores exploratory, lower-budget demand as future", () => {
    expect(
      scoreDriverLead({
        needTimeline: "exploring",
        weeklyBudget: "under_250",
        driverStatus: "not_yet",
        expectedDuration: "few_weeks",
      }),
    ).toBe("future");
  });

  it("requires Empower status when Empower is selected", () => {
    const parsed = DriverDemandSubmissionSchema.safeParse({
      ...common,
      leadType: "driver_demand",
      platforms: ["empower"],
      platformSubtypes: [],
      vehicleCategory: "everyday",
      needTimeline: "within_30_days",
      weeklyBudget: "300_349",
      driverStatus: "approved_need_vehicle",
      currentPlatforms: [],
      expectedDuration: "three_to_six_months",
      empowerStatus: null,
      empowerReferralClicked: false,
    });
    expect(parsed.success).toBe(false);
  });

  it("requires conditional platform detail and rejects stale hidden answers", () => {
    const base = {
      ...common,
      leadType: "driver_demand" as const,
      platforms: ["uber"] as const,
      vehicleCategory: "everyday" as const,
      needTimeline: "within_30_days" as const,
      weeklyBudget: "300_349" as const,
      driverStatus: "approved_need_vehicle" as const,
      currentPlatforms: [],
      expectedDuration: "three_to_six_months" as const,
      empowerStatus: null,
      empowerReferralClicked: false,
    };

    expect(
      DriverDemandSubmissionSchema.safeParse({
        ...base,
        platformSubtypes: [],
      }).success,
    ).toBe(false);
    expect(
      DriverDemandSubmissionSchema.safeParse({
        ...base,
        platforms: ["lyft"],
        platformSubtypes: ["uber:uberx", "lyft:standard"],
      }).success,
    ).toBe(false);
  });

  it("maps budget bounds and priority into analyzable columns", () => {
    const parsed = DriverDemandSubmissionSchema.parse({
      ...common,
      leadType: "driver_demand",
      platforms: ["uber"],
      platformSubtypes: ["uber:uberxl"],
      vehicleCategory: "xl",
      needTimeline: "within_7_days",
      weeklyBudget: "350_399",
      driverStatus: "approved_need_vehicle",
      currentPlatforms: [],
      expectedDuration: "six_to_twelve_months",
      empowerStatus: null,
      empowerReferralClicked: false,
    });
    const row = toAcquisitionRow(parsed);
    expect(row).toMatchObject({
      lead_type: "driver_demand",
      weekly_budget_min: 350,
      weekly_budget_max: 399,
      lead_priority: "hot",
      vehicle_category: "xl",
    });
  });
});

describe("vehicle-supply validation", () => {
  it("requires capacity for passenger vans", () => {
    const parsed = VehicleSupplySubmissionSchema.safeParse({
      ...common,
      landingPage: "/list-your-vehicle",
      leadType: "vehicle_supply",
      vehicleYear: 2022,
      vehicleMake: "Ford",
      vehicleModel: "Transit",
      vehicleTrim: null,
      vehicleType: "passenger_van",
      passengerCapacity: null,
      mileage: 45_000,
      vehicleCondition: "good",
      ownershipStatus: "owned_outright",
      vehicleAvailability: "full_time",
      vin: null,
    });
    expect(parsed.success).toBe(false);
  });

  it("flags 12–14 passenger vans as strategically interesting", () => {
    const parsed = VehicleSupplySubmissionSchema.parse({
      ...common,
      landingPage: "/list-your-vehicle",
      leadType: "vehicle_supply",
      vehicleYear: 2024,
      vehicleMake: "Ford",
      vehicleModel: "Transit 350 HD",
      vehicleTrim: null,
      vehicleType: "passenger_van",
      passengerCapacity: "12_14",
      mileage: 18_000,
      vehicleCondition: "excellent",
      ownershipStatus: "financed",
      vehicleAvailability: "most_of_month",
      vin: null,
    });
    expect(toAcquisitionRow(parsed)).toMatchObject({
      lead_type: "vehicle_supply",
      strategic_interest: true,
      passenger_capacity: "12_14",
    });
  });

  it("rejects invalid VIN characters", () => {
    const parsed = VehicleSupplySubmissionSchema.safeParse({
      ...common,
      landingPage: "/list-your-vehicle",
      leadType: "vehicle_supply",
      vehicleYear: 2020,
      vehicleMake: "Honda",
      vehicleModel: "CR-V",
      vehicleTrim: null,
      vehicleType: "suv_crossover",
      passengerCapacity: null,
      mileage: 60_000,
      vehicleCondition: "good",
      ownershipStatus: "owned_outright",
      vehicleAvailability: "part_time",
      vin: "1INVALIDVIN000000",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects stale passenger capacity for non-van submissions", () => {
    const parsed = VehicleSupplySubmissionSchema.safeParse({
      ...common,
      landingPage: "/list-your-vehicle",
      leadType: "vehicle_supply",
      vehicleYear: 2020,
      vehicleMake: "Honda",
      vehicleModel: "CR-V",
      vehicleTrim: null,
      vehicleType: "suv_crossover",
      passengerCapacity: "12_14",
      mileage: 60_000,
      vehicleCondition: "good",
      ownershipStatus: "owned_outright",
      vehicleAvailability: "part_time",
      vin: null,
    });
    expect(parsed.success).toBe(false);
  });
});
