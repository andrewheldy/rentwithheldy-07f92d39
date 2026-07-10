import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import VacationQuiz from "@/components/VacationQuiz";
import {
  buildBreadcrumbSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const TripPlanner = () => {
  const { t } = useTranslation("tripPlanner");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path="/trip-planner"
        jsonLd={[
          localBusinessSchema,
          buildBreadcrumbSchema([
            { name: t("breadcrumb.home"), path: "/" },
            { name: t("breadcrumb.tripPlanner"), path: "/trip-planner" },
          ]),
        ]}
      />
      <Header />
      <main>
        <section className="bg-secondary py-12">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("hero.subtitle")}
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <VacationQuiz />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TripPlanner;
