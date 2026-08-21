export type AgreementStatus =
  | "draft"
  | "sent"
  | "partially_signed"
  | "executed"
  | "voided"
  | "expired";

export type PaymentCadence = "" | "bi_weekly" | "monthly";

export type AgreementParty = {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  role: string;
  required: boolean;
};

export type AgreementVehicle = {
  year: number;
  make: string;
  model: string;
  vin: string;
  mileage: number;
  licensePlate?: string;
};

export type VehicleConsignmentAgreementData = {
  agreementType?: "vehicle_consignment";
  effectiveDate: string;
  operator: {
    legalName: string;
    tradeName: string;
    address: string;
    phone: string;
    email: string;
    signer: AgreementParty;
  };
  owners: AgreementParty[];
  vehicles: AgreementVehicle[];
  economics: {
    operatorPercent: number;
    ownerPercent: number;
  };
  trial: {
    startDate: string;
    reviewDate: string;
  };
  paymentCadence: PaymentCadence;
};

export type LongTermRentalAgreementData = {
  agreementType: "long_term_rental";
  effectiveDate: string;
  operator: VehicleConsignmentAgreementData["operator"];
  renter: AgreementParty & {
    dateOfBirth: string;
    driversLicenseNumber: string;
    driversLicenseState: string;
    licenseExpirationDate: string;
    city: string;
    state: string;
    zip: string;
  };
  vehicle: AgreementVehicle & {
    color: string;
    fuelLevel: string;
  };
  rental: {
    startDate: string;
    endDate: string;
    weeklyRate: number | null;
    monthlyRate: number | null;
    paymentDue: string;
  };
  insurance: {
    arrangement: "" | "renter_provided" | "separately_arranged";
    company: string;
    policyholderName: string;
    policyNumber: string;
    effectiveDate: string;
    expirationDate: string;
    agentPhone: string;
  };
  additionalDriver: {
    fullName: string;
    driversLicenseNumber: string;
  };
  rideshareUse: "" | "permitted" | "not_permitted" | "prior_approval";
  maintenance: {
    routine: string;
    oilChanges: string;
    tires: string;
    mechanicalRepairs: string;
  };
  returnLocation: string;
  condition: {
    exterior: string;
    interior: string;
    mechanical: string;
    photosTaken: boolean;
    keysProvided: number;
    renterInitials: string;
    acceptanceDate: string;
  };
};

export type AgreementData =
  | VehicleConsignmentAgreementData
  | LongTermRentalAgreementData;

export type AgreementTemplateDataKind =
  | "vehicle_consignment"
  | "long_term_rental";

export type TemplateBlock = {
  type:
    | "paragraph"
    | "subheading"
    | "bullet_list"
    | "vehicles"
    | "revenue_split"
    | "payment_schedule"
    | "trial_period"
    | "renter_information"
    | "vehicle_information"
    | "rental_term"
    | "rental_rate"
    | "insurance"
    | "authorized_driver"
    | "rideshare_use"
    | "maintenance_responsibilities"
    | "return_location"
    | "vehicle_condition"
    | "signatures";
  text?: string;
  items?: string[];
};

export type TemplateDefinition = {
  schema_version: number;
  agreement_code: string;
  data_kind?: AgreementTemplateDataKind;
  sections: Array<{
    number: number;
    title: string;
    blocks: TemplateBlock[];
  }>;
};

export type DocumentSigner = AgreementParty & {
  id?: string;
  status?: "pending" | "signed" | "declined";
  signedAt?: string | null;
  signatureMethod?: "drawn" | "typed" | null;
  signatureArtifactPath?: string | null;
  typedSignature?: string | null;
};

export type ResolvedDocumentBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "fields"; fields: Array<{ label: string; value: string }> }
  | { type: "vehicles"; vehicles: AgreementVehicle[] }
  | { type: "revenue_split"; operatorPercent: number; ownerPercent: number }
  | { type: "payment_schedule"; cadence: Exclude<PaymentCadence, ""> }
  | { type: "trial_period"; startDate: string; reviewDate: string }
  | { type: "signatures"; signers: DocumentSigner[] };

export type ResolvedAgreementDocument = {
  schemaVersion: 1 | 2;
  title: string;
  agreementNumber: string;
  agreementVersion: number;
  effectiveDate: string;
  preamble: string;
  operator: VehicleConsignmentAgreementData["operator"];
  owners: AgreementParty[];
  counterparties?: AgreementParty[];
  counterpartyLabel?: string;
  summary: {
    trialStartDate?: string;
    trialReviewDate?: string;
    operatorPercent?: number;
    ownerPercent?: number;
    vehicles?: AgreementVehicle[];
    items?: Array<{ label: string; value: string }>;
  };
  sections: Array<{
    number: number;
    title: string;
    blocks: ResolvedDocumentBlock[];
  }>;
};

