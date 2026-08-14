import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Anchor,
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  BusFront,
  CalendarDays,
  CarFront,
  Check,
  MapPin,
  Palmtree,
  Plane,
  Trophy,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO, { SITE_URL } from "@/components/SEO";
import FAQAccordion, { type FAQItem } from "@/components/FAQAccordion";
import PhotoGallery from "@/components/PhotoGallery";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import {
  ConsignmentInquiryForm,
  RentalInquiryForm,
} from "@/components/passenger-vans/PassengerVanForms";
import {
  PASSENGER_VAN_HERO_IMAGE,
  PASSENGER_VANS,
} from "@/data/passenger-vans";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/seo-schemas";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const STORY_KEYS = [
  "cruise",
  "sports_team",
  "vacation",
  "event",
  "concierge",
  "professional_driver",
] as const;

const TRIP_OPTIONS = [
  { key: "cruise", icon: Anchor },
  { key: "sports_team", icon: Trophy },
  { key: "event", icon: CalendarDays },
  { key: "vacation", icon: Palmtree },
  { key: "concierge", icon: BellRing },
  { key: "professional_driver", icon: BriefcaseBusiness },
] as const;

type TripKey = (typeof TRIP_OPTIONS)[number]["key"];

const COVERAGE_LOCATIONS = [
  "Miami",
  "Miami Beach",
  "Fort Lauderdale",
  "Hollywood",
  "Dania Beach",
  "Aventura",
  "Doral",
  "MIA",
  "FLL",
  "PortMiami",
  "Port Everglades",
] as const;

