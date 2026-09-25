import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  KeyRound,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  Ship,
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO, { SITE_URL } from "@/components/SEO";
import QuickQuoteForm from "@/components/QuickQuoteForm";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/seo-schemas";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, CONTACT_PHONE_SCHEMA } from "@/lib/contact";
import { track } from "@/lib/analytics";
import heroSunset from "@/assets/hero_sunset.png";
import heroSunsetAvif from "@/assets/hero_sunset.avif";
import heroSunsetWebp from "@/assets/hero_sunset.webp";
import hotelDelivery from "@/assets/categories/hotel-delivery.jpg";

/* /local-car-rentals — the "local alternative to the big rental companies"
   landing page. Copy lives in the `locations` namespace (local.*); routes,
   icons and structured data shape stay here as stable structural data. */

const PATH = "/local-car-rentals";
const PAGE_URL = `${SITE_URL}${PATH}`;
const PLAN_ANCHOR = "plan-my-trip";

interface QA {
  question: string;
  answer: string;
}

interface Alternative {
  heading: string;
  body: string;
}

const TRUST: { key: string; icon: LucideIcon }[] = [
  { key: "reviews", icon: Star },
  { key: "familyOwned", icon: Users },
  { key: "delivery", icon: Truck },
  { key: "contactless", icon: KeyRound },
  { key: "localSupport", icon: MessageCircle },
];

const DIFFERENCE_CARDS: { key: string; icon: LucideIcon }[] = [
  { key: "comeToYou", icon: Truck },
  { key: "localSupport", icon: MessageCircle },
  { key: "flexibility", icon: CalendarClock },
  { key: "hospitality", icon: HeartHandshake },
];

// Destination cards link to existing routes only.
const DESTINATIONS: { key: string; icon: LucideIcon; href: string }[] = [
  { key: "fll", icon: Plane, href: "/fort-lauderdale-airport-car-rental" },
  { key: "mia", icon: Plane, href: "/car-rental-miami" },
  { key: "hotels", icon: BedDouble, href: "/hotel-concierge-rentals" },
  { key: "portEverglades", icon: Anchor, href: "/cruise-port-delivery" },
  { key: "portMiami", icon: Ship, href: "/cruise-port-delivery" },
  { key: "local", icon: MapPin, href: "/car-rental-fort-lauderdale" },
];

const WHY_LOCAL: { key: string; icon: LucideIcon }[] = [
  { key: "direct", icon: MessageCircle },
  { key: "knowledge", icon: MapIcon },
  { key: "delivery", icon: Truck },
  { key: "personal", icon: Users },
  { key: "hospitality", icon: HeartHandshake },
  { key: "requests", icon: Sparkles },
];

// Places named in visible copy; used for Service.areaServed.
const AREA_SERVED = [
  { "@type": "City", name: "Fort Lauderdale" },
  { "@type": "City", name: "Miami" },
  { "@type": "City", name: "Hollywood" },
  { "@type": "City", name: "Dania Beach" },
  { "@type": "City", name: "Hallandale Beach" },
  { "@type": "City", name: "Aventura" },
  { "@type": "City", name: "Pembroke Pines" },
  { "@type": "City", name: "Doral" },
  { "@type": "AdministrativeArea", name: "Broward County" },
  { "@type": "AdministrativeArea", name: "Miami-Dade County" },
  {
    "@type": "Airport",
    name: "Fort Lauderdale-Hollywood International Airport",
    iataCode: "FLL",
  },
  { "@type": "Airport", name: "Miami International Airport", iataCode: "MIA" },
  { "@type": "Place", name: "Port Everglades" },
  { "@type": "Place", name: "PortMiami" },
];

const sectionEyebrow =
  "mb-3 text-sm font-semibold uppercase tracking-wider text-primary";
const ctaButton = "h-auto min-h-12 w-full whitespace-normal py-3 sm:w-auto";

