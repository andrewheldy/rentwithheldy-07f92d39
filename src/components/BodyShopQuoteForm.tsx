import { useState } from "react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { submitQuote } from "@/lib/submitQuote";

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
      notes || null,
    ].filter(Boolean).join(" | ");

    try {
      await submitQuote({
        source: "body-shop-delivery",
        formType: "body_shop_quote",
        passengerType: "Body Shop / Repair Customer",
        name,
        phone,
        company: shopName,
        location: shopAddress,
        when: dateRange,
        claimNumber: claimNumber || undefined,
        referredBy: referredBy || undefined,
        notes: notesComposed || undefined,
      });
      toast({
        title: "Got it — we've received your request!",
        description: "We'll reach out within minutes to coordinate your repair rental.",
      });
      (e.target as HTMLFormElement).reset();
    } catch {
      toast({
        title: "Couldn't send your request",
        description: "Please call 786-505-9330 and we'll handle it directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
          <a href="tel:+17865059330" className="text-primary hover:underline">786-505-9330</a>
        </p>
      </form>
    </div>
  );
};

export default BodyShopQuoteForm;
