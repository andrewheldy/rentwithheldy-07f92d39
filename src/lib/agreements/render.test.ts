import { describe, expect, it } from "vitest";
import { canonicalize, resolveAgreementDocument } from "./render";
import {
  SendableLongTermRentalDataSchema,
  SendableVehicleConsignmentDataSchema,
  SignatureSubmissionSchema,
} from "./schema";
import {
  DEFAULT_LONG_TERM_RENTAL_DATA,
  DEFAULT_VEHICLE_CONSIGNMENT_DATA,
  type TemplateDefinition,
} from "./types";

const template: TemplateDefinition = {
  schema_version: 1,
  agreement_code: "VAN",
  sections: [
    { number: 1, title: "Purpose", blocks: [{ type: "paragraph", text: "Purpose text." }] },
    { number: 2, title: "Vehicles", blocks: [{ type: "vehicles" }] },
    { number: 3, title: "Economics", blocks: [{ type: "revenue_split" }, { type: "payment_schedule" }] },
    { number: 4, title: "Trial", blocks: [{ type: "trial_period" }] },
    { number: 5, title: "Signatures", blocks: [{ type: "signatures" }] },
  ],
};

describe("agreement rendering", () => {
  it("resolves structured data into one deterministic document model", () => {
    const data = structuredClone(DEFAULT_VEHICLE_CONSIGNMENT_DATA);
    data.paymentCadence = "monthly";
    const first = resolveAgreementDocument("Vehicle Agreement", template, "RWH-VAN-2026-001", 1, data);
    const second = resolveAgreementDocument("Vehicle Agreement", template, "RWH-VAN-2026-001", 1, data);

    expect(first.summary.vehicles).toHaveLength(2);
    expect(first.sections[2].blocks[1]).toEqual({ type: "payment_schedule", cadence: "monthly" });
    expect(canonicalize(first)).toBe(canonicalize(second));
  });

  it("canonicalizes object keys without changing array order", () => {
    expect(canonicalize({ b: 2, a: [{ z: 1, a: 2 }] })).toBe('{"a":[{"a":2,"z":1}],"b":2}');
  });

  it("resolves the long-term rental source into editable HTML field blocks", () => {
    const data = structuredClone(DEFAULT_LONG_TERM_RENTAL_DATA);
    data.renter.fullName = "Test Renter";
    data.renter.email = "renter@example.com";
    data.rental.endDate = "2026-11-18";
    data.rental.monthlyRate = 1_500;
    const rentalTemplate: TemplateDefinition = {
      schema_version: 2,
      agreement_code: "LTR",
      data_kind: "long_term_rental",
      sections: [
        { number: 1, title: "Renter Information", blocks: [{ type: "renter_information" }] },
        { number: 2, title: "Rental Term", blocks: [{ type: "rental_term" }, { type: "rental_rate" }] },
        { number: 3, title: "Signatures", blocks: [{ type: "signatures" }] },
      ],
    };
    const document = resolveAgreementDocument("Long-Term Vehicle Rental Agreement", rentalTemplate, "RWH-LTR-2026-001", 1, data);

    expect(document.counterpartyLabel).toBe("Renter");
    expect(document.sections[0].blocks[0]).toMatchObject({ type: "fields" });
    expect(document.sections[1].blocks[0]).toMatchObject({ type: "fields" });
    expect(document.summary.items?.[0]).toEqual({ label: "Renter", value: "Test Renter" });
  });
});

describe("agreement validation", () => {
  it("keeps an incomplete payment cadence in draft", () => {
    const result = SendableVehicleConsignmentDataSchema.safeParse(DEFAULT_VEHICLE_CONSIGNMENT_DATA);
    expect(result.success).toBe(false);
  });

  it("accepts the supplied agreement defaults after cadence selection", () => {
    const data = structuredClone(DEFAULT_VEHICLE_CONSIGNMENT_DATA);
    data.paymentCadence = "bi_weekly";
    expect(SendableVehicleConsignmentDataSchema.safeParse(data).success).toBe(true);
  });

  it("keeps a long-term rental editable as a draft but blocks sending incomplete data", () => {
    expect(SendableLongTermRentalDataSchema.safeParse(DEFAULT_LONG_TERM_RENTAL_DATA).success).toBe(false);
  });

  it("requires explicit consent and a method-specific signature", () => {
    expect(SignatureSubmissionSchema.safeParse({
      token: "a".repeat(43),
      confirmedName: "Gary Heldenmuth",
      consent: true,
      consentVersion: "v1",
      method: "typed",
      typedSignature: "Gary Heldenmuth",
    }).success).toBe(true);

    expect(SignatureSubmissionSchema.safeParse({
      token: "a".repeat(43),
      confirmedName: "Gary Heldenmuth",
      consent: false,
      consentVersion: "v1",
      method: "drawn",
    }).success).toBe(false);
  });
});
