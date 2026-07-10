import { useState } from "react";
import { Plane } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

// value = stored on the lead (do NOT translate); labelKey = display only.
const AIRPORTS = [
  { value: "FLL — Fort Lauderdale", labelKey: "fll" },
  { value: "MIA — Miami International", labelKey: "mia" },
  { value: "PBI — Palm Beach", labelKey: "pbi" },
  { value: "Other", labelKey: "other" },
] as const;

const AirportQuoteForm = () => {
  const { t } = useTranslation("forms");
  const [submitting, setSubmitting] = useState(false);
  const [airport, setAirport] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const airline = String(fd.get("airline") || "").trim();
    const flightNumber = String(fd.get("flightNumber") || "").trim();
    const arrivalDateTime = String(fd.get("arrivalDateTime") || "").trim();
    const returnDateTime = String(fd.get("returnDateTime") || "").trim();
    const pickupNotes = String(fd.get("pickupNotes") || "").trim();
    const notes = String(fd.get("notes") || "").trim();

    if (!name || !phone || !airport || !arrivalDateTime || !returnDateTime) {
      toast({
        title: t("shared.toastCheckDetails"),
        description: t("airportQuote.requiredFields"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const notesComposed = [
      `Airport: ${airport}`,
      airline ? `Airline: ${airline}` : null,
      flightNumber ? `Flight #: ${flightNumber}` : null,
      pickupNotes ? `Pickup Notes: ${pickupNotes}` : null,
      notes ? `Additional: ${notes}` : null,
      `[Source: airport-trips]`,
      `[Lead Type: Airport Traveler]`,
      `[Submitted: ${new Date().toISOString()}]`,
    ].filter(Boolean).join(" | ");

    const { error } = await supabase.from("leads").insert({
      form_type: "airport_quote",
      vertical_path: "airport",
      service_context: "Airport Rental",
      passenger_type: "Airport Traveler",
      name,
      phone,
      location: airport,
      needed_when: `Arrival: ${arrivalDateTime} | Return: ${returnDateTime}`,
      notes: notesComposed,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (error) {
      console.error("Lead insert failed", error);
      toast({
        title: t("shared.saveErrorTitle"),
        description: t("shared.saveErrorDesc", { phone: CONTACT_PHONE_DISPLAY }),
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const subject = `Airport Quote — ${airport}${airline ? ` / ${airline} ${flightNumber}` : ""}`;
    const body = `Source: airport-trips\nLead Type: Airport Traveler\nName: ${name}\nPhone: ${phone}\nAirport: ${airport}\nAirline: ${airline}\nFlight #: ${flightNumber}\nArrival: ${arrivalDateTime}\nReturn: ${returnDateTime}\nPickup Notes: ${pickupNotes}\nNotes: ${notes}\nSubmitted: ${new Date().toISOString()}`;
    window.location.href = `mailto:rentwithheldy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({
      title: t("shared.savedTitle"),
      description: t("shared.savedDesc"),
    });
    setTimeout(() => setSubmitting(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card shadow-tropical overflow-hidden">
      <div className="bg-gradient-tropical px-6 py-4 flex items-center gap-2">
        <Plane className="h-5 w-5 text-primary-foreground" />
        <h3 className="text-lg font-bold text-primary-foreground">{t("airportQuote.title")}</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("airportQuote.subtitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="aq-name">{t("airportQuote.fields.name")}</Label>
            <Input id="aq-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-phone">{t("airportQuote.fields.phone")}</Label>
            <Input id="aq-phone" name="phone" required type="tel" maxLength={20} autoComplete="tel" inputMode="tel" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="aq-airport">{t("airportQuote.fields.airport")}</Label>
            <Select value={airport} onValueChange={setAirport}>
              <SelectTrigger id="aq-airport" className="h-10">
                <SelectValue placeholder={t("airportQuote.fields.airportPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {AIRPORTS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{t(`airportQuote.airports.${a.labelKey}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-airline">{t("airportQuote.fields.airline")}</Label>
            <Input id="aq-airline" name="airline" maxLength={60} placeholder={t("airportQuote.fields.airlinePlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-flightNumber">{t("airportQuote.fields.flightNumber")}</Label>
            <Input id="aq-flightNumber" name="flightNumber" maxLength={20} placeholder={t("airportQuote.fields.flightNumberPlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-arrivalDateTime">{t("airportQuote.fields.arrival")}</Label>
            <Input id="aq-arrivalDateTime" name="arrivalDateTime" required maxLength={60} placeholder={t("airportQuote.fields.arrivalPlaceholder")} />
            <p className="text-xs text-muted-foreground">{t("airportQuote.fields.arrivalHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-returnDateTime">{t("airportQuote.fields.return")}</Label>
            <Input id="aq-returnDateTime" name="returnDateTime" required maxLength={60} placeholder={t("airportQuote.fields.returnPlaceholder")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="aq-pickupNotes">{t("airportQuote.fields.pickupNotes")}</Label>
            <Input id="aq-pickupNotes" name="pickupNotes" maxLength={200} placeholder={t("airportQuote.fields.pickupNotesPlaceholder")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="aq-notes">{t("airportQuote.fields.notes")}</Label>
            <Textarea id="aq-notes" name="notes" maxLength={500} rows={3} placeholder={t("airportQuote.fields.notesPlaceholder")} />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
        >
          {submitting ? t("shared.sending") : t("airportQuote.cta")}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {t("shared.preferToTalk")}{" "}
          <a href={CONTACT_PHONE_HREF} dir="ltr" className="text-primary hover:underline">{CONTACT_PHONE_DISPLAY}</a>
        </p>
      </form>
    </div>
  );
};

export default AirportQuoteForm;
