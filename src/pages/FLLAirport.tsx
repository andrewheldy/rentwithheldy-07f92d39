import ServicePageLayout from "@/components/ServicePageLayout";
import AirportQuoteForm from "@/components/AirportQuoteForm";
import { Plane, Navigation, MessageCircle, Clock } from "lucide-react";
import airportDelivery from "@/assets/categories/airport-delivery.jpg";

const FLLAirport = () => (
  <ServicePageLayout
    metaTitle="Airport Car Rental Delivery in Miami & Fort Lauderdale | Rent With Heldy"
    metaDescription="Skip the rental counters at Fort Lauderdale-Hollywood (FLL) and Miami International (MIA). Fast, friendly airport pickup with a premium private fleet."
    path="/fort-lauderdale-airport-car-rental"
    crumbLabel="Airport Delivery"
    eyebrow="Airport delivery"
    h1="Start your South Florida trip without the rental counter"
    intro="Flying into Miami or Fort Lauderdale? We'll help arrange a simple vehicle handoff around your arrival so you can get on the road with less hassle."
    serviceContext="Airport Delivery"
    verticalPath="airport"
    defaultPassengerType="Airport Traveler"
    formSlot={<AirportQuoteForm />}
    heroImage={airportDelivery}
    heroImageAlt="Dark crossover driving toward the Miami skyline as a passenger jet descends"
    primaryCta={{ label: "View available vehicles", href: "/fleet" }}
    secondaryCta={{ label: "How airport delivery works", href: "#how-it-works" }}
    highlights={[
      "Service for MIA and FLL travelers",
      "Clear pickup instructions",
      "Direct communication with a local team",
      "Return guidance provided before the end of the trip",
    ]}
    steps={[
      "Choose your vehicle and travel dates.",
      "Share your flight and arrival details.",
      "Receive clear handoff instructions before landing.",
      "Start your trip and contact us directly if you need help.",
    ]}
    testimonial={{
      quote:
        "Process was easy and convenient. The car was clean and well maintained. The shuttle system was easy, operators were friendly and I would book again.",
      name: "Reinah",
      location: "Verified Turo guest",
    }}
    valueProps={[
      {
        icon: Plane,
        title: "MIA & FLL travelers",
        description:
          "Serving both major South Florida airports with the same fleet and team.",
      },
      {
        icon: Navigation,
        title: "Clear pickup instructions",
        description:
          "You'll know exactly where to go and what to expect before you land.",
      },
      {
        icon: MessageCircle,
        title: "A local team, not a call center",
        description:
          "Direct line to the people who run the fleet, not an overseas hotline.",
      },
      {
        icon: Clock,
        title: "Return guidance up front",
        description:
          "We'll walk you through return timing before your trip even starts.",
      },
    ]}
    body={[
      {
        heading: "Serving both FLL and Miami International (MIA)",
        paragraphs: [
          "Whether you're landing at Fort Lauderdale-Hollywood International (FLL) or Miami International Airport (MIA), we coordinate a smooth meet-and-greet near the terminal so you can skip the rental counter entirely. Same price, same fleet, same direct line to our team — just pick the airport that fits your flight.",
          "For MIA arrivals, we typically meet just off-airport for a quick handoff, then you're straight onto 836, 95, or the Dolphin. For FLL arrivals, pickup is right by the airport with easy access to I-95, 595, and Port Everglades.",
        ],
      },
      {
        heading: "Skip the airport counter line. Get on the road faster.",
        paragraphs: [
          "If you've ever landed at FLL or MIA on a Friday afternoon, you know the routine: grab your bag, hike out to the rental center, queue behind 40 other travelers, listen to upsell pitches you didn't ask for, and finally get a car that may or may not match what you booked. Rent With Heldy is a cleaner option.",
          "We're a private host serving travelers flying into South Florida. You book online with a real vehicle and a real price, message us your flight details, and meet your car at a convenient pickup spot near the airport. No counter, no upsell, no surprise fees at return.",
        ],
      },
      {
        heading: "Built for FLL and MIA travelers",
        paragraphs: [
          "Most of our airport renters fall into a few clear groups, and the fleet is set up to fit each.",
        ],
        bullets: [
          "Business travelers flying in for one to three nights who want a clean sedan and zero friction.",
          "Families landing for a beach week, theme-park run, or cruise — looking for a roomy SUV with luggage space.",
          "Cruise passengers using Port Everglades who need a short rental on either side of their sailing.",
          "Visitors heading down to Miami, Aventura, or Hollywood who'd rather drive themselves than rideshare.",
          "Returning renters who already know us from a previous trip and just want the same car again.",
        ],
      },
      {
        heading: "Where Heldy renters go after landing",
        paragraphs: [
          "Once you're in the car, the rest of South Florida is yours. Most of our airport renters head to Fort Lauderdale Beach, downtown Fort Lauderdale, Hollywood, Aventura, or straight down I-95 into Miami. Some are catching cruises out of Port Everglades. Others are heading north to Boca, Delray, or West Palm.",
          "Whatever the destination, we make sure the car is ready, fueled, and clean. If you're planning a longer trip — for example, FLL to the Keys or up to Orlando — let us know when you book so we can confirm the vehicle and mileage expectations.",
        ],
      },
    ]}
    partnerHeading="Travel agent or corporate travel coordinator?"
    partnerSubheading="Arrange airport delivery for clients or employees flying into South Florida. We coordinate directly with you."
    faqs={[
      {
        question: "Do you pick up directly at FLL or MIA airport?",
        answer:
          "We coordinate pickup at a convenient spot near Fort Lauderdale-Hollywood International Airport or Miami International Airport. After booking, share your flight details and we'll confirm the exact meeting point.",
      },
      {
        question: "What if my flight is delayed?",
        answer:
          "Just text us. We track your flight number once you share it and adjust pickup timing for delays — no extra fees for normal travel changes.",
      },
      {
        question: "Can I drop the car back at the airport for an early flight?",
        answer:
          "Yes. We'll arrange a return time that fits your departure and meet you at the same convenient spot near the airport.",
      },
      {
        question: "Do you offer SUVs at the airport for families and groups?",
        answer:
          "Yes. Our fleet includes SUVs and larger vehicles ideal for families and groups. Filter the live fleet by vehicle type when booking.",
      },
      {
        question: "Is airport delivery more expensive?",
        answer:
          "No. We don't charge airport surcharges. The price you see in the booking widget is the price you pay.",
      },
    ]}
  />
);

export default FLLAirport;
