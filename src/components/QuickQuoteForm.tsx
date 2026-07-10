import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Zap } from "lucide-react";
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

const PASSENGER_TYPES = [
  "Hotel Guest",
  "Airport Traveler",
  "Body Shop / Repair Customer",
  "Local Rental",
  "Other",
] as const;

const DATE_RANGE_HINTS: Record<string, string> = {
  "Body Shop / Repair Customer": "Estimated dates are okay.",
  "Hotel Guest": "Please enter exact pickup and return dates.",
  "Airport Traveler": "Please enter exact pickup and return dates, plus flight details.",
};

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  passengerType: z.enum(PASSENGER_TYPES, {
    errorMap: () => ({ message: "Select your customer type" }),
  }),
  location: z.string().trim().min(2, "Where should we deliver?").max(120),
  dateRange: z.string().trim().min(2, "Enter your rental date range").max(120),
  referredBy: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

interface QuickQuoteFormProps {
  serviceContext?: string;
  verticalPath?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  defaultPassengerType?: (typeof PASSENGER_TYPES)[number];
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const QuickQuoteForm = ({
  serviceContext = "Quick Quote",
  verticalPath,
  title = "Start Your Booking",
  subtitle = "Tell us who you are and where you need the car. We'll text you back fast with a quote.",
  ctaLabel = "Check Our Availability",
  defaultPassengerType,
}: QuickQuoteFormProps) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [passengerType, setPassengerType] = useState<string>(
    defaultPassengerType ?? ""
  );

  const dateRangeHint = DATE_RANGE_HINTS[passengerType] ?? "";

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
        title: "Please check your details",
        description: parsed.error.issues[0]?.message ?? "Invalid input",
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
          <h3 className="text-lg font-bold text-primary-foreground">{title}</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-destructive font-medium">
            Something went wrong. Please call or text us directly.
          </p>
          <a href={CONTACT_PHONE_HREF} className="text-primary hover:underline text-sm mt-2 block">
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
        <h3 className="text-lg font-bold text-primary-foreground">{title}</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-passenger">I am a…</Label>
            <Select value={passengerType} onValueChange={setPassengerType}>
              <SelectTrigger id="qq-passenger">
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                {PASSENGER_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qq-name">Full Name</Label>
            <Input id="qq-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qq-phone">Mobile Phone</Label>
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
            <Label htmlFor="qq-location">Delivery Location</Label>
            <Input
              id="qq-location"
              name="location"
              required
              maxLength={120}
              placeholder="Hotel, body shop, port, address…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-dateRange">Rental Date Range</Label>
            <Input
              id="qq-dateRange"
              name="dateRange"
              required
              maxLength={120}
              placeholder="e.g. June 20 – June 25, or ASAP for ~1 week"
            />
            {dateRangeHint && (
              <p className="text-xs text-muted-foreground">{dateRangeHint}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-referredBy">Referred by (optional)</Label>
            <Input
              id="qq-referredBy"
              name="referredBy"
              maxLength={120}
              placeholder="Hotel, body shop, attorney, friend, agent…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qq-notes">Anything else? (optional)</Label>
            <Textarea
              id="qq-notes"
              name="notes"
              maxLength={500}
              rows={3}
              placeholder="Vehicle type, insurance carrier, claim #, flight…"
            />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full"
        >
          {submitting ? "Sending…" : ctaLabel}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Prefer to talk? Call{" "}
          <a href={CONTACT_PHONE_HREF} className="text-primary hover:underline">
            {CONTACT_PHONE_DISPLAY}
          </a>
        </p>
      </form>
    </div>
  );
};

export default QuickQuoteForm;
