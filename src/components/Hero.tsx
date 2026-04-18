import { Link } from "react-router-dom";
import { MapPin, Star, Car, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-miami-skyline.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[78vh] flex items-center justify-center bg-gradient-hero overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-primary/40" aria-hidden />

      <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto">
          <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide uppercase bg-primary-foreground/15 backdrop-blur px-3 py-1.5 rounded-full mb-6">
            <Star className="h-3.5 w-3.5 fill-current" /> All-Star Host • 34+ Vehicles
          </p>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Private Car Rentals in
            <span className="block text-primary-foreground/90">
              Fort Lauderdale &amp; Miami
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Skip the rental counter. Book a hand-picked vehicle online in
            minutes — flexible pickup, airport-friendly, and trusted across
            South Florida.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link to="/book">
              <Button
                size="lg"
                className="bg-card text-primary hover:bg-card/90 text-base px-8 shadow-tropical"
              >
                Book Now
              </Button>
            </Link>
            <Link to="/fleet">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary text-base px-8"
              >
                View Fleet
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/85">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Miami • Fort Lauderdale
            </span>
            <span className="flex items-center gap-2">
              <Plane className="h-4 w-4" /> FLL airport pickup
            </span>
            <span className="flex items-center gap-2">
              <Car className="h-4 w-4" /> Curated premium fleet
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
