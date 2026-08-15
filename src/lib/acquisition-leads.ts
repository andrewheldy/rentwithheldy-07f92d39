import { z } from "zod";

export const DRIVER_PLATFORMS = [
  "uber",
  "lyft",
  "empower",
  "delivery_apps",
  "professional_driving",
  "not_sure",
] as const;

export const VEHICLE_CATEGORIES = [
  "everyday",
  "xl",
  "premium",
  "large_passenger",
  "delivery",
  "not_sure",
] as const;

export const NEED_TIMELINES = [
  "asap",
  "within_7_days",
  "within_30_days",
  "one_to_three_months",
  "exploring",
] as const;

export const WEEKLY_BUDGETS = [
  "under_250",
  "250_299",
  "300_349",
  "350_399",
  "400_499",
  "500_plus",
  "not_sure",
] as const;

export const DRIVER_STATUSES = [
  "currently_driving",
  "approved_need_vehicle",
  "application_pending",
  "not_yet",
  "not_applicable",
] as const;

export const RENTAL_DURATIONS = [
  "few_weeks",
  "one_to_three_months",
  "three_to_six_months",
  "six_to_twelve_months",
  "long_term",
  "not_sure",
] as const;

export const EMPOWER_STATUSES = ["yes", "application_pending", "no"] as const;

export const VEHICLE_TYPES = [
  "sedan",
  "suv_crossover",
  "minivan",
  "passenger_van",
  "pickup",
  "premium_luxury",
  "other",
] as const;

export const PASSENGER_CAPACITIES = [
  "7_8",
  "9_11",
  "12_14",
  "15_plus",
  "other",
] as const;

export const VEHICLE_CONDITIONS = [
  "excellent",
  "good",
  "fair",
  "needs_work",
] as const;

export const OWNERSHIP_STATUSES = [
  "owned_outright",
  "financed",
  "leased",
  "other_unsure",
] as const;

export const VEHICLE_AVAILABILITY = [
  "full_time",
  "most_of_month",
  "weekends",
  "part_time",
  "seasonal",
  "not_sure",
] as const;

export const DELIVERY_PLATFORMS = [
  "uber_eats",
  "doordash",
  "instacart",
  "spark",
  "other_delivery",
] as const;

export const UBER_OPPORTUNITIES = [
  "uberx",
  "uberxl",
  "black_premium",
  "large_passenger",
  "delivery",
  "not_sure",
] as const;

export const LYFT_OPPORTUNITIES = [
  "standard",
  "xl",
  "premium",
  "not_sure",
] as const;

export const CURRENT_DRIVER_PLATFORMS = [
  "uber",
  "lyft",
  "empower",
  "delivery_apps",
  "professional_driving",
] as const;

const PLATFORM_SUBTYPES = [
  ...DELIVERY_PLATFORMS.map((value) => `delivery:${value}` as const),
  ...UBER_OPPORTUNITIES.map((value) => `uber:${value}` as const),
  ...LYFT_OPPORTUNITIES.map((value) => `lyft:${value}` as const),
] as const;
const PLATFORM_SUBTYPE_SET = new Set<string>(PLATFORM_SUBTYPES);

const zipSchema = z.string().trim().regex(/^\d{5}(-\d{4})?$/);
const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(24)
  .refine((value) => value.replace(/\D/g, "").length >= 7);
const attributionSchema = z.object({
  source: z.string().trim().max(120).optional().default("direct"),
  campaign: z.string().trim().max(160).optional().nullable(),
  referrer: z.string().trim().max(500).optional().nullable(),
  landingPage: z.string().trim().min(1).max(200),
});
const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: phoneSchema,
  email: z.string().trim().email().max(254),
  zipCode: zipSchema,
});
const antiSpamSchema = z.object({
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().int().positive(),
});

