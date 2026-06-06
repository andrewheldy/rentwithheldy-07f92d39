import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Truck,
  Users,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type GigType = "rideshare" | "delivery" | "both";
type RideTier = "standard" | "comfort" | "xl";
type Hours = "part" | "full" | "heavy";

const RIDESHARE_PLATFORMS = ["Uber", "Lyft", "Empower"];
const DELIVERY_PLATFORMS = [
  "DoorDash",
  "Uber Eats",
  "Instacart",
  "Amazon Flex",
  "Grubhub",
];

type Recommendation = {
  tier: "Starter" | "Standard" | "Premium" | "Group / XL";
  category: string;
  weekly: number;
  why: string;
  fits: string[];
};

function recommend(args: {
  gig: GigType;
  rideTier?: RideTier;
  hours: Hours;
}): Recommendation {
  const { gig, rideTier, hours } = args;

  // XL / group rides → Full-Size SUV
  if (gig !== "delivery" && rideTier === "xl") {
    return {
      tier: "Group / XL",
      category: "Full-Size SUV",
      weekly: 570,
      why: "Qualifies for Uber XL and large-group rides — higher fares per trip.",
      fits: ["Uber XL", "Lyft XL", "Group airport runs", "7+ passengers"],
    };
  }

  // Premium rideshare (Comfort) → Mid-Size SUV
  if (gig !== "delivery" && rideTier === "comfort") {
    return {
      tier: "Premium",
      category: "Mid-Size SUV",
      weekly: 450,
      why: "Roomy, comfortable ride that qualifies for Uber Comfort and premium tiers.",
      fits: ["Uber Comfort", "Lyft Preferred", "Highway-heavy driving"],
    };
  }

  // Pure delivery → Economy (fuel efficient)
  if (gig === "delivery") {
    return {
      tier: "Starter",
      category: "Economy",
      weekly: 270,
      why: "Best fuel efficiency keeps more of every delivery payout in your pocket.",
      fits: [
        "DoorDash",
        "Uber Eats",
        "Instacart",
        "Amazon Flex",
        "Grubhub",
      ],
    };
  }

  // Heavy hours rideshare → Compact Sedan upgrade to Mid-Size for comfort
  if (gig === "rideshare" && hours === "heavy") {
    return {
      tier: "Standard",
      category: "Compact Sedan",
      weekly: 330,
      why: "Reliable, fuel-smart sedan built for long shifts on Uber, Lyft, and Empower.",
      fits: ["Uber X", "Lyft Standard", "Empower", "Daily drivers"],
    };
  }

  // Default rideshare or both
  if (gig === "both") {
    return {
      tier: "Standard",
      category: "Compact Sedan",
      weekly: 330,
      why: "Versatile sedan that handles both rideshare passengers and delivery runs.",
      fits: ["Uber / Lyft / Empower", "DoorDash", "Uber Eats", "Instacart"],
    };
  }

  return {
    tier: "Standard",
    category: "Compact Sedan",
    weekly: 330,
    why: "Approved for Uber, Lyft, and Empower with low weekly cost and great reliability.",
    fits: ["Uber X", "Lyft Standard", "Empower"],
  };
}

const TOTAL_STEPS = 5;