const LocalCarRentals = () => {
  const { t, i18n } = useTranslation(["locations", "common"]);
  const faqs = t("local.faq.items", { returnObjects: true }) as QA[];
  const alternatives = t("local.alternatives.items", { returnObjects: true }) as Alternative[];
  const differenceParagraphs = t("local.difference.paragraphs", { returnObjects: true }) as string[];
  const alternativesParagraphs = t("local.alternatives.paragraphs", { returnObjects: true }) as string[];
  const areasParagraphs = t("local.areas.paragraphs", { returnObjects: true }) as string[];
  const traditionalItems = t("local.comparison.traditional.items", { returnObjects: true }) as string[];
  const heldyItems = t("local.comparison.heldy.items", { returnObjects: true }) as string[];

  const provider = {
    "@type": "AutoRental",
    name: "Rent With Heldy",
    url: SITE_URL,
    telephone: CONTACT_PHONE_SCHEMA,
    email: "rentwithheldy@gmail.com",
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: t("local.metaTitle"),
      description: t("local.metaDescription"),
      inLanguage: i18n.resolvedLanguage ?? i18n.language,
      isPartOf: { "@type": "WebSite", name: "Rent With Heldy", url: SITE_URL },
      about: { "@id": `${PAGE_URL}#service` },
      breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${PAGE_URL}#service`,
      name: t("local.schema.serviceName"),
      serviceType: "Local Car Rental and Vehicle Delivery",
      description: t("local.schema.serviceDescription"),
      url: PAGE_URL,
      provider,
      areaServed: AREA_SERVED,
      availableChannel: [
        {
          "@type": "ServiceChannel",
          name: t("local.schema.bookingChannel"),
          serviceUrl: `${SITE_URL}/book`,
        },
        {
          "@type": "ServiceChannel",
          name: t("local.schema.contactChannel"),
          serviceUrl: `${SITE_URL}/contact`,
          servicePhone: {
            "@type": "ContactPoint",
            telephone: CONTACT_PHONE_SCHEMA,
            contactType: "customer service",
          },
        },
      ],
    },
    {
      ...buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: t("local.crumbLabel"), path: PATH },
      ]),
      "@id": `${PAGE_URL}#breadcrumb`,
    },
    buildFaqSchema(faqs),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={t("local.metaTitle")}
        description={t("local.metaDescription")}
        ogTitle={t("local.ogTitle")}
        ogDescription={t("local.ogDescription")}
        path={PATH}
        jsonLd={jsonLd}
      />
      <Helmet>
        <link rel="preload" as="image" href={heroSunsetAvif} type="image/avif" fetchPriority="high" />
      </Helmet>
      <Header />

      <main className="flex-1">
        {/* ===== Hero ===== */}
        <section className="relative isolate overflow-hidden bg-ink">
          <picture>
            <source srcSet={heroSunsetAvif} type="image/avif" />
            <source srcSet={heroSunsetWebp} type="image/webp" />
            <img
              src={heroSunset}
              alt={t("local.hero.imageAlt")}
              className="absolute inset-0 -z-10 h-full w-full object-cover object-[68%_center] lg:object-center"
              {...{ fetchpriority: "high" }}
              decoding="async"
              width={1915}
              height={821}
            />
          </picture>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/25 rtl:bg-gradient-to-l"
          />

          <div className="container mx-auto pb-14 pt-8 sm:pb-20 lg:pb-24">
            <nav
              aria-label={t("layout.breadcrumbLabel")}
              className="mb-10 flex items-center gap-1 text-xs text-white/70 sm:mb-14"
            >
              <Link to="/" className="hover:text-white">
                {t("layout.breadcrumbHome")}
              </Link>
              <ChevronRight className="h-3 w-3 rtl:-scale-x-100" aria-hidden />
              <span className="text-white" aria-current="page">
                {t("local.crumbLabel")}
              </span>
            </nav>

            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-white/75">
                {t("local.hero.eyebrow")}
              </p>
              <h1 className="mt-5 font-heading text-display-lg font-bold text-white">
                {t("local.hero.h1")}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
                {t("local.hero.intro")}
              </p>
              <p className="mt-5 font-heading text-2xl font-semibold italic text-primary sm:text-3xl">
                {t("local.hero.tagline")}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className={ctaButton}>
                  <Link to="/book">
                    {t("local.hero.primaryCta")}
                    <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className={`${ctaButton} border-white/40 text-white hover:border-white/70 hover:bg-white/10`}
                >
                  <a href={`#${PLAN_ANCHOR}`}>{t("local.hero.secondaryCta")}</a>
                </Button>
              </div>

              <a
                href={CONTACT_PHONE_HREF}
                onClick={() => track("call_cta_click", { placement: "local_rentals_hero" })}
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4" aria-hidden />
                <span>{t("local.hero.talkToTeam")}</span>
                <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
              </a>

              <ul
                aria-label={t("local.hero.trustLabel")}
                className="mt-9 flex flex-wrap gap-x-5 gap-y-2.5 border-t border-white/15 pt-6"
              >
                {TRUST.map(({ key, icon: Icon }) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-white/80">
                    <Icon
                      aria-hidden
                      className={`h-4 w-4 text-primary ${key === "reviews" ? "fill-primary" : ""}`}
                    />
                    {t(`local.hero.trust.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ===== The difference ===== */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto">
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-5">
                <p className={sectionEyebrow}>{t("local.difference.eyebrow")}</p>
                <h2 className="mb-6 font-heading text-heading font-bold text-ink">
                  {t("local.difference.title")}
                </h2>
                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                  {differenceParagraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </Reveal>

              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                {DIFFERENCE_CARDS.map(({ key, icon: Icon }, i) => (
                  <Reveal key={key} delay={i * 70} className="h-full">
                    <div className="h-full rounded-card border border-border bg-card p-6 shadow-card">
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-control bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" aria-hidden />
                      </div>
                      <h3 className="mb-2 font-heading text-xl font-semibold text-ink">
                        {t(`local.difference.cards.${key}.title`)}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t(`local.difference.cards.${key}.body`)}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== Comparison ===== */}
        <section className="bg-secondary py-16 sm:py-24">
          <div className="container mx-auto">
            <Reveal className="mx-auto mb-12 max-w-2xl text-center">
              <p className={sectionEyebrow}>{t("local.comparison.eyebrow")}</p>
              <h2 className="mb-4 font-heading text-heading font-bold text-ink">
                {t("local.comparison.title")}
              </h2>
              <p className="text-lg text-muted-foreground">{t("local.comparison.intro")}</p>
            </Reveal>

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
              <Reveal className="h-full">
                <div className="h-full rounded-card border border-border bg-card/70 p-6 sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
                    </span>
                    <h3 className="font-heading text-xl font-semibold text-ink">
                      {t("local.comparison.traditional.title")}
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {traditionalItems.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-muted-foreground">
                        <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal className="h-full" delay={80}>
                <div className="h-full rounded-card border-2 border-primary/50 bg-card p-6 shadow-card sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary/10">
                      <KeyRound className="h-5 w-5 text-primary" aria-hidden />
                    </span>
                    <h3 className="font-heading text-xl font-semibold text-ink">
                      {t("local.comparison.heldy.title")}
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {heldyItems.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-foreground">
                        <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/book"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                {t("local.comparison.fleetLink")}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* ===== Alternatives to the national brands ===== */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-6">
                <p className={sectionEyebrow}>{t("local.alternatives.eyebrow")}</p>
                <h2 className="mb-6 font-heading text-heading font-bold text-ink">
                  {t("local.alternatives.title")}
                </h2>
                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                  {alternativesParagraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </Reveal>

              <div className="space-y-4 lg:col-span-6">
                {alternatives.map((a, i) => (
                  <Reveal key={a.heading} delay={i * 60}>
                    <div className="rounded-card border border-border bg-card p-5 sm:p-6">
                      <h3 className="mb-2 font-heading text-lg font-semibold text-ink">
                        {a.heading}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== Where your trip starts ===== */}
        <section className="bg-secondary py-16 sm:py-24">
          <div className="container mx-auto">
            <Reveal className="mb-12 max-w-2xl">
              <p className={sectionEyebrow}>{t("local.destinations.eyebrow")}</p>
              <h2 className="mb-4 font-heading text-heading font-bold text-ink">
                {t("local.destinations.title")}
              </h2>
              <p className="text-lg text-muted-foreground">{t("local.destinations.intro")}</p>
            </Reveal>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {DESTINATIONS.map(({ key, icon: Icon, href }, i) => (
                <Reveal as="li" key={key} delay={(i % 3) * 70} className="h-full">
                  <Link
                    to={href}
                    className="group flex h-full flex-col rounded-card border border-border bg-card p-6 shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-control bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden />
                    </span>
                    <h3 className="mb-2 font-heading text-xl font-semibold text-ink">
                      {t(`local.destinations.cards.${key}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`local.destinations.cards.${key}.body`)}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary">
                      {t(`local.destinations.cards.${key}.cta`)}
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                      />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== Service area ===== */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <Reveal className="order-last lg:order-first">
                <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-card border border-border shadow-card lg:max-w-none">
                  <img
                    src={hotelDelivery}
                    alt={t("local.areas.imageAlt")}
                    loading="lazy"
                    decoding="async"
                    width={700}
                    height={1167}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </Reveal>

              <Reveal>
                <p className={sectionEyebrow}>{t("local.areas.eyebrow")}</p>
                <h2 className="mb-6 font-heading text-heading font-bold text-ink">
                  {t("local.areas.title")}
                </h2>
                <div className="mb-8 space-y-4 text-lg leading-relaxed text-muted-foreground">
                  {areasParagraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      { key: "broward", href: "/car-rental-fort-lauderdale" },
                      { key: "miamiDade", href: "/car-rental-miami" },
                    ] as const
                  ).map(({ key, href }) => (
                    <div key={key} className="flex flex-col rounded-card border border-border bg-card p-5">
                      <h3 className="mb-2 flex items-center gap-2 font-heading text-lg font-semibold text-ink">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {t(`local.areas.${key}.title`)}
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                        {t(`local.areas.${key}.body`)}
                      </p>
                      <Link
                        to={href}
                        className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        {t(`local.areas.${key}.link`)}
                        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
                      </Link>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== Why rent local + trip form ===== */}
        <section className="bg-secondary py-16 sm:py-24">
          <div className="container mx-auto">
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-14">
              <Reveal className="min-w-0">
                <p className={sectionEyebrow}>{t("local.whyLocal.eyebrow")}</p>
                <h2 className="mb-4 font-heading text-heading font-bold text-ink">
                  {t("local.whyLocal.title")}
                </h2>
                <p className="mb-10 text-lg text-muted-foreground">{t("local.whyLocal.intro")}</p>
                <ul className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                  {WHY_LOCAL.map(({ key, icon: Icon }) => (
                    <li key={key} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" aria-hidden />
                      </span>
                      <div>
                        <h3 className="mb-1 font-semibold text-ink">
                          {t(`local.whyLocal.items.${key}.title`)}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t(`local.whyLocal.items.${key}.body`)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal id={PLAN_ANCHOR} className="min-w-0 scroll-mt-24" delay={80}>
                <QuickQuoteForm
                  serviceContext="Local Car Rentals"
                  verticalPath="local-car-rentals"
                  title={t("local.whyLocal.form.title")}
                  subtitle={t("local.whyLocal.form.subtitle")}
                  ctaLabel={t("local.whyLocal.form.cta")}
                  appearance="concierge"
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== FAQ (visible answers mirror the FAQPage JSON-LD exactly) ===== */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto">
            <Reveal className="mb-12 max-w-2xl">
              <p className={sectionEyebrow}>{t("local.faq.eyebrow")}</p>
              <h2 className="font-heading text-heading font-bold text-ink">
                {t("local.faq.title")}
              </h2>
            </Reveal>

            <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
              {faqs.map((f) => (
                <div key={f.question} className="border-t border-border pt-6">
                  <h3 className="mb-3 font-heading text-lg font-semibold text-ink">{f.question}</h3>
                  <p className="leading-relaxed text-muted-foreground">{f.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 flex flex-col gap-4 rounded-card border border-border bg-card p-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
              <p className="font-semibold text-ink">{t("local.faq.moreTitle")}</p>
              {(
                [
                  { key: "faq", href: "/faq" },
                  { key: "howItWorks", href: "/how-it-works" },
                  { key: "contact", href: "/contact" },
                ] as const
              ).map(({ key, href }) => (
                <Link
                  key={key}
                  to={href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  {t(`local.faq.links.${key}`)}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Final CTA ===== */}
        <section className="bg-ink">
          <div className="container mx-auto max-w-3xl py-16 text-center sm:py-24">
            <h2 className="mb-4 font-heading text-display font-bold text-white">
              {t("local.finalCta.title")}
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-white/80">
              {t("local.finalCta.body")}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className={ctaButton}>
                <Link to="/book">
                  {t("local.hero.primaryCta")}
                  <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className={`${ctaButton} border-white/40 text-white hover:border-white/70 hover:bg-white/10`}
              >
                <a href={`#${PLAN_ANCHOR}`}>{t("local.hero.secondaryCta")}</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LocalCarRentals;
