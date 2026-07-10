import { Link } from "react-router-dom";
import { Plane, BedDouble, Anchor, Wrench, ArrowRight, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/ui/reveal";
import airportDelivery from "@/assets/categories/airport-delivery.jpg";
import hotelDelivery from "@/assets/categories/hotel-delivery.jpg";
import cruisePortDelivery from "@/assets/categories/cruise-port-delivery.jpg";
import bodyShopDelivery from "@/assets/categories/body-shop-delivery.jpg";

/* Four delivery destinations. Copy comes from the `home` namespace
   (destinations.cards.*); routes, icons and photography stay here as
   structural data. Photography is real (licensed placeholder, same
   SUV/skyline world as the hero); the 3:5 region is sized to swap in future
   Rent With Heldy photography without any layout change. */
interface Destination {
  href: string;
  icon: LucideIcon;
  key: string;
  image: string;
  objectPosition?: string;
}

const DESTINATIONS: Destination[] = [
  { href: "/fort-lauderdale-airport-car-rental", icon: Plane, key: "airport", image: airportDelivery },
  { href: "/hotel-concierge-rentals", icon: BedDouble, key: "hotel", image: hotelDelivery },
  { href: "/cruise-port-delivery", icon: Anchor, key: "cruise", image: cruisePortDelivery },
  { href: "/body-shop-delivery", icon: Wrench, key: "bodyShop", image: bodyShopDelivery },
];

const LOCATIONS = [
  { to: "/car-rental-fort-lauderdale", key: "fortLauderdale" },
  { to: "/car-rental-miami", key: "miami" },
  { to: "/local-car-rentals", key: "local" },
  { to: "/fort-lauderdale-airport-car-rental", key: "fllAirport" },
];

const DeliveryDestinations = () => {
  const { t } = useTranslation("home");
  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto">
        <Reveal className="mb-12 max-w-2xl sm:mb-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {t("destinations.eyebrow")}
          </p>
          <h2 className="mb-4 text-heading font-bold text-ink">
            {t("destinations.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("destinations.description")}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d, i) => {
            const title = t(`destinations.cards.${d.key}.title`);
            const ctaLabel = t(`destinations.cards.${d.key}.ctaLabel`);
            return (
              <Reveal key={d.href} delay={i * 70} className="h-full">
                <Link
                  to={d.href}
                  aria-label={`${ctaLabel} — ${title}`}
                  className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {/* Photographic region — fixed 3:5, identical across every card */}
                  <div className="relative aspect-[3/5] overflow-hidden">
                    <img
                      src={d.image}
                      alt={t(`destinations.cards.${d.key}.alt`)}
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
                      className="absolute end-4 top-4 h-5 w-5 text-white drop-shadow-sm"
                    />
                    <h3 className="absolute inset-x-0 bottom-0 p-5 font-heading text-2xl font-semibold text-white">
                      {title}
                    </h3>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`destinations.cards.${d.key}.description`)}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-primary">
                      {ctaLabel}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 rtl:-scale-x-100" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* Locations — preserve internal links for SEO */}
        <Reveal className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-foreground/70">
            <MapPin className="h-4 w-4 text-primary" /> {t("destinations.serving")}
          </span>
          {LOCATIONS.map((l, i) => (
            <span key={l.to} className="flex items-center gap-3">
              <Link
                to={l.to}
                className="font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                {t(`destinations.locations.${l.key}`)}
              </Link>
              {i < LOCATIONS.length - 1 && <span className="text-border">•</span>}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default DeliveryDestinations;
