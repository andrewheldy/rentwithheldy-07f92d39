import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WheelbaseWidget from "@/components/WheelbaseWidget";
import SEO from "@/components/SEO";
import {
  buildBreadcrumbSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";

const Book = () => {
  const { t } = useTranslation(["booking", "common"]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Book a Car | Live Availability | Rent With Heldy"
        description="Check live availability and book your private car rental in Fort Lauderdale, Miami, or near FLL airport. Fast online booking with Rent With Heldy."
        path="/book"
        jsonLd={[
          localBusinessSchema,
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Book", path: "/book" },
          ]),
        ]}
      />
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            {t("book.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("book.subtitle")}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <WheelbaseWidget />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Book;
