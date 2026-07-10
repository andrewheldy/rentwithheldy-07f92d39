import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQAccordion, { type FAQItem } from "@/components/FAQAccordion";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const FAQ = () => {
  const { t } = useTranslation(["faq", "common"]);
  const items = t("items", { returnObjects: true }) as FAQItem[];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path="/faq"
        jsonLd={[
          localBusinessSchema,
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          buildFaqSchema(items),
        ]}
      />
      <Header />
      <main>
        <section className="bg-secondary py-14">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("hero.subtitle")}
            </p>
          </div>
        </section>
        <section className="py-14">
          <div className="container mx-auto px-4 max-w-3xl">
            <FAQAccordion items={items} />
            <div className="text-center mt-10">
              <Link to="/book">
                <Button className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical">
                  {t("common:actions.bookNow")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
