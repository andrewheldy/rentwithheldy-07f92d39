import ServicePageLayout from "@/components/ServicePageLayout";
import BodyShopForm from "@/components/BodyShopForm";
import { Truck, Wrench, Clock, Handshake } from "lucide-react";

const BodyShopDelivery = () => (
  <ServicePageLayout
    metaTitle="Body Shop & Mechanic Rental Car Delivery | Rent With Heldy"
    metaDescription="Dropping off at a body shop or mechanic? We deliver your rental directly to the shop in Fort Lauderdale, Miami, and South Florida. Fast, flexible, no airport detour."
    path="/body-shop-delivery"
    crumbLabel="Body Shop & Mechanic Delivery"
    eyebrow="Body Shop & Mechanic Delivery"
    h1="Dropping Off at the Body Shop or Mechanic? We Meet You There With Your Rental."
    intro="Don't waste a half-day rideshare-ing to the airport for a counter rental. We'll meet you at the body shop or mechanic with a clean, ready-to-drive replacement so you can hand off your car and keep going."
    serviceContext="Body Shop / Mechanic Delivery"
    verticalPath="body-shop-delivery"
    defaultPassengerType="Body Shop / Repair Customer"
    formSlot={<BodyShopForm />}
    valueProps={[
      {
        icon: Truck,
        title: "On-Site Hand-off",
        description:
          "We arrive at the body shop or mechanic with the rental ready to go. Quick license check, sign, drive.",
      },
      {
        icon: Wrench,
        title: "Coordinated With the Shop",
        description:
          "We sync timing with the service writer or mechanic so you're not stuck waiting around.",
      },
      {
        icon: Clock,
        title: "Same-Day Availability",
        description:
          "Most weekday morning requests are met the same day across Broward and Miami-Dade.",
      },
      {
        icon: Handshake,
        title: "Flexible Return",
        description:
          "When repairs are done, return the rental at the same shop — we coordinate the pickup.",
      },
    ]}
    partnerHeading="Run a body shop or mechanic shop? Make us your delivery partner."
    partnerSubheading="We deliver and pick up at your location so your customers never leave without a ride."
    faqs={[
      {
        question: "How does body shop or mechanic delivery actually work?",
        answer:
          "You tell us the shop, day, and approximate drop-off time. We coordinate with the service writer or mechanic and meet you on-site with the rental keys when your car is being handed in.",
      },
      {
        question: "Which shops do you deliver to?",
        answer:
          "Any reputable collision center or mechanic shop across Fort Lauderdale, Hollywood, Dania Beach, Miami, Aventura, and Pompano. We've delivered to most of the major chains and independent shops in the region.",
      },
      {
        question: "Do I need to book in advance?",
        answer:
          "Booking earlier is always better, but we accept same-day requests when our fleet has availability. Text or call the moment you know your shop appointment.",
      },
      {
        question: "Can the shop coordinate the rental for me?",
        answer:
          "Yes. Service writers, mechanics, and managers can request the delivery on behalf of a customer using our partner intake form on this page.",
      },
      {
        question: "What if my car is ready earlier than expected?",
        answer:
          "Just message us. We'll arrange pickup at the shop and close out the rental — no penalty for early returns inside the booked window.",
      },
    ]}
  />
);

export default BodyShopDelivery;
