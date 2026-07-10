import { useState } from "react";
import { useTranslation } from "react-i18next";
import DriveToOwnQuiz from "@/components/DriveToOwnQuiz";
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
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";
import heroRentToOwn from "@/assets/hero-rent-to-own.png";
import heroRentToOwnAvif from "@/assets/hero-rent-to-own.avif";
import heroRentToOwnWebp from "@/assets/hero-rent-to-own.webp";

const PLATFORMS = ["Uber", "Lyft", "DoorDash", "Uber Eats", "Instacart"];

// Structural data (icons + semantic keys) stays here; visible copy comes from
// the `rentToOwn` namespace so only customer-facing strings are translated.
const STEPS = [
  { icon: ClipboardCheck, key: "getApproved" },
  { icon: Car, key: "startDriving" },
  { icon: PiggyBank, key: "buildOwnership" },
  { icon: Key, key: "ownVehicle" },
] as const;

const FEATURES = [
  { icon: Wallet, key: "noDownPayment" },
  { icon: Briefcase, key: "flexibleGig" },
  { icon: TrendingUp, key: "progressTracking" },
  { icon: LifeBuoy, key: "reliableSupport" },
] as const;

const DriveToOwn = () => {
  const { t } = useTranslation(["rentToOwn", "common"]);
  const [submitting, setSubmitting] = useState(false);
  const faqs = t("faq.items", { returnObjects: true }) as {
    question: string;
    answer: string;
  }[];

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
      notes: `Rent-To-Own application. Platforms: ${
        platforms.join(", ") || "Not specified"
      }. Notes: ${String(fd.get("notes") || "")}`,
    };

    const { error } = await supabase.from("leads").insert(payload);
    setSubmitting(false);
    if (error) {
      toast({
        title: t("apply.toast.errorTitle"),
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: t("apply.toast.successTitle"),
      description: t("apply.toast.successDesc"),
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path="/rent-to-own"
      />
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative isolate flex min-h-[72svh] items-center overflow-hidden bg-background lg:min-h-[600px]">
          {/* Full-bleed background photo — desktop only. On mobile the same
              image runs in-flow below the copy instead (see photo band
              below), since a full-bleed layer here would sit almost entirely
              behind the full-width text column and never read as visible. */}
          <picture className="contents">
            <source srcSet={heroRentToOwnAvif} type="image/avif" />
            <source srcSet={heroRentToOwnWebp} type="image/webp" />
            <img
              src={heroRentToOwn}
              alt={t("hero.imageAlt")}
              className="absolute inset-0 -z-10 hidden h-full w-full object-cover object-[68%_center] lg:block"
              fetchPriority="high"
              decoding="async"
              width={1672}
              height={941}
            />
          </picture>
          {/* Warm cream wash, left to right, fading to transparent — keeps the
              text zone quiet without boxing it in. Desktop only, to match the
              background photo above. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-r from-background via-background/80 to-background/10 lg:block"
          />

          <div className="container mx-auto py-14 lg:py-0">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-ink/[0.06] border border-ink/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink mb-5">
                  <Key className="h-3.5 w-3.5" /> {t("hero.badge")}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-ink">
                  {t("hero.title")}
                </h1>
                <p className="text-lg md:text-xl text-ink/85 max-w-xl mb-3">
                  {t("hero.subtitle")}
                </p>
                <p className="text-base md:text-lg text-ink/75 max-w-xl mb-8">
                  {t("hero.tagline")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <a href="#quiz" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-ink text-white hover:bg-ink/90 px-8"
                    >
                      {t("hero.findMatch")}
                      <ArrowRight className="h-4 w-4 ms-1 rtl:-scale-x-100" />
                    </Button>
                  </a>
                  <a href="#how-it-works" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      {t("hero.seeHowItWorks")}
                    </Button>
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-xs uppercase tracking-wider text-ink/60 w-full sm:w-auto sm:me-2">
                    {t("hero.builtForDriversOn")}
                  </span>
                  {PLATFORMS.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-ink/10 bg-card/80 px-3 py-1.5 text-sm font-medium text-ink"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mobile photo band — in-flow, below the copy, so it's never
                  covered by text. Hidden on desktop, where the same image
                  runs full-bleed behind the two-column layout instead. */}
              <div className="lg:hidden">
                <picture className="contents">
                  <source srcSet={heroRentToOwnAvif} type="image/avif" />
                  <source srcSet={heroRentToOwnWebp} type="image/webp" />
                  <img
                    src={heroRentToOwn}
                    alt={t("hero.imageAlt")}
                    className="h-56 w-full rounded-2xl object-cover object-[85%_center] sm:h-64"
                    loading="lazy"
                    decoding="async"
                    width={1672}
                    height={941}
                  />
                </picture>
              </div>
            </div>
          </div>
        </section>

        {/* QUIZ */}
        <section id="quiz" className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <DriveToOwnQuiz />
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {t("howItWorks.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("howItWorks.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, idx) => (
                <Card key={s.key} className="border-none shadow-card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center">
                        <s.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("howItWorks.stepLabel", { number: idx + 1 })}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t(`howItWorks.steps.${s.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t(`howItWorks.steps.${s.key}.body`)}
                    </p>
                    <Progress value={(idx + 1) * 25} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>


        {/* WHY DRIVERS LOVE IT */}
        <section className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {t("comparison.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("comparison.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-card-hover">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    {t("comparison.traditional.title")}
                  </h3>
                  <ul className="space-y-3">
                    {(
                      t("comparison.traditional.items", {
                        returnObjects: true,
                      }) as string[]
                    ).map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-tropical ring-2 ring-primary/20">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-lg font-semibold mb-4 text-primary">
                    {t("comparison.rentToOwn.title")}
                  </h3>
                  <ul className="space-y-3">
                    {(
                      t("comparison.rentToOwn.items", {
                        returnObjects: true,
                      }) as string[]
                    ).map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
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
                {t("features.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("features.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f) => (
                <Card key={f.key} className="border-none shadow-card-hover">
                  <CardContent className="p-6">
                    <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t(`features.items.${f.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`features.items.${f.key}.body`)}
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
                {t("faq.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("faq.subtitle")}
              </p>
            </div>
            <FAQAccordion items={faqs} />
          </div>
        </section>

        {/* APPLY FORM */}
        <section id="apply" className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card className="border-none shadow-card-hover">
              <CardContent className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {t("apply.title")}
                  </h2>
                  <p className="text-muted-foreground">
                    {t("apply.subtitle")}
                  </p>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <Label htmlFor="dto-name">{t("apply.fields.name")}</Label>
                    <Input
                      id="dto-name"
                      name="name"
                      required
                      placeholder={t("apply.fields.namePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dto-phone">{t("apply.fields.phone")}</Label>
                    <Input
                      id="dto-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder={t("apply.fields.phonePlaceholder")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="dto-email">{t("apply.fields.email")}</Label>
                    <Input
                      id="dto-email"
                      name="email"
                      type="email"
                      required
                      placeholder={t("apply.fields.emailPlaceholder")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="block mb-2">
                      {t("apply.fields.platforms")}
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
                    <Label htmlFor="dto-notes">{t("apply.fields.notes")}</Label>
                    <Textarea
                      id="dto-notes"
                      name="notes"
                      rows={3}
                      placeholder={t("apply.fields.notesPlaceholder")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                    >
                      {submitting ? t("apply.submitting") : t("apply.submit")}
                      <ArrowRight className="h-4 w-4 ms-1 rtl:-scale-x-100" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      {t("apply.disclaimer")}
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
              {t("finalCta.title")}
            </h2>
            <p className="text-lg mb-8 opacity-90">
              {t("finalCta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#apply">
                <Button
                  size="lg"
                  className="bg-card text-primary hover:bg-card/90 shadow-tropical px-8"
                >
                  {t("finalCta.apply")}
                </Button>
              </a>
              <a href={CONTACT_PHONE_HREF}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  <Phone className="h-5 w-5 me-2" /> {t("finalCta.scheduleCall")}
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm opacity-80">
              {t("finalCta.browsePrompt")}{" "}
              <Link to="/fleet" className="underline">
                {t("finalCta.seeFleet")}
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
