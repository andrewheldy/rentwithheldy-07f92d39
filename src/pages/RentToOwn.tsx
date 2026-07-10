import { Link } from "react-router-dom";
import { Car, Sparkles, Bell, ArrowRight, Key } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import journeyImg from "@/assets/journey-to-ownership.png";

const PLATFORMS = ["Uber", "Lyft", "DoorDash", "Uber Eats", "Instacart", "Other"] as const;
const TIMELINE_OPTIONS = ["ASAP", "Within 1 week", "Within 2 weeks", "Within a month", "Just exploring"] as const;

const RentToOwn = () => {
  const [submitting, setSubmitting] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [hasLicense, setHasLicense] = useState("");
  const [hasInsurance, setHasInsurance] = useState("");
  const [timeline, setTimeline] = useState("");

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const city = String(fd.get("city") || "").trim();
    const notes = String(fd.get("notes") || "").trim();

    if (!name || !phone || !email || !city || platforms.length === 0 || !hasLicense || !hasInsurance || !timeline) {
      toast({
        title: "Please fill in all required fields",
        description: "Name, phone, email, city, platform(s), license, insurance, and timeline are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const notesComposed = [
      `Platforms: ${platforms.join(", ")}`,
      `Valid Driver's License: ${hasLicense}`,
      `Personal Auto Insurance: ${hasInsurance}`,
      `Timeline: ${timeline}`,
      notes ? `Additional: ${notes}` : null,
      `[Source: rent-to-own]`,
      `[Lead Type: Rideshare / Delivery Driver]`,
      `[Submitted: ${new Date().toISOString()}]`,
    ].filter(Boolean).join(" | ");

    const { error } = await supabase.from("leads").insert({
      form_type: "rent_to_own",
      vertical_path: "rent-to-own",
      service_context: "Rent-To-Own Application",
      passenger_type: "Rideshare / Delivery Driver",
      name,
      phone,
      email: email || null,
      location: city,
      needed_when: timeline,
      notes: notesComposed,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }

    const subject = `Rent-To-Own Application — ${name}`;
    const body = `Source: rent-to-own\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nCity: ${city}\nPlatforms: ${platforms.join(", ")}\nValid License: ${hasLicense}\nPersonal Insurance: ${hasInsurance}\nTimeline: ${timeline}\nNotes: ${notes}\nSubmitted: ${new Date().toISOString()}`;
    window.location.href = `mailto:rentwithheldy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast({
      title: "Application submitted!",
      description: "We'll reach out to discuss your options.",
    });
    (e.target as HTMLFormElement).reset();
    setPlatforms([]);
    setHasLicense("");
    setHasInsurance("");
    setTimeline("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Rent-to-Own Cars for Uber, Lyft, DoorDash Drivers | Rent With Heldy"
        description="Apply for rent-to-own for rideshare and delivery drivers (Uber, Lyft, DoorDash, Uber Eats, Instacart) in South Florida."
        path="/rent-to-own"
      />
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-tropical">
          <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl text-center text-primary-foreground">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
              <Key className="h-3.5 w-3.5" /> Rent-To-Own Program
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Rent-to-Own Cars for Rideshare & Delivery Drivers
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              A program built for Uber, Lyft, DoorDash, Uber Eats, and Instacart
              drivers in South Florida. Drive it. Earn with it. Own it.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pt-12 md:pt-16 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your journey to ownership
            </h2>
            <p className="text-muted-foreground">
              Every qualifying payment builds equity and brings you closer to
              owning your vehicle.
            </p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-card-hover bg-card">
            <img
              src={journeyImg}
              alt="Rent-To-Own journey infographic showing weekly milestones from Week 1 to full ownership with growing equity at each step."
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Car,
                title: "Approved rideshare vehicles",
                body: "Late-model sedans and SUVs that meet Uber & Lyft platform requirements.",
              },
              {
                icon: Sparkles,
                title: "Weekly payments that build equity",
                body: "Every payment moves you closer to ownership — not just another rental bill.",
              },
              {
                icon: Bell,
                title: "Maintenance handled",
                body: "We keep the car in shape so you stay on the road and on the clock.",
              },
            ].map((b) => (
              <Card key={b.title} className="border-none shadow-card-hover">
                <CardContent className="p-6">
                  <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <b.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-card-hover">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-gradient-tropical w-8 h-8 rounded-full flex items-center justify-center">
                  <Key className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Apply for Rent-To-Own</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Fill out the application below and we'll reach out to discuss your options.
              </p>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rto-name">Full Name</Label>
                  <Input id="rto-name" name="name" required maxLength={80} autoComplete="name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rto-phone">Mobile Phone</Label>
                  <Input id="rto-phone" name="phone" type="tel" required maxLength={20} autoComplete="tel" inputMode="tel" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="rto-email">Email</Label>
                  <Input id="rto-email" name="email" type="email" required maxLength={120} autoComplete="email" placeholder="you@email.com" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="rto-city">City</Label>
                  <Input id="rto-city" name="city" required maxLength={80} placeholder="e.g. Fort Lauderdale" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Which platform(s) do you drive for?</Label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          platforms.includes(p)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary/60"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {platforms.length === 0 && (
                    <p className="text-xs text-muted-foreground">Select at least one platform.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rto-license">Do you have a valid driver's license?</Label>
                  <Select value={hasLicense} onValueChange={setHasLicense}>
                    <SelectTrigger id="rto-license" className="h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rto-insurance">Do you have personal auto insurance?</Label>
                  <Select value={hasInsurance} onValueChange={setHasInsurance}>
                    <SelectTrigger id="rto-insurance" className="h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="rto-timeline">How soon do you need a vehicle?</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger id="rto-timeline" className="h-10">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="rto-notes">Anything else? (optional)</Label>
                  <Textarea id="rto-notes" name="notes" maxLength={500} rows={3} placeholder="Vehicle preference, questions, current situation…" />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                  >
                    {submitting ? "Submitting…" : "Apply Now"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Prefer to talk? Call{" "}
                    <a href={CONTACT_PHONE_HREF} className="text-primary hover:underline">{CONTACT_PHONE_DISPLAY}</a>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground mb-3">
              Need a car for rideshare or delivery work today?
            </p>
            <Link to="/local-car-rentals">
              <Button variant="outline">Explore Local Rentals</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RentToOwn;
