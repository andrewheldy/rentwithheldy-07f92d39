import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, CheckCircle2, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import ChoiceField, { type ChoiceOption } from "./ChoiceField";
import QuestionnaireShell from "./QuestionnaireShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  OWNERSHIP_STATUSES,
  PASSENGER_CAPACITIES,
  VEHICLE_AVAILABILITY,
  VEHICLE_CONDITIONS,
  VehicleSupplySubmissionSchema,
  VEHICLE_TYPES,
} from "@/lib/acquisition-leads";
import {
  clearFunnelDraft,
  getLeadAttribution,
  loadFunnelDraft,
  saveFunnelDraft,
} from "@/lib/funnel-persistence";
import { track } from "@/lib/analytics";

const DRAFT_KEY = "rwh.vehicle-supply.v1";

type SupplyStep =
  | "vehicle"
  | "vehicleType"
  | "passengerCapacity"
  | "mileage"
  | "condition"
  | "ownership"
  | "availability"
  | "location"
  | "photos"
  | "vin"
  | "contact";

type SupplyDraft = {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  vehicleType: string;
  passengerCapacity: string;
  mileage: string;
  vehicleCondition: string;
  ownershipStatus: string;
  vehicleAvailability: string;
  zipCode: string;
  vin: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  website: string;
};

const initialDraft: SupplyDraft = {
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleTrim: "",
  vehicleType: "",
  passengerCapacity: "",
  mileage: "",
  vehicleCondition: "",
  ownershipStatus: "",
  vehicleAvailability: "",
  zipCode: "",
  vin: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  website: "",
};

const persistedSupplyData = (draft: SupplyDraft) => ({
  vehicleYear: draft.vehicleYear,
  vehicleMake: draft.vehicleMake,
  vehicleModel: draft.vehicleModel,
  vehicleTrim: draft.vehicleTrim,
  vehicleType: draft.vehicleType,
  passengerCapacity: draft.passengerCapacity,
  mileage: draft.mileage,
  vehicleCondition: draft.vehicleCondition,
  ownershipStatus: draft.ownershipStatus,
  vehicleAvailability: draft.vehicleAvailability,
  // ZIP, VIN, honeypot, and contact fields intentionally remain memory-only.
});

