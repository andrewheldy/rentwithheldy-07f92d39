import { describe, expect, it } from "vitest";
import { resolveAgreementDocument } from "../../lib/agreements/render";
import {
  DEFAULT_VEHICLE_CONSIGNMENT_DATA,
  type AgreementDetail,
  type TemplateDefinition,
} from "../../lib/agreements/types";
import { generateExecutedAgreementPdf } from "./pdf";
import type { ServerSupabase } from "./server";

describe("executed agreement PDF", () => {
  it("generates a real PDF from the frozen document model", async () => {
    const data = structuredClone(DEFAULT_VEHICLE_CONSIGNMENT_DATA);
    data.paymentCadence = "monthly";
    const definition: TemplateDefinition = {
      schema_version: 1,
      agreement_code: "VAN",
      sections: [
        { number: 1, title: "Purpose", blocks: [{ type: "paragraph", text: "The Parties’ agreement is frozen — and complete." }] },
        { number: 2, title: "Vehicles", blocks: [{ type: "vehicles" }] },
        { number: 3, title: "Signatures", blocks: [{ type: "signatures" }] },
      ],
    };
    const signedAt = "2026-08-20T16:00:00.000Z";
    const signers: AgreementDetail["signers"] = [data.operator.signer, ...data.owners].map((signer, index) => ({
      ...signer,
      id: `00000000-0000-4000-8000-00000000000${index}`,
      status: "signed",
      viewedAt: signedAt,
      signedAt,
      signatureMethod: "typed",
      signatureArtifactPath: null,
      typedSignature: signer.fullName,
    }));
    const rendered = resolveAgreementDocument(
      "Vehicle Consignment & Rental Management Agreement",
      definition,
      "RWH-VAN-2026-001",
      1,
      data,
      signers,
    );
    const detail = {
      id: "00000000-0000-4000-8000-000000000010",
      agreementNumber: "RWH-VAN-2026-001",
      status: "executed",
      templateId: "00000000-0000-4000-8000-000000000020",
      templateName: rendered.title,
      templateDefinition: definition,
      createdAt: signedAt,
      updatedAt: signedAt,
      sentAt: signedAt,
      executedAt: signedAt,
      voidedAt: null,
      expiresAt: null,
      finalPdfPath: null,
      version: {
        id: "00000000-0000-4000-8000-000000000030",
        number: 1,
        agreementData: data,
        renderedContent: rendered,
        documentHash: "a".repeat(64),
        frozenAt: signedAt,
      },
      signers,
      events: [],
    } satisfies AgreementDetail;

    const bytes = await generateExecutedAgreementPdf({} as ServerSupabase, detail);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(2_000);
  });
});
