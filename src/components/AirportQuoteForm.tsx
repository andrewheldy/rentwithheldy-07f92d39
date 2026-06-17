import { useState } from "react";
import { Plane } from "lucide-react";
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

const AIRPORTS = ["FLL — Fort Lauderdale", "MIA — Miami International", "PBI — Palm Beach", "Other"] as const;

const AirportQuoteForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [airport, setAirport] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const airline = String(fd.get("airline") || "").trim();
    const flightNumber = String(fd.get("flightNumber") || "").trim();
    const arrivalDateTime = String(fd.get("arrivalDateTime") || "").trim();
    const returnDateTime = String(fd.get("returnDateTime") || "").trim();
    const pickupNotes = String(fd.get("pickupNotes") || "").trim();
    const notes = String(fd.get("notes") || "").trim();

    if (!name || !phone || !airport || !arrivalDateTime || !returnDateTime) {
      toast({
        title: "Please check your details",
        description: "Name, phone, airport, and dates are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const notesComposed = [
      `Airport: ${airport}`,
      airline ? `Airline: ${airline}` : null,
      flightNumber ? `Flight #: ${flightNumber}` : null,
      pickupNotes ? `Pickup Notes: ${pickupNotes}` : null,
      notes ? `Additional: ${notes}` : null,
      `[Source: airport-trips]`,
      `[Lead Type: Airport Traveler]`,
      `[Submitted: ${new Date().toISOString()}]`,
    ].filter(Boolean).join(" | ");

    const { error } = await supabase.from("leads").insert({
      form_type: "airport_quote",
      vertical_path: "airport",
      service_context: "Airport Rental",
      passenger_type: "Airport Traveler",
      name,
      phone,
      location: airport,
      needed_when: `Arrival: ${arrivalDateTime} | Return: ${returnDateTime}`,
      notes: notesComposed,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (error) {
      console.error("Lead insert failed", error);
      toast({
        title: "Couldn't save your request",
        description: "Please call (561) 519-8958 and we'll handle it directly.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const subject = `Airport Quote — ${airport}${airline ? ` / ${airline} ${flightNumber}` : ""}`;
    const body = `Source: airport-trips\nLead Type: Airport Traveler\nName: ${name}\nPhone: ${phone}\nAirport: ${airport}\nAirline: ${airline}\nFlight #: ${flightNumber}\nArrival: ${arrivalDateTime}\nReturn: ${returnDateTime}\nPickup Notes: ${pickupNotes}\nNotes: ${notes}\nSubmitted: ${new Date().toISOString()}`;
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
        <Plane className="h-5 w-5 text-primary-foreground" />
        <h3 className="text-lg font-bold text-primary-foreground">Book Your Airport Rental</h3>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your flight details and we'll coordinate a smooth pickup near your terminal.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="aq-name">Full Name</Label>
            <Input id="aq-name" name="name" required maxLength={80} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-phone">Mobile Phone</Label>
            <Input id="aq-phone" name="phone" required type="tel" maxLength={20} autoComplete="tel" inputMode="tel" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="aq-airport">Airport</Label>
            <Select value={airport} onValueChange={setAirport}>
              <SelectTrigger id="aq-airport" className="h-10">
                <SelectValue placeholder="Select airport" />
              </SelectTrigger>
              <SelectContent>
                {AIRPORTS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-airline">Airline</Label>
            <Input id="aq-airline" name="airline" maxLength={60} placeholder="e.g. American Airlines" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-flightNumber">Flight Number</Label>
            <Input id="aq-flightNumber" name="flightNumber" maxLength={20} placeholder="e.g. AA 2341" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-arrivalDateTime">Arrival Date and Time</Label>
            <Input id="aq-arrivalDateTime" name="arrivalDateTime" required maxLength={60} placeholder="e.g. June 20 at 3:45 PM" />
            <p className="text-xs text-muted-foreground">Please enter exact pickup and return dates, plus flight details.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aq-returnDateTime">Return Date and Time</Label>
            <Input id="aq-returnDateTime" name="returnDateTime" required maxLength={60} placeholder="e.g. June 25 at 11:00 AM" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="aq-pickupNotes">Delivery / Pickup Notes (optional)</Label>
            <Input id="aq-pickupNotes" name="pickupNotes" maxLength={200} placeholder="Terminal, curbside, hotel address after landing…" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="aq-notes">Anything else? (optional)</Label>
            <Textarea id="aq-notes" name="notes" maxLength={500} rows={3} placeholder="Vehicle preference, group size, luggage…" />
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
        >
          {submitting ? "Sending…" : "Get My Airport Quote"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Prefer to talk? Call{" "}
          <a href="tel:+15615198958" className="text-primary hover:underline">(561) 519-8958</a>
        </p>
      </form>
    </div>
  );
};

export default AirportQuoteForm;
