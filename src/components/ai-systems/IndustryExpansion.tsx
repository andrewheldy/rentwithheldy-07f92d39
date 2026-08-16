import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/ui/reveal";
import { industries } from "@/data/ai-systems";
import { SectionIntro } from "./SectionIntro";

export function IndustryExpansion() {
  const { t } = useTranslation("aiSystems");

  return (
    <section className="ai-section ai-industries" aria-labelledby="ai-industries-title">
      <div className="ai-shell ai-industries-layout">
        <Reveal className="ai-reveal">
          <SectionIntro
            title={t("industries.title")}
            titleId="ai-industries-title"
            body={t("industries.body")}
            className="ai-industries-intro"
          />
          <h3>{t("industries.reveal")}</h3>
          <p className="ai-industries-support">{t("industries.support")}</p>
        </Reveal>

        <Reveal className="ai-reveal ai-industry-map">
          <div className="ai-industry-origin">
            <small>{t("industries.originLabel")}</small>
            <strong>Rent With Heldy</strong>
            <span>{t("industries.carRental")}</span>
          </div>
          <span className="ai-industry-connector" aria-hidden="true"><i /></span>
          <div className="ai-industry-pattern">
            <small>{t("industries.patternLabel")}</small>
            <strong>{t("industries.patternTitle")}</strong>
          </div>
          <span className="ai-industry-branches" aria-hidden="true"><i /></span>
          <div className="ai-industry-list" aria-label={t("industries.listLabel")}>
            {industries.map((industry) => (
              <span key={industry}>{t(`industries.items.${industry}`)}</span>
            ))}
          </div>
          <div className="ai-industry-foundation">
            {(t("industries.foundation", { returnObjects: true }) as string[]).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
