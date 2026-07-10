import { Link } from "react-router-dom";
import { Plane, BedDouble, Anchor, Wrench, ArrowRight, MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/* Four delivery destinations. Each card links into its existing vertical page
   (targeted quote form) — no booking logic here. The media slot is a muted,
   brand-palette gradient PLACEHOLDER, structured to swap for a real photo:
   drop an <img> in as the first child of the slot and the scrim/label still work. */
const DESTINATIONS = [
  {
    to: "/fort-lauderdale-airport-car-rental",
    icon: Plane,
    label: "Airport",
    body: "Flying into FLL or Miami? We'll meet you at arrivals — no shuttle, no counter.",
    cta: "Airport delivery",
    tint: "linear-gradient(155deg, hsl(35 80% 66%) 0%, hsl(210 35% 22%) 78%)",
  },
  {
    to: "/hotel-concierge-rentals",
    icon: BedDouble,
    label: "Hotel",
    body: "Delivered to your hotel or condo, on your schedule — whenever you land.",
    cta: "Hotel delivery",
    tint: "linear-gradient(155deg, hsl(15 72% 62%) 0%, hsl(210 35% 20%) 78%)",
  },
  {
    to: "/cruise-port-delivery",
    icon: Anchor,
    label: "Cruise port",
    body: "Sailing from Port Everglades or PortMiami? We handle the drop-off and pickup.",
    cta: "Cruise port delivery",
    tint: "linear-gradient(155deg, hsl(192 68% 55%) 0%, hsl(212 45% 18%) 78%)",
  },
  {
    to: "/body-shop-delivery",
    icon: Wrench,
    label: "Repair shop",
    body: "Car in the shop? We'll drop a dependable replacement right where you are.",
    cta: "Body shop delivery",
    tint: "linear-gradient(155deg, hsl(205 18% 52%) 0%, hsl(210 32% 16%) 78%)",
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
          <Reveal key={d.to} delay={i * 70} className="h-full">
            <Link
              to={d.to}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {/* Media slot — gradient placeholder, photo-ready */}
              <div className="relative aspect-[5/6] overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-0 transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]"
                  style={{ backgroundImage: d.tint }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent"
                />
                <d.icon
                  aria-hidden
                  strokeWidth={1.5}
                  className="absolute right-5 top-5 h-6 w-6 text-white/80"
                />
                <h3 className="absolute inset-x-0 bottom-0 p-5 font-heading text-2xl font-semibold text-white">
                  {d.label}
                </h3>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">{d.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {d.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
