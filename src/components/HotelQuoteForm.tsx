import { useState } from "react";
import { BellRing } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { insertLead } from "@/lib/leads";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

const HotelQuoteForm = () => {
  const { t } = useTranslation("forms");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const hotelName = String(fd.get("hotelName") || "").trim();
    const hotelAddress = String(fd.get("hotelAddress") || "").trim();
    const pickupDateTime = String(fd.get("pickupDateTime") || "").trim();
    const returnDateTime = String(fd.get("returnDateTime") || "").trim();
    const referredBy = String(fd.get("referredBy") || "").trim();
    const notes = String(fd.get("notes") || "").trim();

    if (!name || !phone || !hotelName || !pickupDateTime || !returnDateTime) {
      toast({
        title: t("shared.toastCheckDetails"),
        description: t("hotelQuote.requiredFields"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const notesComposed = [
      hotelAddress ? `Hotel Address: ${hotelAddress}` : null,
      notes ? `Additional: ${notes}` : null,
      `[Source: hotel-concierge-rentals]`,
      `[Lead Type: Hotel Guest]`,
      `[Submitted: ${new Date().toISOString()}]`,
    ].filter(Boolean).join(" | ");

    const { error } = await insertLead({
      form_type: "hotel_quote",
      vertical_path: "hotel",
      service_context: "Hotel Concierge Rental",
      passenger_type: "Hotel Guest",
      name,
      phone,
      company: hotelName,
      location: hotelAddress || hotelName,
      needed_when: `Pickup: ${pickupDateTime} | Return: ${returnDateTime}`,
      referred_by: referredBy || null,
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

    const subject = `Hotel Delivery Quote — ${hotelName}`;
    const body = `Source: hotel-concierge-rentals\nLead Type: Hotel Guest\nName: ${name}\nPhone: ${phone}\nHotel: ${hotelName}\nHotel Address: ${hotelAddress}\nPickup: ${pickupDateTime}\nReturn: ${returnDateTime}\nReferred By: ${referredBy}\nNotes: ${notes}\nSubmitted: ${new Date().toISOString()}`;
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
        <BellRing className="h-5 w-5 text-primary-foreground" />
        <h3 className="text-lg font-bold text-primary-foreground">{t("hotelQuote.title")}</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("hotelQuote.subtitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="hq-name">{t("hotelQuote.fields.name")}</Label>
            <Input id="hq-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hq-phone">{t("hotelQuote.fields.phone")}</Label>
            <Input id="hq-phone" name="phone" required type="tel" maxLength={20} autoComplete="tel" inputMode="tel" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hq-hotelName">{t("hotelQuote.fields.hotelName")}</Label>
            <Input id="hq-hotelName" name="hotelName" required maxLength={120} placeholder={t("hotelQuote.fields.hotelNamePlaceholder")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hq-hotelAddress">{t("hotelQuote.fields.hotelAddress")}</Label>
            <Input id="hq-hotelAddress" name="hotelAddress" maxLength={200} placeholder={t("hotelQuote.fields.hotelAddressPlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hq-pickupDateTime">{t("hotelQuote.fields.pickup")}</Label>
            <Input id="hq-pickupDateTime" name="pickupDateTime" required maxLength={60} placeholder={t("hotelQuote.fields.pickupPlaceholder")} />
            <p className="text-xs text-muted-foreground">{t("hotelQuote.fields.pickupHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hq-returnDateTime">{t("hotelQuote.fields.return")}</Label>
            <Input id="hq-returnDateTime" name="returnDateTime" required maxLength={60} placeholder={t("hotelQuote.fields.returnPlaceholder")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hq-referredBy">{t("hotelQuote.fields.referredBy")}</Label>
            <Input id="hq-referredBy" name="referredBy" maxLength={120} placeholder={t("hotelQuote.fields.referredByPlaceholder")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hq-notes">{t("hotelQuote.fields.notes")}</Label>
            <Textarea id="hq-notes" name="notes" maxLength={500} rows={3} placeholder={t("hotelQuote.fields.notesPlaceholder")} />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
        >
          {submitting ? t("shared.sending") : t("hotelQuote.cta")}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {t("shared.preferToTalk")}{" "}
          <a href={CONTACT_PHONE_HREF} dir="ltr" className="text-primary hover:underline">{CONTACT_PHONE_DISPLAY}</a>
        </p>
      </form>
    </div>
  );
};

export default HotelQuoteForm;
