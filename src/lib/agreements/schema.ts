import { z } from "zod";
import type {
  AgreementData,
  TemplateDefinition,
} from "./types";
import { templateDataKind } from "./types";

const PartySchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(500).optional(),
  role: z.string().trim().min(1).max(100),
  required: z.boolean(),
});

const VehicleSchema = z.object({
  year: z.coerce.number().int().min(1980).max(2100),
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  vin: z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/),
  mileage: z.coerce.number().int().min(0).max(2_000_000),
  licensePlate: z.string().trim().max(30).optional(),
});

const OperatorSchema = z.object({
  legalName: z.string().trim().min(1).max(160),
  tradeName: z.string().trim().min(1).max(160),
  address: z.string().trim().min(1).max(500),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(254),
  signer: PartySchema,
});

export const VehicleConsignmentAgreementDataSchema = z
  .object({
    effectiveDate: z.string().date(),
    agreementType: z.literal("vehicle_consignment").optional(),
    operator: OperatorSchema,
    owners: z.array(PartySchema).min(1).max(12),
    vehicles: z.array(VehicleSchema).min(1).max(25),
    economics: z.object({
      operatorPercent: z.coerce.number().min(0).max(100),
      ownerPercent: z.coerce.number().min(0).max(100),
    }),
    trial: z.object({
      startDate: z.string().date(),
      reviewDate: z.string().date(),
    }),
    paymentCadence: z.enum(["", "bi_weekly", "monthly"]),
  })
  .superRefine((data, context) => {
    if (data.economics.operatorPercent + data.economics.ownerPercent !== 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["economics", "ownerPercent"],
        message: "Revenue shares must total 100%.",
      });
    }
    if (data.trial.reviewDate <= data.trial.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trial", "reviewDate"],
        message: "The review date must be after the start date.",
      });
    }
  });

const DraftPartySchema = z.object({
  fullName: z.string().trim().max(160),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(500).optional(),
  role: z.string().trim().min(1).max(100),
  required: z.boolean(),
});

const OptionalDateSchema = z.union([z.literal(""), z.string().date()]);
const MoneySchema = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? null : value,
  z.coerce.number().min(0).max(1_000_000).nullable(),
);

export const LongTermRentalAgreementDataSchema = z
  .object({
    agreementType: z.literal("long_term_rental"),
    effectiveDate: z.string().date(),
    operator: OperatorSchema,
    renter: DraftPartySchema.extend({
      dateOfBirth: OptionalDateSchema,
      driversLicenseNumber: z.string().trim().max(80),
      driversLicenseState: z.string().trim().max(40),
      licenseExpirationDate: OptionalDateSchema,
      city: z.string().trim().max(120),
      state: z.string().trim().max(40),
      zip: z.string().trim().max(20),
    }),
    vehicle: VehicleSchema.extend({
      make: z.string().trim().max(80),
      model: z.string().trim().max(120),
      vin: z.union([z.literal(""), z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/)]),
      color: z.string().trim().max(80),
      fuelLevel: z.string().trim().max(80),
    }),
    rental: z.object({
      startDate: z.string().date(),
      endDate: OptionalDateSchema,
      weeklyRate: MoneySchema,
      monthlyRate: MoneySchema,
      paymentDue: z.string().trim().max(160),
    }),
    insurance: z.object({
      arrangement: z.enum(["", "renter_provided", "separately_arranged"]),
      company: z.string().trim().max(160),
      policyholderName: z.string().trim().max(160),
      policyNumber: z.string().trim().max(120),
      effectiveDate: OptionalDateSchema,
      expirationDate: OptionalDateSchema,
      agentPhone: z.string().trim().max(40),
    }),
    additionalDriver: z.object({
      fullName: z.string().trim().max(160),
      driversLicenseNumber: z.string().trim().max(80),
    }),
    rideshareUse: z.enum(["", "permitted", "not_permitted", "prior_approval"]),
    maintenance: z.object({
      routine: z.string().trim().max(500),
      oilChanges: z.string().trim().max(500),
      tires: z.string().trim().max(500),
      mechanicalRepairs: z.string().trim().max(500),
    }),
    returnLocation: z.string().trim().max(500),
    condition: z.object({
      exterior: z.string().trim().max(2_000),
      interior: z.string().trim().max(2_000),
      mechanical: z.string().trim().max(2_000),
      photosTaken: z.boolean(),
      keysProvided: z.coerce.number().int().min(0).max(20),
      renterInitials: z.string().trim().max(20),
      acceptanceDate: OptionalDateSchema,
    }),
  })
  .superRefine((data, context) => {
    if (data.rental.endDate && data.rental.endDate <= data.rental.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rental", "endDate"],
        message: "The rental end date must be after the start date.",
      });
    }
    if (
      data.insurance.effectiveDate &&
      data.insurance.expirationDate &&
      data.insurance.expirationDate <= data.insurance.effectiveDate
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["insurance", "expirationDate"],
        message: "The policy expiration date must be after its effective date.",
      });
    }
  });

