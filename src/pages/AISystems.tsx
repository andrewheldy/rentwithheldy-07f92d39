import SEO from "@/components/SEO";
import { AISystemsHero } from "@/components/ai-systems/AISystemsHero";
import { BusinessNarrative } from "@/components/ai-systems/BusinessNarrative";
import { SystemsGallery } from "@/components/ai-systems/SystemsGallery";
import { WorkflowComparison } from "@/components/ai-systems/WorkflowComparison";
import { ArtifactShowcase } from "@/components/ai-systems/ArtifactShowcase";
import { IndustryExpansion } from "@/components/ai-systems/IndustryExpansion";
import { OpportunityFinder } from "@/components/ai-systems/OpportunityFinder";
import { ProcessAndCTA } from "@/components/ai-systems/ProcessAndCTA";
import { useTranslation } from "react-i18next";
import "@/styles/ai-systems.css";

export default function AISystems() {
  const { t } = useTranslation("aiSystems");

  return (
    <div className="ai-systems">
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path="/ai-systems"
        noIndex
      />
      <main>
        <AISystemsHero />
        <BusinessNarrative />
        <SystemsGallery />
        <WorkflowComparison />
        <ArtifactShowcase />
        <IndustryExpansion />
        <OpportunityFinder />
        <ProcessAndCTA />
      </main>
    </div>
  );
}
