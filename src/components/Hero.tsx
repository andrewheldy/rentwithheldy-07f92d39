import { Link } from "react-router-dom";
import { Car, Calendar, Plane, Anchor, BedDouble, Wrench, FileText, Key, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.png";

const VERTICALS = [
  { to: "/fort-lauderdale-airport-car-rental", label: "Airport", icon: Plane },
  { to: "/cruise-port-delivery", label: "Cruise Port", icon: Anchor },
  { to: "/hotel-concierge-rentals", label: "Hotel", icon: BedDouble },
  { to: "/body-shop-delivery", label: "Body Shop / Mechanic", icon: Wrench },
  { to: "/loss-of-use-claims", label: "Loss of Use", icon: FileText },
];

const Hero = () => {
  return (
    <section className="relative bg-background">
      <div className="relative w-full overflow-hidden">
        <img
          src={heroBanner}
          alt="Rent With Heldy — premium car rentals in Miami and Fort Lauderdale"
          className="w-full h-auto block"
          loading="eager"
        />
      </div>

      {/* CTA buttons below the hero image */}
      <div className="container mx-auto px-4 pt-4 pb-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
          <Link to="/book" className="w-full">
            <Button size="lg" className="w-full">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" /> Book Now
            </Button>
          </Link>
          <Link to="/trip-planner" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" /> What Car Fits My Trip?
            </Button>
          </Link>
          <Link to="/fleet" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              <Car className="h-4 w-4 sm:h-5 sm:w-5" /> View Fleet
            </Button>
          </Link>
        </div>


        {/* Vertical service shortcuts */}
        <nav
          aria-label="Specialized services"
          className="mt-6 sm:mt-8"
        >
          <ul className="grid grid-cols-5 gap-2 sm:gap-4 max-w-3xl mx-auto">
            {VERTICALS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex flex-col items-center justify-start gap-2 rounded-card border border-border bg-card p-2 sm:p-4 text-center transition-all duration-200 ease-out-expo hover:border-primary/50 hover:shadow-card-hover hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="h-10 w-10 sm:h-12 sm:w-12 rounded-control bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </span>
                  <span className="text-[11px] sm:text-sm font-medium text-foreground leading-tight">
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Rent to Own CTA for rideshare & delivery drivers */}
          <div className="mt-4 sm:mt-6 flex justify-center">
            <Link to="/rent-to-own" className="w-full max-w-3xl">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 sm:h-14 text-sm sm:text-base"
              >
                <Key className="h-4 w-4 sm:h-5 sm:w-5" />
                Rent to Own — For Rideshare & Delivery Drivers
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </section>
  );
};

export default Hero;