const DriveToOwnQuiz = () => {
  const [step, setStep] = useState(0); // 0 = intro, 1..4 = questions, 5 = result
  const [gig, setGig] = useState<GigType | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [rideTier, setRideTier] = useState<RideTier | null>(null);
  const [hours, setHours] = useState<Hours | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const showRideTierStep = gig !== "delivery";
  const lastQuestionStep = showRideTierStep ? 4 : 3;

  const rec = useMemo(() => {
    if (!gig || !hours) return null;
    return recommend({
      gig,
      rideTier: showRideTierStep ? rideTier ?? "standard" : undefined,
      hours,
    });
  }, [gig, rideTier, hours, showRideTierStep]);

  const progress = step === 0 ? 0 : Math.min((step / lastQuestionStep) * 100, 100);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const reset = () => {
    setStep(0);
    setGig(null);
    setPlatforms([]);
    setRideTier(null);
    setHours(null);
    setSubmitted(false);
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rec) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      form_type: "quick_quote" as const,
      vertical_path: "drive-to-own",
      passenger_type: "Rideshare / Delivery Driver",
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      notes: [
        `Chariot Quiz match: ${rec.tier} — ${rec.category} ($${rec.weekly}/wk).`,
        `Gig type: ${gig}.`,
        showRideTierStep ? `Ride tier: ${rideTier ?? "standard"}.` : null,
        `Hours: ${hours}.`,
        `Platforms: ${platforms.join(", ") || "Not specified"}.`,
      ]
        .filter(Boolean)
        .join(" "),
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
    setSubmitted(true);
    toast({
      title: "Match saved",
      description: "Our team will reach out with next steps for your match.",
    });
  };

  return (
    <Card className="border-none shadow-card-hover overflow-hidden">
      <div className="bg-gradient-tropical px-6 py-5 text-primary-foreground">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Find your match in 60 seconds</h3>
          </div>
          {step > 0 && step <= lastQuestionStep && (
            <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Step {step} of {lastQuestionStep}
            </span>
          )}
        </div>
        {step > 0 && step <= lastQuestionStep && (
          <Progress
            value={progress}
            className="h-1.5 mt-3 bg-primary-foreground/20"
          />
        )}
      </div>

      <CardContent className="p-6 md:p-8">
        {/* INTRO */}
        {step === 0 && (
          <div className="text-center">
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Answer a few quick questions and we'll recommend the right vehicle
              and weekly price point for your goals.
            </p>
            <Button
              size="lg"
              onClick={next}
              className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical px-8"
            >
              Start the questionnaire <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Q1: Gig type */}
        {step === 1 && (
          <div>
            <h4 className="text-xl font-semibold text-foreground mb-1">
              What kind of gig work?
            </h4>
            <p className="text-sm text-muted-foreground mb-6">
              Pick the option that best matches how you'll use the vehicle.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "rideshare" as const, label: "Rideshare", desc: "Uber, Lyft, Empower", icon: Users },
                { key: "delivery" as const, label: "Delivery", desc: "DoorDash, Uber Eats, Instacart", icon: Truck },
                { key: "both" as const, label: "Both", desc: "Mix of rideshare + delivery", icon: Car },
              ].map((opt) => {
                const active = gig === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setGig(opt.key);
                      if (opt.key === "delivery") setRideTier(null);
                    }}
                    className={`text-left rounded-xl border-2 p-4 transition-all ${
                      active
                        ? "border-primary bg-primary/5 shadow-card-hover"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <opt.icon className={`h-6 w-6 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="font-semibold text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Q2: Platforms */}
        {step === 2 && (
          <div>
            <h4 className="text-xl font-semibold text-foreground mb-1">
              Which platforms will you drive for?
            </h4>
            <p className="text-sm text-muted-foreground mb-6">Select all that apply.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(gig === "delivery"
                ? DELIVERY_PLATFORMS
                : gig === "rideshare"
                ? RIDESHARE_PLATFORMS
                : [...RIDESHARE_PLATFORMS, ...DELIVERY_PLATFORMS]
              ).map((p) => {
                const active = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center justify-between rounded-md border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {p}
                    {active && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Q3: Hours */}
        {step === 3 && (
          <div>
            <h4 className="text-xl font-semibold text-foreground mb-1">
              How many hours per week?
            </h4>
            <p className="text-sm text-muted-foreground mb-6">
              Helps us match a vehicle that holds up to your shift load.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "part" as const, label: "Part-time", desc: "Under 20 hrs / week" },
                { key: "full" as const, label: "Full-time", desc: "20 – 40 hrs / week" },
                { key: "heavy" as const, label: "Heavy", desc: "40+ hrs / week" },
              ].map((opt) => {
                const active = hours === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setHours(opt.key)}
                    className={`text-left rounded-xl border-2 p-4 transition-all ${
                      active
                        ? "border-primary bg-primary/5 shadow-card-hover"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <Clock className={`h-5 w-5 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="font-semibold text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Q4: Ride tier (skipped for delivery) */}
        {step === 4 && showRideTierStep && (
          <div>
            <h4 className="text-xl font-semibold text-foreground mb-1">
              Which rideshare tier do you want to target?
            </h4>
            <p className="text-sm text-muted-foreground mb-6">
              Premium tiers earn more per trip but need a qualifying vehicle.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "standard" as const, label: "Standard", desc: "Uber X, Lyft, Empower" },
                { key: "comfort" as const, label: "Comfort / Premium", desc: "Uber Comfort, Lyft Preferred" },
                { key: "xl" as const, label: "XL / Group", desc: "Uber XL, Lyft XL — 6+ riders" },
              ].map((opt) => {
                const active = rideTier === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRideTier(opt.key)}
                    className={`text-left rounded-xl border-2 p-4 transition-all ${
                      active
                        ? "border-primary bg-primary/5 shadow-card-hover"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <DollarSign className={`h-5 w-5 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="font-semibold text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RESULT */}
        {step > lastQuestionStep && rec && (
          <div>
            {!submitted ? (
              <>
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                    <Sparkles className="h-3.5 w-3.5" /> Your match
                  </span>
                  <h4 className="text-2xl font-bold text-foreground">
                    {rec.tier} — {rec.category}
                  </h4>
                  <div className="mt-2 text-3xl font-bold text-primary">
                    ${rec.weekly}
                    <span className="text-sm font-medium text-muted-foreground">
                      {" "}
                      / week
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
                    {rec.why}
                  </p>
                </div>

                <div className="bg-secondary rounded-lg p-4 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Approved for
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rec.fits.map((f) => (
                      <span
                        key={f}
                        className="bg-card border border-border px-2.5 py-1 rounded-full text-xs font-medium text-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiz-name">Full name</Label>
                    <Input id="quiz-name" name="name" required placeholder="Your name" />
                  </div>
                  <div>
                    <Label htmlFor="quiz-phone">Phone</Label>
                    <Input
                      id="quiz-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="quiz-email">Email</Label>
                    <Input
                      id="quiz-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                    >
                      {submitting ? "Saving…" : "Claim my match"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      No commitment. Approval subject to verification.
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-2">
                  You're matched
                </h4>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We saved your <strong>{rec.category}</strong> match. Our team
                  will reach out with next steps and Drive-to-Own program
                  details.
                </p>
                <Button variant="outline" onClick={reset}>
                  Retake the quiz
                </Button>
              </div>
            )}
          </div>
        )}

        {/* NAV BUTTONS */}
        {step > 0 && step <= lastQuestionStep && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" onClick={back} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              onClick={() => {
                // skip ride tier if delivery only
                if (step === 3 && !showRideTierStep) {
                  setStep(lastQuestionStep + 1);
                  return;
                }
                next();
              }}
              disabled={
                (step === 1 && !gig) ||
                (step === 2 && platforms.length === 0) ||
                (step === 3 && !hours) ||
                (step === 4 && showRideTierStep && !rideTier)
              }
              className="bg-gradient-tropical text-primary-foreground hover:opacity-90"
            >
              {step === lastQuestionStep ? "See my match" : "Next"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriveToOwnQuiz;
