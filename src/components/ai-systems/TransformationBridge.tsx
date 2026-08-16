import { useTranslation } from "react-i18next";
import { transformationNodes, transformationStages } from "@/data/ai-systems";
import { Reveal } from "@/components/ui/reveal";
import { SectionIntro } from "./SectionIntro";
import { useActiveIndex } from "./useActiveIndex";

export function TransformationBridge() {
  const { t } = useTranslation("aiSystems");
  const activeIndex = useActiveIndex("[data-transformation-beat]", transformationStages.length);

  return (
    <section className="ai-section ai-transformation" aria-labelledby="ai-transformation-title">
      <div className="ai-shell">
        <Reveal className="ai-reveal">
          <SectionIntro
            label={t("transformation.kicker")}
            titleId="ai-transformation-title"
            title={t("transformation.title")}
            body={t("transformation.body")}
            className="ai-transformation-intro"
          />
        </Reveal>

        <div className="ai-transformation-story">
          <div className="ai-transformation-beats">
            {transformationStages.map((stage, index) => (
              <article
                key={stage}
                data-transformation-beat
                data-index={index}
                data-active={index === activeIndex}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{t(`transformation.stages.${stage}.title`)}</h3>
                <p>{t(`transformation.stages.${stage}.body`)}</p>
              </article>
            ))}
          </div>

          <Reveal className="ai-reveal ai-transformation-visual">
            <figure
              className="ai-transformation-map"
              data-stage={activeIndex + 1}
              aria-labelledby="ai-transformation-caption"
            >
              <div className="ai-transformation-spine" aria-hidden="true" />
              {transformationNodes.map((node) => (
                <span
                  key={node.id}
                  className={`ai-transformation-node ai-transformation-node-${node.id}`}
                  data-level={node.level}
                >
                  {t(`transformation.nodes.${node.id}`)}
                </span>
              ))}
              <figcaption id="ai-transformation-caption">{t("transformation.caption")}</figcaption>
            </figure>
          </Reveal>
        </div>

        <Reveal className="ai-reveal ai-transformation-thesis">
          <p>{t("transformation.thesis")}</p>
        </Reveal>
      </div>
    </section>
  );
}
