import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import ChoiceField, { type ChoiceOption } from "./ChoiceField";
import QuestionnaireShell from "./QuestionnaireShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPOWER_REFERRAL_URL } from "@/config/driver-programs";
import {
  DELIVERY_PLATFORMS,
  CURRENT_DRIVER_PLATFORMS,
  DRIVER_PLATFORMS,
  DRIVER_STATUSES,
  DriverDemandSubmissionSchema,
  EMPOWER_STATUSES,
  LYFT_OPPORTUNITIES,
  NEED_TIMELINES,
  RENTAL_DURATIONS,
  scoreDriverLead,
  UBER_OPPORTUNITIES,
  VEHICLE_CATEGORIES,
  WEEKLY_BUDGETS,
} from "@/lib/acquisition-leads";
import {
  clearFunnelDraft,
  getLeadAttribution,
  loadFunnelDraft,
  saveFunnelDraft,
} from "@/lib/funnel-persistence";
import { track } from "@/lib/analytics";

const DRAFT_KEY = "rwh.driver-demand.v1";

type DriverStep =
  | "platforms"
  | "deliveryPlatforms"
  | "uberOpportunity"
  | "lyftOpportunity"
  | "empowerStatus"
  | "vehicleCategory"
  | "timeline"
  | "budget"
  | "driverStatus"
  | "currentPlatforms"
  | "duration"
  | "location"
  | "contact";

type DriverDraft = {
  platforms: string[];
  platformSubtypes: string[];
  vehicleCategory: string;
  needTimeline: string;
  weeklyBudget: string;
  driverStatus: string;
  currentPlatforms: string[];
  expectedDuration: string;
  empowerStatus: string;
  empowerReferralClicked: boolean;
  zipCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  website: string;
};

const initialDraft: DriverDraft = {
  platforms: [],
  platformSubtypes: [],
  vehicleCategory: "",
  needTimeline: "",
  weeklyBudget: "",
  driverStatus: "",
  currentPlatforms: [],
  expectedDuration: "",
  empowerStatus: "",
  empowerReferralClicked: false,
  zipCode: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  website: "",
};

const persistedDriverData = (draft: DriverDraft) => ({
  platforms: draft.platforms,
  platformSubtypes: draft.platformSubtypes,
  vehicleCategory: draft.vehicleCategory,
  needTimeline: draft.needTimeline,
  weeklyBudget: draft.weeklyBudget,
  driverStatus: draft.driverStatus,
  currentPlatforms: draft.currentPlatforms,
  expectedDuration: draft.expectedDuration,
  empowerStatus: draft.empowerStatus,
  empowerReferralClicked: draft.empowerReferralClicked,
  // ZIP and contact fields intentionally remain memory-only.
});

