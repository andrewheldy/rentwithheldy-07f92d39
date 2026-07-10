import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Zap } from "lucide-react";
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

// `value` is the STABLE string persisted to Supabase / emailed to the team —
// never translate it. `labelKey`/`hintKey` drive only the visible copy.
const PASSENGER_TYPES = [
  { value: "Hotel Guest", labelKey: "hotelGuest", hintKey: "hotelGuest" },
  { value: "Airport Traveler", labelKey: "airportTraveler", hintKey: "airportTraveler" },
  { value: "Body Shop / Repair Customer", labelKey: "bodyShop", hintKey: "bodyShop" },
  { value: "Local Rental", labelKey: "localRental" },
  { value: "Other", labelKey: "other" },
] as const;

const PASSENGER_VALUES = PASSENGER_TYPES.map((p) => p.value) as [string, ...string[]];

interface QuickQuoteFormProps {
  serviceContext?: string;
  verticalPath?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  defaultPassengerType?: (typeof PASSENGER_TYPES)[number]["value"];
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const QuickQuoteForm = ({
  serviceContext = "Quick Quote",
  verticalPath,
  title,
  subtitle,
  ctaLabel,
  defaultPassengerType,
}: QuickQuoteFormProps) => {
  const { t } = useTranslation(["forms", "common"]);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [passengerType, setPassengerType] = useState<string>(
    defaultPassengerType ?? ""
  );

  // Callers may pass already-translated overrides; otherwise use the defaults.
  const heading = title ?? t("quickQuote.title");
  const sub = subtitle ?? t("quickQuote.subtitle");
  const cta = ctaLabel ?? t("quickQuote.cta");

  // Rebuilt when the language changes so validation messages stay localized.
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t("quickQuote.validation.name")).max(80),
        phone: z.string().trim().min(7, t("quickQuote.validation.phone")).max(20),
        passengerType: z.enum(PASSENGER_VALUES, {
          errorMap: () => ({ message: t("quickQuote.validation.passengerType") }),
        }),
        location: z
          .string()
          .trim()
          .min(2, t("quickQuote.validation.location"))
          .max(120),
        dateRange: z
          .string()
          .trim()
          .min(2, t("quickQuote.validation.dateRange"))
          .max(120),
        referredBy: z.string().trim().max(120).optional(),
        notes: z.string().trim().max(500).optional(),
      }),
    [t]
  );

  const activeType = PASSENGER_TYPES.find((p) => p.value === passengerType);
  const dateRangeHint =
    activeType && "hintKey" in activeType
      ? t(`quickQuote.hints.${activeType.hintKey}`)
      : "";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      phone: fd.get("phone"),
      passengerType,
      location: fd.get("location"),
      dateRange: fd.get("dateRange"),
      referredBy: fd.get("referredBy") ?? "",
      notes: fd.get("notes") ?? "",
    });
    if (!parsed.success) {
      toast({
        title: t("quickQuote.toastTitle"),
        description: parsed.error.issues[0]?.message ?? t("quickQuote.toastInvalid"),
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    setSubmitError(false);
    const { name, phone, location, dateRange, notes, referredBy } = parsed.data;
    const path = verticalPath ?? slugify(serviceContext);
    const pageSource = "home";

    const notesWithMeta = [
      notes,
      `[Source: ${pageSource}]`,
      `[Lead Type: ${parsed.data.passengerType}]`,
      `[Submitted: ${new Date().toISOString()}]`,
    ].filter(Boolean).join(" | ");

    const { error: insertError } = await supabase.from("leads").insert({
      form_type: "quick_quote",
      vertical_path: path,
      service_context: serviceContext,
      passenger_type: parsed.data.passengerType,
      name,
      phone,
      location,
      needed_when: dateRange,
      referred_by: referredBy || null,
      notes: notesWithMeta,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (insertError) {
      console.error("Lead insert failed", insertError);
    }

    try {
      const res = await fetch("/api/send-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: path,
          formType: "quick_quote",
          passengerType: parsed.data.passengerType,
          name,
          phone,
          location,
          when: dateRange,
          referredBy: referredBy || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      navigate("/book");
    } catch (err) {
      console.error("Email send failed", err);
      if (insertError) {
        setSubmitError(true);
      } else {
        navigate("/book");
      }
    }

    setSubmitting(false);
  };

  if (submitError) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card shadow-tropical overflow-hidden">
        <div className="bg-gradient-tropical px-6 py-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary-foreground" />
          <h3 className="text-lg font-bold text-primary-foreground">{heading}</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-destructive font-medium">
            {t("quickQuote.errorRetry")}
          </p>
          <a href={CONTACT_PHONE_HREF} dir="ltr" className="text-primary hover:underline text-sm mt-2 block">
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card shadow-tropical overflow-hidden">
      <div className="bg-gradient-tropical px-6 py-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary-foreground" />
        <h3 className="text-lg font-bold text-primary-foreground">{heading}</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{sub}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-passenger">{t("quickQuote.passengerTypeLabel")}</Label>
            <Select value={passengerType} onValueChange={setPassengerType}>
              <SelectTrigger id="qq-passenger">
                <SelectValue placeholder={t("quickQuote.passengerTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {PASSENGER_TYPES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {t(`quickQuote.passengerTypes.${p.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qq-name">{t("quickQuote.fields.name")}</Label>
            <Input id="qq-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qq-phone">{t("quickQuote.fields.phone")}</Label>
            <Input
              id="qq-phone"
              name="phone"
              required
              type="tel"
              maxLength={20}
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-location">{t("quickQuote.fields.location")}</Label>
            <Input
              id="qq-location"
              name="location"
              required
              maxLength={120}
              placeholder={t("quickQuote.fields.locationPlaceholder")}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-dateRange">{t("quickQuote.fields.dateRange")}</Label>
            <Input
              id="qq-dateRange"
              name="dateRange"
              required
              maxLength={120}
              placeholder={t("quickQuote.fields.dateRangePlaceholder")}
            />
            {dateRangeHint && (
              <p className="text-xs text-muted-foreground">{dateRangeHint}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-referredBy">{t("quickQuote.fields.referredBy")}</Label>
            <Input
              id="qq-referredBy"
              name="referredBy"
              maxLength={120}
              placeholder={t("quickQuote.fields.referredByPlaceholder")}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-notes">{t("quickQuote.fields.notes")}</Label>
            <Textarea
              id="qq-notes"
              name="notes"
              maxLength={500}
              rows={3}
              placeholder={t("quickQuote.fields.notesPlaceholder")}
            />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full"
        >
          {submitting ? t("quickQuote.sending") : cta}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {t("quickQuote.preferToTalk")}{" "}
          <a href={CONTACT_PHONE_HREF} dir="ltr" className="text-primary hover:underline">
            {CONTACT_PHONE_DISPLAY}
          </a>
        </p>
      </form>
    </div>
  );
};

export default QuickQuoteForm;
