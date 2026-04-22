import { Link } from "react-router-dom";
import { Car } from "lucide-react";
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

          {/*
            Clickable hotspot over the "Book Your Ride" button printed in the
            banner image. Positioned roughly where the button sits in the art.
          */}
          <Link
            to="/book"
            aria-label="Book Your Ride"
            className="absolute left-[31%] top-[68%] w-[22%] h-[12%] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
          />

          {/* Secondary CTA overlay */}
          <div className="absolute inset-0 flex items-end justify-center sm:items-end sm:justify-start">
            <div className="px-4 pb-4 sm:pb-6 sm:pl-[31%]">
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
