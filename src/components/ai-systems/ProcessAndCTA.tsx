import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/ui/reveal";
import { processSteps } from "@/data/ai-systems";
import { SectionIntro } from "./SectionIntro";

const CONTACT_HREF = "mailto:rentwithheldy@gmail.com?subject=AI%20systems%20inquiry";

export function ProcessAndCTA() {
  const { t } = useTranslation("aiSystems");

  return (
    <>
      <section className="ai-section ai-process" aria-labelledby="ai-process-title">
        <div className="ai-shell">
          <Reveal className="ai-reveal">
            <SectionIntro
              title={t("process.title")}
              titleId="ai-process-title"
              body={t("process.body")}
              className="ai-process-intro"
            />
          </Reveal>
          <ol className="ai-process-list">
            {processSteps.map((step, index) => (
              <Reveal key={step} as="li" className="ai-reveal">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{t(`process.steps.${step}.title`)}</h3>
                <p>{t(`process.steps.${step}.body`)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="contact" className="ai-section ai-contact" aria-labelledby="ai-contact-title">
        <div className="ai-shell">
          <Reveal className="ai-reveal ai-contact-panel">
            <p className="ai-kicker">{t("contact.kicker")}</p>
            <h2 id="ai-contact-title">{t("contact.title")}</h2>
            <p>{t("contact.body")}</p>
            <a className="ai-button ai-button-primary" href={CONTACT_HREF}>
              {t("contact.cta")}
              <ArrowUpRight aria-hidden="true" />
            </a>
            <small>{t("contact.note")}</small>
          </Reveal>
        </div>
      </section>

      <footer className="ai-footer">
        <div className="ai-shell">
          <span>Rent With Heldy</span>
          <a href="/">{t("footer.back")}</a>
        </div>
      </footer>
    </>
  );
}
