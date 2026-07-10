import { useTranslation } from "react-i18next";
import LocationPageLayout, {
  type LocationSection,
} from "@/components/LocationPageLayout";
import { type FAQItem } from "@/components/FAQAccordion";

const Miami = () => {
  const { t } = useTranslation(["locations", "common"]);

  return (
    <LocationPageLayout
      metaTitle={t("miami.metaTitle")}
      metaDescription={t("miami.metaDescription")}
      path="/car-rental-miami"
      crumbLabel={t("miami.crumbLabel")}
      h1={t("miami.h1")}
      intro={t("miami.intro")}
      sections={t("miami.sections", { returnObjects: true }) as LocationSection[]}
      faqs={t("miami.faqs", { returnObjects: true }) as FAQItem[]}
    />
  );
};

export default Miami;
