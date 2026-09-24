import { useTranslation } from "react-i18next";
import ServicePageLayout from "@/components/ServicePageLayout";
import { Anchor, Sparkles, Bus, Receipt } from "lucide-react";
import cruisePortDelivery from "@/assets/categories/cruise-port-delivery.jpg";

const VP_ICONS = [Anchor, Bus, Sparkles, Receipt];

const CruisePortDelivery = () => {
  const { t } = useTranslation(["services", "common"]);
  const valueProps = (
    t("cruise.valueProps", { returnObjects: true }) as {
      title: string;
      description: string;
    }[]
  ).map((vp, i) => ({ icon: VP_ICONS[i], ...vp }));

  return (
    <ServicePageLayout
      metaTitle={t("cruise.meta.title")}
      metaDescription={t("cruise.meta.description")}
      path="/cruise-port-delivery"
      crumbLabel={t("cruise.crumbLabel")}
      eyebrow={t("cruise.eyebrow")}
      h1={t("cruise.h1")}
      intro={t("cruise.intro")}
      serviceContext="Cruise Port Delivery"
      verticalPath="cruise-port"
      defaultPassengerType="Cruise Passenger"
      heroImage={cruisePortDelivery}
      heroImageAlt={t("cruise.heroImageAlt")}
      primaryCta={{ label: t("common:actions.bookNow"), href: "/book" }}
      secondaryCta={{ label: t("cruise.secondaryCta"), href: "#quick-quote" }}
      highlights={t("cruise.highlights", { returnObjects: true }) as string[]}
      steps={t("cruise.steps", { returnObjects: true }) as string[]}
      testimonial={
        t("cruise.testimonial", { returnObjects: true }) as {
          quote: string;
          name: string;
          location: string;
        }
      }
      valueProps={valueProps}
      faqs={
        t("cruise.faqs", { returnObjects: true }) as {
          question: string;
          answer: string;
        }[]
      }
    />
  );
};

export default CruisePortDelivery;
