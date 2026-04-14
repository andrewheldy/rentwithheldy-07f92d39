import { Link } from "react-router-dom";
import { MapPin, Star, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-hero">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&h=800&fit=crop)'
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Premium Car Rentals in 
            <span className="block text-yellow-200">South Florida</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            Discover Miami and Fort Lauderdale with our fleet of quality vehicles. 
            Search dates and book the exact car you want.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <div className="flex items-center space-x-2 text-lg">
              <MapPin className="h-5 w-5 text-yellow-200" />
              <span>Miami • Fort Lauderdale</span>
            </div>
            <div className="flex items-center space-x-2 text-lg">
              <Car className="h-5 w-5 text-yellow-200" />
              <span>34+ Vehicles</span>
            </div>
            <div className="flex items-center space-x-2 text-lg">
              <Star className="h-5 w-5 fill-yellow-200 text-yellow-200" />
              <span>All-Star Host</span>
            </div>
          </div>
          
          <Link to="/book">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-3 shadow-tropical"
            >
              Search Available Vehicles
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;