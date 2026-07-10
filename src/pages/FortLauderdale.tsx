import { useTranslation } from "react-i18next";
import LocationPageLayout, {
  type LocationSection,
} from "@/components/LocationPageLayout";
import { type FAQItem } from "@/components/FAQAccordion";

const FortLauderdale = () => {
  const { t } = useTranslation(["locations", "common"]);

  return (
    <LocationPageLayout
      metaTitle={t("fortLauderdale.metaTitle")}
      metaDescription={t("fortLauderdale.metaDescription")}
      path="/car-rental-fort-lauderdale"
      crumbLabel={t("fortLauderdale.crumbLabel")}
      h1={t("fortLauderdale.h1")}
      intro={t("fortLauderdale.intro")}
      sections={
        t("fortLauderdale.sections", { returnObjects: true }) as LocationSection[]
      }
      faqs={t("fortLauderdale.faqs", { returnObjects: true }) as FAQItem[]}
    />
  );
};

export default FortLauderdale;
