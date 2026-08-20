import type {
  AgreementData,
  DocumentSigner,
  LongTermRentalAgreementData,
  ResolvedAgreementDocument,
  ResolvedDocumentBlock,
  TemplateDefinition,
  VehicleConsignmentAgreementData,
} from "./types";
import { isLongTermRentalData } from "./types";

export function allAgreementParties(data: AgreementData): DocumentSigner[] {
  return isLongTermRentalData(data)
    ? [data.operator.signer, data.renter]
    : [data.operator.signer, ...data.owners];
}

const dateLabel = (value: string) => value
  ? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`))
  : "Not provided";

const moneyLabel = (value: number | null) => value === null
  ? "Not provided"
  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const rideshareLabel: Record<LongTermRentalAgreementData["rideshareUse"], string> = {
  "": "Not selected",
  permitted: "Permitted",
  not_permitted: "Not permitted",
  prior_approval: "Permitted only with prior written approval",
};

const insuranceLabel: Record<LongTermRentalAgreementData["insurance"]["arrangement"], string> = {
  "": "Not selected",
  renter_provided: "Renter is providing their own insurance",
  separately_arranged: "Insurance coverage is being arranged or facilitated separately",
};

export function resolveAgreementDocument(
  templateName: string,
  definition: TemplateDefinition,
  agreementNumber: string,
  agreementVersion: number,
  data: AgreementData,
  signers: DocumentSigner[] = allAgreementParties(data),
): ResolvedAgreementDocument {
  const longTerm = isLongTermRentalData(data);
  if (!longTerm && !data.paymentCadence) {
    throw new Error("A payment schedule is required before the agreement can be frozen.");
  }

  const sections = definition.sections.map((section) => ({
    number: section.number,
    title: section.title,
    blocks: section.blocks.map((block): ResolvedDocumentBlock => {
      switch (block.type) {
        case "paragraph":
          return { type: "paragraph", text: block.text ?? "" };
        case "subheading":
          return { type: "subheading", text: block.text ?? "" };
        case "bullet_list":
          return { type: "bullet_list", items: block.items ?? [] };
        case "vehicles":
          if (longTerm) throw new Error("The selected agreement template is incompatible with rental data.");
          return { type: "vehicles", vehicles: data.vehicles };
        case "revenue_split":
          if (longTerm) throw new Error("The selected agreement template is incompatible with rental data.");
          return {
            type: "revenue_split",
            operatorPercent: data.economics.operatorPercent,
            ownerPercent: data.economics.ownerPercent,
          };
        case "payment_schedule":
          if (longTerm) throw new Error("The selected agreement template is incompatible with rental data.");
          return {
            type: "payment_schedule",
            cadence: data.paymentCadence as Exclude<typeof data.paymentCadence, "">,
          };
        case "trial_period":
          if (longTerm) throw new Error("The selected agreement template is incompatible with rental data.");
          return {
            type: "trial_period",
            startDate: data.trial.startDate,
            reviewDate: data.trial.reviewDate,
          };
        case "renter_information":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [
            { label: "Full legal name", value: data.renter.fullName || "Not provided" },
            { label: "Date of birth", value: dateLabel(data.renter.dateOfBirth) },
            { label: "Driver's license number", value: data.renter.driversLicenseNumber || "Not provided" },
            { label: "Driver's license state", value: data.renter.driversLicenseState || "Not provided" },
            { label: "License expiration date", value: dateLabel(data.renter.licenseExpirationDate) },
            { label: "Home address", value: [data.renter.address, `${data.renter.city}, ${data.renter.state} ${data.renter.zip}`.trim()].filter(Boolean).join("\n") || "Not provided" },
            { label: "Phone", value: data.renter.phone || "Not provided" },
            { label: "Email", value: data.renter.email || "Not provided" },
          ] };
        case "vehicle_information":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [
            { label: "Vehicle", value: `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`.trim() },
            { label: "Color", value: data.vehicle.color || "Not provided" },
            { label: "VIN", value: data.vehicle.vin || "Not provided" },
            { label: "License plate", value: data.vehicle.licensePlate || "Not provided" },
            { label: "Starting mileage", value: data.vehicle.mileage.toLocaleString("en-US") },
            { label: "Fuel level at delivery", value: data.vehicle.fuelLevel || "Not provided" },
          ] };
        case "rental_term": {
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          const days = data.rental.endDate
            ? Math.round((Date.parse(`${data.rental.endDate}T00:00:00Z`) - Date.parse(`${data.rental.startDate}T00:00:00Z`)) / 86_400_000)
            : null;
          return { type: "fields", fields: [
            { label: "Rental start date", value: dateLabel(data.rental.startDate) },
            { label: "Rental end date", value: dateLabel(data.rental.endDate) },
            { label: "Total rental period", value: days === null ? "Not provided" : `${days} days` },
          ] };
        }
        case "rental_rate":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [
            { label: "Weekly rental rate", value: data.rental.weeklyRate === null ? "Not provided" : `${moneyLabel(data.rental.weeklyRate)} per week` },
            { label: "Monthly rental rate", value: data.rental.monthlyRate === null ? "Not provided" : `${moneyLabel(data.rental.monthlyRate)} per month` },
            { label: "Payment due", value: data.rental.paymentDue || "Not provided" },
          ] };
        case "insurance":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [
            { label: "Insurance arrangement", value: insuranceLabel[data.insurance.arrangement] },
            { label: "Insurance company", value: data.insurance.company || "Not provided" },
            { label: "Policyholder name", value: data.insurance.policyholderName || "Not provided" },
            { label: "Policy number", value: data.insurance.policyNumber || "Not provided" },
            { label: "Policy effective date", value: dateLabel(data.insurance.effectiveDate) },
            { label: "Policy expiration date", value: dateLabel(data.insurance.expirationDate) },
            { label: "Agent / insurance phone", value: data.insurance.agentPhone || "Not provided" },
          ] };
        case "authorized_driver":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [
            { label: "Additional authorized driver", value: data.additionalDriver.fullName || "None listed" },
            { label: "Driver's license number", value: data.additionalDriver.driversLicenseNumber || "Not provided" },
          ] };
        case "rideshare_use":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [{ label: "Rideshare / delivery use", value: rideshareLabel[data.rideshareUse] }] };
        case "maintenance_responsibilities":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [
            { label: "Routine maintenance responsibility", value: data.maintenance.routine || "Not provided" },
            { label: "Oil changes", value: data.maintenance.oilChanges || "Not provided" },
            { label: "Tires", value: data.maintenance.tires || "Not provided" },
            { label: "Mechanical repairs", value: data.maintenance.mechanicalRepairs || "Not provided" },
          ] };
        case "return_location":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [{ label: "Agreed return location", value: data.returnLocation || "Not provided" }] };
        case "vehicle_condition":
          if (!longTerm) throw new Error("The selected agreement template is incompatible with consignment data.");
          return { type: "fields", fields: [
            { label: "Exterior condition / existing damage", value: data.condition.exterior || "None noted" },
            { label: "Interior condition", value: data.condition.interior || "None noted" },
            { label: "Existing warning lights / mechanical issues", value: data.condition.mechanical || "None noted" },
            { label: "Photos taken at delivery", value: data.condition.photosTaken ? "Yes" : "No" },
            { label: "Number of keys provided", value: String(data.condition.keysProvided) },
            { label: "Renter initials", value: data.condition.renterInitials || "Not provided" },
            { label: "Vehicle acceptance date", value: dateLabel(data.condition.acceptanceDate) },
          ] };
        case "signatures":
          return { type: "signatures", signers };
      }
    }),
  }));

  return {
    schemaVersion: 2,
    title: templateName,
    agreementNumber,
    agreementVersion,
    effectiveDate: data.effectiveDate,
    preamble: longTerm
      ? `This Long-Term Vehicle Rental Agreement ("Agreement") is entered into between ${data.operator.legalName} d/b/a ${data.operator.tradeName} ("Rent With Heldy," "Owner," or "Rental Company") and the renter identified below ("Renter"). By signing this Agreement, Renter agrees to rent the Vehicle identified below subject to the terms and conditions of this Agreement.`
      : `This Vehicle Consignment & Rental Management Agreement ("Agreement") is entered into between ${data.operator.legalName}, doing business as ${data.operator.tradeName} ("Rent With Heldy" or "Operator"), and the Vehicle Owner(s) listed below. Collectively, the Operator and Vehicle Owner may be referred to as the "Parties."`,
    operator: data.operator,
    owners: longTerm ? [] : data.owners,
    counterparties: longTerm ? [data.renter] : data.owners,
    counterpartyLabel: longTerm ? "Renter" : "Vehicle owner",
    summary: longTerm ? {
      vehicles: [data.vehicle],
      items: [
        { label: "Renter", value: data.renter.fullName || "Not provided" },
        { label: "Rental term", value: `${dateLabel(data.rental.startDate)} – ${dateLabel(data.rental.endDate)}` },
        { label: "Vehicle", value: `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`.trim() },
      ],
    } : {
      trialStartDate: data.trial.startDate,
      trialReviewDate: data.trial.reviewDate,
      operatorPercent: data.economics.operatorPercent,
      ownerPercent: data.economics.ownerPercent,
      vehicles: data.vehicles,
      items: [
        { label: "Trial period", value: `${dateLabel(data.trial.startDate)} – ${dateLabel(data.trial.reviewDate)}` },
        { label: "Revenue split", value: `${data.economics.operatorPercent}% Rent With Heldy\n${data.economics.ownerPercent}% Vehicle Owners` },
        { label: "Vehicles", value: data.vehicles.map((vehicle) => `${vehicle.year} ${vehicle.make} ${vehicle.model}`).join(" · ") },
      ],
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