const PassengerVans = () => {
  const { t } = useTranslation("passengerVans");
  const [selectedTrip, setSelectedTrip] = useState<TripKey>("cruise");
  const [inquiryTripType, setInquiryTripType] = useState("");
  const [inquiryVehicle, setInquiryVehicle] = useState("no_preference");
  const [consignmentOpen, setConsignmentOpen] = useState(false);

  const faqs = t("faq.items", { returnObjects: true }) as FAQItem[];
  const selectedLocations = t(`tripSelector.options.${selectedTrip}.locations`, {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  useEffect(() => {
    track("passenger_vans_page_view");
  }, []);

  const scrollToInquiry = (options?: { trip?: string; vehicle?: string }) => {
    if (options?.trip) setInquiryTripType(options.trip);
    if (options?.vehicle) setInquiryVehicle(options.vehicle);
    window.requestAnimationFrame(() => {
      document.getElementById("passenger-van-inquiry")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  };

  const onBook = (location: string, vehicle = "any") => {
    track("passenger_vans_cta_click", {
      action: "book",
      cta_location: location,
      vehicle,
    });
    track("passenger_vans_wheelbase_launch", {
      cta_location: location,
      vehicle,
    });
  };

  const galleryLabels = {
    open: t("gallery.open"),
    close: t("gallery.close"),
    previous: t("gallery.previous"),
    next: t("gallery.next"),
    thumbnail: t("gallery.thumbnail"),
    photo: t("gallery.photo"),
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background pb-16 lg:pb-0">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path="/passenger-vans"
        image={`${SITE_URL}${PASSENGER_VAN_HERO_IMAGE}`}
        jsonLd={[
          buildBreadcrumbSchema([
            { name: t("breadcrumbs.home"), path: "/" },
            { name: t("breadcrumbs.current"), path: "/passenger-vans" },
          ]),
          buildFaqSchema(faqs),
        ]}
      />
      <Header />

      <main>
        <section className="bg-ink text-white" aria-labelledby="passenger-vans-title">
          <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:min-h-[720px]">
            <div className="relative z-10 flex items-center px-6 py-12 sm:px-10 sm:py-16 lg:px-[max(3rem,calc((100vw-1280px)/2+1.5rem))] lg:pe-12">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  {t("hero.eyebrow")}
                </p>
                <h1
                  id="passenger-vans-title"
                  className="mt-5 text-[clamp(2.65rem,1.65rem+4.4vw,5.25rem)] font-bold leading-[0.98] tracking-[-0.035em]"
                >
                  {t("hero.title")}
                </h1>
                <p className="mt-6 font-heading text-[clamp(1.35rem,1.05rem+1.2vw,2rem)] font-semibold text-white/95">
                  {t("hero.brandLine")}
                </p>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                  {t("hero.body")}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="sm:min-w-40">
                    <Link to="/book" onClick={() => onBook("hero")}>
                      {t("hero.bookCta")}
                      <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="border-white/35 text-white hover:border-white/60 hover:bg-white/10"
                    onClick={() => {
                      track("passenger_vans_cta_click", {
                        action: "inquiry",
                        cta_location: "hero",
                      });
                      scrollToInquiry();
                    }}
                  >
                    {t("hero.inquiryCta")}
                  </Button>
                </div>
                <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-xs font-medium text-white/70 sm:text-sm">
                  {(t("hero.trust", { returnObjects: true }) as string[]).map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative min-h-[42svh] overflow-hidden lg:min-h-full">
              <img
                src={PASSENGER_VAN_HERO_IMAGE}
                alt={t("hero.imageAlt")}
                width={1600}
                height={1200}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent lg:bg-gradient-to-r lg:from-ink/30 lg:via-transparent lg:to-transparent" />
              <div className="absolute bottom-5 end-5 rounded-control border border-white/20 bg-ink/80 px-4 py-3 text-end backdrop-blur-sm">
                <span className="block font-heading text-3xl font-bold">14</span>
                <span className="block text-xs uppercase tracking-[0.14em] text-white/70">
                  {t("hero.passengerLabel")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24" aria-labelledby="travel-together-title">
          <div className="container mx-auto">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <Reveal className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  {t("story.eyebrow")}
                </p>
                <h2 id="travel-together-title" className="mt-3 text-display font-bold text-ink">
                  {t("story.title")}
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  {t("story.intro")}
                </p>
              </Reveal>
              <div className="border-t border-border">
                {STORY_KEYS.map((key, index) => (
                  <Reveal key={key} delay={Math.min(index * 55, 220)}>
                    <article className="grid gap-3 border-b border-border py-7 sm:grid-cols-[10rem_1fr] sm:gap-8">
                      <h3 className="text-lg font-semibold text-ink">
                        {t(`story.items.${key}.title`)}
                      </h3>
                      <p className="leading-relaxed text-muted-foreground">
                        {t(`story.items.${key}.body`)}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="vans" className="scroll-mt-24 bg-secondary py-16 sm:py-24" aria-labelledby="meet-vans-title">
          <div className="container mx-auto">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                {t("vehicles.eyebrow")}
              </p>
              <h2 id="meet-vans-title" className="mt-3 text-display font-bold text-ink">
                {t("vehicles.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("vehicles.intro")}</p>
            </Reveal>

            <div className="mt-12 space-y-20 lg:space-y-28">
              {PASSENGER_VANS.map((van, index) => {
                const highlights = t(`vehicles.items.${van.translationKey}.highlights`, {
                  returnObjects: true,
                }) as string[];
                const vehicleLabel = `${van.year} ${van.name}`;

                return (
                  <article
                    id={van.id}
                    key={van.id}
                    className="scroll-mt-24 grid min-w-0 grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12"
                    aria-labelledby={`${van.id}-title`}
                  >
                    <Reveal className={cn("min-w-0 lg:col-span-7", index % 2 === 1 && "lg:order-2")}>
                      <PhotoGallery
                        images={van.images}
                        alt={vehicleLabel}
                        labels={galleryLabels}
                      />
                    </Reveal>
                    <Reveal
                      delay={80}
                      className={cn("min-w-0 lg:col-span-5", index % 2 === 1 && "lg:order-1")}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                          {van.year}
                        </span>
                        {van.premium && (
                          <span className="rounded-full border border-complementary/30 bg-complementary/10 px-3 py-1 text-xs font-semibold text-foreground">
                            {t("vehicles.newerOption")}
                          </span>
                        )}
                      </div>
                      <h3 id={`${van.id}-title`} className="mt-3 text-heading font-bold text-ink">
                        {van.name}
                      </h3>
                      <p className="mt-3 flex items-center gap-2 font-semibold text-foreground">
                        <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                        {t("vehicles.capacity", { count: van.capacity })}
                      </p>
                      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                        {t(`vehicles.items.${van.translationKey}.description`)}
                      </p>
                      <ul className="mt-6 space-y-3">
                        {highlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-3 text-sm text-foreground/85">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          size="lg"
                          onClick={() => {
                            track("passenger_vans_vehicle_cta", {
                              action: "inquiry",
                              cta_location: "vehicle_showcase",
                              vehicle: van.id,
                            });
                            scrollToInquiry({ vehicle: van.id });
                          }}
                        >
                          {t("vehicles.inquiryCta")}
                        </Button>
                        <Button asChild size="lg" variant="outline">
                          <Link
                            to="/book"
                            onClick={() => {
                              track("passenger_vans_vehicle_cta", {
                                action: "book",
                                cta_location: "vehicle_showcase",
                                vehicle: van.id,
                              });
                              onBook("vehicle_showcase", van.id);
                            }}
                          >
                            {t("vehicles.bookCta")}
                          </Link>
                        </Button>
                      </div>
                    </Reveal>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-ink py-16 text-white sm:py-24" aria-labelledby="one-vehicle-title">
          <div className="container mx-auto">
            <Reveal className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  {t("groupVisual.eyebrow")}
                </p>
                <h2 id="one-vehicle-title" className="mt-3 text-display font-bold">
                  {t("groupVisual.title")}
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
                  {t("groupVisual.body")}
                </p>
              </div>
              <div className="rounded-card border border-white/15 bg-white/[0.04] p-6 sm:p-8">
                <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto_1fr]">
                  <div className="text-center">
                    <div className="grid grid-cols-2 gap-3" aria-hidden="true">
                      {[1, 2, 3, 4].map((car) => (
                        <span key={car} className="flex h-16 items-center justify-center rounded-control border border-white/15 bg-white/[0.06]">
                          <CarFront className="h-8 w-8 text-white/65" />
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-medium text-white/60">
                      {t("groupVisual.multipleCars")}
                    </p>
                  </div>
                  <div className="hidden h-20 w-px bg-white/15 sm:block" aria-hidden="true" />
                  <div className="text-center">
                    <div className="relative flex h-36 items-center justify-center rounded-card border border-primary/35 bg-primary/10" aria-hidden="true">
                      <BusFront className="h-20 w-20 text-primary" />
                      <span className="absolute end-4 top-3 font-heading text-3xl font-bold">14</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {t("groupVisual.oneTransit")}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-16 sm:py-24" aria-labelledby="trip-selector-title">
          <div className="container mx-auto">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                {t("tripSelector.eyebrow")}
              </p>
              <h2 id="trip-selector-title" className="mt-3 text-display font-bold text-ink">
                {t("tripSelector.title")}
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
              <div role="tablist" aria-label={t("tripSelector.title")} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {TRIP_OPTIONS.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`trip-tab-${key}`}
                    aria-selected={selectedTrip === key}
                    aria-controls="trip-selector-panel"
                    onClick={() => {
                      setSelectedTrip(key);
                      setInquiryTripType(key);
                      track("passenger_vans_use_case_select", { use_case: key });
                    }}
                    className={cn(
                      "flex min-h-24 flex-col items-start justify-between rounded-control border p-4 text-start transition-[border-color,background-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selectedTrip === key
                        ? "border-primary bg-primary/[0.08] text-ink"
                        : "border-border bg-card text-muted-foreground hover:border-ink/25 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="mt-4 text-sm font-semibold">
                      {t(`tripSelector.options.${key}.label`)}
                    </span>
                  </button>
                ))}
              </div>

              <Reveal
                id="trip-selector-panel"
                role="tabpanel"
                aria-labelledby={`trip-tab-${selectedTrip}`}
                className="flex min-h-80 flex-col justify-between rounded-card border border-border bg-card p-7 shadow-card sm:p-10"
              >
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                    {t(`tripSelector.options.${selectedTrip}.label`)}
                  </p>
                  <h3 className="mt-3 text-heading font-bold text-ink">
                    {t(`tripSelector.options.${selectedTrip}.headline`)}
                  </h3>
                  <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
                    {t(`tripSelector.options.${selectedTrip}.body`)}
                  </p>
                  {selectedLocations.length > 0 && (
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {selectedLocations.map((location) => (
                        <li key={location} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/80" dir={/^(MIA|FLL)$/.test(location) ? "ltr" : undefined}>
                          {location}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-8">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      track("passenger_vans_cta_click", {
                        action: "inquiry",
                        cta_location: "trip_selector",
                        use_case: selectedTrip,
                      });
                      scrollToInquiry({ trip: selectedTrip });
                    }}
                  >
                    {t(`tripSelector.options.${selectedTrip}.cta`)}
                    <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-secondary py-16 sm:py-24" aria-labelledby="coverage-title">
          <div className="container mx-auto">
            <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <Reveal>
                <div className="flex h-12 w-12 items-center justify-center rounded-control bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h2 id="coverage-title" className="mt-5 text-display font-bold text-ink">
                  {t("coverage.title")}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {t("coverage.body")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="mt-7"
                  onClick={() => {
                    track("passenger_vans_cta_click", {
                      action: "inquiry",
                      cta_location: "coverage",
                    });
                    scrollToInquiry();
                  }}
                >
                  {t("coverage.cta")}
                </Button>
              </Reveal>
              <Reveal delay={80} className="relative overflow-hidden rounded-card border border-border bg-card p-7 shadow-card sm:p-10">
                <div className="absolute bottom-0 start-10 top-0 w-px bg-primary/20" aria-hidden="true" />
                <ul className="relative grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {COVERAGE_LOCATIONS.map((location, index) => (
                    <li key={location} className="flex items-center gap-3 text-sm font-medium text-foreground/85">
                      <span className={cn("relative z-10 h-3 w-3 shrink-0 rounded-full border-2 border-card", index === 0 || index === COVERAGE_LOCATIONS.length - 1 ? "bg-complementary" : "bg-primary")} aria-hidden="true" />
                      <span dir={/^(MIA|FLL)$/.test(location) ? "ltr" : undefined}>{location}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
                  <Plane className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t("coverage.note")}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="passenger-van-inquiry" className="scroll-mt-20 py-16 sm:py-24" aria-labelledby="inquiry-title">
          <div className="container mx-auto">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                {t("conversion.eyebrow")}
              </p>
              <h2 id="inquiry-title" className="mt-3 text-display font-bold text-ink">
                {t("conversion.title")}
              </h2>
            </Reveal>

            <div className="mt-10 grid items-start gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10">
              <Reveal className="rounded-card bg-ink p-7 text-white shadow-elevated sm:p-10">
                <BusFront className="h-10 w-10 text-primary" aria-hidden="true" />
                <h3 className="mt-6 text-heading font-bold">{t("conversion.book.title")}</h3>
                <p className="mt-3 text-white/70">{t("conversion.book.body")}</p>
                <Button asChild size="lg" className="mt-7 w-full sm:w-auto">
                  <Link to="/book" onClick={() => onBook("conversion_section")}>
                    {t("conversion.book.cta")}
                    <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                  </Link>
                </Button>
                <ul className="mt-8 space-y-3 border-t border-white/15 pt-6 text-sm text-white/65">
                  {(t("conversion.book.notes", { returnObjects: true }) as string[]).map((note) => (
                    <li key={note} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {note}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={80} className="rounded-card border border-border bg-card p-6 shadow-card sm:p-8">
                <h3 className="text-heading font-bold text-ink">{t("conversion.inquiry.title")}</h3>
                <p className="mb-7 mt-3 text-muted-foreground">{t("conversion.inquiry.body")}</p>
                <RentalInquiryForm
                  initialTripType={inquiryTripType}
                  initialVehicle={inquiryVehicle}
                />
              </Reveal>
            </div>
          </div>
        </section>

        <section id="consignment" className="scroll-mt-20 border-y border-white/10 bg-ink py-16 text-white sm:py-24" aria-labelledby="consignment-title">
          <div className="container mx-auto">
            <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <Reveal>
                <p className="text-sm font-semibold uppercase tracking-wider text-complementary">
                  {t("consignment.eyebrow")}
                </p>
                <h2 id="consignment-title" className="mt-3 text-display font-bold">
                  {t("consignment.title")}
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-white/70">
                  {t("consignment.body")}
                </p>
                <p className="mt-4 text-sm text-white/55">{t("consignment.microcopy")}</p>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="mt-7 border-white/35 text-white hover:border-white/60 hover:bg-white/10"
                  aria-expanded={consignmentOpen}
                  aria-controls="consignment-form"
                  onClick={() => {
                    const next = !consignmentOpen;
                    setConsignmentOpen(next);
                    if (next) track("passenger_vans_consignment_cta");
                  }}
                >
                  {consignmentOpen ? t("consignment.closeCta") : t("consignment.cta")}
                </Button>
              </Reveal>
              <div id="consignment-form">
                {consignmentOpen ? (
                  <Reveal className="rounded-card bg-card p-6 text-foreground shadow-elevated sm:p-8">
                    <h3 className="text-heading font-bold text-ink">{t("forms.consignment.title")}</h3>
                    <p className="mb-7 mt-3 text-muted-foreground">{t("forms.consignment.body")}</p>
                    <ConsignmentInquiryForm />
                  </Reveal>
                ) : (
                  <div className="hidden min-h-72 rounded-card border border-dashed border-white/20 lg:flex lg:items-center lg:justify-center">
                    <BusFront className="h-20 w-20 text-white/10" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24" aria-labelledby="passenger-vans-faq-title">
          <div className="container mx-auto max-w-3xl">
            <Reveal>
              <p className="text-center text-sm font-semibold uppercase tracking-wider text-primary">
                {t("faq.eyebrow")}
              </p>
              <h2 id="passenger-vans-faq-title" className="mt-3 text-center text-display font-bold text-ink">
                {t("faq.title")}
              </h2>
            </Reveal>
            <Reveal delay={80} className="mt-10">
              <FAQAccordion items={faqs} />
            </Reveal>
          </div>
        </section>

        <section className="bg-primary py-14 sm:py-18" aria-labelledby="final-cta-title">
          <div className="container mx-auto">
            <Reveal className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <h2 id="final-cta-title" className="text-display font-bold text-ink">
                  {t("finalCta.title")}
                </h2>
                <p className="mt-3 text-lg text-ink/70">{t("finalCta.body")}</p>
                <a
                  href="#consignment"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/70 underline-offset-4 hover:text-ink hover:underline"
                  onClick={() => track("passenger_vans_consignment_cta", { cta_location: "final_cta" })}
                >
                  {t("finalCta.consignmentLink")}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </a>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild size="lg" className="bg-ink text-white hover:bg-ink/90">
                  <Link to="/book" onClick={() => onBook("final_cta")}>
                    {t("finalCta.bookCta")}
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="border-ink/35 text-ink hover:border-ink/60 hover:bg-ink/5"
                  onClick={() => {
                    track("passenger_vans_cta_click", {
                      action: "inquiry",
                      cta_location: "final_cta",
                    });
                    scrollToInquiry();
                  }}
                >
                  {t("finalCta.inquiryCta")}
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 py-2 shadow-[0_-8px_30px_-18px_hsl(var(--ink)/0.35)] backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <Button asChild>
            <Link to="/book" onClick={() => onBook("mobile_sticky")}>
              {t("sticky.book")}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              track("passenger_vans_cta_click", {
                action: "inquiry",
                cta_location: "mobile_sticky",
              });
              scrollToInquiry();
            }}
          >
            {t("sticky.inquire")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PassengerVans;
