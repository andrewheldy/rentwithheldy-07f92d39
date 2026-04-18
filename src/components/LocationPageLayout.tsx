import { Link } from "react-router-dom";
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
  ctaHeadline = "Ready to book your South Florida rental?",
  ctaSubhead = "Reserve in minutes. Premium fleet. Friendly, hands-on service from pickup to return.",
}: LocationPageLayoutProps) => {
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
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
            {/* Breadcrumb */}
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
                  Book Now
                </Button>
              </Link>
              <Link to="/fleet">
                <Button size="lg" variant="outline">
                  View Fleet
                </Button>
              </Link>
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

        {/* Internal links band */}
        <section className="bg-secondary/40 border-y border-border">
          <div className="container mx-auto px-4 py-10 max-w-4xl">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Explore more
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <li>
                <Link to="/fleet" className="text-primary hover:underline">
                  → Browse our full fleet
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-primary hover:underline"
                >
                  → How booking works
                </Link>
              </li>
              <li>
                <Link
                  to="/car-rental-fort-lauderdale"
                  className="text-primary hover:underline"
                >
                  → Car rental in Fort Lauderdale
                </Link>
              </li>
              <li>
                <Link
                  to="/car-rental-miami"
                  className="text-primary hover:underline"
                >
                  → Car rental in Miami
                </Link>
              </li>
              <li>
                <Link
                  to="/fort-lauderdale-airport-car-rental"
                  className="text-primary hover:underline"
                >
                  → Fort Lauderdale Airport (FLL) rentals
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary hover:underline">
                  → Contact Heldy directly
                </Link>
              </li>
            </ul>
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
              {ctaHeadline}
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              {ctaSubhead}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/book">
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-semibold"
                >
                  Book Now
                </Button>
              </Link>
              <a href="tel:+15615198958">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10"
                >
                  Call (561) 519-8958
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
