import { useState } from "react";
import journeyImg from "@/assets/journey-to-ownership.png";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Wallet,
  Briefcase,
  TrendingUp,
  LifeBuoy,
  ClipboardCheck,
  Car,
  PiggyBank,
  Key,
  Star,
  Phone,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import FAQAccordion from "@/components/FAQAccordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PLATFORMS = ["Uber", "Lyft", "DoorDash", "Uber Eats", "Instacart"];

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Get Approved",
    body: "Complete a quick application and verification process.",
  },
  {
    icon: Car,
    title: "Start Driving",
    body: "Get matched with an approved vehicle and start earning immediately.",
  },
  {
    icon: PiggyBank,
    title: "Build Ownership",
    body: "A portion of qualifying payments contributes toward vehicle ownership.",
  },
  {
    icon: Key,
    title: "Own Your Vehicle",
    body: "Continue making progress until ownership requirements are completed.",
  },
];

const FEATURES = [
  {
    icon: Wallet,
    title: "No Large Down Payment",
    body: "Get started without the large upfront costs of traditional financing.",
  },
  {
    icon: Briefcase,
    title: "Flexible for Gig Work",
    body: "Built specifically for rideshare and delivery drivers.",
  },
  {
    icon: TrendingUp,
    title: "Ownership Progress Tracking",
    body: "See your progress and stay motivated.",
  },
  {
    icon: LifeBuoy,
    title: "Reliable Support",
    body: "Maintenance guidance and support when needed.",
  },
];

const FAQS = [
  {
    question: "Can I drive for Uber?",
    answer:
      "Yes. Our Drive-to-Own vehicles meet Uber's vehicle requirements for South Florida markets.",
  },
  {
    question: "Can I drive for Lyft?",
    answer:
      "Yes. The program supports Lyft drivers and the vehicles qualify for the Lyft platform.",
  },
  {
    question: "Can I use the vehicle for delivery apps?",
    answer:
      "Absolutely. DoorDash, Uber Eats, Instacart, and similar delivery platforms are all welcome.",
  },
  {
    question: "Do I need perfect credit?",
    answer:
      "No. The program is designed for gig workers and focuses on driving history and income consistency rather than traditional credit scoring alone.",
  },
  {
    question: "How does ownership work?",
    answer:
      "A portion of every qualifying payment contributes toward vehicle ownership. You'll see your progress tracked over time until ownership requirements are met.",
  },
  {
    question: "What happens if I stop participating?",
    answer:
      "You can return the vehicle at any time. We'll walk you through your options and any next steps based on your progress.",
  },
];

