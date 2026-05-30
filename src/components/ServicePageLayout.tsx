import { Link } from "react-router-dom";
import { ChevronRight, CheckCircle2, MapPin, Phone, type LucideIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import FAQAccordion, { type FAQItem } from "@/components/FAQAccordion";
import QuickQuoteForm from "@/components/QuickQuoteForm";
import PartnerIntakeForm from "@/components/PartnerIntakeForm";
import { Button } from "@/components/ui/button";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

export interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ServicePageLayoutProps {
  metaTitle: string;
  metaDescription: string;
  path: string;
  crumbLabel: string;
  eyebrow: string;
  h1: string;
  intro: string;
  /** Service name used inside intake forms' subject lines */
  serviceContext: string;
  /** Stable slug used in backend logs/leads (e.g. "body-shop", "cruise-port") */
  verticalPath?: string;
  /** Pre-selected passenger type for the onboarding form on this page */
  defaultPassengerType?:
    | "Airport Traveler"
    | "Cruise Passenger"
    | "Hotel Guest"
    | "Body Shop / Repair Customer"
    | "Loss of Use / Legal Claim"
    | "Local Resident"
    | "Other";
  valueProps: ValueProp[];
  coverageAreas?: string[];
  partnerHeading?: string;
  partnerSubheading?: string;
  faqs: FAQItem[];
  /** Optional long-form body content rendered above the FAQ section */
  body?: { heading: string; paragraphs: string[]; bullets?: string[] }[];
}

const DEFAULT_COVERAGE = [
  "Fort Lauderdale",
  "Miami",
  "Hollywood",
  "Dania Beach",
  "Aventura",
  "Pompano Beach",
  "Port Everglades",
  "PortMiami",
];

const ServicePageLayout = ({
  metaTitle,
  metaDescription,
  path,
  crumbLabel,
  eyebrow,
  h1,
  intro,
  serviceContext,
  defaultPassengerType,
  valueProps,
  coverageAreas = DEFAULT_COVERAGE,
  partnerHeading,
  partnerSubheading,
  faqs,
  body,
}: ServicePageLayoutProps) => {
  const jsonLd = [
    localBusinessSchema,
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: crumbLabel, path },
    ]),
    buildFaqSchema(faqs),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={metaTitle}
        description={metaDescription}
        path={path}
        jsonLd={jsonLd}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-subtle border-b border-border">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <nav
              aria-label="Breadcrumb"
              className="text-xs text-muted-foreground mb-4 flex items-center gap-1"
            >
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{crumbLabel}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <span className="inline-block text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                  {eyebrow}
                </span>
                <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                  {h1}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-xl">
                  {intro}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/book" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                    >
                      Book Instantly
                    </Button>
                  </Link>
                  <a href="#quick-quote" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full">
                      Request Direct Delivery
                    </Button>
                  </a>
                </div>
                <a
                  href="tel:+15615198958"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <Phone className="h-4 w-4" />
                  Talk to a real person: (561) 519-8958
                </a>
              </div>

              <div id="quick-quote" className="scroll-mt-24">
                <QuickQuoteForm serviceContext={serviceContext} defaultPassengerType={defaultPassengerType} />
              </div>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Built for the way you actually need a car
            </h2>
            <p className="text-muted-foreground">
              Specialized perks for {crumbLabel.toLowerCase()} renters — not a
              generic airport counter checklist.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {valueProps.map((vp) => {
              const Icon = vp.icon;
              return (
                <div
                  key={vp.title}
                  className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-card-hover focus-within:border-primary/60"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-tropical flex items-center justify-center mb-4 shadow-tropical">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">
                    {vp.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {vp.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Optional body content */}
        {body && body.length > 0 && (
          <section className="bg-secondary/30 border-y border-border">
            <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl space-y-10">
              {body.map((s) => (
                <div key={s.heading}>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {s.heading}
                  </h2>
                  <div className="space-y-4">
                    {s.paragraphs.map((p, i) => (
                      <p
                        key={i}
                        className="text-base text-muted-foreground leading-relaxed"
                      >
                        {p}
                      </p>
                    ))}
                    {s.bullets && (
                      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        {s.bullets.map((b, i) => (
                          <li key={i} className="leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Partner intake */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <PartnerIntakeForm
              serviceContext={serviceContext}
              heading={partnerHeading}
              subheading={partnerSubheading}
            />
          </div>
        </section>

        {/* Coverage matrix */}
        <section className="bg-secondary/40 border-y border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Where we deliver
              </h2>
              <p className="text-muted-foreground">
                Our primary delivery corridors across South Florida. Not on the
                list? Ask — we'll quote it.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {coverageAreas.map((area) => (
                <div
                  key={area}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {area}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-dashed border-border bg-card/60 p-6 flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <span>
                Live coverage map coming soon — for now, message us and we'll
                confirm your address in minutes.
              </span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Frequently asked questions
          </h2>
          <FAQAccordion items={faqs} />
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-tropical">
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
              Need a car delivered today?
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              Book online in minutes or send a quick request — we'll respond
              fast and meet you where you are.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/book">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Book Instantly
                </Button>
              </Link>
              <a href="#quick-quote">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10"
                >
                  Request Delivery
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServicePageLayout;