const DriverDemandFunnel = () => {
  const { t } = useTranslation(["acquisition", "common"]);
  const loaded = useMemo(() => loadFunnelDraft(DRAFT_KEY, initialDraft), []);
  const [draft, setDraft] = useState<DriverDraft>(loaded.data);
  const [stepIndex, setStepIndex] = useState(loaded.step);
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const startedRef = useRef(false);

  const steps = useMemo<DriverStep[]>(() => {
    const result: DriverStep[] = ["platforms"];
    if (draft.platforms.includes("delivery_apps")) result.push("deliveryPlatforms");
    if (draft.platforms.includes("uber")) result.push("uberOpportunity");
    if (draft.platforms.includes("lyft")) result.push("lyftOpportunity");
    if (draft.platforms.includes("empower")) result.push("empowerStatus");
    result.push("vehicleCategory", "timeline", "budget", "driverStatus");
    if (draft.driverStatus === "currently_driving") result.push("currentPlatforms");
    result.push("duration", "location", "contact");
    return result;
  }, [draft.platforms, draft.driverStatus]);

  useEffect(() => {
    if (stepIndex >= steps.length) setStepIndex(Math.max(steps.length - 1, 0));
  }, [stepIndex, steps.length]);

  useEffect(() => {
    if (!submitted) saveFunnelDraft(DRAFT_KEY, persistedDriverData(draft), stepIndex);
  }, [draft, stepIndex, submitted]);

  const currentStep = steps[stepIndex] ?? "platforms";
  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("driver_funnel_started", { step_number: stepIndex + 1 });
  };

  const option = (group: string, value: string): ChoiceOption => ({
    value,
    label: t(`driver.options.${group}.${value}.label`),
    description: t(`driver.options.${group}.${value}.description`, {
      defaultValue: "",
    }) || undefined,
  });

  const setSingle = (field: keyof DriverDraft, value: string) => {
    markStarted();
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const toggleArray = (
    field: "platforms" | "currentPlatforms",
    value: string,
    checked: boolean,
  ) => {
    markStarted();
    setDraft((previous) => {
      let next = checked
        ? [...previous[field], value]
        : previous[field].filter((item) => item !== value);
      if (field === "platforms") {
        if (value === "not_sure" && checked) next = ["not_sure"];
        else if (checked) next = next.filter((item) => item !== "not_sure");

        const selectedPlatforms = new Set(next);
        const allowedSubtypePrefixes = new Set<string>();
        if (selectedPlatforms.has("delivery_apps")) allowedSubtypePrefixes.add("delivery");
        if (selectedPlatforms.has("uber")) allowedSubtypePrefixes.add("uber");
        if (selectedPlatforms.has("lyft")) allowedSubtypePrefixes.add("lyft");

        return {
          ...previous,
          platforms: Array.from(new Set(next)),
          platformSubtypes: previous.platformSubtypes.filter((item) =>
            allowedSubtypePrefixes.has(item.split(":")[0]),
          ),
          empowerStatus: selectedPlatforms.has("empower") ? previous.empowerStatus : "",
          empowerReferralClicked: selectedPlatforms.has("empower")
            ? previous.empowerReferralClicked
            : false,
        };
      }
      return { ...previous, [field]: Array.from(new Set(next)) };
    });
    if (field === "platforms") {
      track("driver_platform_selected", {
        step_number: stepIndex + 1,
        platform: value,
        selected: checked,
      });
    }
  };

  const setSubtype = (prefix: string, value: string) => {
    markStarted();
    setDraft((previous) => ({
      ...previous,
      platformSubtypes: [
        ...previous.platformSubtypes.filter((item) => !item.startsWith(`${prefix}:`)),
        `${prefix}:${value}`,
      ],
    }));
  };

  const toggleSubtype = (prefix: string, value: string, checked: boolean) => {
    markStarted();
    const encoded = `${prefix}:${value}`;
    setDraft((previous) => ({
      ...previous,
      platformSubtypes: checked
        ? Array.from(new Set([...previous.platformSubtypes, encoded]))
        : previous.platformSubtypes.filter((item) => item !== encoded),
    }));
  };

  const subtypeValue = (prefix: string) =>
    draft.platformSubtypes.find((item) => item.startsWith(`${prefix}:`))?.split(":")[1] ?? "";
  const subtypeValues = (prefix: string) =>
    draft.platformSubtypes
      .filter((item) => item.startsWith(`${prefix}:`))
      .map((item) => item.split(":")[1]);

  const canContinue = (() => {
    switch (currentStep) {
      case "platforms":
        return draft.platforms.length > 0;
      case "deliveryPlatforms":
        return subtypeValues("delivery").length > 0;
      case "uberOpportunity":
        return Boolean(subtypeValue("uber"));
      case "lyftOpportunity":
        return Boolean(subtypeValue("lyft"));
      case "empowerStatus":
        return Boolean(draft.empowerStatus);
      case "vehicleCategory":
        return Boolean(draft.vehicleCategory);
      case "timeline":
        return Boolean(draft.needTimeline);
      case "budget":
        return Boolean(draft.weeklyBudget);
      case "driverStatus":
        return Boolean(draft.driverStatus);
      case "currentPlatforms":
        return draft.currentPlatforms.length > 0;
      case "duration":
        return Boolean(draft.expectedDuration);
      case "location":
        return /^\d{5}(-\d{4})?$/.test(draft.zipCode.trim());
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

  const handleEmpowerClick = () => {
    const next = { ...draft, empowerReferralClicked: true };
    setDraft(next);
    if (!submitted) saveFunnelDraft(DRAFT_KEY, persistedDriverData(next), stepIndex);
    track("empower_referral_clicked", {
      step_number: stepIndex + 1,
      empower_status: draft.empowerStatus,
      vehicle_category: draft.vehicleCategory || null,
    });
  };

  const submit = async () => {
    setSubmitError(null);
    const payload = {
      leadType: "driver_demand" as const,
      platforms: draft.platforms,
      platformSubtypes: draft.platformSubtypes,
      vehicleCategory: draft.vehicleCategory,
      needTimeline: draft.needTimeline,
      weeklyBudget: draft.weeklyBudget,
      driverStatus: draft.driverStatus,
      currentPlatforms: draft.currentPlatforms,
      expectedDuration: draft.expectedDuration,
      empowerStatus: draft.empowerStatus || null,
      empowerReferralClicked: draft.empowerReferralClicked,
      zipCode: draft.zipCode,
      firstName: draft.firstName,
      lastName: draft.lastName,
      phone: draft.phone,
      email: draft.email,
      ...getLeadAttribution("/drive-for-work"),
      website: draft.website,
      startedAt,
    };
    const parsed = DriverDemandSubmissionSchema.safeParse(payload);
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
      track("driver_funnel_completed", {
        step_number: steps.length,
        vehicle_category: draft.vehicleCategory,
        need_timeline: draft.needTimeline,
        weekly_budget: draft.weeklyBudget,
        lead_priority: scoreDriverLead(parsed.data),
        empower_selected: draft.platforms.includes("empower"),
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
          {t("driver.confirmation.eyebrow")}
        </p>
        <h2 className="mt-3 text-heading font-semibold text-ink">
          {t("driver.confirmation.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
          {t("driver.confirmation.body")}
        </p>
        <dl className="mx-auto mt-8 grid max-w-2xl gap-px overflow-hidden border border-border bg-border text-start sm:grid-cols-2">
          {["platforms", "vehicle", "timeline", "budget"].map((key) => (
            <div key={key} className="bg-background px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(`driver.confirmation.summary.${key}`)}
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {key === "platforms"
                  ? draft.platforms.map((value) => t(`driver.options.platforms.${value}.label`)).join(", ")
                  : key === "vehicle"
                    ? t(`driver.options.vehicleCategories.${draft.vehicleCategory}.label`)
                    : key === "timeline"
                      ? t(`driver.options.timelines.${draft.needTimeline}.label`)
                      : t(`driver.options.budgets.${draft.weeklyBudget}.label`)}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/fleet">{t("driver.confirmation.explore")}</Link>
          </Button>
          {draft.platforms.includes("empower") && draft.empowerStatus === "no" && EMPOWER_REFERRAL_URL && (
            <Button asChild variant="outline" size="lg">
              <a href={EMPOWER_REFERRAL_URL} target="_blank" rel="noopener noreferrer" onClick={handleEmpowerClick}>
                {t("driver.empower.cta")} <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </section>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case "platforms":
        return (
          <ChoiceField
            legend={t("driver.steps.platforms.title")}
            name="driver-platforms"
            multiple
            options={DRIVER_PLATFORMS.map((value) => option("platforms", value))}
            selected={draft.platforms}
            onChange={(value, checked) => toggleArray("platforms", value, checked)}
          />
        );
      case "deliveryPlatforms":
        return (
          <ChoiceField
            legend={t("driver.steps.deliveryPlatforms.title")}
            name="delivery-platforms"
            multiple
            options={DELIVERY_PLATFORMS.map((value) => option("deliveryPlatforms", value))}
            selected={subtypeValues("delivery")}
            onChange={(value, checked) => toggleSubtype("delivery", value, checked)}
          />
        );
      case "uberOpportunity":
        return (
          <ChoiceField
            legend={t("driver.steps.uberOpportunity.title")}
            name="uber-opportunity"
            options={UBER_OPPORTUNITIES.map((value) => option("uberOpportunities", value))}
            selected={[subtypeValue("uber")].filter(Boolean)}
            onChange={(value) => setSubtype("uber", value)}
          />
        );
      case "lyftOpportunity":
        return (
          <ChoiceField
            legend={t("driver.steps.lyftOpportunity.title")}
            name="lyft-opportunity"
            options={LYFT_OPPORTUNITIES.map((value) => option("lyftOpportunities", value))}
            selected={[subtypeValue("lyft")].filter(Boolean)}
            onChange={(value) => setSubtype("lyft", value)}
          />
        );
      case "empowerStatus":
        return (
          <div>
            <ChoiceField
              legend={t("driver.steps.empowerStatus.title")}
              name="empower-status"
              options={EMPOWER_STATUSES.map((value) => option("empowerStatuses", value))}
              selected={[draft.empowerStatus].filter(Boolean)}
              onChange={(value) => setSingle("empowerStatus", value)}
            />
            {draft.empowerStatus === "no" && (
              <div className="mt-5 border-s-2 border-primary bg-primary/[0.06] px-5 py-4">
                <p className="font-semibold text-ink">{t("driver.empower.title")}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("driver.empower.body")}</p>
                {EMPOWER_REFERRAL_URL ? (
                  <a
                    href={EMPOWER_REFERRAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleEmpowerClick}
                    className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline"
                  >
                    {t("driver.empower.cta")} <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="mt-3 text-sm font-medium text-muted-foreground">{t("driver.empower.linkPending")}</p>
                )}
              </div>
            )}
          </div>
        );
      case "vehicleCategory":
        return (
          <ChoiceField
            legend={t("driver.steps.vehicleCategory.title")}
            name="vehicle-category"
            options={VEHICLE_CATEGORIES.map((value) => option("vehicleCategories", value))}
            selected={[draft.vehicleCategory].filter(Boolean)}
            onChange={(value) => {
              setSingle("vehicleCategory", value);
              track("driver_vehicle_category_selected", { step_number: stepIndex + 1, vehicle_category: value });
            }}
          />
        );
      case "timeline":
        return (
          <ChoiceField
            legend={t("driver.steps.timeline.title")}
            name="need-timeline"
            options={NEED_TIMELINES.map((value) => option("timelines", value))}
            selected={[draft.needTimeline].filter(Boolean)}
            onChange={(value) => setSingle("needTimeline", value)}
          />
        );
      case "budget":
        return (
          <ChoiceField
            legend={t("driver.steps.budget.title")}
            name="weekly-budget"
            options={WEEKLY_BUDGETS.map((value) => option("budgets", value))}
            selected={[draft.weeklyBudget].filter(Boolean)}
            onChange={(value) => {
              setSingle("weeklyBudget", value);
              track("driver_budget_selected", { step_number: stepIndex + 1, weekly_budget: value });
            }}
          />
        );
      case "driverStatus":
        return (
          <ChoiceField
            legend={t("driver.steps.driverStatus.title")}
            name="driver-status"
            columns={1}
            options={DRIVER_STATUSES.map((value) => option("driverStatuses", value))}
            selected={[draft.driverStatus].filter(Boolean)}
            onChange={(value) => {
              markStarted();
              setDraft((previous) => ({
                ...previous,
                driverStatus: value,
                currentPlatforms:
                  value === "currently_driving" ? previous.currentPlatforms : [],
              }));
            }}
          />
        );
      case "currentPlatforms":
        return (
          <ChoiceField
            legend={t("driver.steps.currentPlatforms.title")}
            name="current-platforms"
            multiple
            options={CURRENT_DRIVER_PLATFORMS.map((value) => option("platforms", value))}
            selected={draft.currentPlatforms}
            onChange={(value, checked) => toggleArray("currentPlatforms", value, checked)}
          />
        );
      case "duration":
        return (
          <ChoiceField
            legend={t("driver.steps.duration.title")}
            name="rental-duration"
            options={RENTAL_DURATIONS.map((value) => option("durations", value))}
            selected={[draft.expectedDuration].filter(Boolean)}
            onChange={(value) => setSingle("expectedDuration", value)}
          />
        );
      case "location":
        return (
          <div className="max-w-md space-y-2">
            <Label htmlFor="driver-zip">{t("shared.fields.zip")}</Label>
            <Input
              id="driver-zip"
              name="zipCode"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={10}
              value={draft.zipCode}
              onChange={(event) => setDraft((previous) => ({ ...previous, zipCode: event.target.value }))}
              placeholder={t("shared.fields.zipPlaceholder")}
              required
              className="min-h-12 text-base"
            />
          </div>
        );
      case "contact":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["firstName", "lastName"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`driver-${field}`}>{t(`shared.fields.${field}`)}</Label>
                <Input
                  id={`driver-${field}`}
                  name={field}
                  autoComplete={field === "firstName" ? "given-name" : "family-name"}
                  maxLength={80}
                  value={draft[field]}
                  onChange={(event) => setDraft((previous) => ({ ...previous, [field]: event.target.value }))}
                  required
                  className="min-h-12 text-base"
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="driver-phone">{t("shared.fields.phone")}</Label>
              <Input
                id="driver-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={24}
                value={draft.phone}
                onChange={(event) => setDraft((previous) => ({ ...previous, phone: event.target.value }))}
                required
                className="min-h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-email">{t("shared.fields.email")}</Label>
              <Input
                id="driver-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                value={draft.email}
                onChange={(event) => setDraft((previous) => ({ ...previous, email: event.target.value }))}
                required
                className="min-h-12 text-base"
              />
            </div>
            <div className="absolute -start-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <Label htmlFor="driver-website">Website</Label>
              <Input id="driver-website" name="website" tabIndex={-1} autoComplete="off" value={draft.website} onChange={(event) => setDraft((previous) => ({ ...previous, website: event.target.value }))} />
            </div>
            <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">
              {t("shared.privacy")}
            </p>
          </div>
        );
    }
  };

  return (
    <QuestionnaireShell
      eyebrow={t("driver.funnelEyebrow")}
      heading={t(`driver.steps.${currentStep}.title`)}
      help={t(`driver.steps.${currentStep}.help`)}
      step={stepIndex}
      totalSteps={steps.length}
      stepLabel={t("shared.stepOf", { current: stepIndex + 1, total: steps.length })}
      backLabel={t("shared.back")}
      continueLabel={currentStep === "contact" ? t("driver.submit") : t("shared.continue")}
      submittingLabel={t("shared.submitting")}
      disclaimer={t("driver.disclaimer")}
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

export default DriverDemandFunnel;
