import { useState } from "react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

const BodyShopQuoteForm = () => {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const shopName = String(fd.get("shopName") || "").trim();
    const shopAddress = String(fd.get("shopAddress") || "").trim();
    const dateRange = String(fd.get("dateRange") || "").trim();
    const insuranceCarrier = String(fd.get("insuranceCarrier") || "").trim();
    const claimNumber = String(fd.get("claimNumber") || "").trim();
    const referredBy = String(fd.get("referredBy") || "").trim();
    const notes = String(fd.get("notes") || "").trim();

    if (!name || !phone || !shopName || !shopAddress || !dateRange) {
      toast({
        title: "Please check your details",
        description: "Name, phone, shop name, address, and date range are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const notesComposed = [
      insuranceCarrier ? `Insurance Carrier: ${insuranceCarrier}` : null,
      notes ? `Additional: ${notes}` : null,
      `[Source: body-shop-delivery]`,
      `[Lead Type: Body Shop / Repair Customer]`,
      `[Submitted: ${new Date().toISOString()}]`,
    ].filter(Boolean).join(" | ");

    const { error } = await supabase.from("leads").insert({
      form_type: "body_shop_quote",
      vertical_path: "body-shop",
      service_context: "Body Shop Delivery",
      passenger_type: "Body Shop / Repair Customer",
      name,
      phone,
      company: shopName,
      location: shopAddress,
      needed_when: dateRange,
      claim_number: claimNumber || null,
      referred_by: referredBy || null,
      notes: notesComposed,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (error) {
      console.error("Lead insert failed", error);
      toast({
        title: "Couldn't save your request",
        description: `Please call ${CONTACT_PHONE_DISPLAY} and we'll handle it directly.`,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const subject = `Body Shop Quote — ${shopName}`;
    const body = `Source: body-shop-delivery\nLead Type: Body Shop / Repair Customer\nName: ${name}\nPhone: ${phone}\nBody Shop: ${shopName}\nShop Address: ${shopAddress}\nDate Range: ${dateRange}\nInsurance Carrier: ${insuranceCarrier}\nClaim #: ${claimNumber}\nReferred By: ${referredBy}\nNotes: ${notes}\nSubmitted: ${new Date().toISOString()}`;
    window.location.href = `mailto:rentwithheldy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({
      title: "Got it — we've logged your request",
      description: "We'll respond within minutes. Email draft opened as a backup.",
    });
    setTimeout(() => setSubmitting(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card shadow-tropical overflow-hidden">
      <div className="bg-gradient-tropical px-6 py-4 flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary-foreground" />
        <h3 className="text-lg font-bold text-primary-foreground">Get a Rental While Your Car Is in the Shop</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          We'll meet you at the collision center so you can hand off your car and keep going.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bsq-name">Full Name</Label>
            <Input id="bsq-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bsq-phone">Mobile Phone</Label>
            <Input id="bsq-phone" name="phone" required type="tel" maxLength={20} autoComplete="tel" inputMode="tel" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bsq-shopName">Body Shop Name</Label>
            <Input id="bsq-shopName" name="shopName" required maxLength={120} placeholder="e.g. Maaco Fort Lauderdale" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bsq-shopAddress">Body Shop Address</Label>
            <Input id="bsq-shopAddress" name="shopAddress" required maxLength={200} placeholder="Street address" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bsq-dateRange">Estimated Rental Date Range</Label>
            <Input id="bsq-dateRange" name="dateRange" required maxLength={120} placeholder="e.g. June 20 – June 28, or ~1 week starting Monday" />
            <p className="text-xs text-muted-foreground">Estimated dates are okay.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bsq-insuranceCarrier">Insurance Carrier (optional)</Label>
            <Input id="bsq-insuranceCarrier" name="insuranceCarrier" maxLength={100} placeholder="e.g. State Farm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bsq-claimNumber">Claim Number (optional)</Label>
            <Input id="bsq-claimNumber" name="claimNumber" maxLength={60} placeholder="e.g. CLM-123456" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bsq-referredBy">Referred by (optional)</Label>
            <Input id="bsq-referredBy" name="referredBy" maxLength={120} placeholder="Body shop, attorney, insurance agent…" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bsq-notes">Anything else? (optional)</Label>
            <Textarea id="bsq-notes" name="notes" maxLength={500} rows={3} placeholder="Vehicle preference, repair timeline, special needs…" />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
        >
          {submitting ? "Sending…" : "Get My Repair Rental Quote"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Prefer to talk? Call{" "}
          <a href={CONTACT_PHONE_HREF} className="text-primary hover:underline">{CONTACT_PHONE_DISPLAY}</a>
        </p>
      </form>
    </div>
  );
};

export default BodyShopQuoteForm;
