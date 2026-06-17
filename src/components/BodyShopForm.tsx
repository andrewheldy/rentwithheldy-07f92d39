import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  shopName: z.string().trim().min(2, "Enter the body shop name").max(120),
  shopAddress: z.string().trim().min(4, "Enter the shop address").max(160),
  dateRange: z.string().trim().min(2, "Enter your estimated rental dates").max(120),
  insurance: z.string().trim().max(80).optional(),
  claimNumber: z.string().trim().max(80).optional(),
  referredBy: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

const BodyShopForm = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const parsed = schema.safeParse({
      name: fd.get("name"),
      phone: fd.get("phone"),
      shopName: fd.get("shopName"),
      shopAddress: fd.get("shopAddress"),
      dateRange: fd.get("dateRange"),
      insurance: fd.get("insurance") ?? "",
      claimNumber: fd.get("claimNumber") ?? "",
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
    const { name, phone, shopName, shopAddress, dateRange, insurance, claimNumber, referredBy, notes } = parsed.data;

    const location = `${shopName} — ${shopAddress}`;
    const fullNotes = [
      insurance ? `Insurance: ${insurance}` : null,
      claimNumber ? `Claim #: ${claimNumber}` : null,
      notes || null,
    ].filter(Boolean).join(" | ");

    await supabase.from("leads").insert({
      form_type: "quick_quote",
      vertical_path: "body-shop-delivery",
      service_context: "Body Shop / Mechanic Delivery",
      passenger_type: "Body Shop / Repair Customer",
      name,
      phone,
      location,
      needed_when: dateRange,
      referred_by: referredBy || null,
      notes: fullNotes || null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    try {
      const res = await fetch("/api/send-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "body-shop-delivery",
          formType: "quick_quote",
          passengerType: "Body Shop / Repair Customer",
          name,
          phone,
          location,
          when: dateRange,
          referredBy: referredBy || undefined,
          notes: fullNotes || undefined,
        }),
      });
      if (!res.ok) console.error("Email send failed", await res.text());
    } catch (err) {
      console.error("Email send failed", err);
    }

    setSubmitting(false);
    navigate("/book");
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card shadow-tropical overflow-hidden">
      <div className="bg-gradient-tropical px-6 py-4 flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary-foreground" />
        <h3 className="text-lg font-bold text-primary-foreground">Request Delivery to Your Shop</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          We'll meet you at the collision center so you can hand off your car and keep going.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bs-name">Full Name</Label>
            <Input id="bs-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-phone">Mobile Phone</Label>
            <Input id="bs-phone" name="phone" required type="tel" maxLength={20} autoComplete="tel" inputMode="tel" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bs-shopName">Body Shop Name</Label>
            <Input
              id="bs-shopName"
              name="shopName"
              required
              maxLength={120}
              placeholder="e.g. Maaco Fort Lauderdale"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bs-shopAddress">Body Shop Address</Label>
            <Input
              id="bs-shopAddress"
              name="shopAddress"
              required
              maxLength={160}
              placeholder="Street address"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bs-dateRange">Estimated Rental Date Range</Label>
            <Input
              id="bs-dateRange"
              name="dateRange"
              required
              maxLength={120}
              placeholder="e.g. June 20 – June 28, or ~1 week starting Monday"
            />
            <p className="text-xs text-muted-foreground">Estimated dates are okay.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bs-insurance">Insurance Carrier (optional)</Label>
            <Input id="bs-insurance" name="insurance" maxLength={80} placeholder="e.g. State Farm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bs-claim">Claim Number (optional)</Label>
            <Input id="bs-claim" name="claimNumber" maxLength={80} placeholder="e.g. CLM-123456" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bs-referredBy">Referred by (optional)</Label>
            <Input
              id="bs-referredBy"
              name="referredBy"
              maxLength={120}
              placeholder="Body shop, attorney, insurance agent…"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bs-notes">Anything else? (optional)</Label>
            <Textarea
              id="bs-notes"
              name="notes"
              maxLength={500}
              rows={3}
              placeholder="Vehicle preference, repair timeline, special needs…"
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
        >
          {submitting ? "Sending…" : "Check Our Availability"}
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

export default BodyShopForm;
