import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import FAQAccordion, { type FAQItem } from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

export interface LocationSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface LocationPageLayoutProps {
  /** SEO meta title (<60 chars ideal) */
  metaTitle: string;
  /** SEO meta description (<160 chars ideal) */
  metaDescription: string;
  /** Canonical path, e.g. "/car-rental-miami" */
  path: string;
  /** Single H1 */
  h1: string;
  /** Short hero subhead */
  intro: string;
  /** Crumb label (e.g. "Fort Lauderdale") */
  crumbLabel: string;
  /** Long-form H2 sections */
  sections: LocationSection[];
  /** Page-specific FAQs (used both visually and in JSON-LD) */
  faqs: FAQItem[];
  /** Optional final CTA copy override */
  ctaHeadline?: string;
  ctaSubhead?: string;
  /** Optional form rendered in the hero section */
  heroForm?: ReactNode;
}

const LocationPageLayout = ({
  metaTitle,
  metaDescription,
  path,
  h1,
  intro,
  crumbLabel,
  sections,
  faqs,
  ctaHeadline,
  ctaSubhead,
  heroForm,
}: LocationPageLayoutProps) => {
  const { t } = useTranslation(["locations", "common"]);
  const ctaHeadlineText = ctaHeadline ?? t("layout.finalCta.title");
  const ctaSubheadText = ctaSubhead ?? t("layout.finalCta.subtitle");
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
          <div className={`container mx-auto px-4 py-12 md:py-16 ${heroForm ? "max-w-6xl" : "max-w-4xl"}`}>
            {/* Breadcrumb */}
            <nav
              aria-label={t("layout.breadcrumbLabel")}
              className="text-xs text-muted-foreground mb-4 flex items-center gap-1"
            >
              <Link to="/" className="hover:text-primary">
                {t("layout.breadcrumbHome")}
              </Link>
              <ChevronRight className="h-3 w-3 rtl:-scale-x-100" />
              <span className="text-foreground">{crumbLabel}</span>
            </nav>

            <div className={heroForm ? "grid grid-cols-1 lg:grid-cols-2 gap-10 items-start" : undefined}>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                  {h1}
                </h1>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                  {intro}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/book">
                    <Button
                      size="lg"
                      className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
                    >
                      {t("common:actions.bookNow")}
                    </Button>
                  </Link>
                  <Link to="/fleet">
                    <Button size="lg" variant="outline">
                      {t("layout.viewFleet")}
                    </Button>
                  </Link>
                </div>
              </div>
              {heroForm && (
                <div id="quick-quote" className="scroll-mt-24">
                  {heroForm}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Long-form content */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <div className="space-y-10">
            {sections.map((s) => (
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
                    <ul className="list-disc ps-6 space-y-2 text-muted-foreground">
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

        {/* Internal links band */}
        <section className="bg-secondary/40 border-y border-border">
          <div className="container mx-auto px-4 py-10 max-w-4xl">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {t("layout.exploreMore.title")}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <li>
                <Link to="/fleet" className="text-primary hover:underline">
                  → {t("layout.exploreMore.links.fleet")}
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-primary hover:underline"
                >
                  → {t("layout.exploreMore.links.howItWorks")}
                </Link>
              </li>
              <li>
                <Link
                  to="/car-rental-fort-lauderdale"
                  className="text-primary hover:underline"
                >
                  → {t("layout.exploreMore.links.fortLauderdale")}
                </Link>
              </li>
              <li>
                <Link
                  to="/car-rental-miami"
                  className="text-primary hover:underline"
                >
                  → {t("layout.exploreMore.links.miami")}
                </Link>
              </li>
              <li>
                <Link
                  to="/fort-lauderdale-airport-car-rental"
                  className="text-primary hover:underline"
                >
                  → {t("layout.exploreMore.links.airport")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary hover:underline">
                  → {t("layout.exploreMore.links.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t("layout.faqHeading")}
          </h2>
          <FAQAccordion items={faqs} />
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-tropical">
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
              {ctaHeadlineText}
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              {ctaSubheadText}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/book">
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-semibold"
                >
                  {t("common:actions.bookNow")}
                </Button>
              </Link>
              <a href={CONTACT_PHONE_HREF}>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10"
                >
                  {t("layout.callCta")} <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
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

export default LocationPageLayout;
