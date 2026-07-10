import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FleetGrid from "@/components/FleetGrid";
import FAQAccordion from "@/components/FAQAccordion";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useVehicles } from "@/hooks/useVehicles";
import { GENERAL_FAQS } from "@/data/faqs";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const FLEET_FAQS = GENERAL_FAQS.filter((f) =>
  ["What types of vehicles are available?", "How do I book a car?", "What documents do I need?", "Is there a minimum age requirement?"].includes(
    f.question
  )
);

const Fleet = () => {
  const { t } = useTranslation(["fleet", "common"]);
  const { data: vehicles = [], isLoading } = useVehicles();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Our Fleet | Car & SUV Rentals in Fort Lauderdale and Miami"
        description="Browse our sedans, SUVs, and premium vehicles for rent in Fort Lauderdale, Miami, and South Florida. See live availability and book online."
        path="/fleet"
        jsonLd={[
          localBusinessSchema,
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Fleet", path: "/fleet" },
          ]),
          buildFaqSchema(FLEET_FAQS),
        ]}
      />
      <Header />

      <main>
        {/* Intro */}
        <section className="bg-secondary py-14">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/book">
                <Button className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical">
                  {t("hero.checkAvailability")}
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline">{t("hero.howBookingWorks")}</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Fleet grid */}
        <section className="py-14">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-12">
                {t("common:states.loadingFleet")}
              </p>
            ) : (
              <FleetGrid vehicles={vehicles} />
            )}
          </div>
        </section>

        {/* Internal links to local pages */}
        <section className="py-14 bg-secondary">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl font-bold mb-3">
              {t("areaLinks.title")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("areaLinks.subtitle")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/car-rental-fort-lauderdale">
                <Button variant="outline">{t("areaLinks.fortLauderdale")}</Button>
              </Link>
              <Link to="/car-rental-miami">
                <Button variant="outline">{t("areaLinks.miami")}</Button>
              </Link>
              <Link to="/fort-lauderdale-airport-car-rental">
                <Button variant="outline">{t("areaLinks.fllAirport")}</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-8">
              {t("faqSection.title")}
            </h2>
            <FAQAccordion items={FLEET_FAQS} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Fleet;