const DriveToOwn = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const platforms = PLATFORMS.filter((p) => fd.get(`platform-${p}`) === "on");

    const payload = {
      form_type: "quick_quote" as const,
      vertical_path: "drive-to-own",
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      passenger_type: "Rideshare / Delivery Driver",
      message: `Drive-to-Own application. Platforms: ${
        platforms.join(", ") || "Not specified"
      }. Notes: ${String(fd.get("notes") || "")}`,
    };

    const { error } = await supabase.from("leads").insert(payload);
    setSubmitting(false);
    if (error) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Application received",
      description:
        "Thanks! Our team will reach out shortly to walk you through the next steps.",
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Drive-to-Own Program for Rideshare & Delivery Drivers | Rent With Heldy"
        description="Drive today, own tomorrow. Rent With Heldy's Drive-to-Own program helps Uber, Lyft, DoorDash, Uber Eats, and Instacart drivers build vehicle ownership while earning."
        path="/drive-to-own"
      />
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="bg-gradient-tropical">
          <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl text-center text-primary-foreground">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
              <Key className="h-3.5 w-3.5" /> Drive-to-Own Program
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Drive Today. Own Tomorrow.
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-3">
              Rent With Heldy helps Uber, Lyft, DoorDash, Uber Eats, and delivery
              drivers get access to reliable vehicles while building ownership
              over time.
            </p>
            <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Every qualifying payment helps move drivers closer to owning the
              vehicle they rely on to earn income.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <a href="#apply">
                <Button
                  size="lg"
                  className="bg-card text-primary hover:bg-card/90 shadow-tropical px-8"
                >
                  Apply for Drive-to-Own
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </a>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Learn How It Works
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="text-xs uppercase tracking-wider text-primary-foreground/70 w-full sm:w-auto sm:mr-2">
                Approved for
              </span>
              {PLATFORMS.map((p) => (
                <span
                  key={p}
                  className="bg-primary-foreground/15 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                How it works
              </h2>
              <p className="text-muted-foreground">
                A clear path from approval to ownership — built around your
                schedule as a driver.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, idx) => (
                <Card key={s.title} className="border-none shadow-card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center">
                        <s.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Step {idx + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {s.body}
                    </p>
                    <Progress value={(idx + 1) * 25} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* JOURNEY TO OWNERSHIP */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
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
              alt="Drive-to-Own journey infographic showing weekly milestones from Week 1 to full ownership with growing equity at each step."
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        </section>

        {/* WHY DRIVERS LOVE IT */}
        <section className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Why drivers love it
              </h2>
              <p className="text-muted-foreground">
                A program designed to grow your future — not just cover your
                next shift.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-card-hover">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    Traditional Rentals
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Endless payments",
                      "No ownership",
                      "No long-term value",
                      "Start over every time",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3 text-sm">
                        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-tropical ring-2 ring-primary/20">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-lg font-semibold mb-4 text-primary">
                    Drive-to-Own
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Build ownership over time",
                      "Reliable vehicle access",
                      "Designed for gig workers",
                      "Long-term financial benefit",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                What you get
              </h2>
              <p className="text-muted-foreground">
                Built for the realities of driving for a living.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f) => (
                <Card key={f.title} className="border-none shadow-card-hover">
                  <CardContent className="p-6">
                    <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Driver stories
              </h2>
              <p className="text-muted-foreground">
                Real drivers building toward ownership through the program.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "I needed a vehicle for Uber and wanted more than just another rental. This program gave me a path toward ownership.",
                  name: "Future Driver Story",
                },
                {
                  quote:
                    "Weekly payments that actually build toward something — that's what was missing from every other rental I tried.",
                  name: "Future Driver Story",
                },
                {
                  quote:
                    "Reliable vehicle, real support, and progress I can see. Exactly what gig workers need.",
                  name: "Future Driver Story",
                },
              ].map((t, i) => (
                <Card key={i} className="border-none shadow-card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className="h-4 w-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-foreground mb-4 leading-relaxed">
                      "{t.quote}"
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Frequently asked questions
              </h2>
              <p className="text-muted-foreground">
                Everything you need to know about the Drive-to-Own program.
              </p>
            </div>
            <FAQAccordion items={FAQS} />
          </div>
        </section>

        {/* APPLY FORM */}
        <section id="apply" className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card className="border-none shadow-card-hover">
              <CardContent className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    Apply for Drive-to-Own
                  </h2>
                  <p className="text-muted-foreground">
                    Tell us a bit about yourself and our team will reach out to
                    walk you through the next steps.
                  </p>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <Label htmlFor="dto-name">Full name</Label>
                    <Input
                      id="dto-name"
                      name="name"
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dto-phone">Phone</Label>
                    <Input
                      id="dto-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="dto-email">Email</Label>
                    <Input
                      id="dto-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="block mb-2">
                      Which platforms will you drive for?
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PLATFORMS.map((p) => (
                        <label
                          key={p}
                          className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 cursor-pointer hover:border-primary focus-within:border-primary transition-colors"
                        >
                          <input
                            type="checkbox"
                            name={`platform-${p}`}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="text-sm">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="dto-notes">Anything else? (optional)</Label>
                    <Textarea
                      id="dto-notes"
                      name="notes"
                      rows={3}
                      placeholder="Tell us about your driving experience or any questions."
                    />
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
                      No commitment. Approval subject to verification.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 sm:py-20 bg-gradient-hero relative overflow-hidden">
          <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The vehicle that helps you earn should help you build a future too.
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join the Rent With Heldy Drive-to-Own Program and start working
              toward vehicle ownership while earning income.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#apply">
                <Button
                  size="lg"
                  className="bg-card text-primary hover:bg-card/90 shadow-tropical px-8"
                >
                  Apply Now
                </Button>
              </a>
              <a href="tel:+15615198958">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  <Phone className="h-5 w-5 mr-2" /> Schedule a Call
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm opacity-80">
              Prefer to browse rentals first?{" "}
              <Link to="/fleet" className="underline">
                See our fleet
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DriveToOwn;
