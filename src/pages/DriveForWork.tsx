import { useEffect } from "react";
import { ArrowDown, Check, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import DriverDemandFunnel from "@/components/acquisition/DriverDemandFunnel";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

const DriveForWork = () => {
  const { t } = useTranslation("acquisition");

  useEffect(() => {
    track("drive_for_work_view");
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <SEO
        title={t("driver.meta.title")}
        description={t("driver.meta.description")}
        path="/drive-for-work"
      />
      <Header />
      <main>
        <section className="border-b border-border">
          <div className="container mx-auto grid min-h-[560px] grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.72fr)]">
            <div className="flex items-center py-16 pe-0 lg:py-24 lg:pe-16">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {t("driver.hero.eyebrow")}
                </p>
                <h1 className="mt-5 text-display-lg font-semibold text-ink">
                  {t("driver.hero.title")}
                </h1>
                <p className="mt-5 text-xl font-heading font-medium leading-snug text-foreground sm:text-2xl">
                  {t("driver.hero.subtitle")}
                </p>
                <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {t("driver.hero.body")}
                </p>
                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Button asChild size="lg" className="min-h-12 px-7">
                    <a href="#questionnaire">
                      {t("driver.hero.cta")} <ArrowDown className="h-4 w-4" />
                    </a>
                  </Button>
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4 text-primary" /> {t("driver.hero.microcopy")}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative flex items-end overflow-hidden bg-ink px-6 py-10 text-ink-foreground sm:px-10 lg:my-10 lg:px-12 lg:py-14">
              <div className="absolute -end-12 -top-20 select-none font-heading text-[12rem] font-semibold leading-none text-white/[0.035]" aria-hidden>
                D
              </div>
              <div className="relative w-full">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {t("driver.hero.panelEyebrow")}
                </p>
                <ol className="mt-8 space-y-0">
                  {["work", "vehicle", "timing", "contact"].map((key, index) => (
                    <li key={key} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-4 border-t border-white/15 py-5 last:border-b">
                      <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                      <span className="font-heading text-lg font-medium text-white">{t(`driver.hero.panel.${key}`)}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-7 text-sm leading-6 text-white/60">{t("driver.hero.panelNote")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="container mx-auto grid gap-4 py-6 sm:grid-cols-3">
            {["honest", "local", "flexible"].map((key) => (
              <div key={key} className="flex items-center gap-3 text-sm font-medium text-foreground">
                <Check className="h-4 w-4 shrink-0 text-primary" /> {t(`driver.trust.${key}`)}
              </div>
            ))}
          </div>
        </section>

        <section id="questionnaire" className="scroll-mt-24 py-16 sm:py-20 lg:py-28">
          <div className="container mx-auto">
            <DriverDemandFunnel />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DriveForWork;
