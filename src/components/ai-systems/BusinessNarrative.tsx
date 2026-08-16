import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/ui/reveal";
import {
  businessFunctionLevels,
  businessFunctions,
  businessStoryBeats,
  workflowBranches,
  workflowStages,
} from "@/data/ai-systems";
import { SectionIntro } from "./SectionIntro";
import { useActiveIndex } from "./useActiveIndex";
import { usePointerMotion } from "./usePointerMotion";

export function BusinessNarrative() {
  const { t } = useTranslation("aiSystems");
  const activeBeat = useActiveIndex("[data-business-beat]", businessStoryBeats.length);

  return (
    <section id="business" className="ai-section ai-business" aria-labelledby="ai-business-title">
      <div className="ai-shell">
        <Reveal className="ai-reveal">
          <SectionIntro
            label={t("business.kicker")}
            titleId="ai-business-title"
            title={t("business.title")}
            body={t("business.body")}
            className="ai-business-intro"
          />
          <blockquote>{t("business.quote")}</blockquote>
        </Reveal>

        <div className="ai-business-story">
          <div className="ai-business-beats">
            {businessStoryBeats.map((beat, index) => (
              <article key={beat} data-business-beat data-index={index} data-active={index === activeBeat}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{t(`business.story.${beat}.title`)}</h3>
                <p>{t(`business.story.${beat}.body`)}</p>
              </article>
            ))}
          </div>

          <Reveal className="ai-reveal ai-business-inventory ai-story-system" data-stage={activeBeat + 1}>
            <div className="ai-operating-core">
              <span>{t("business.coreLabel")}</span>
              <strong>Rent With Heldy</strong>
            </div>
            <span className="ai-story-connector" aria-hidden="true"><i /></span>
            <ul aria-label={t("business.functionsLabel")}>
              {businessFunctions.map((item, index) => (
                <li key={item} data-story-level={businessFunctionLevels[index]}>
                  {t(`business.functions.${item}`)}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function WorkflowStory() {
  const { t } = useTranslation("aiSystems");
  const [activeStage, setActiveStage] = useState<(typeof workflowStages)[number]>("qualification");
  const activeStageIndex = workflowStages.indexOf(activeStage);
  const { motionActive, markPointerIntent, cancelMotion, commitMotion } = usePointerMotion();

  return (
    <section className="ai-section ai-workflow" aria-labelledby="ai-workflow-title">
      <div className="ai-shell">
        <Reveal className="ai-reveal">
          <SectionIntro
            title={t("workflow.title")}
            titleId="ai-workflow-title"
            body={t("workflow.body")}
            className="ai-workflow-intro"
          />
        </Reveal>

        <Reveal className="ai-reveal ai-workflow-frame" data-motion={motionActive}>
          <p className="ai-workflow-guidance">{t("workflow.guidance")}</p>
          <div className="ai-workflow-stages" role="list" aria-label={t("workflow.flowLabel")}>
            {workflowStages.map((stage, index) => {
              const state = index < activeStageIndex
                ? "prerequisite"
                : index === activeStageIndex
                  ? "active"
                  : "downstream";

              return (
                <div
                  className="ai-workflow-step-wrap"
                  data-state={state}
                  data-connected={index < activeStageIndex}
                  key={stage}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="ai-workflow-step"
                    aria-current={state === "active" ? "step" : undefined}
                    aria-label={`${t(`workflow.stages.${stage}.title`)} — ${t(`workflow.states.${state}`)}`}
                    aria-pressed={state === "active"}
                    onPointerDown={markPointerIntent}
                    onPointerCancel={cancelMotion}
                    onKeyDown={cancelMotion}
                    onClick={() => {
                      commitMotion();
                      setActiveStage(stage);
                    }}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{t(`workflow.stages.${stage}.title`)}</strong>
                  </button>
                  {index < workflowStages.length - 1 ? (
                    <span className="ai-workflow-connector" aria-hidden="true"><i /></span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="ai-workflow-detail" aria-live="polite">
            <div>
              <p>{t("workflow.detailLabel")}</p>
              <h3>{t(`workflow.stages.${activeStage}.title`)}</h3>
            </div>
            <p>{t(`workflow.stages.${activeStage}.detail`)}</p>
          </div>

          <div className="ai-workflow-branches" aria-label={t("workflow.branchesLabel")}>
            {workflowBranches.map((branch) => (
              <span key={branch}>{t(`workflow.branches.${branch}`)}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