export const SendableLongTermRentalDataSchema =
  LongTermRentalAgreementDataSchema.superRefine((data, context) => {
    const required: Array<[unknown, Array<string | number>, string]> = [
      [data.renter.fullName, ["renter", "fullName"], "Enter the renter's full legal name."],
      [data.renter.email, ["renter", "email"], "Enter the renter's email."],
      [data.renter.phone, ["renter", "phone"], "Enter the renter's phone number."],
      [data.renter.address, ["renter", "address"], "Enter the renter's home address."],
      [data.renter.dateOfBirth, ["renter", "dateOfBirth"], "Choose the renter's date of birth."],
      [data.renter.driversLicenseNumber, ["renter", "driversLicenseNumber"], "Enter the driver's license number."],
      [data.renter.driversLicenseState, ["renter", "driversLicenseState"], "Enter the driver's license state."],
      [data.renter.licenseExpirationDate, ["renter", "licenseExpirationDate"], "Choose the license expiration date."],
      [data.renter.city, ["renter", "city"], "Enter the renter's city."],
      [data.renter.state, ["renter", "state"], "Enter the renter's state."],
      [data.renter.zip, ["renter", "zip"], "Enter the renter's ZIP code."],
      [data.vehicle.make, ["vehicle", "make"], "Enter the vehicle make."],
      [data.vehicle.model, ["vehicle", "model"], "Enter the vehicle model."],
      [data.vehicle.vin, ["vehicle", "vin"], "Enter the 17-character VIN."],
      [data.rental.endDate, ["rental", "endDate"], "Choose the rental end date."],
      [data.rental.paymentDue, ["rental", "paymentDue"], "Enter when payment is due."],
      [data.insurance.arrangement, ["insurance", "arrangement"], "Choose the insurance arrangement."],
      [data.insurance.company, ["insurance", "company"], "Enter the insurance company."],
      [data.insurance.policyholderName, ["insurance", "policyholderName"], "Enter the policyholder name."],
      [data.insurance.policyNumber, ["insurance", "policyNumber"], "Enter the policy number."],
      [data.insurance.effectiveDate, ["insurance", "effectiveDate"], "Choose the policy effective date."],
      [data.insurance.expirationDate, ["insurance", "expirationDate"], "Choose the policy expiration date."],
      [data.rideshareUse, ["rideshareUse"], "Choose whether rideshare or delivery use is permitted."],
      [data.returnLocation, ["returnLocation"], "Enter the agreed return location."],
    ];
    for (const [value, path, message] of required) {
      if (value === "" || value === null || value === undefined) {
        context.addIssue({ code: z.ZodIssueCode.custom, path, message });
      }
    }
    if (data.rental.weeklyRate === null && data.rental.monthlyRate === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rental", "monthlyRate"],
        message: "Enter a weekly or monthly rental rate.",
      });
    }
    if (Boolean(data.additionalDriver.fullName) !== Boolean(data.additionalDriver.driversLicenseNumber)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["additionalDriver", data.additionalDriver.fullName ? "driversLicenseNumber" : "fullName"],
        message: "Enter both the additional driver's name and license number, or leave both blank.",
      });
    }
    if (!data.operator.signer.required || !data.renter.required) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["renter", "required"],
        message: "The renter and Rent With Heldy representative must sign.",
      });
    }
  });

export const SendableVehicleConsignmentDataSchema =
  VehicleConsignmentAgreementDataSchema.superRefine((data, context) => {
    if (!data.paymentCadence) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentCadence"],
        message: "Choose a payment schedule before sending.",
      });
    }
    if (![data.operator.signer, ...data.owners].some((party) => party.required)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["owners"],
        message: "At least one signer must be required.",
      });
    }
  });

export const AgreementCreateSchema = z.object({
  templateId: z.string().uuid(),
  agreementData: z.unknown(),
});

export const AgreementUpdateSchema = z.object({
  agreementId: z.string().uuid(),
  agreementData: z.unknown(),
});

export function parseAgreementData(
  definition: TemplateDefinition,
  value: unknown,
  sendable = false,
) {
  const kind = templateDataKind(definition);
  if (kind === "long_term_rental") {
    return (sendable ? SendableLongTermRentalDataSchema : LongTermRentalAgreementDataSchema)
      .safeParse(value) as z.SafeParseReturnType<unknown, AgreementData>;
  }
  return (sendable ? SendableVehicleConsignmentDataSchema : VehicleConsignmentAgreementDataSchema)
    .safeParse(value) as z.SafeParseReturnType<unknown, AgreementData>;
}

export const SignatureSubmissionSchema = z
  .object({
    token: z.string().min(40).max(500),
    confirmedName: z.string().trim().min(1).max(160),
    consent: z.literal(true),
    consentVersion: z.string().min(1).max(100),
    method: z.enum(["drawn", "typed"]),
    signatureDataUrl: z.string().max(750_000).optional(),
    typedSignature: z.string().trim().max(160).optional(),
  })
  .superRefine((value, context) => {
    if (value.method === "drawn" && !value.signatureDataUrl?.startsWith("data:image/png;base64,")) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["signatureDataUrl"], message: "Draw a signature before signing." });
    }
    if (value.method === "typed" && !value.typedSignature) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["typedSignature"], message: "Type your full legal name before signing." });
    }
  });
