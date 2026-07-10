import { useTranslation } from "react-i18next";
import ServicePageLayout from "@/components/ServicePageLayout";
import AirportQuoteForm from "@/components/AirportQuoteForm";
import { Plane, Navigation, MessageCircle, Clock } from "lucide-react";
import airportDelivery from "@/assets/categories/airport-delivery.jpg";

const VP_ICONS = [Plane, Navigation, MessageCircle, Clock];

const FLLAirport = () => {
  const { t } = useTranslation("services");
  const valueProps = (
    t("airport.valueProps", { returnObjects: true }) as {
      title: string;
      description: string;
    }[]
  ).map((vp, i) => ({ icon: VP_ICONS[i], ...vp }));

  return (
    <ServicePageLayout
      metaTitle={t("airport.meta.title")}
      metaDescription={t("airport.meta.description")}
      path="/fort-lauderdale-airport-car-rental"
      crumbLabel={t("airport.crumbLabel")}
      eyebrow={t("airport.eyebrow")}
      h1={t("airport.h1")}
      intro={t("airport.intro")}
      serviceContext="Airport Delivery"
      verticalPath="airport"
      defaultPassengerType="Airport Traveler"
      formSlot={<AirportQuoteForm />}
      heroImage={airportDelivery}
      heroImageAlt={t("airport.heroImageAlt")}
      primaryCta={{ label: t("airport.primaryCta"), href: "/fleet" }}
      secondaryCta={{ label: t("airport.secondaryCta"), href: "#how-it-works" }}
      highlights={t("airport.highlights", { returnObjects: true }) as string[]}
      steps={t("airport.steps", { returnObjects: true }) as string[]}
      testimonial={
        t("airport.testimonial", { returnObjects: true }) as {
          quote: string;
          name: string;
          location: string;
        }
      }
      valueProps={valueProps}
      body={
        t("airport.body", { returnObjects: true }) as {
          heading: string;
          paragraphs: string[];
          bullets?: string[];
        }[]
      }
      partnerHeading={t("airport.partnerHeading")}
      partnerSubheading={t("airport.partnerSubheading")}
      faqs={
        t("airport.faqs", { returnObjects: true }) as {
          question: string;
          answer: string;
        }[]
      }
    />
  );
};

export default FLLAirport;
