import { Link } from "react-router-dom";
import { Star, Phone, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
// Temporary licensed placeholder (Miami skyline, self-hosted & optimized).
// Swap for real Rent With Heldy photography (key handoff / fleet curbside) when available.
import heroImage from "@/assets/hero-south-florida.jpg";

const TRUST = [
  "Family-owned",
  "Hablamos Español",
  "Delivered to your door",
  "Open 7 days",
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-subtle">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center py-14 sm:py-20 lg:py-24">
          {/* Copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-sm font-medium text-primary">
              <Star className="h-4 w-4 fill-primary text-primary" />
              All-Star Host on Turo
            </div>

            <h1 className="mt-5 text-display-lg text-ink">
              South Florida car rentals, delivered to you.
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              A family-owned private fleet across Fort Lauderdale, Miami, and
              FLL airport. Skip the rental counter — we bring the car to your
              hotel, terminal, or doorstep.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/book">
                <Button size="lg" className="w-full sm:w-auto">
                  Book Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#quote">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Get a Quote
                </Button>
              </a>
            </div>

            <a
              href="tel:+15615198958"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 text-primary" />
              Call or Text (561) 519-8958
            </a>

            {/* Trust row */}
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-card shadow-elevated ring-1 ring-black/5 aspect-[16/11] lg:aspect-auto lg:h-[540px]">
              <img
                src={heroImage}
                alt="Sunset over the Miami skyline and Biscayne Bay in South Florida"
                className="absolute inset-0 h-full w-full object-cover object-[center_62%] motion-safe:animate-ken-burns"
                fetchPriority="high"
                decoding="async"
                width={1300}
                height={1950}
              />
              {/* Subtle bottom scrim for the location tag legibility */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/35 to-transparent" aria-hidden />
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <MapPin className="h-4 w-4" />
                Serving Fort Lauderdale &amp; Miami
              </div>
            </div>

            {/* Floating trust card */}
            <div className="absolute -bottom-5 right-4 sm:right-6 hidden sm:flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3 shadow-card-hover">
              <div className="flex h-10 w-10 items-center justify-center rounded-control bg-primary/10">
                <Star className="h-5 w-5 fill-primary text-primary" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">All-Star Host</p>
                <p className="text-xs text-muted-foreground">Rated by real Turo guests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