export type AgreementListItem = {
  id: string;
  agreement_number: string;
  status: AgreementStatus;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  executed_at: string | null;
  template: { name: string } | null;
  version: {
    agreement_data: AgreementData;
  } | null;
  signers: Array<Pick<DocumentSigner, "fullName" | "role" | "status">>;
};

export type AgreementDetail = {
  id: string;
  agreementNumber: string;
  status: AgreementStatus;
  templateId: string;
  templateName: string;
  templateDefinition: TemplateDefinition;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  executedAt: string | null;
  voidedAt: string | null;
  expiresAt: string | null;
  finalPdfPath: string | null;
  version: {
    id: string;
    number: number;
    agreementData: AgreementData;
    renderedContent: ResolvedAgreementDocument | null;
    documentHash: string | null;
    frozenAt: string | null;
  };
  signers: Array<
    DocumentSigner & {
      id: string;
      email: string;
      phone: string;
      viewedAt: string | null;
    }
  >;
  events: Array<{
    id: string;
    eventType: string;
    message: string | null;
    createdAt: string;
    signerId: string | null;
  }>;
};

export const DEFAULT_VEHICLE_CONSIGNMENT_DATA: VehicleConsignmentAgreementData = {
  agreementType: "vehicle_consignment",
  effectiveDate: "2026-08-20",
  operator: {
    legalName: "Heldy’s LLC",
    tradeName: "Rent With Heldy",
    address: "1 South Federal Highway\nDania Beach, Florida 33004",
    phone: "561-519-8958",
    email: "heldy@rentwithheldy.com",
    signer: {
      fullName: "Andrew Heldenmuth",
      email: "heldy@rentwithheldy.com",
      phone: "561-519-8958",
      role: "Rent With Heldy",
      required: true,
    },
  },
  owners: [
    {
      fullName: "Gary Heldenmuth",
      email: "GaryHH1@MSN.com",
      phone: "954-655-8107",
      address: "",
      role: "Vehicle Owner",
      required: true,
    },
  ],
  vehicles: [
    {
      year: 2018,
      make: "Ford",
      model: "Transit 350 Passenger Van",
      vin: "1FBAX2CM3JKA25303",
      mileage: 115257,
      licensePlate: "",
    },
    {
      year: 2024,
      make: "Ford",
      model: "Transit 350 HD Passenger Van",
      vin: "1FBVU4XG6RKA04970",
      mileage: 33083,
      licensePlate: "",
    },
  ],
  economics: { operatorPercent: 70, ownerPercent: 30 },
  trial: { startDate: "2026-08-20", reviewDate: "2026-11-20" },
  paymentCadence: "",
};

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const DEFAULT_LONG_TERM_RENTAL_DATA: LongTermRentalAgreementData = {
  agreementType: "long_term_rental",
  effectiveDate: localDateString(),
  operator: structuredClone(DEFAULT_VEHICLE_CONSIGNMENT_DATA.operator),
  renter: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    role: "Renter",
    required: true,
    dateOfBirth: "",
    driversLicenseNumber: "",
    driversLicenseState: "FL",
    licenseExpirationDate: "",
    city: "",
    state: "FL",
    zip: "",
  },
  vehicle: {
    year: new Date().getFullYear(),
    make: "",
    model: "",
    color: "",
    vin: "",
    licensePlate: "",
    mileage: 0,
    fuelLevel: "Full",
  },
  rental: {
    startDate: localDateString(),
    endDate: "",
    weeklyRate: null,
    monthlyRate: null,
    paymentDue: "",
  },
  insurance: {
    arrangement: "",
    company: "",
    policyholderName: "",
    policyNumber: "",
    effectiveDate: "",
    expirationDate: "",
    agentPhone: "",
  },
  additionalDriver: { fullName: "", driversLicenseNumber: "" },
  rideshareUse: "",
  maintenance: {
    routine: "",
    oilChanges: "",
    tires: "",
    mechanicalRepairs: "",
  },
  returnLocation: "",
  condition: {
    exterior: "",
    interior: "",
    mechanical: "",
    photosTaken: false,
    keysProvided: 1,
    renterInitials: "",
    acceptanceDate: "",
  },
};

export function isLongTermRentalData(
  data: AgreementData,
): data is LongTermRentalAgreementData {
  return data.agreementType === "long_term_rental" || "renter" in data;
}

export function templateDataKind(
  definition: TemplateDefinition,
): AgreementTemplateDataKind {
  return definition.data_kind ??
    (definition.agreement_code === "LTR" ? "long_term_rental" : "vehicle_consignment");
}

export const AGREEMENT_CONSENT_VERSION = "rwh-esign-consent-v1";
