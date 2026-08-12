import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { heroNodes } from "@/data/ai-systems";

export function AISystemsHero() {
  const { t } = useTranslation("aiSystems");

  return (
    <section className="ai-hero" aria-labelledby="ai-hero-title">
      <div className="ai-shell ai-hero-nav" aria-label={t("hero.privateLabel")}>
        <Link to="/" className="ai-wordmark" aria-label={t("hero.homeLabel")}>
          Rent With Heldy
        </Link>
        <span>{t("hero.privateLabel")}</span>
      </div>

      <div className="ai-shell ai-hero-layout">
        <div className="ai-hero-copy">
          <p className="ai-kicker">{t("hero.kicker")}</p>
          <h1 id="ai-hero-title">{t("hero.title")}</h1>
          <p className="ai-hero-summary">{t("hero.summary")}</p>
          <div className="ai-hero-actions">
            <a href="#business" className="ai-button ai-button-primary">
              {t("hero.explore")}
              <ArrowDown aria-hidden="true" />
            </a>
            <a href="#contact" className="ai-button ai-button-secondary">
              {t("hero.build")}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <p className="ai-hero-proof">{t("hero.proof")}</p>
        </div>

        <figure className="ai-system-map" aria-labelledby="ai-system-map-caption">
          <div className="ai-map-field" aria-hidden="true">
            {heroNodes.map((node, index) => (
              <span key={node} className={`ai-map-node ai-map-node-${index + 1}`}>
                {t(`hero.nodes.${node}`)}
              </span>
            ))}
            <span className="ai-map-core">
              <small>{t("hero.core.small")}</small>
              <strong>{t("hero.core.title")}</strong>
              <em>{t("hero.core.note")}</em>
            </span>
            <i className="ai-map-line ai-map-line-a" />
            <i className="ai-map-line ai-map-line-b" />
            <i className="ai-map-line ai-map-line-c" />
            <i className="ai-map-line ai-map-line-d" />
          </div>
          <figcaption id="ai-system-map-caption">
            <span>{t("hero.mapCaption.one")}</span>
            <span>{t("hero.mapCaption.workflows")}</span>
            <strong>{t("hero.mapCaption.ai")}</strong>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