export const DriverDemandSubmissionSchema = z
  .object({
    leadType: z.literal("driver_demand"),
    platforms: z.array(z.enum(DRIVER_PLATFORMS)).min(1).max(6),
    platformSubtypes: z
      .array(
        z.string().refine((value) => PLATFORM_SUBTYPE_SET.has(value), {
          message: "Unsupported platform detail.",
        }),
      )
      .max(20),
    vehicleCategory: z.enum(VEHICLE_CATEGORIES),
    needTimeline: z.enum(NEED_TIMELINES),
    weeklyBudget: z.enum(WEEKLY_BUDGETS),
    driverStatus: z.enum(DRIVER_STATUSES),
    currentPlatforms: z.array(z.enum(CURRENT_DRIVER_PLATFORMS)).max(5),
    expectedDuration: z.enum(RENTAL_DURATIONS),
    empowerStatus: z.enum(EMPOWER_STATUSES).nullable(),
    empowerReferralClicked: z.boolean().default(false),
  })
  .merge(contactSchema)
  .merge(attributionSchema)
  .merge(antiSpamSchema)
  .superRefine((data, ctx) => {
    if (data.platforms.includes("not_sure") && data.platforms.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["platforms"],
        message: "Not sure cannot be combined with another platform.",
      });
    }

    const conditionalSubtypes = [
      ["delivery_apps", "delivery"],
      ["uber", "uber"],
      ["lyft", "lyft"],
    ] as const;
    for (const [platform, prefix] of conditionalSubtypes) {
      const selected = data.platforms.includes(platform);
      const matching = data.platformSubtypes.filter((value) =>
        value.startsWith(`${prefix}:`),
      );
      if (selected && matching.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["platformSubtypes"],
          message: `${platform} detail is required when selected.`,
        });
      }
      if (!selected && matching.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["platformSubtypes"],
          message: `${platform} detail is only accepted when the platform is selected.`,
        });
      }
    }

    if (data.platforms.includes("empower") && !data.empowerStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["empowerStatus"],
        message: "Empower status is required when Empower is selected.",
      });
    }
    if (!data.platforms.includes("empower") && data.empowerStatus !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["empowerStatus"],
        message: "Empower status is only accepted when Empower is selected.",
      });
    }
    if (!data.platforms.includes("empower") && data.empowerReferralClicked) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["empowerReferralClicked"],
        message: "Empower referral activity requires Empower selection.",
      });
    }
    if (data.driverStatus === "currently_driving" && data.currentPlatforms.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPlatforms"],
        message: "Current platforms are required for active drivers.",
      });
    }
    if (data.driverStatus !== "currently_driving" && data.currentPlatforms.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPlatforms"],
        message: "Current platforms are only accepted for active drivers.",
      });
    }
  });

export const VehicleSupplySubmissionSchema = z
  .object({
    leadType: z.literal("vehicle_supply"),
    vehicleYear: z.number().int().min(1980).max(new Date().getFullYear() + 1),
    vehicleMake: z.string().trim().min(1).max(80),
    vehicleModel: z.string().trim().min(1).max(80),
    vehicleTrim: z.string().trim().max(80).optional().nullable(),
    vehicleType: z.enum(VEHICLE_TYPES),
    passengerCapacity: z.enum(PASSENGER_CAPACITIES).nullable(),
    mileage: z.number().int().min(0).max(1_000_000),
    vehicleCondition: z.enum(VEHICLE_CONDITIONS),
    ownershipStatus: z.enum(OWNERSHIP_STATUSES),
    vehicleAvailability: z.enum(VEHICLE_AVAILABILITY),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => value === "" || /^[A-HJ-NPR-Z0-9]{17}$/.test(value))
      .optional()
      .nullable(),
  })
  .merge(contactSchema)
  .merge(attributionSchema)
  .merge(antiSpamSchema)
  .superRefine((data, ctx) => {
    if (data.vehicleType === "passenger_van" && !data.passengerCapacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passengerCapacity"],
        message: "Passenger capacity is required for passenger vans.",
      });
    }
    if (data.vehicleType !== "passenger_van" && data.passengerCapacity !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passengerCapacity"],
        message: "Passenger capacity is only accepted for passenger vans.",
      });
    }
  });

export const AcquisitionSubmissionSchema = z.union([
  DriverDemandSubmissionSchema,
  VehicleSupplySubmissionSchema,
]);

