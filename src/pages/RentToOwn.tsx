import { Link } from "react-router-dom";
import { Car, Sparkles, Bell, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PLATFORMS = ["Uber", "Lyft", "Empower", "Uber Eats", "DoorDash"];

const RentToOwn = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      form_type: "quick_quote" as const,
      vertical_path: "rent-to-own",
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      passenger_type: "Rideshare / Delivery Driver",
      message: `Platform(s): ${String(fd.get("platform") || "")}. Interested in Rent-to-Own program (coming soon).`,
    };

    const { error } = await supabase.from("leads").insert(payload);
    setSubmitting(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "You're on the list",
      description: "We'll reach out as soon as the Rent-to-Own program launches.",
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Rent-to-Own Cars for Uber, Lyft, DoorDash Drivers | Rent With Heldy"
        description="Coming soon: A rent-to-own program for rideshare and delivery drivers (Uber, Lyft, Empower, Uber Eats, DoorDash) in South Florida. Join the waitlist."
        path="/rent-to-own"
      />
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-tropical">
          <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl text-center text-primary-foreground">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Coming Soon
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Rent-to-Own Cars for Rideshare & Delivery Drivers
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              A new program built for Uber, Lyft, Empower, Uber Eats, and DoorDash
              drivers in South Florida. Drive it. Earn with it. Own it.
            </p>
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
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Join the waitlist
              </h2>
              <p className="text-muted-foreground mb-6">
                Drop your info and we'll reach out the moment the program goes
                live. No commitment, no spam.
              </p>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="rto-name">Full name</Label>
                  <Input id="rto-name" name="name" required placeholder="Your name" />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="rto-phone">Phone</Label>
                  <Input id="rto-phone" name="phone" type="tel" required placeholder="(555) 555-5555" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="rto-email">Email</Label>
                  <Input id="rto-email" name="email" type="email" required placeholder="you@email.com" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="rto-platform">Which platforms do you drive for?</Label>
                  <Input
                    id="rto-platform"
                    name="platform"
                    required
                    placeholder={PLATFORMS.join(", ")}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                  >
                    {submitting ? "Joining…" : "Notify Me When It Launches"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
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
