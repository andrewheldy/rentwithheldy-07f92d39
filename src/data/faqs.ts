// Centralized FAQ content so the same items power the homepage preview,
// /faq page, and FAQPage JSON-LD schema.

import type { FAQItem } from "@/components/FAQAccordion";

export const GENERAL_FAQS: FAQItem[] = [
  {
    question: "How do I book a car?",
    answer:
      "Click Book Now anywhere on the site to open our live booking widget. Choose your dates, select an available vehicle, and confirm online. You'll receive an instant confirmation by email.",
  },
  {
    question: "Do you offer airport pickup?",
    answer:
      "Yes. We coordinate fast pickup and drop-off near Fort Lauderdale-Hollywood International Airport (FLL). Just share your flight details after booking.",
  },
  {
    question: "What areas do you serve?",
    answer:
      "We serve Fort Lauderdale, Miami, Hollywood, Aventura, and most of South Florida. If your destination isn't listed, contact us — we likely cover it.",
  },
  {
    question: "What types of vehicles are available?",
    answer:
      "Our fleet includes economy cars, sedans, SUVs, family-friendly vehicles, and premium options. Browse the live Fleet page to see what's currently available.",
  },
  {
    question: "What documents do I need?",
    answer:
      "A valid driver's license, a credit card in the renter's name, and proof of insurance or our offered protection plan. International renters welcome with a valid license and passport.",
  },
  {
    question: "Is there a minimum age requirement?",
    answer:
      "Yes. Renters typically need to be 21 or older. Some premium vehicles may require a minimum age of 25. The booking widget will reflect any age restrictions.",
  },
  {
    question: "Can I book for Miami or Fort Lauderdale?",
    answer:
      "Absolutely. Both Miami and Fort Lauderdale are core service areas. Choose your preferred pickup location during booking.",
  },
  {
    question: "What happens if I need to extend my rental?",
    answer:
      "Just message us before your scheduled return. As long as the vehicle is available, we'll extend your trip and update your reservation.",
  },
];
