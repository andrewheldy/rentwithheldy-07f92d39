import { Link } from "react-router-dom";
import { Car, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.png";

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

        {/* CTA buttons positioned under the central headline text */}
        <div className="absolute inset-0 pointer-events-none flex">
          <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 sm:left-[42%] sm:translate-x-0 top-[55%] sm:top-[58%] flex flex-col items-center sm:items-start gap-2 sm:gap-3">
            <Link to="/book">
              <Button
                size="lg"
                className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical text-sm sm:text-base px-5 sm:px-8 h-9 sm:h-11"
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" /> Book Now
              </Button>
            </Link>
            <Link to="/fleet">
              <Button
                size="lg"
                variant="outline"
                className="bg-card/90 backdrop-blur border-primary text-primary hover:bg-primary hover:text-primary-foreground text-sm sm:text-base px-5 sm:px-8 h-9 sm:h-11"
              >
                <Car className="h-4 w-4 sm:h-5 sm:w-5" /> View Fleet
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
