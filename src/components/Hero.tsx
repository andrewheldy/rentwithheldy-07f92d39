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
      </div>

      {/* CTA buttons below the hero image */}
      <div className="container mx-auto px-4 pt-4 pb-0">
        <div className="flex flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/book">
            <Button
              size="lg"
              className="bg-gradient-tropical text-primary-foreground hover:opacity-90 shadow-tropical text-sm sm:text-base px-5 sm:px-8 h-10 sm:h-11"
            >
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" /> Book Now
            </Button>
          </Link>
          <Link to="/fleet">
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-sm sm:text-base px-5 sm:px-8 h-10 sm:h-11"
            >
              <Car className="h-4 w-4 sm:h-5 sm:w-5" /> View Fleet
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
