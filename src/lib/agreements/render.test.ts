import { describe, expect, it } from "vitest";
import { canonicalize, resolveAgreementDocument } from "./render";
import {
  SendableVehicleConsignmentDataSchema,
  SignatureSubmissionSchema,
} from "./schema";
import {
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
