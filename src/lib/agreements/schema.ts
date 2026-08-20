import { z } from "zod";

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

export const VehicleConsignmentAgreementDataSchema = z
  .object({
    effectiveDate: z.string().date(),
    operator: z.object({
      legalName: z.string().trim().min(1).max(160),
      tradeName: z.string().trim().min(1).max(160),
      address: z.string().trim().min(1).max(500),
      phone: z.string().trim().min(1).max(40),
      email: z.string().trim().email().max(254),
      signer: PartySchema,
    }),
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
  agreementData: VehicleConsignmentAgreementDataSchema,
});

export const AgreementUpdateSchema = z.object({
  agreementId: z.string().uuid(),
  agreementData: VehicleConsignmentAgreementDataSchema,
});

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
