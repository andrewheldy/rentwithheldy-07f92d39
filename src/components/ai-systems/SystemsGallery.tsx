import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { systemCategories } from "@/data/ai-systems";
import { SectionIntro } from "./SectionIntro";
import { usePointerMotion } from "./usePointerMotion";

type SystemCategory = (typeof systemCategories)[number];

export function SystemsGallery() {
  const { t } = useTranslation("aiSystems");
  const [active, setActive] = useState<SystemCategory>("customerExperience");
  const { motionActive, markPointerIntent, cancelMotion, commitMotion } = usePointerMotion();

  return (
    <section className="ai-section ai-gallery" aria-labelledby="ai-gallery-title">
      <div className="ai-shell">
        <Reveal className="ai-reveal">
          <SectionIntro
            label={t("gallery.kicker")}
            titleId="ai-gallery-title"
            title={t("gallery.title")}
            body={t("gallery.body")}
            className="ai-gallery-intro"
          />
        </Reveal>

        <div className="ai-gallery-layout">
          <Reveal className="ai-reveal ai-gallery-index">
            <div role="list" aria-label={t("gallery.indexLabel")}>
              {systemCategories.map((category, index) => (
                <div key={category} role="listitem">
                  <button
                    type="button"
                    data-active={active === category}
                    aria-pressed={active === category}
                    aria-controls="ai-gallery-active-detail"
                    aria-label={`${String(index + 1).padStart(2, "0")} ${t(`gallery.categories.${category}.title`)}`}
                    onPointerDown={markPointerIntent}
                    onPointerCancel={cancelMotion}
                    onKeyDown={cancelMotion}
                    onClick={() => {
                      commitMotion();
                      setActive(category);
                    }}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{t(`gallery.categories.${category}.title`)}</strong>
                    <ChevronDown aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal
            className="ai-reveal ai-gallery-detail"
            id="ai-gallery-active-detail"
            data-motion={motionActive}
            aria-live="polite"
          >
            <div className="ai-gallery-detail-inner" key={active}>
              <p className="ai-detail-label">{t("gallery.systemLabel")}</p>
              <h3>{t(`gallery.categories.${active}.title`)}</h3>
              <p className="ai-gallery-thesis">{t(`gallery.categories.${active}.thesis`)}</p>
              <ul>
                {(t(`gallery.categories.${active}.examples`, { returnObjects: true }) as string[]).map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <CategoryFeature category={active} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CategoryFeature({ category }: { category: SystemCategory }) {
  const { t } = useTranslation("aiSystems");

  if (category === "customerExperience") {
    return (
      <aside className="ai-case-study">
        <p>{t("gallery.caseStudy.label")}</p>
        <h4>{t("gallery.caseStudy.title")}</h4>
        <dl>
          <div><dt>{t("gallery.caseStudy.problemLabel")}</dt><dd>{t("gallery.caseStudy.problem")}</dd></div>
          <div><dt>{t("gallery.caseStudy.systemLabel")}</dt><dd>{t("gallery.caseStudy.system")}</dd></div>
          <div><dt>{t("gallery.caseStudy.resultLabel")}</dt><dd>{t("gallery.caseStudy.result")}</dd></div>
        </dl>
      </aside>
    );
  }

  if (category === "vehicleAcquisition") {
    return (
      <aside className="ai-decision-support" aria-label={t("gallery.acquisition.label")}>
        <div><span>{t("gallery.acquisition.buy")}</span><small>{t("gallery.acquisition.buyNote")}</small></div>
        <div><span>{t("gallery.acquisition.investigate")}</span><small>{t("gallery.acquisition.investigateNote")}</small></div>
        <div><span>{t("gallery.acquisition.pass")}</span><small>{t("gallery.acquisition.passNote")}</small></div>
        <p>{t("gallery.acquisition.disclaimer")}</p>
      </aside>
    );
  }

  if (category === "productDevelopment") {
    return (
      <aside className="ai-driver-dashboard" aria-label={t("gallery.product.dashboardLabel")}>
        {(t("gallery.product.metrics", { returnObjects: true }) as string[]).map((metric) => (
          <span key={metric}>{metric}</span>
        ))}
        <p>{t("gallery.product.demoNote")}</p>
      </aside>
    );
  }

  return (
    <aside className="ai-category-note">
      <span>{t("gallery.patternLabel")}</span>
      <p>{t(`gallery.categories.${category}.note`)}</p>
    </aside>
  );
}