export type DriverDemandSubmission = z.infer<typeof DriverDemandSubmissionSchema>;
export type VehicleSupplySubmission = z.infer<typeof VehicleSupplySubmissionSchema>;
export type AcquisitionSubmission = z.infer<typeof AcquisitionSubmissionSchema>;
export type LeadPriority = "hot" | "warm" | "future";

export const WEEKLY_BUDGET_RANGES: Record<
  (typeof WEEKLY_BUDGETS)[number],
  { min: number | null; max: number | null }
> = {
  under_250: { min: null, max: 249 },
  "250_299": { min: 250, max: 299 },
  "300_349": { min: 300, max: 349 },
  "350_399": { min: 350, max: 399 },
  "400_499": { min: 400, max: 499 },
  "500_plus": { min: 500, max: null },
  not_sure: { min: null, max: null },
};

/** Deterministic outreach priority; this is triage logic, not approval logic. */
export function scoreDriverLead(
  lead: Pick<
    DriverDemandSubmission,
    "needTimeline" | "weeklyBudget" | "driverStatus" | "expectedDuration"
  >,
): LeadPriority {
  let score = 0;

  score +=
    lead.needTimeline === "asap"
      ? 3
      : lead.needTimeline === "within_7_days"
        ? 2
        : lead.needTimeline === "within_30_days"
          ? 1
          : lead.needTimeline === "exploring"
            ? -2
            : -1;

  score +=
    lead.driverStatus === "currently_driving"
      ? 3
      : lead.driverStatus === "approved_need_vehicle"
        ? 2
        : lead.driverStatus === "application_pending"
          ? 1
          : lead.driverStatus === "not_yet"
            ? -1
            : 0;

  const budgetMin = WEEKLY_BUDGET_RANGES[lead.weeklyBudget].min;
  score += budgetMin !== null && budgetMin >= 500 ? 3 : budgetMin !== null && budgetMin >= 400 ? 2 : budgetMin !== null && budgetMin >= 300 ? 1 : lead.weeklyBudget === "under_250" ? -1 : 0;

  score +=
    lead.expectedDuration === "long_term" || lead.expectedDuration === "six_to_twelve_months"
      ? 2
      : lead.expectedDuration === "three_to_six_months"
        ? 1
        : 0;

  if (score >= 7) return "hot";
  if (score >= 3) return "warm";
  return "future";
}

export function toAcquisitionRow(submission: AcquisitionSubmission) {
  const common = {
    lead_type: submission.leadType,
    first_name: submission.firstName,
    last_name: submission.lastName,
    phone: submission.phone,
    email: submission.email,
    zip_code: submission.zipCode,
    source: submission.source || "direct",
    campaign: submission.campaign || null,
    referrer: submission.referrer || null,
    landing_page: submission.landingPage,
  };

  if (submission.leadType === "driver_demand") {
    const range = WEEKLY_BUDGET_RANGES[submission.weeklyBudget];
    return {
      ...common,
      platforms: submission.platforms,
      platform_subtypes: submission.platformSubtypes,
      vehicle_category: submission.vehicleCategory,
      need_timeline: submission.needTimeline,
      weekly_budget_min: range.min,
      weekly_budget_max: range.max,
      driver_status: submission.driverStatus,
      current_platforms: submission.currentPlatforms,
      expected_duration: submission.expectedDuration,
      empower_status: submission.empowerStatus,
      empower_referral_clicked: submission.empowerReferralClicked,
      lead_priority: scoreDriverLead(submission),
    };
  }

  return {
    ...common,
    vehicle_year: submission.vehicleYear,
    vehicle_make: submission.vehicleMake,
    vehicle_model: submission.vehicleModel,
    vehicle_trim: submission.vehicleTrim || null,
    vehicle_type: submission.vehicleType,
    passenger_capacity: submission.passengerCapacity,
    mileage: submission.mileage,
    vehicle_condition: submission.vehicleCondition,
    ownership_status: submission.ownershipStatus,
    vehicle_availability: submission.vehicleAvailability,
    vin: submission.vin || null,
    strategic_interest:
      submission.vehicleType === "passenger_van" &&
      submission.passengerCapacity === "12_14",
  };
}
