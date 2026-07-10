import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, CheckCircle2, Phone, Star, type LucideIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import FAQAccordion, { type FAQItem } from "@/components/FAQAccordion";
import QuickQuoteForm from "@/components/QuickQuoteForm";
import PartnerIntakeForm from "@/components/PartnerIntakeForm";
import EnglishLegalNotice from "@/components/legal/EnglishLegalNotice";
import EnglishLegalContent from "@/components/legal/EnglishLegalContent";
import { Button } from "@/components/ui/button";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

export interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface CtaLink {
  label: string;
  href: string;
}

interface Testimonial {
  quote: string;
  name: string;
  location?: string;
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
  /**
   * When true, the long-form `body` and `faqs` are treated as substantive
   * English-only legal content: a translated notice is shown above them and
   * both are pinned to LTR (readable even in RTL locales). The caller is
   * responsible for passing English strings for `body`/`faqs` (see
   * `useEnglishT`). Everything else on the page still localizes normally.
   */
  legalContent?: boolean;
  /** Optional long-form body content rendered above the FAQ section */
  body?: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  /** Custom form to render in the quote slot instead of the default QuickQuoteForm */
  formSlot?: ReactNode;

  /** Destination portrait photo — when set, the hero switches to the
   *  split copy/photo layout and the quote form moves to its own section. */
  heroImage?: string;
  heroImageAlt?: string;
  /** CSS object-position override for the hero image; defaults to "center" */
  heroImagePosition?: string;
  primaryCta?: CtaLink;
  secondaryCta?: CtaLink;
  /** "What guests should expect" bullet list */
  highlights?: string[];
  /** "How it works" numbered steps */
  steps?: string[];
  testimonial?: Testimonial;
  /** Small print shown near the steps (e.g. insurance-reimbursement caveat) */
  disclaimer?: string;
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
  verticalPath,
  defaultPassengerType,
  valueProps,
  coverageAreas = DEFAULT_COVERAGE,
  partnerHeading,
  partnerSubheading,
  faqs,
  legalContent = false,
  body,
  formSlot,
  heroImage,
  heroImageAlt,
  heroImagePosition,
  primaryCta,
  secondaryCta,
  highlights,
  steps,
  testimonial,
  disclaimer,
}: ServicePageLayoutProps) => {
  const { t } = useTranslation(["services", "common"]);
  const jsonLd = [
    localBusinessSchema,
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: crumbLabel, path },
    ]),
    buildFaqSchema(faqs),
  ];

  const quoteForm = formSlot ?? (
    <QuickQuoteForm serviceContext={serviceContext} verticalPath={verticalPath} defaultPassengerType={defaultPassengerType} />
  );

  const renderCta = (cta: CtaLink, variant: "default" | "outline") => {
    const button = (
      <Button size="lg" variant={variant} className="w-full sm:w-auto">
        {cta.label}
      </Button>
    );
    return cta.href.startsWith("#") ? (
      <a href={cta.href} className="w-full sm:w-auto">
        {button}
      </a>
    ) : (
      <Link to={cta.href} className="w-full sm:w-auto">
        {button}
      </Link>
    );
  };

  const bodyMarkup = body?.map((s) => (
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
  ));

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
              aria-label={t("layout.breadcrumbLabel")}
              className="text-xs text-muted-foreground mb-4 flex items-center gap-1"
            >
              <Link to="/" className="hover:text-primary">
                {t("layout.breadcrumbHome")}
              </Link>
              <ChevronRight className="h-3 w-3 rtl:-scale-x-100" />
              <span className="text-foreground">{crumbLabel}</span>
            </nav>

            {heroImage ? (
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
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
                    {primaryCta && renderCta(primaryCta, "default")}
                    {secondaryCta && renderCta(secondaryCta, "outline")}
                  </div>
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{t("layout.talkToPerson")}</span>
                    <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
                  </a>
                </div>

                <div className="mx-auto w-full max-w-sm lg:max-w-none">
                  <div className="relative aspect-[3/5] overflow-hidden rounded-card border border-border shadow-card">
                    <img
                      src={heroImage}
                      alt={heroImageAlt ?? ""}
                      style={{ objectPosition: heroImagePosition ?? "center" }}
                      className="absolute inset-0 h-full w-full object-cover"
                      width={700}
                      height={1167}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            ) : (
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
                        {t("common:actions.bookNow")}
                      </Button>
                    </Link>
                    <a href="#quick-quote" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full">
                        {t("common:actions.requestDirectDelivery")}
                      </Button>
                    </a>
                  </div>
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{t("layout.talkToPerson")}</span>
                    <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
                  </a>
                </div>

                <div id="quick-quote" className="scroll-mt-24">
                  {quoteForm}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quote form — its own section when the hero is photo-led */}
        {heroImage && (
          <section id="quick-quote" className="scroll-mt-24 border-b border-border bg-secondary/20 py-12 md:py-16">
            <div className="container mx-auto max-w-xl px-4">{quoteForm}</div>
          </section>
        )}

        {/* Value props */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {t("layout.valueProps.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("layout.valueProps.subtitle", { context: crumbLabel.toLowerCase() })}
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

        {/* How it works */}
        {steps && steps.length > 0 && (
          <section id="how-it-works" className="scroll-mt-24 bg-secondary/30 border-y border-border">
            <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                {t("layout.howItWorks")}
              </h2>
              <ol className="space-y-5">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="pt-1.5 text-base text-muted-foreground leading-relaxed">
                      {s}
                    </p>
                  </li>
                ))}
              </ol>
              {disclaimer && (
                <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
                  {disclaimer}
                </p>
              )}
            </div>
          </section>
        )}

        {/* What guests should expect */}
        {highlights && highlights.length > 0 && (
          <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              {t("layout.whatToExpect")}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Optional long-form body content. When `legalContent` is set, this is
            substantive English-only legal copy: it gets a translated preface
            and stays LTR even in RTL locales. */}
        {body && body.length > 0 && (
          <section className="bg-secondary/30 border-y border-border">
            <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl space-y-10">
              {legalContent && <EnglishLegalNotice />}
              {legalContent ? (
                <EnglishLegalContent className="space-y-10">
                  {bodyMarkup}
                </EnglishLegalContent>
              ) : (
                bodyMarkup
              )}
            </div>
          </section>
        )}

        {/* Partner intake */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <PartnerIntakeForm
              serviceContext={serviceContext}
              verticalPath={verticalPath}
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
                {t("layout.coverage.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("layout.coverage.subtitle")}
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
          </div>
        </section>

        {/* Testimonial */}
        {testimonial && (
          <section className="container mx-auto px-4 py-12 md:py-16 max-w-2xl">
            <div className="rounded-card border border-border bg-card p-6 md:p-8 shadow-card text-center">
              <div className="mb-3 flex justify-center gap-1" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p
                dir="ltr"
                lang="en"
                className="text-lg italic leading-relaxed text-foreground"
              >
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <p className="mt-4 text-sm font-semibold text-muted-foreground">
                <bdi dir="ltr">{testimonial.name}</bdi>
                {testimonial.location ? <>, {testimonial.location}</> : null}
              </p>
            </div>
          </section>
        )}

        {/* FAQ. The heading is localized UI chrome; when `legalContent` is set
            the answers are English-only legal copy, so the list stays LTR. */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t("layout.faqHeading")}
          </h2>
          {legalContent ? (
            <EnglishLegalContent>
              <FAQAccordion items={faqs} />
            </EnglishLegalContent>
          ) : (
            <FAQAccordion items={faqs} />
          )}
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-tropical">
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
              {t("layout.finalCta.title")}
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              {t("layout.finalCta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/book">
                <Button size="lg" variant="secondary" className="font-semibold">
                  {t("common:actions.bookNow")}
                </Button>
              </Link>
              <a href="#quick-quote">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10"
                >
                  {t("common:actions.requestDelivery")}
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
