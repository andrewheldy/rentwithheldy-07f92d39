import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Car, Star, MapPin, Phone } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  useEffect(() => {
    if (typeof (window as any).Outdoorsy !== "undefined" && (window as any).Outdoorsy.init) {
      (window as any).Outdoorsy.init();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      {/* Features Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose Rent with Heldy?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the difference with our premium car rental service
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-none shadow-card-hover">
              <CardContent className="pt-8">
                <div className="bg-gradient-tropical w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">All-Star Quality</h3>
                <p className="text-muted-foreground">
                  5-star rated vehicles with exceptional customer service and reliability you can trust.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-card-hover">
              <CardContent className="pt-8">
                <div className="bg-gradient-tropical w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">34+ Vehicles</h3>
                <p className="text-muted-foreground">
                  Choose from sedans, SUVs, luxury cars, and more — see exactly what's available for your dates.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-card-hover">
              <CardContent className="pt-8">
                <div className="bg-gradient-tropical w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Local Expertise</h3>
                <p className="text-muted-foreground">
                  Based in South Florida with insider knowledge of Miami and Fort Lauderdale.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking Widget */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Find Your Perfect Ride
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Search available dates and browse our full fleet of quality vehicles.
              Book online in minutes.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div
              id="outdoorsy-book-now-container"
              data-owner="4913818"
              data-color="000000"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-hero relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1494905998402-395d579af36f?w=1200&h=600&fit=crop)'
          }}
        />
        <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Explore South Florida?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Book your perfect vehicle today and discover the beauty of Miami and Fort Lauderdale 
            with the freedom and comfort you deserve.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/book">
              <Button 
                size="lg" 
                className="bg-card text-primary hover:bg-card/90 text-lg px-8 py-3 shadow-tropical"
              >
                Browse Fleet
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-3"
            >
              <Phone className="h-5 w-5 mr-2" />
              (561) 519-8958
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
