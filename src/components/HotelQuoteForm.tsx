import { useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { submitQuote } from "@/lib/submitQuote";

const HotelQuoteForm = () => {
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
        title: "Please check your details",
        description: "Name, phone, hotel, and dates are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await submitQuote({
        source: "hotel-guest",
        formType: "hotel_quote",
        passengerType: "Hotel Guest",
        name,
        phone,
        company: hotelName,
        location: hotelAddress || hotelName,
        when: `Pickup: ${pickupDateTime} | Return: ${returnDateTime}`,
        referredBy: referredBy || undefined,
        notes: notes || undefined,
      });
      toast({
        title: "Got it — we've received your request!",
        description: "We'll reach out within minutes to arrange your hotel delivery.",
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
        <BellRing className="h-5 w-5 text-primary-foreground" />
        <h3 className="text-lg font-bold text-primary-foreground">Get a Rental Delivered to Your Hotel</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          We coordinate with your hotel valet for a smooth, white-glove handoff.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="hq-name">Full Name</Label>
            <Input id="hq-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hq-phone">Mobile Phone</Label>
            <Input id="hq-phone" name="phone" required type="tel" maxLength={20} autoComplete="tel" inputMode="tel" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hq-hotelName">Hotel Name</Label>
            <Input id="hq-hotelName" name="hotelName" required maxLength={120} placeholder="e.g. Marriott Fort Lauderdale Beach" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hq-hotelAddress">Hotel Address (optional)</Label>
            <Input id="hq-hotelAddress" name="hotelAddress" maxLength={200} placeholder="Street address if known" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hq-pickupDateTime">Exact Pickup Date and Time</Label>
            <Input id="hq-pickupDateTime" name="pickupDateTime" required maxLength={60} placeholder="e.g. June 20 at 10:00 AM" />
            <p className="text-xs text-muted-foreground">Please enter exact pickup and return dates.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hq-returnDateTime">Exact Return Date and Time</Label>
            <Input id="hq-returnDateTime" name="returnDateTime" required maxLength={60} placeholder="e.g. June 25 at 12:00 PM" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hq-referredBy">Referred by (optional)</Label>
            <Input id="hq-referredBy" name="referredBy" maxLength={120} placeholder="Concierge, friend, travel agent…" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="hq-notes">Anything else? (optional)</Label>
            <Textarea id="hq-notes" name="notes" maxLength={500} rows={3} placeholder="Vehicle preference, number of guests, special occasion…" />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
        >
          {submitting ? "Sending…" : "Get My Hotel Delivery Quote"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Prefer to talk? Call{" "}
          <a href="tel:+17865059330" className="text-primary hover:underline">786-505-9330</a>
        </p>
      </form>
    </div>
  );
};

export default HotelQuoteForm;
