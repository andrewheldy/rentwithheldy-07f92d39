import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

const Terms = () => {
  const { t } = useTranslation(["legal", "common"]);

  return (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title={t("terms.meta.title")}
      description={t("terms.meta.description")}
      path="/terms"
    />
    <Header />
    <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
        {t("terms.title")}
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {t("terms.lastUpdated", {
          date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        })}
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.acceptance.heading")}
          </h2>
          <p>
            {t("terms.acceptance.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.reservations.heading")}
          </h2>
          <p>
            {t("terms.reservations.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.eligibility.heading")}
          </h2>
          <ul className="list-disc ps-6 space-y-2">
            {(t("terms.eligibility.items", { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.vehicleUse.heading")}
          </h2>
          <p>
            {t("terms.vehicleUse.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.cancellations.heading")}
          </h2>
          <p>
            {t("terms.cancellations.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.liability.heading")}
          </h2>
          <p>
            {t("terms.liability.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.website.heading")}
          </h2>
          <p>
            {t("terms.website.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.governingLaw.heading")}
          </h2>
          <p>
            {t("terms.governingLaw.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("terms.contact.heading")}
          </h2>
          <p>
            {t("terms.contact.text")}{" "}
            <a
              href="mailto:rentwithheldy@gmail.com"
              className="text-primary underline"
              dir="ltr"
            >
              rentwithheldy@gmail.com
            </a>{" "}
            {t("terms.contact.or")}{" "}
            <a href={CONTACT_PHONE_HREF} className="text-primary underline" dir="ltr">
              {CONTACT_PHONE_DISPLAY}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default Terms;
