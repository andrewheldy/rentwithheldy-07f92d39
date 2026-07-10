import { useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

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

    const notesComposed = [
      hotelAddress ? `Hotel Address: ${hotelAddress}` : null,
      notes ? `Additional: ${notes}` : null,
      `[Source: hotel-concierge-rentals]`,
      `[Lead Type: Hotel Guest]`,
      `[Submitted: ${new Date().toISOString()}]`,
    ].filter(Boolean).join(" | ");

    const { error } = await supabase.from("leads").insert({
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
        title: "Couldn't save your request",
        description: `Please call ${CONTACT_PHONE_DISPLAY} and we'll handle it directly.`,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const subject = `Hotel Delivery Quote — ${hotelName}`;
    const body = `Source: hotel-concierge-rentals\nLead Type: Hotel Guest\nName: ${name}\nPhone: ${phone}\nHotel: ${hotelName}\nHotel Address: ${hotelAddress}\nPickup: ${pickupDateTime}\nReturn: ${returnDateTime}\nReferred By: ${referredBy}\nNotes: ${notes}\nSubmitted: ${new Date().toISOString()}`;
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
          <a href={CONTACT_PHONE_HREF} className="text-primary hover:underline">{CONTACT_PHONE_DISPLAY}</a>
        </p>
      </form>
    </div>
  );
};

export default HotelQuoteForm;
