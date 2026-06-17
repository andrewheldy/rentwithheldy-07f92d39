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

const PASSENGER_TYPES = [
  "Airport Traveler",
  "Cruise Passenger",
  "Hotel Guest",
  "Body Shop / Repair Customer",
  "Loss of Use / Legal Claim",
  "Local Resident",
  "Other",
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  passengerType: z.enum(PASSENGER_TYPES, {
    errorMap: () => ({ message: "Select your passenger type" }),
  }),
  location: z.string().trim().min(2, "Where should we deliver?").max(120),
  when: z.string().trim().min(2, "When do you need it?").max(80),
  referredBy: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

interface QuickQuoteFormProps {
  serviceContext: string;
  verticalPath?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  defaultPassengerType?: (typeof PASSENGER_TYPES)[number];
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const QuickQuoteForm = ({
  serviceContext,
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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      phone: fd.get("phone"),
      passengerType,
      location: fd.get("location"),
      when: fd.get("when"),
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
    const { name, phone, location, when, notes, referredBy } = parsed.data;
    const path = verticalPath ?? slugify(serviceContext);

    const { error: insertError } = await supabase.from("leads").insert({
      form_type: "quick_quote",
      vertical_path: path,
      service_context: serviceContext,
      passenger_type: parsed.data.passengerType,
      name,
      phone,
      location,
      needed_when: when,
      referred_by: referredBy || null,
      notes: notes || null,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
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
          when,
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
          <a href="tel:+15615198958" className="text-primary hover:underline text-sm mt-2 block">
            (561) 519-8958
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
              <SelectTrigger id="qq-passenger" className="h-10">
                <SelectValue placeholder="Select passenger type" />
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
            <Label htmlFor="qq-when">When do you need the car?</Label>
            <Input
              id="qq-when"
              name="when"
              required
              maxLength={80}
              placeholder="ASAP, today 4pm, Sat 6/14 morning…"
            />
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
          className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
        >
          {submitting ? "Sending…" : ctaLabel}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Prefer to talk? Call{" "}
          <a href="tel:+15615198958" className="text-primary hover:underline">
            (561) 519-8958
          </a>
        </p>
      </form>
    </div>
  );
};

export default QuickQuoteForm;
