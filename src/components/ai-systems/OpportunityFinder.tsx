import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, RotateCcw } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import {
  opportunityMap,
  opportunityProblems,
  recommendationIds,
  type RecommendationId,
  type OpportunityProblem,
} from "@/data/ai-systems";
import { SectionIntro } from "./SectionIntro";
import { usePointerMotion } from "./usePointerMotion";

export function OpportunityFinder() {
  const { t } = useTranslation("aiSystems");
  const [selected, setSelected] = useState<OpportunityProblem[]>([]);
  const { motionActive, markPointerIntent, cancelMotion, commitMotion } = usePointerMotion();

  const recommendations = useMemo(() => {
    const ids = new Set(selected.flatMap((problem) => opportunityMap[problem]));
    return recommendationIds.filter((id) => ids.has(id));
  }, [selected]);

  const reasonsByRecommendation = useMemo(
    () => Object.fromEntries(
      recommendationIds.map((recommendation) => [
        recommendation,
        selected.filter((problem) => opportunityMap[problem].includes(recommendation)),
      ]),
    ) as Record<RecommendationId, OpportunityProblem[]>,
    [selected],
  );

  function toggle(problem: OpportunityProblem) {
    commitMotion();
    setSelected((current) =>
      current.includes(problem)
        ? current.filter((item) => item !== problem)
        : [...current, problem],
    );
  }

  return (
    <section className="ai-section ai-opportunity" aria-labelledby="ai-opportunity-title">
      <div className="ai-shell">
        <Reveal className="ai-reveal">
          <SectionIntro
            label={t("opportunity.kicker")}
            titleId="ai-opportunity-title"
            title={t("opportunity.title")}
            body={t("opportunity.body")}
            className="ai-opportunity-intro"
          />
        </Reveal>

        <Reveal className="ai-reveal ai-opportunity-tool" data-motion={motionActive}>
          <div className="ai-opportunity-input">
            <div className="ai-tool-heading">
              <h3>{t("opportunity.prompt")}</h3>
              {selected.length ? (
                <button
                  type="button"
                  className="ai-reset"
                  onPointerDown={markPointerIntent}
                  onPointerCancel={cancelMotion}
                  onKeyDown={cancelMotion}
                  onClick={() => {
                    commitMotion();
                    setSelected([]);
                  }}
                >
                  <RotateCcw aria-hidden="true" />
                  {t("opportunity.clear")}
                </button>
              ) : null}
            </div>
            <div className="ai-problem-options" aria-label={t("opportunity.optionsLabel")}>
              {opportunityProblems.map((problem) => {
                const isSelected = selected.includes(problem);
                return (
                  <button
                    key={problem}
                    type="button"
                    aria-pressed={isSelected}
                    data-selected={isSelected}
                    onPointerDown={markPointerIntent}
                    onPointerCancel={cancelMotion}
                    onKeyDown={cancelMotion}
                    onClick={() => toggle(problem)}
                  >
                    <Check aria-hidden="true" />
                    {t(`opportunity.problems.${problem}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ai-opportunity-output" data-motion={motionActive}>
            <div className="ai-tool-heading">
              <div>
                <p>{t("opportunity.outputLabel")}</p>
                <h3>{t("opportunity.outputTitle")}</h3>
              </div>
              <span>{t("opportunity.selectedCount", { count: selected.length })}</span>
            </div>

            {selected.length ? (
              <figure className="ai-opportunity-architecture" aria-labelledby="ai-opportunity-architecture-caption">
                <div className="ai-architecture-sources" aria-hidden="true">
                  {selected.map((problem) => (
                    <span key={problem} data-motion-node>{t(`opportunity.problems.${problem}`)}</span>
                  ))}
                </div>
                <span className="ai-architecture-connector" aria-hidden="true"><i /></span>
                <strong className="ai-architecture-core" aria-hidden="true">
                  {t("opportunity.architectureCore")}
                </strong>
                <span className="ai-architecture-connector" aria-hidden="true"><i /></span>
                <div className="ai-architecture-systems" aria-hidden="true">
                  {recommendations.map((recommendation) => (
                    <span key={recommendation} data-motion-node>
                      {t(`opportunity.recommendations.${recommendation}.title`)}
                    </span>
                  ))}
                </div>
                <figcaption id="ai-opportunity-architecture-caption">
                  {t("opportunity.architectureDescription")}
                </figcaption>
              </figure>
            ) : null}

            {recommendations.length ? (
              <div className="ai-recommendations" aria-live="polite" aria-atomic="false">
                {recommendations.map((recommendation, index) => (
                  <article key={recommendation}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h4>{t(`opportunity.recommendations.${recommendation}.title`)}</h4>
                      <p>{t(`opportunity.recommendations.${recommendation}.body`)}</p>
                      <div className="ai-recommendation-reasons">
                        <p>{t("opportunity.reasonLabel")}</p>
                        <ul>
                          {reasonsByRecommendation[recommendation].map((problem) => (
                            <li key={problem}>{t(`opportunity.problems.${problem}`)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="ai-opportunity-empty" aria-live="polite">
                <span aria-hidden="true">+</span>
                <p>{t("opportunity.empty")}</p>
              </div>
            )}
            <p className="ai-tool-note">{t("opportunity.note")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
