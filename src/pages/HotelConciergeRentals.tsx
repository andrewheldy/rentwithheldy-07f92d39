import { useTranslation } from "react-i18next";
import ServicePageLayout from "@/components/ServicePageLayout";
import HotelQuoteForm from "@/components/HotelQuoteForm";
import { BellRing, Sparkles, Bus, Receipt } from "lucide-react";
import hotelDelivery from "@/assets/categories/hotel-delivery.jpg";

const VP_ICONS = [BellRing, Sparkles, Bus, Receipt];

const HotelConciergeRentals = () => {
  const { t } = useTranslation("services");
  const valueProps = (
    t("hotel.valueProps", { returnObjects: true }) as {
      title: string;
      description: string;
    }[]
  ).map((vp, i) => ({ icon: VP_ICONS[i], ...vp }));

  return (
    <ServicePageLayout
      metaTitle={t("hotel.meta.title")}
      metaDescription={t("hotel.meta.description")}
      path="/hotel-concierge-rentals"
      crumbLabel={t("hotel.crumbLabel")}
      eyebrow={t("hotel.eyebrow")}
      h1={t("hotel.h1")}
      intro={t("hotel.intro")}
      serviceContext="Hotel Concierge Rental"
      verticalPath="hotel"
      defaultPassengerType="Hotel Guest"
      formSlot={<HotelQuoteForm />}
      heroImage={hotelDelivery}
      heroImageAlt={t("hotel.heroImageAlt")}
      primaryCta={{ label: t("hotel.primaryCta"), href: "/fleet" }}
      secondaryCta={{ label: t("hotel.secondaryCta"), href: "#how-it-works" }}
      highlights={t("hotel.highlights", { returnObjects: true }) as string[]}
      steps={t("hotel.steps", { returnObjects: true }) as string[]}
      testimonial={
        t("hotel.testimonial", { returnObjects: true }) as {
          quote: string;
          name: string;
          location: string;
        }
      }
      valueProps={valueProps}
      partnerHeading={t("hotel.partnerHeading")}
      partnerSubheading={t("hotel.partnerSubheading")}
      faqs={
        t("hotel.faqs", { returnObjects: true }) as {
          question: string;
          answer: string;
        }[]
      }
    />
  );
};

export default HotelConciergeRentals;
