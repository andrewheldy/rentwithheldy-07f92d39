import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

interface PartnerIntakeFormProps {
  serviceContext: string;
  verticalPath?: string;
  heading?: string;
  subheading?: string;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const PartnerIntakeForm = ({
  serviceContext,
  verticalPath,
  heading,
  subheading,
}: PartnerIntakeFormProps) => {
  const { t } = useTranslation(["forms", "common"]);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  // Callers may pass already-translated overrides; otherwise use the defaults.
  const title = heading ?? t("partnerIntake.heading");
  const sub = subheading ?? t("partnerIntake.subheading");

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t("partnerIntake.validation.name")).max(80),
        company: z
          .string()
          .trim()
          .min(2, t("partnerIntake.validation.company"))
          .max(120),
        claim: z.string().trim().max(80).optional(),
        phone: z.string().trim().min(7, t("partnerIntake.validation.phone")).max(20),
        location: z
          .string()
          .trim()
          .min(2, t("partnerIntake.validation.location"))
          .max(160),
      }),
    [t]
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      company: fd.get("company"),
      claim: fd.get("claim") ?? "",
      phone: fd.get("phone"),
      location: fd.get("location"),
    });
    if (!parsed.success) {
      toast({
        title: t("partnerIntake.toastTitle"),
        description: parsed.error.issues[0]?.message ?? t("partnerIntake.toastInvalid"),
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { name, company, claim, phone, location } = parsed.data;
    const path = verticalPath ?? slugify(serviceContext);

    const { error: insertError } = await supabase.from("leads").insert({
      form_type: "partner_intake",
      vertical_path: path,
      service_context: serviceContext,
      name,
      phone,
      company,
      claim_number: claim || null,
      location,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (insertError) {
      console.error("Partner lead insert failed", insertError);
    }

    try {
      const res = await fetch("/api/send-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "partner-intake",
          formType: "partner_intake",
          name,
          phone,
          company,
          claimNumber: claim || undefined,
          location,
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
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card-hover">
        <div className="px-6 py-5 border-b border-border flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-foreground">{title}</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-destructive font-medium">
            {t("partnerIntake.errorRetry")}
          </p>
          <a href={CONTACT_PHONE_HREF} dir="ltr" className="text-primary hover:underline text-sm mt-2 block">
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card-hover">
      <div className="px-6 py-5 border-b border-border flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{sub}</p>
        </div>
      </div>
      <form
        onSubmit={onSubmit}
        className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="pi-name">{t("partnerIntake.fields.name")}</Label>
          <Input id="pi-name" name="name" required maxLength={80} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-company">{t("partnerIntake.fields.company")}</Label>
          <Input
            id="pi-company"
            name="company"
            required
            maxLength={120}
            autoComplete="organization"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-claim">{t("partnerIntake.fields.claim")}</Label>
          <Input id="pi-claim" name="claim" maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-phone">{t("partnerIntake.fields.phone")}</Label>
          <Input
            id="pi-phone"
            name="phone"
            required
            type="tel"
            maxLength={20}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="pi-location">{t("partnerIntake.fields.location")}</Label>
          <Input
            id="pi-location"
            name="location"
            required
            maxLength={160}
            placeholder={t("partnerIntake.fields.locationPlaceholder")}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="sm:col-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitting ? t("partnerIntake.sending") : t("partnerIntake.cta")}
        </Button>
      </form>
    </div>
  );
};

export default PartnerIntakeForm;
