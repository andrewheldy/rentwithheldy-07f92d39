import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { artifacts } from "@/data/ai-systems";
import { SectionIntro } from "./SectionIntro";

export function ArtifactShowcase() {
  const { t } = useTranslation("aiSystems");

  return (
    <section className="ai-section ai-artifacts" aria-labelledby="ai-artifacts-title">
      <div className="ai-shell">
        <Reveal className="ai-reveal">
          <SectionIntro
            label={t("artifacts.kicker")}
            titleId="ai-artifacts-title"
            title={t("artifacts.title")}
            body={t("artifacts.body")}
            className="ai-artifacts-intro"
          />
        </Reveal>

        <div className="ai-artifact-grid">
          {artifacts.map((artifact) => (
            <Reveal
              key={artifact.id}
              as="figure"
              className="ai-reveal ai-artifact"
            >
              <figcaption>
                <span>{t("artifacts.demoLabel")}</span>
                <h3>{t(`artifacts.items.${artifact.id}.title`)}</h3>
                <p>{t(`artifacts.items.${artifact.id}.description`)}</p>
              </figcaption>
              <div className="ai-artifact-flow" aria-label={t(`artifacts.items.${artifact.id}.flowLabel`)}>
                {artifact.flow.map((step, index) => (
                  <div key={step}>
                    <span>{t(`artifacts.items.${artifact.id}.flow.${step}`)}</span>
                    {index < artifact.flow.length - 1 ? <ArrowRight aria-hidden="true" /> : null}
                  </div>
                ))}
              </div>
              <small>{t("artifacts.replaceableNote")}</small>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
