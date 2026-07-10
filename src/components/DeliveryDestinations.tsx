import { Link } from "react-router-dom";
import { Plane, BedDouble, Anchor, Wrench, ArrowRight, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import airportDelivery from "@/assets/categories/airport-delivery.jpg";
import hotelDelivery from "@/assets/categories/hotel-delivery.jpg";
import cruisePortDelivery from "@/assets/categories/cruise-port-delivery.jpg";
import bodyShopDelivery from "@/assets/categories/body-shop-delivery.jpg";

/* Four delivery destinations. Each card links into its existing vertical page
   (targeted quote form) — no booking logic here. Photography is real (licensed
   placeholder, same SUV/skyline world as the hero); the 3:5 region is sized to
   swap in future Rent With Heldy photography without any layout change. */
interface Destination {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  image: string;
  alt: string;
  /** Only set when a card's crop needs to differ from the shared default. */
  objectPosition?: string;
}

const DESTINATIONS: Destination[] = [
  {
    href: "/fort-lauderdale-airport-car-rental",
    icon: Plane,
    title: "Airport",
    description:
      "Flying into FLL or Miami? We'll help make the handoff simple, so you can skip the rental counter and start your trip.",
    ctaLabel: "Airport delivery",
    image: airportDelivery,
    alt: "An SUV on a South Florida causeway with a plane descending toward the Miami skyline at sunset",
  },
  {
    href: "/hotel-concierge-rentals",
    icon: BedDouble,
    title: "Hotel",
    description:
      "Staying nearby? We can arrange delivery to your hotel, resort, or vacation rental across South Florida.",
    ctaLabel: "Hotel delivery",
    image: hotelDelivery,
    alt: "An SUV parked under a hotel porte-cochère at dusk with the Miami skyline across the water",
  },
  {
    href: "/cruise-port-delivery",
    icon: Anchor,
    title: "Cruise Port",
    description:
      "Heading to PortMiami or Port Everglades? Start or finish your cruise with a rental arranged around your trip.",
    ctaLabel: "Cruise port delivery",
    image: cruisePortDelivery,
    alt: "An SUV on a causeway passing a docked cruise ship near the Miami skyline at sunset",
  },
  {
    href: "/body-shop-delivery",
    icon: Wrench,
    title: "Body Shop",
    description:
      "Car in the shop? We'll help keep you moving with a replacement rental delivered to your repair facility.",
    ctaLabel: "Replacement rentals",
    image: bodyShopDelivery,
    alt: "An SUV parked outside a body shop with palm trees and the skyline visible at dusk",
  },
];

const LOCATIONS = [
  { to: "/car-rental-fort-lauderdale", label: "Fort Lauderdale" },
  { to: "/car-rental-miami", label: "Miami" },
  { to: "/local-car-rentals", label: "Local Rentals" },
  { to: "/fort-lauderdale-airport-car-rental", label: "FLL Airport" },
];

const DeliveryDestinations = () => (
  <section className="py-20 sm:py-28">
    <div className="container mx-auto">
      <Reveal className="mb-12 max-w-2xl sm:mb-14">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
          Delivery, not a counter
        </p>
        <h2 className="mb-4 text-heading font-bold text-ink">
          Where should we deliver your vehicle?
        </h2>
        <p className="text-lg text-muted-foreground">
          Tell us where you'll be — an airport, a hotel, a cruise terminal, or the
          body shop — and we'll bring the keys to you.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DESTINATIONS.map((d, i) => (
          <Reveal key={d.href} delay={i * 70} className="h-full">
            <Link
              to={d.href}
              aria-label={`${d.ctaLabel} — ${d.title}`}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {/* Photographic region — fixed 3:5, identical across every card */}
              <div className="relative aspect-[3/5] overflow-hidden">
                <img
                  src={d.image}
                  alt={d.alt}
                  loading="lazy"
                  decoding="async"
                  width={700}
                  height={1167}
                  style={{ objectPosition: d.objectPosition ?? "center" }}
                  className="absolute inset-0 h-full w-full scale-100 object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                {/* Soft bottom scrim — only enough to carry the title, not a full wash */}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, hsl(var(--ink) / 0.80) 0%, hsl(var(--ink) / 0.32) 32%, transparent 58%)",
                  }}
                />
                <d.icon
                  aria-hidden
                  strokeWidth={1.5}
                  className="absolute right-4 top-4 h-5 w-5 text-white drop-shadow-sm"
                />
                <h3 className="absolute inset-x-0 bottom-0 p-5 font-heading text-2xl font-semibold text-white">
                  {d.title}
                </h3>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {d.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-primary">
                  {d.ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Locations — preserve internal links for SEO */}
      <Reveal className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-foreground/70">
          <MapPin className="h-4 w-4 text-primary" /> Serving
        </span>
        {LOCATIONS.map((l, i) => (
          <span key={l.to} className="flex items-center gap-3">
            <Link
              to={l.to}
              className="font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
            {i < LOCATIONS.length - 1 && <span className="text-border">•</span>}
          </span>
        ))}
      </Reveal>
    </div>
  </section>
);

export default DeliveryDestinations;
