import type {
  DocumentSigner,
  ResolvedAgreementDocument,
  ResolvedDocumentBlock,
  TemplateDefinition,
  VehicleConsignmentAgreementData,
} from "./types";

export function allAgreementParties(data: VehicleConsignmentAgreementData): DocumentSigner[] {
  return [data.operator.signer, ...data.owners];
}

export function resolveAgreementDocument(
  templateName: string,
  definition: TemplateDefinition,
  agreementNumber: string,
  agreementVersion: number,
  data: VehicleConsignmentAgreementData,
  signers: DocumentSigner[] = allAgreementParties(data),
): ResolvedAgreementDocument {
  if (!data.paymentCadence) {
    throw new Error("A payment schedule is required before the agreement can be frozen.");
  }

  const sections = definition.sections.map((section) => ({
    number: section.number,
    title: section.title,
    blocks: section.blocks.map((block): ResolvedDocumentBlock => {
      switch (block.type) {
        case "paragraph":
          return { type: "paragraph", text: block.text ?? "" };
        case "vehicles":
          return { type: "vehicles", vehicles: data.vehicles };
        case "revenue_split":
          return {
            type: "revenue_split",
            operatorPercent: data.economics.operatorPercent,
            ownerPercent: data.economics.ownerPercent,
          };
        case "payment_schedule":
          return {
            type: "payment_schedule",
            cadence: data.paymentCadence as Exclude<typeof data.paymentCadence, "">,
          };
        case "trial_period":
          return {
            type: "trial_period",
            startDate: data.trial.startDate,
            reviewDate: data.trial.reviewDate,
          };
        case "signatures":
          return { type: "signatures", signers };
      }
    }),
  }));

  return {
    schemaVersion: 1,
    title: templateName,
    agreementNumber,
    agreementVersion,
    effectiveDate: data.effectiveDate,
    preamble: `This Vehicle Consignment & Rental Management Agreement ("Agreement") is entered into between ${data.operator.legalName}, doing business as ${data.operator.tradeName} ("Rent With Heldy" or "Operator"), and the Vehicle Owner(s) listed below. Collectively, the Operator and Vehicle Owner may be referred to as the "Parties."`,
    operator: data.operator,
    owners: data.owners,
    summary: {
      trialStartDate: data.trial.startDate,
      trialReviewDate: data.trial.reviewDate,
      operatorPercent: data.economics.operatorPercent,
      ownerPercent: data.economics.ownerPercent,
      vehicles: data.vehicles,
    },
    sections,
  };
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonicalize(child)}`);
  return `{${entries.join(",")}}`;
}

export function cadenceLabel(cadence: "bi_weekly" | "monthly") {
  return cadence === "bi_weekly" ? "Bi-weekly" : "Monthly";
}
