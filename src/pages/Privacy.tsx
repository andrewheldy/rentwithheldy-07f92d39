import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

const Privacy = () => {
  const { t } = useTranslation(["legal", "common"]);

  return (
  <div className="min-h-screen bg-background flex flex-col">
    <SEO
      title="Privacy Policy | Rent With Heldy"
      description="How Rent With Heldy collects, uses, and protects your personal information when you book a car rental in Fort Lauderdale, Miami, or South Florida."
      path="/privacy"
    />
    <Header />
    <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
        {t("privacy.title")}
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {t("privacy.lastUpdated", {
          date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        })}
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t("privacy.overview.heading")}</h2>
          <p>
            {t("privacy.overview.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("privacy.collect.heading")}
          </h2>
          <ul className="list-disc ps-6 space-y-2">
            <li>
              <strong>{t("privacy.collect.booking.term")}</strong> — {t("privacy.collect.booking.desc")}
            </li>
            <li>
              <strong>{t("privacy.collect.verification.term")}</strong> — {t("privacy.collect.verification.desc")}
            </li>
            <li>
              <strong>{t("privacy.collect.communication.term")}</strong> — {t("privacy.collect.communication.desc")}
            </li>
            <li>
              <strong>{t("privacy.collect.siteUsage.term")}</strong> — {t("privacy.collect.siteUsage.desc")}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("privacy.use.heading")}
          </h2>
          <ul className="list-disc ps-6 space-y-2">
            {(t("privacy.use.items", { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("privacy.sharing.heading")}
          </h2>
          <p>
            {t("privacy.sharing.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("privacy.cookies.heading")}
          </h2>
          <p>
            {t("privacy.cookies.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("privacy.choices.heading")}
          </h2>
          <p>
            {t("privacy.choices.text")}{" "}
            <a
              href="mailto:rentwithheldy@gmail.com"
              className="text-primary underline"
              dir="ltr"
            >
              rentwithheldy@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("privacy.contact.heading")}
          </h2>
          <p>
            Rent With Heldy<br />
            {t("privacy.contact.address")}<br />
            {t("privacy.contact.phoneLabel")}{" "}
            <a href={CONTACT_PHONE_HREF} className="text-primary underline" dir="ltr">
              {CONTACT_PHONE_DISPLAY}
            </a>
            <br />
            {t("privacy.contact.emailLabel")}{" "}
            <a
              href="mailto:rentwithheldy@gmail.com"
              className="text-primary underline"
              dir="ltr"
            >
              rentwithheldy@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default Privacy;
