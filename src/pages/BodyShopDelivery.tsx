import { useTranslation } from "react-i18next";
import ServicePageLayout from "@/components/ServicePageLayout";
import BodyShopForm from "@/components/BodyShopForm";
import { Truck, Wrench, Clock, Handshake } from "lucide-react";
import bodyShopDelivery from "@/assets/categories/body-shop-delivery.jpg";

const VP_ICONS = [Truck, Wrench, Clock, Handshake];

const BodyShopDelivery = () => {
  const { t } = useTranslation("services");
  const valueProps = (
    t("bodyShop.valueProps", { returnObjects: true }) as {
      title: string;
      description: string;
    }[]
  ).map((vp, i) => ({ icon: VP_ICONS[i], ...vp }));

  return (
    <ServicePageLayout
      metaTitle={t("bodyShop.meta.title")}
      metaDescription={t("bodyShop.meta.description")}
      path="/body-shop-delivery"
      crumbLabel={t("bodyShop.crumbLabel")}
      eyebrow={t("bodyShop.eyebrow")}
      h1={t("bodyShop.h1")}
      intro={t("bodyShop.intro")}
      serviceContext="Body Shop / Mechanic Delivery"
      verticalPath="body-shop-delivery"
      defaultPassengerType="Body Shop / Repair Customer"
      formSlot={<BodyShopForm />}
      heroImage={bodyShopDelivery}
      heroImageAlt={t("bodyShop.heroImageAlt")}
      primaryCta={{ label: t("bodyShop.primaryCta"), href: "#quick-quote" }}
      secondaryCta={{ label: t("bodyShop.secondaryCta"), href: "#how-it-works" }}
      highlights={t("bodyShop.highlights", { returnObjects: true }) as string[]}
      steps={t("bodyShop.steps", { returnObjects: true }) as string[]}
      disclaimer={t("bodyShop.disclaimer")}
      testimonial={
        t("bodyShop.testimonial", { returnObjects: true }) as {
          quote: string;
          name: string;
          location: string;
        }
      }
      valueProps={valueProps}
      partnerHeading={t("bodyShop.partnerHeading")}
      partnerSubheading={t("bodyShop.partnerSubheading")}
      faqs={
        t("bodyShop.faqs", { returnObjects: true }) as {
          question: string;
          answer: string;
        }[]
      }
    />
  );
};

export default BodyShopDelivery;
