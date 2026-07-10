import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import HowItWorksSteps from "@/components/HowItWorksSteps";
import FAQAccordion, { type FAQItem } from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const HowItWorks = () => {
  const { t } = useTranslation(["howItWorks", "common"]);
  const faqs = t("faqs", { returnObjects: true }) as FAQItem[];
  const jsonLd = [
    localBusinessSchema,
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "How It Works", path: "/how-it-works" },
    ]),
    buildFaqSchema(faqs),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path="/how-it-works"
        jsonLd={jsonLd}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-subtle border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <Link to="/book">
              <Button
                size="lg"
                className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical"
              >
                {t("hero.cta")}
              </Button>
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <HowItWorksSteps />
        </section>

        {/* Detailed walkthrough */}
        <section className="container mx-auto px-4 py-8 md:py-12 max-w-3xl space-y-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t("walkthrough.step1.heading")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <Trans
                t={t}
                i18nKey="walkthrough.step1.body"
                components={{ strong: <strong /> }}
              />
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t("walkthrough.step2.heading")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("walkthrough.step2.body")}
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t("walkthrough.step3.heading")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("walkthrough.step3.body")}
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t("walkthrough.step4.heading")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("walkthrough.step4.body")}
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t("walkthrough.step5.heading")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("walkthrough.step5.body")}
            </p>
          </div>
        </section>

        {/* What you need */}
        <section className="bg-secondary/40 border-y border-border">
          <div className="container mx-auto px-4 py-10 max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {t("pickup.heading")}
            </h2>
            <ul className="list-disc ps-6 space-y-2 text-muted-foreground">
              {(t("pickup.items", { returnObjects: true }) as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t("faqHeading")}
          </h2>
          <FAQAccordion items={faqs} />
        </section>

        {/* CTA */}
        <section className="bg-gradient-tropical">
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
              {t("finalCta.title")}
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              {t("finalCta.subtitle")}
            </p>
            <Link to="/book">
              <Button size="lg" variant="secondary" className="font-semibold">
                {t("common:actions.bookNow")}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