const VehicleSupplyFunnel = () => {
  const { t } = useTranslation(["acquisition", "common"]);
  const loaded = useMemo(() => loadFunnelDraft(DRAFT_KEY, initialDraft), []);
  const [draft, setDraft] = useState<SupplyDraft>(loaded.data);
  const [stepIndex, setStepIndex] = useState(loaded.step);
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const startedRef = useRef(false);

  const steps = useMemo<SupplyStep[]>(() => {
    const result: SupplyStep[] = ["vehicle", "vehicleType"];
    if (draft.vehicleType === "passenger_van") result.push("passengerCapacity");
    result.push("mileage", "condition", "ownership", "availability", "location", "photos", "vin", "contact");
    return result;
  }, [draft.vehicleType]);

  useEffect(() => {
    if (stepIndex >= steps.length) setStepIndex(Math.max(steps.length - 1, 0));
  }, [stepIndex, steps.length]);

  useEffect(() => {
    if (!submitted) saveFunnelDraft(DRAFT_KEY, persistedSupplyData(draft), stepIndex);
  }, [draft, stepIndex, submitted]);

  const currentStep = steps[stepIndex] ?? "vehicle";
  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("consignment_funnel_started", { step_number: stepIndex + 1 });
  };

  const option = (group: string, value: string): ChoiceOption => {
    const descriptionKey = `supply.options.${group}.${value}.description`;
    const description = t(descriptionKey, { defaultValue: "" });
    return {
      value,
      label: t(`supply.options.${group}.${value}.label`),
      description: description && description !== descriptionKey ? description : undefined,
    };
  };

  const setSingle = (field: keyof SupplyDraft, value: string) => {
    markStarted();
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const currentYear = new Date().getFullYear();
  const numericYear = Number(draft.vehicleYear);
  const numericMileage = Number(draft.mileage);
  const canContinue = (() => {
    switch (currentStep) {
      case "vehicle":
        return numericYear >= 1980 && numericYear <= currentYear + 1 && Boolean(draft.vehicleMake.trim() && draft.vehicleModel.trim());
      case "vehicleType":
        return Boolean(draft.vehicleType);
      case "passengerCapacity":
        return Boolean(draft.passengerCapacity);
      case "mileage":
        return Number.isInteger(numericMileage) && numericMileage >= 0 && numericMileage <= 1_000_000;
      case "condition":
        return Boolean(draft.vehicleCondition);
      case "ownership":
        return Boolean(draft.ownershipStatus);
      case "availability":
        return Boolean(draft.vehicleAvailability);
      case "location":
        return /^\d{5}(-\d{4})?$/.test(draft.zipCode.trim());
      case "photos":
        return true;
      case "vin":
        return draft.vin.trim() === "" || /^[A-HJ-NPR-Z0-9]{17}$/.test(draft.vin.trim().toUpperCase());
      case "contact":
        return (
          draft.firstName.trim().length > 0 &&
          draft.lastName.trim().length > 0 &&
          draft.phone.replace(/\D/g, "").length >= 7 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())
        );
      default:
        return false;
    }
  })();

  const submit = async () => {
    setSubmitError(null);
    const payload = {
      leadType: "vehicle_supply" as const,
      vehicleYear: Number(draft.vehicleYear),
      vehicleMake: draft.vehicleMake,
      vehicleModel: draft.vehicleModel,
      vehicleTrim: draft.vehicleTrim || null,
      vehicleType: draft.vehicleType,
      passengerCapacity: draft.passengerCapacity || null,
      mileage: Number(draft.mileage),
      vehicleCondition: draft.vehicleCondition,
      ownershipStatus: draft.ownershipStatus,
      vehicleAvailability: draft.vehicleAvailability,
      vin: draft.vin || null,
      zipCode: draft.zipCode,
      firstName: draft.firstName,
      lastName: draft.lastName,
      phone: draft.phone,
      email: draft.email,
      ...getLeadAttribution("/list-your-vehicle"),
      website: draft.website,
      startedAt,
    };
    const parsed = VehicleSupplySubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      setSubmitError(t("shared.validation.review"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/submit-acquisition-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || t("shared.validation.submit"));

      clearFunnelDraft(DRAFT_KEY);
      setSubmitted(true);
      track("consignment_funnel_completed", {
        step_number: steps.length,
        vehicle_type: draft.vehicleType,
        vehicle_year: Number(draft.vehicleYear),
        vehicle_condition: draft.vehicleCondition,
        availability: draft.vehicleAvailability,
        passenger_capacity: draft.passengerCapacity || null,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("shared.validation.submit"));
    } finally {
      setSubmitting(false);
    }
  };

  const advance = () => {
    markStarted();
    setSubmitError(null);
    if (currentStep === "contact") return submit();
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  if (submitted) {
    return (
      <section className="rounded-card border border-border bg-card px-6 py-12 text-center shadow-card sm:px-10" aria-live="polite">
        <CheckCircle2 className="mx-auto h-11 w-11 text-primary" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {t("supply.confirmation.eyebrow")}
        </p>
        <h2 className="mt-3 text-heading font-semibold text-ink">{t("supply.confirmation.title")}</h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">{t("supply.confirmation.body")}</p>
        <dl className="mx-auto mt-8 grid max-w-2xl gap-px overflow-hidden border border-border bg-border text-start sm:grid-cols-2">
          <div className="bg-background px-5 py-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("supply.confirmation.vehicle")}</dt>
            <dd className="mt-1 font-medium text-foreground">{draft.vehicleYear} {draft.vehicleMake} {draft.vehicleModel}</dd>
          </div>
          <div className="bg-background px-5 py-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("supply.confirmation.availability")}</dt>
            <dd className="mt-1 font-medium text-foreground">{t(`supply.options.availability.${draft.vehicleAvailability}.label`)}</dd>
          </div>
        </dl>
        <Button asChild size="lg" className="mt-8">
          <Link to="/">{t("supply.confirmation.explore")}</Link>
        </Button>
      </section>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case "vehicle":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supply-year">{t("supply.fields.year")}</Label>
              <Input id="supply-year" name="vehicleYear" type="number" inputMode="numeric" min={1980} max={currentYear + 1} value={draft.vehicleYear} onChange={(event) => setDraft((previous) => ({ ...previous, vehicleYear: event.target.value }))} required className="min-h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supply-make">{t("supply.fields.make")}</Label>
              <Input id="supply-make" name="vehicleMake" autoComplete="off" maxLength={80} value={draft.vehicleMake} onChange={(event) => setDraft((previous) => ({ ...previous, vehicleMake: event.target.value }))} required className="min-h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supply-model">{t("supply.fields.model")}</Label>
              <Input id="supply-model" name="vehicleModel" autoComplete="off" maxLength={80} value={draft.vehicleModel} onChange={(event) => setDraft((previous) => ({ ...previous, vehicleModel: event.target.value }))} required className="min-h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supply-trim">{t("supply.fields.trim")}</Label>
              <Input id="supply-trim" name="vehicleTrim" autoComplete="off" maxLength={80} value={draft.vehicleTrim} onChange={(event) => setDraft((previous) => ({ ...previous, vehicleTrim: event.target.value }))} className="min-h-12 text-base" />
            </div>
          </div>
        );
      case "vehicleType":
        return (
          <ChoiceField
            legend={t("supply.steps.vehicleType.title")}
            name="supply-vehicle-type"
            options={VEHICLE_TYPES.map((value) => option("vehicleTypes", value))}
            selected={[draft.vehicleType].filter(Boolean)}
            onChange={(value) => {
              markStarted();
              setDraft((previous) => ({
                ...previous,
                vehicleType: value,
                passengerCapacity:
                  value === "passenger_van" ? previous.passengerCapacity : "",
              }));
              track("consignment_vehicle_type_selected", { step_number: stepIndex + 1, vehicle_type: value });
            }}
          />
        );
      case "passengerCapacity":
        return (
          <ChoiceField
            legend={t("supply.steps.passengerCapacity.title")}
            name="passenger-capacity"
            options={PASSENGER_CAPACITIES.map((value) => option("passengerCapacities", value))}
            selected={[draft.passengerCapacity].filter(Boolean)}
            onChange={(value) => setSingle("passengerCapacity", value)}
          />
        );
      case "mileage":
        return (
          <div className="max-w-md space-y-2">
            <Label htmlFor="supply-mileage">{t("supply.fields.mileage")}</Label>
            <Input id="supply-mileage" name="mileage" type="number" inputMode="numeric" min={0} max={1_000_000} step={1} value={draft.mileage} onChange={(event) => setDraft((previous) => ({ ...previous, mileage: event.target.value }))} placeholder={t("supply.fields.mileagePlaceholder")} required className="min-h-12 text-base" />
          </div>
        );
      case "condition":
        return (
          <ChoiceField legend={t("supply.steps.condition.title")} name="vehicle-condition" columns={1} options={VEHICLE_CONDITIONS.map((value) => option("conditions", value))} selected={[draft.vehicleCondition].filter(Boolean)} onChange={(value) => setSingle("vehicleCondition", value)} />
        );
      case "ownership":
        return (
          <ChoiceField legend={t("supply.steps.ownership.title")} name="ownership-status" options={OWNERSHIP_STATUSES.map((value) => option("ownership", value))} selected={[draft.ownershipStatus].filter(Boolean)} onChange={(value) => setSingle("ownershipStatus", value)} />
        );
      case "availability":
        return (
          <ChoiceField legend={t("supply.steps.availability.title")} name="vehicle-availability" options={VEHICLE_AVAILABILITY.map((value) => option("availability", value))} selected={[draft.vehicleAvailability].filter(Boolean)} onChange={(value) => setSingle("vehicleAvailability", value)} />
        );
      case "location":
        return (
          <div className="max-w-md space-y-2">
            <Label htmlFor="supply-zip">{t("shared.fields.zip")}</Label>
            <Input id="supply-zip" name="zipCode" inputMode="numeric" autoComplete="postal-code" maxLength={10} value={draft.zipCode} onChange={(event) => setDraft((previous) => ({ ...previous, zipCode: event.target.value }))} placeholder={t("shared.fields.zipPlaceholder")} required className="min-h-12 text-base" />
          </div>
        );
      case "photos":
        return (
          <div className="max-w-2xl border-s-2 border-primary bg-primary/[0.06] px-5 py-5">
            <Camera className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold text-ink">{t("supply.photos.title")}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("supply.photos.body")}</p>
          </div>
        );
      case "vin":
        return (
          <div className="max-w-xl space-y-2">
            <Label htmlFor="supply-vin">{t("supply.fields.vin")}</Label>
            <Input id="supply-vin" name="vin" autoCapitalize="characters" autoComplete="off" maxLength={17} value={draft.vin} onChange={(event) => setDraft((previous) => ({ ...previous, vin: event.target.value.toUpperCase() }))} placeholder={t("supply.fields.vinPlaceholder")} className="min-h-12 font-mono text-base uppercase tracking-wider" aria-describedby="vin-help" />
            <p id="vin-help" className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t("supply.fields.vinHelp")}
            </p>
          </div>
        );
      case "contact":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["firstName", "lastName"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`supply-${field}`}>{t(`shared.fields.${field}`)}</Label>
                <Input id={`supply-${field}`} name={field} autoComplete={field === "firstName" ? "given-name" : "family-name"} maxLength={80} value={draft[field]} onChange={(event) => setDraft((previous) => ({ ...previous, [field]: event.target.value }))} required className="min-h-12 text-base" />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="supply-phone">{t("shared.fields.phone")}</Label>
              <Input id="supply-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={draft.phone} onChange={(event) => setDraft((previous) => ({ ...previous, phone: event.target.value }))} required className="min-h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supply-email">{t("shared.fields.email")}</Label>
              <Input id="supply-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={draft.email} onChange={(event) => setDraft((previous) => ({ ...previous, email: event.target.value }))} required className="min-h-12 text-base" />
            </div>
            <div className="absolute -start-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <Label htmlFor="supply-website">Website</Label>
              <Input id="supply-website" name="website" tabIndex={-1} autoComplete="off" value={draft.website} onChange={(event) => setDraft((previous) => ({ ...previous, website: event.target.value }))} />
            </div>
            <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">{t("shared.privacy")}</p>
          </div>
        );
    }
  };

  return (
    <QuestionnaireShell
      eyebrow={t("supply.funnelEyebrow")}
      heading={t(`supply.steps.${currentStep}.title`)}
      help={t(`supply.steps.${currentStep}.help`)}
      step={stepIndex}
      totalSteps={steps.length}
      stepLabel={t("shared.stepOf", { current: stepIndex + 1, total: steps.length })}
      backLabel={t("shared.back")}
      continueLabel={currentStep === "contact" ? t("supply.submit") : t("shared.continue")}
      submittingLabel={t("shared.submitting")}
      disclaimer={t("supply.disclaimer")}
      canContinue={canContinue}
      submitting={submitting}
      error={submitError}
      onBack={() => {
        setSubmitError(null);
        setStepIndex((index) => Math.max(0, index - 1));
      }}
      onContinue={advance}
      onInvalid={() => setSubmitError(t("shared.validation.review"))}
    >
      {renderStep()}
    </QuestionnaireShell>
  );
};

export default VehicleSupplyFunnel;
