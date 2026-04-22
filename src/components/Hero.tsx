import { Link } from "react-router-dom";
import { Calendar, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.png";

const Hero = () => {
  return (
    <section className="relative bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-10">
        <div className="relative rounded-2xl overflow-hidden shadow-card-hover">
          <img
            src={heroBanner}
            alt="Rent With Heldy — affordable car rentals in Miami and Fort Lauderdale"
            className="w-full h-auto block"
            loading="eager"
          />

          {/* Overlay CTAs positioned over the banner's text area */}
          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="w-full sm:w-1/2 sm:ml-[28%] px-4 pb-6 sm:pb-0 sm:pt-[18%] flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <Link to="/book">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-tropical text-base px-6"
                >
                  <Calendar className="h-5 w-5" /> Book Your Ride
                </Button>
              </Link>
              <Link to="/fleet">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-card/90 backdrop-blur border-primary text-primary hover:bg-primary hover:text-primary-foreground text-base px-6"
                >
                  <Car className="h-5 w-5" /> View Fleet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
