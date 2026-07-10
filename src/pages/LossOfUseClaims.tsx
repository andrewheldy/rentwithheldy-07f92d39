import { useTranslation } from "react-i18next";
import ServicePageLayout from "@/components/ServicePageLayout";
import { useEnglishT } from "@/i18n/useEnglishT";
import { Scale, FileText, Clock, ShieldCheck } from "lucide-react";

const VP_ICONS = [Scale, FileText, Clock, ShieldCheck];

const LossOfUseClaims = () => {
  // Marketing chrome (meta, hero, value props, partner section) localizes
  // normally…
  const { t } = useTranslation("services");
  // …but the substantive legal body and the attorney-facing legal FAQs are read
  // from the single English source of truth and never translated, to preserve
  // their original legal meaning. ServicePageLayout renders them behind a
  // translated notice and pins them to LTR (see `legalContent` + useEnglishT).
  const enT = useEnglishT("services");

  const valueProps = (
    t("lossOfUse.valueProps", { returnObjects: true }) as {
      title: string;
      description: string;
    }[]
  ).map((vp, i) => ({ icon: VP_ICONS[i], ...vp }));

  return (
    <ServicePageLayout
      metaTitle={t("lossOfUse.meta.title")}
      metaDescription={t("lossOfUse.meta.description")}
      path="/loss-of-use-claims"
      crumbLabel={t("lossOfUse.crumbLabel")}
      eyebrow={t("lossOfUse.eyebrow")}
      h1={t("lossOfUse.h1")}
      intro={t("lossOfUse.intro")}
      serviceContext="Loss of Use Claim"
      verticalPath="loss-of-use"
      defaultPassengerType="Loss of Use / Legal Claim"
      valueProps={valueProps}
      partnerHeading={t("lossOfUse.partnerHeading")}
      partnerSubheading={t("lossOfUse.partnerSubheading")}
      legalContent
      body={
        enT("lossOfUse.body", { returnObjects: true }) as {
          heading: string;
          paragraphs: string[];
          bullets?: string[];
        }[]
      }
      faqs={
        enT("lossOfUse.faqs", { returnObjects: true }) as {
          question: string;
          answer: string;
        }[]
      }
    />
  );
};

export default LossOfUseClaims;
