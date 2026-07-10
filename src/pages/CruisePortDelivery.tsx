import ServicePageLayout from "@/components/ServicePageLayout";
import { Anchor, Sparkles, Bus, Receipt } from "lucide-react";
import cruisePortDelivery from "@/assets/categories/cruise-port-delivery.jpg";

const CruisePortDelivery = () => (
  <ServicePageLayout
    metaTitle="Cruise Port Car Rental Delivery in Miami & Fort Lauderdale | Rent With Heldy"
    metaDescription="Curb-side rental car delivery to Port Everglades and PortMiami. Skip the shuttles, sail in style. White-glove valet hand-off for cruise passengers."
    path="/cruise-port-delivery"
    crumbLabel="Cruise Port Delivery"
    eyebrow="Cruise port delivery"
    h1="An easier connection between your cruise and South Florida"
    intro="Sailing through PortMiami or Port Everglades? We'll help coordinate your rental around your cruise schedule, whether you're exploring before departure or staying after you return."
    serviceContext="Cruise Port Delivery"
    verticalPath="cruise-port"
    defaultPassengerType="Cruise Passenger"
    heroImage={cruisePortDelivery}
    heroImageAlt="Dark crossover approaching PortMiami with a cruise ship and skyline ahead"
    primaryCta={{ label: "View available vehicles", href: "/fleet" }}
    secondaryCta={{ label: "Plan cruise port delivery", href: "#quick-quote" }}
    highlights={[
      "PortMiami",
      "Port Everglades",
      "Pre-cruise and post-cruise rentals",
      "Clear coordination around arrival or departure timing",
    ]}
    steps={[
      "Choose your vehicle and dates.",
      "Share your cruise itinerary.",
      "Confirm the handoff plan before your sailing date.",
      "Continue your trip without making an unnecessary airport detour.",
    ]}
    testimonial={{
      quote:
        "Car quality was cleanest ever, customer service was the best ever. I highly recommend. Please make sure to check out this host.",
      name: "Christopher",
      location: "Verified Turo guest",
    }}
    valueProps={[
      {
        icon: Anchor,
        title: "Curb-side Delivery",
        description:
          "We meet you at the terminal as you disembark. Bags in, keys in hand, on the road in minutes.",
      },
      {
        icon: Bus,
        title: "Skip the Airport Shuttles",
        description:
          "No detour to FLL or MIA. No standing in a counter line in flip-flops.",
      },
      {
        icon: Sparkles,
        title: "White-Glove Valet Hand-off",
        description:
          "Detailed vehicles, friendly greeter, and a smooth handoff that matches the cruise experience.",
      },
      {
        icon: Receipt,
        title: "Transparent Toll Pricing",
        description:
          "We tell you up front how tolls work in South Florida — no $9.99/day surprise fees.",
      },
    ]}
    partnerHeading="Travel Agent or Cruise Concierge?"
    partnerSubheading="Add a premium curb-side rental to your clients' itinerary. We coordinate directly with you."
    faqs={[
      {
        question: "How does curb-side delivery work at the cruise port?",
        answer:
          "After you book, send us your ship name and arrival time. We track your disembarkation and meet you at the designated rideshare/private vehicle pickup area at Port Everglades or PortMiami.",
      },
      {
        question: "Can I drop the rental off at the airport after my cruise?",
        answer:
          "Yes — we offer drop-off coordination at FLL and MIA after your cruise so you can drive straight from the port to your flight home.",
      },
      {
        question: "What about pre-cruise hotel pickup?",
        answer:
          "Many cruisers stay a night in Fort Lauderdale or Miami before sailing. We can deliver to your pre-cruise hotel and pick the car up at the port when you board.",
      },
      {
        question: "Do you handle tolls?",
        answer:
          "Our vehicles come with transponders enabled. We pass through toll charges at cost with a small flat convenience fee — no padded daily surcharges.",
      },
      {
        question: "Which cruise lines and terminals do you serve?",
        answer:
          "All terminals at Port Everglades (Fort Lauderdale) and PortMiami, including Royal Caribbean, Carnival, Celebrity, MSC, Norwegian, Princess, and Virgin Voyages.",
      },
    ]}
  />
);

export default CruisePortDelivery;
