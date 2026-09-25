// Editor presets. Every path here is a real route in src/App.tsx — keep them
// in sync if routes change (src/lib/blog/presets.test.ts checks this).

export interface CtaPreset {
  id: string;
  label: string;
  url: string;
}

export const CTA_PRESETS: CtaPreset[] = [
  { id: "browse", label: "Browse Available Cars", url: "/book" },
  { id: "plan", label: "Plan My Trip", url: "/trip-planner" },
  { id: "airport", label: "See Airport Rental Options", url: "/fort-lauderdale-airport-car-rental" },
  { id: "delivered", label: "Have a Car Delivered", url: "/local-car-rentals" },
  { id: "contact", label: "Contact Rent With Heldy", url: "/contact" },
  { id: "guest", label: "Be Our Guest", url: "/book" },
];

export interface InternalLinkSuggestion {
  label: string;
  path: string;
}

/** Quick-pick commercial pages offered in the editor's link dialog. */
export const INTERNAL_LINKS: InternalLinkSuggestion[] = [
  { label: "Browse available cars / Book", path: "/book" },
  { label: "Local car rentals", path: "/local-car-rentals" },
  { label: "Airport trips (FLL)", path: "/fort-lauderdale-airport-car-rental" },
  { label: "Hotel delivery", path: "/hotel-concierge-rentals" },
  { label: "Cruise port rentals", path: "/cruise-port-delivery" },
  { label: "Body shop / replacement rentals", path: "/body-shop-delivery" },
  { label: "Loss of use claims", path: "/loss-of-use-claims" },
  { label: "Passenger vans", path: "/passenger-vans" },
  { label: "Fort Lauderdale car rental", path: "/car-rental-fort-lauderdale" },
  { label: "Miami car rental", path: "/car-rental-miami" },
  { label: "How it works", path: "/how-it-works" },
  { label: "Trip planner", path: "/trip-planner" },
  { label: "FAQ", path: "/faq" },
  { label: "Contact", path: "/contact" },
  { label: "About", path: "/about" },
  { label: "Blog", path: "/blog" },
];

export const DEFAULT_AUTHOR = "Rent With Heldy";
