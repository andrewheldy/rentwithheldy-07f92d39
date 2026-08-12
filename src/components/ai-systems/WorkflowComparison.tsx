import { useTranslation } from "react-i18next";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { afterSteps, beforeSteps } from "@/data/ai-systems";
import { SectionIntro } from "./SectionIntro";

export function WorkflowComparison() {
  const { t } = useTranslation("aiSystems");

  return (
    <section className="ai-section ai-comparison" aria-labelledby="ai-comparison-title">
      <div className="ai-shell">
        <Reveal className="ai-reveal">
          <SectionIntro
            title={t("comparison.title")}
            titleId="ai-comparison-title"
            body={t("comparison.body")}
            className="ai-comparison-intro"
          />
        </Reveal>

        <div className="ai-comparison-grid">
          <Reveal className="ai-reveal ai-comparison-column ai-before">
            <h3>{t("comparison.beforeLabel")}</h3>
            <ol>
              {beforeSteps.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{t(`comparison.before.${step}`)}</p>
                  {index < beforeSteps.length - 1 ? <ArrowDown aria-hidden="true" /> : null}
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal className="ai-reveal ai-comparison-column ai-after">
            <h3>{t("comparison.afterLabel")}</h3>
            <ol>
              {afterSteps.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{t(`comparison.after.${step}`)}</p>
                  {index < afterSteps.length - 1 ? <ArrowDown aria-hidden="true" /> : null}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal className="ai-reveal ai-comparison-statement">
          <p>{t("comparison.statement")}</p>
        </Reveal>
      </div>
    </section>
  );
}
