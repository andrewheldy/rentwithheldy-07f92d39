import SEO from "@/components/SEO";
import { AISystemsHero } from "@/components/ai-systems/AISystemsHero";
import { BusinessNarrative, WorkflowStory } from "@/components/ai-systems/BusinessNarrative";
import { SystemsGallery } from "@/components/ai-systems/SystemsGallery";
import { WorkflowComparison } from "@/components/ai-systems/WorkflowComparison";
import { ArtifactShowcase } from "@/components/ai-systems/ArtifactShowcase";
import { IndustryExpansion } from "@/components/ai-systems/IndustryExpansion";
import { OpportunityFinder } from "@/components/ai-systems/OpportunityFinder";
import { ProcessAndCTA } from "@/components/ai-systems/ProcessAndCTA";
import { JourneyNavigation } from "@/components/ai-systems/JourneyNavigation";
import { TransformationBridge } from "@/components/ai-systems/TransformationBridge";
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
        <JourneyNavigation />
        <div id="chapter-business" data-ai-chapter data-index="0" tabIndex={-1}>
          <BusinessNarrative />
        </div>
        <div id="chapter-system" data-ai-chapter data-index="1" tabIndex={-1}>
          <SystemsGallery />
        </div>
        <div id="chapter-workflows" data-ai-chapter data-index="2" tabIndex={-1}>
          <WorkflowStory />
          <WorkflowComparison />
        </div>
        <div id="chapter-transformation" data-ai-chapter data-index="3" tabIndex={-1}>
          <ArtifactShowcase />
          <TransformationBridge />
        </div>
        <div id="chapter-pattern" data-ai-chapter data-index="4" tabIndex={-1}>
          <IndustryExpansion />
        </div>
        <div id="chapter-opportunity" data-ai-chapter data-index="5" tabIndex={-1}>
          <OpportunityFinder />
          <ProcessAndCTA />
        </div>
      </main>
    </div>
  );
}
