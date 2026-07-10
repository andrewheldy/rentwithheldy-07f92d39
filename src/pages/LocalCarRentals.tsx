import { useTranslation } from "react-i18next";
import LocationPageLayout, {
  type LocationSection,
} from "@/components/LocationPageLayout";
import { type FAQItem } from "@/components/FAQAccordion";

const LocalCarRentals = () => {
  const { t } = useTranslation(["locations", "common"]);

  return (
    <LocationPageLayout
      metaTitle={t("local.metaTitle")}
      metaDescription={t("local.metaDescription")}
      path="/local-car-rentals"
      crumbLabel={t("local.crumbLabel")}
      h1={t("local.h1")}
      intro={t("local.intro")}
      sections={t("local.sections", { returnObjects: true }) as LocationSection[]}
      faqs={t("local.faqs", { returnObjects: true }) as FAQItem[]}
    />
  );
};

export default LocalCarRentals;
