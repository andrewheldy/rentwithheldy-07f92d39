import { useState } from "react";
import { z } from "zod";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  company: z.string().trim().min(2, "Enter your company or firm").max(120),
  claim: z.string().trim().max(80).optional(),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  location: z.string().trim().min(2, "Where do we deliver?").max(160),
});

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
  heading = "Are you a Body Shop Manager, Claims Adjuster, or Paralegal?",
  subheading = "Set up a direct delivery for your client. We'll coordinate billing and paperwork with you.",
}: PartnerIntakeFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

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
        title: "Please check your details",
        description: parsed.error.issues[0]?.message ?? "Invalid input",
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
      const res = await supabase.functions.invoke("send-booking-email", {
        body: {
          source: "partner-intake",
          formType: "partner_intake",
          name,
          phone,
          company,
          claimNumber: claim || undefined,
          location,
        },
      });
      if (res.error) throw res.error;
      setSubmitted(true);
    } catch (err) {
      console.error("Email send failed", err);
      if (insertError) {
        setSubmitError(true);
      } else {
        setSubmitted(true);
      }
    }

    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card-hover">
        <div className="px-6 py-5 border-b border-border flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-foreground">{heading}</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-foreground font-medium">
            Thanks! We're checking availability and will text you back shortly.
          </p>
        </div>
      </div>
    );
  }

  if (submitError) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card-hover">
        <div className="px-6 py-5 border-b border-border flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-foreground">{heading}</h3>
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-destructive font-medium">
            Something went wrong. Please call or text us directly.
          </p>
          <a href="tel:+15615198958" className="text-primary hover:underline text-sm mt-2 block">
            (561) 519-8958
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
            {heading}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{subheading}</p>
        </div>
      </div>
      <form
        onSubmit={onSubmit}
        className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="pi-name">Your Name</Label>
          <Input id="pi-name" name="name" required maxLength={80} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-company">Company / Firm</Label>
          <Input
            id="pi-company"
            name="company"
            required
            maxLength={120}
            autoComplete="organization"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-claim">Client Claim # (optional)</Label>
          <Input id="pi-claim" name="claim" maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pi-phone">Phone</Label>
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
          <Label htmlFor="pi-location">Delivery Location</Label>
          <Input
            id="pi-location"
            name="location"
            required
            maxLength={160}
            placeholder="Body shop, hotel, port, or address…"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="sm:col-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitting ? "Sending…" : "Check Our Availability"}
        </Button>
      </form>
    </div>
  );
};

export default PartnerIntakeForm;
