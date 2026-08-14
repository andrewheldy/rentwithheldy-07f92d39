import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";
import { track } from "@/lib/analytics";

type SubmissionState = "idle" | "submitting" | "success" | "error";

interface RentalInquiryFormProps {
  initialTripType?: string;
  initialVehicle?: string;
}

const TRIP_VALUES = [
  "cruise",
  "sports_team",
  "event",
  "vacation",
  "concierge",
  "professional_driver",
  "other",
] as const;

const VEHICLE_VALUES = [
  "no_preference",
  "2018-transit-350",
  "2024-transit-350-hd",
] as const;

const FormResult = ({ type }: { type: "rental" | "consignment" }) => {
  const { t } = useTranslation("passengerVans");
  return (
    <div
      className="flex min-h-72 flex-col items-center justify-center rounded-card border border-primary/25 bg-primary/[0.06] p-8 text-center"
      role="status"
    >
      <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
      <h3 className="mt-4 text-subheading font-bold text-ink">
        {t(`forms.${type}.successTitle`)}
      </h3>
      <p className="mt-2 max-w-md text-muted-foreground">
        {t(`forms.${type}.successBody`)}
      </p>
    </div>
  );
};

export const RentalInquiryForm = ({
  initialTripType = "",
  initialVehicle = "no_preference",
}: RentalInquiryFormProps) => {
  const { t } = useTranslation("passengerVans");
  const [state, setState] = useState<SubmissionState>("idle");
  const [tripType, setTripType] = useState(initialTripType);
  const [preferredVehicle, setPreferredVehicle] = useState(initialVehicle);
  const started = useRef(false);

  useEffect(() => {
    if (initialTripType) setTripType(initialTripType);
  }, [initialTripType]);

  useEffect(() => {
    if (initialVehicle) setPreferredVehicle(initialVehicle);
  }, [initialVehicle]);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    track("passenger_vans_inquiry_start", {
      use_case: tripType || "not_selected",
      vehicle: preferredVehicle,
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      setState("error");
      return;
    }
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const phone = String(values.get("phone") || "").trim();
    const email = String(values.get("email") || "").trim();
    const startDate = String(values.get("startDate") || "");
    const endDate = String(values.get("endDate") || "");
    const passengers = String(values.get("passengers") || "");
    const area = String(values.get("area") || "").trim();
    const message = String(values.get("message") || "").trim();

    if (!name || !phone || !email || !startDate || !endDate || !passengers || !tripType || !area) {
      setState("error");
      return;
    }

    if (endDate < startDate) {
      setState("error");
      return;
    }

    setState("submitting");
    const notes = [
      `Passengers: ${passengers}`,
      `Trip type: ${tripType}`,
      `Preferred vehicle: ${preferredVehicle}`,
      message ? `Requirements: ${message}` : null,
      "[Source: passenger_vans]",
    ]
      .filter(Boolean)
      .join(" | ");

    const { error: insertError } = await supabase.from("leads").insert({
      form_type: "quick_quote",
      vertical_path: "passenger_vans",
      service_context: "Passenger Van Inquiry",
      passenger_type: tripType,
      name,
      phone,
      email,
      location: area,
      needed_when: `${startDate} through ${endDate}`,
      notes,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (insertError) console.error("Passenger van lead insert failed", insertError);

    let emailError = false;
    try {
      const response = await fetch("/api/send-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "passenger_vans",
          formType: "passenger_vans",
          passengerType: tripType,
          name,
          phone,
          email,
          location: area,
          startDate,
          endDate,
          notes,
        }),
      });
      if (!response.ok) emailError = true;
    } catch {
      emailError = true;
    }

    if (insertError && emailError) {
      setState("error");
      return;
    }

    track("passenger_vans_inquiry_submit", {
      use_case: tripType,
      vehicle: preferredVehicle,
      passenger_count: Number(passengers),
    });
    if (tripType === "concierge") {
      track("passenger_vans_concierge_inquiry", { vehicle: preferredVehicle });
    }
    if (tripType === "professional_driver") {
      track("passenger_vans_professional_driver_inquiry", {
        vehicle: preferredVehicle,
      });
    }
    setState("success");
    form.reset();
  };

  if (state === "success") return <FormResult type="rental" />;

  return (
    <form
      onSubmit={onSubmit}
      onFocusCapture={markStarted}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="pv-name">{t("forms.rental.fields.name")}</Label>
        <Input id="pv-name" name="name" autoComplete="name" required maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pv-phone">{t("forms.rental.fields.phone")}</Label>
        <Input id="pv-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pv-email">{t("forms.rental.fields.email")}</Label>
        <Input id="pv-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pv-start">{t("forms.rental.fields.startDate")}</Label>
        <Input id="pv-start" name="startDate" type="date" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pv-end">{t("forms.rental.fields.endDate")}</Label>
        <Input id="pv-end" name="endDate" type="date" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pv-passengers">{t("forms.rental.fields.passengers")}</Label>
        <Input id="pv-passengers" name="passengers" type="number" inputMode="numeric" min={1} max={14} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pv-trip-type">{t("forms.rental.fields.tripType")}</Label>
        <select
          id="pv-trip-type"
          name="tripType"
          value={tripType}
          onChange={(event) => setTripType(event.target.value)}
          required
          className="flex h-11 w-full rounded-control border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">{t("forms.rental.fields.selectTripType")}</option>
          {TRIP_VALUES.map((value) => (
            <option key={value} value={value}>{t(`tripSelector.options.${value}.label`)}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pv-vehicle">{t("forms.rental.fields.preferredVehicle")}</Label>
        <select
          id="pv-vehicle"
          name="preferredVehicle"
          value={preferredVehicle}
          onChange={(event) => setPreferredVehicle(event.target.value)}
          className="flex h-11 w-full rounded-control border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {VEHICLE_VALUES.map((value) => (
            <option key={value} value={value}>{t(`forms.rental.vehicles.${value}`)}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pv-area">{t("forms.rental.fields.area")}</Label>
        <Input id="pv-area" name="area" required maxLength={160} placeholder={t("forms.rental.fields.areaPlaceholder")} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pv-message">{t("forms.rental.fields.message")}</Label>
        <Textarea id="pv-message" name="message" rows={4} maxLength={1200} placeholder={t("forms.rental.fields.messagePlaceholder")} />
      </div>
      {state === "error" && (
        <p className="text-sm text-destructive sm:col-span-2" role="alert">
          {t("forms.rental.error")} {" "}
          <a href={CONTACT_PHONE_HREF} dir="ltr" className="font-semibold underline">
            {CONTACT_PHONE_DISPLAY}
          </a>
        </p>
      )}
      <Button type="submit" size="lg" disabled={state === "submitting"} className="sm:col-span-2">
        <Send className="h-4 w-4" aria-hidden="true" />
        {state === "submitting" ? t("forms.rental.sending") : t("forms.rental.cta")}
      </Button>
    </form>
  );
};

export const ConsignmentInquiryForm = () => {
  const { t } = useTranslation("passengerVans");
  const [state, setState] = useState<SubmissionState>("idle");
  const started = useRef(false);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    track("passenger_vans_consignment_start");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      setState("error");
      return;
    }
    const values = new FormData(form);
    const value = (name: string) => String(values.get(name) || "").trim();
    const name = value("name");
    const phone = value("phone");
    const email = value("email");
    const year = value("year");
    const make = value("make");
    const model = value("model");
    const capacity = value("capacity");
    const mileage = value("mileage");
    const vin = value("vin");
    const location = value("location");
    const condition = value("condition");
    const notesValue = value("notes");

    if (!name || !phone || !email || !year || !make || !model || !capacity || !mileage || !location || !condition) {
      setState("error");
      return;
    }

    setState("submitting");
    const notes = [
      `Vehicle: ${year} ${make} ${model}`,
      `Passenger capacity: ${capacity}`,
      `Mileage: ${mileage}`,
      vin ? `VIN: ${vin}` : null,
      `Condition: ${condition}`,
      notesValue ? `Owner notes: ${notesValue}` : null,
      "[Source: passenger_van_consignment]",
    ]
      .filter(Boolean)
      .join(" | ");

    const { error: insertError } = await supabase.from("leads").insert({
      form_type: "partner_intake",
      vertical_path: "passenger_van_consignment",
      service_context: "Passenger Van Consignment",
      name,
      phone,
      email,
      company: `${year} ${make} ${model}`,
      location,
      notes,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (insertError) console.error("Passenger van consignment insert failed", insertError);

    let emailError = false;
    try {
      const response = await fetch("/api/send-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "passenger_van_consignment",
          formType: "passenger_van_consignment",
          name,
          phone,
          email,
          company: `${year} ${make} ${model}`,
          location,
          notes,
        }),
      });
      if (!response.ok) emailError = true;
    } catch {
      emailError = true;
    }

    if (insertError && emailError) {
      setState("error");
      return;
    }

    track("passenger_vans_consignment_submit", {
      vehicle_year: Number(year),
      passenger_capacity: Number(capacity),
    });
    setState("success");
    form.reset();
  };

  if (state === "success") return <FormResult type="consignment" />;

  return (
    <form
      onSubmit={onSubmit}
      onFocusCapture={markStarted}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="consign-name">{t("forms.consignment.fields.name")}</Label>
        <Input id="consign-name" name="name" autoComplete="name" required maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-phone">{t("forms.consignment.fields.phone")}</Label>
        <Input id="consign-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="consign-email">{t("forms.consignment.fields.email")}</Label>
        <Input id="consign-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-year">{t("forms.consignment.fields.year")}</Label>
        <Input id="consign-year" name="year" type="number" inputMode="numeric" min={1990} max={new Date().getFullYear() + 1} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-make">{t("forms.consignment.fields.make")}</Label>
        <Input id="consign-make" name="make" required maxLength={60} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-model">{t("forms.consignment.fields.model")}</Label>
        <Input id="consign-model" name="model" required maxLength={80} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-capacity">{t("forms.consignment.fields.capacity")}</Label>
        <Input id="consign-capacity" name="capacity" type="number" inputMode="numeric" min={8} max={20} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-mileage">{t("forms.consignment.fields.mileage")}</Label>
        <Input id="consign-mileage" name="mileage" type="number" inputMode="numeric" min={0} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-vin">{t("forms.consignment.fields.vin")}</Label>
        <Input id="consign-vin" name="vin" autoCapitalize="characters" maxLength={17} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="consign-location">{t("forms.consignment.fields.location")}</Label>
        <Input id="consign-location" name="location" required maxLength={160} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="consign-condition">{t("forms.consignment.fields.condition")}</Label>
        <Input id="consign-condition" name="condition" required maxLength={240} placeholder={t("forms.consignment.fields.conditionPlaceholder")} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="consign-notes">{t("forms.consignment.fields.notes")}</Label>
        <Textarea id="consign-notes" name="notes" rows={4} maxLength={1200} />
      </div>
      {state === "error" && (
        <p className="text-sm text-destructive sm:col-span-2" role="alert">
          {t("forms.consignment.error")} {" "}
          <a href={CONTACT_PHONE_HREF} dir="ltr" className="font-semibold underline">
            {CONTACT_PHONE_DISPLAY}
          </a>
        </p>
      )}
      <Button type="submit" size="lg" disabled={state === "submitting"} className="sm:col-span-2">
        <Send className="h-4 w-4" aria-hidden="true" />
        {state === "submitting" ? t("forms.consignment.sending") : t("forms.consignment.cta")}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">
        {t("forms.consignment.photoNote")}
      </p>
    </form>
  );
};
