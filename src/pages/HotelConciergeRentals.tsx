import ServicePageLayout from "@/components/ServicePageLayout";
import HotelQuoteForm from "@/components/HotelQuoteForm";
import { BellRing, Sparkles, Bus, Receipt } from "lucide-react";

const HotelConciergeRentals = () => (
  <ServicePageLayout
    metaTitle="Hotel Concierge Car Rental Delivery | Rent With Heldy"
    metaDescription="Upscale rental cars delivered to your Miami or Fort Lauderdale hotel. Valet hand-off, transparent pricing, white-glove service for premium travelers."
    path="/hotel-concierge-rentals"
    crumbLabel="Hotel Concierge Rentals"
    eyebrow="Hotel Concierge"
    h1="Premium Rentals, Delivered Right to Your Hotel."
    intro="Stay at the property. Skip the airport detour. We coordinate with your hotel valet for a smooth, white-glove rental hand-off — perfect for guests at Miami Beach, Brickell, Las Olas, and the Fort Lauderdale beachfront."
    serviceContext="Hotel Concierge Rental"
    verticalPath="hotel"
    defaultPassengerType="Hotel Guest"
    customForm={<HotelQuoteForm />}
    valueProps={[
      {
        icon: BellRing,
        title: "Coordinated With Your Concierge",
        description:
          "We work with the front desk and valet so the car is staged and ready when you want it.",
      },
      {
        icon: Sparkles,
        title: "White-Glove Valet Hand-off",
        description:
          "Detailed vehicles, professional greeter, and paperwork wrapped up in minutes.",
      },
      {
        icon: Bus,
        title: "Skip the Airport Shuttles",
        description:
          "Land, get to your hotel, and have the car waiting when you're ready to explore.",
      },
      {
        icon: Receipt,
        title: "Transparent Toll Pricing",
        description:
          "Tolls passed through at cost with no padded daily surcharges. Clean invoicing.",
      },
    ]}
    partnerHeading="Concierge or Hotel GM?"
    partnerSubheading="Offer your guests a premium rental option without the airport hassle. We support recurring partnerships."
    faqs={[
      {
        question: "How does hotel valet drop-off work?",
        answer:
          "After booking, send us your hotel name, room number or guest name, and preferred pickup time. We coordinate directly with the valet to stage the car and complete the handoff at the front entrance.",
      },
      {
        question: "Which hotels do you deliver to?",
        answer:
          "We deliver to most major hotels across Miami Beach, Brickell, Downtown Miami, Aventura, Sunny Isles, Hollywood, Fort Lauderdale Beach, and Las Olas. If your property has a valet, we can work with it.",
      },
      {
        question: "Can I have the car held at valet between uses?",
        answer:
          "Yes. The rental stays with the hotel valet during your stay just like any guest vehicle. Valet fees are paid directly to the hotel.",
      },
      {
        question: "What if my flight is delayed?",
        answer:
          "Just text us. We hold the delivery slot for late arrivals at no extra cost as long as we have advance notice.",
      },
      {
        question: "Do you offer premium or specialty vehicles?",
        answer:
          "Yes. We carry a curated selection of premium SUVs and sedans alongside our standard fleet — ideal for anniversaries, business trips, and special weekends.",
      },
    ]}
  />
);

export default HotelConciergeRentals;
