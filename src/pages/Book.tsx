import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  buildBreadcrumbSchema,
  localBusinessSchema,
} from "@/lib/seo-schemas";
import { buildWheelbaseStoreUrl } from "@/lib/wheelbase";

const Book = () => {
  const { t, i18n } = useTranslation(["booking", "home"]);
  const { search } = useLocation();
  const storeUrl = buildWheelbaseStoreUrl(i18n.language, search);

  // Booking lives on our hosted Wheelbase store; carry over locale and dates.
  useEffect(() => {
    window.location.replace(storeUrl);
  }, [storeUrl]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
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

        <div className="flex justify-center">
          <a
            href={storeUrl}
            data-testid="wheelbase-store-link"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[hsl(var(--primary-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("home:bookingWidget.button")}
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Book;
