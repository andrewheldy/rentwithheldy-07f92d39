import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Shield, MapPin, Clock, Phone, Mail } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            About Rent with Heldy
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your trusted partner for premium car rentals in South Florida. 
            We're committed to providing exceptional service and quality vehicles 
            for all your transportation needs.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Trusted & Reliable</h3>
              <p className="text-muted-foreground">
                All-Star Host status with consistently high ratings from satisfied customers.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
              <p className="text-muted-foreground">
                Carefully maintained fleet of 17 vehicles ranging from economy to luxury.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-gradient-tropical w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Local Expertise</h3>
              <p className="text-muted-foreground">
                Based in South Florida, we know the area and provide insider tips.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Story Section */}
        <div className="bg-card rounded-lg border border-border p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                Founded with a passion for hospitality and a love for South Florida, 
                Rent with Heldy has been serving travelers and locals alike with premium 
                car rental services. What started as a small operation has grown into 
                a trusted fleet of 17 carefully selected vehicles.
              </p>
              <p className="mb-4">
                Our commitment to excellence has earned us All-Star Host status, 
                reflecting our dedication to providing exceptional customer service 
                and maintaining our vehicles to the highest standards. Whether you're 
                visiting Miami's vibrant beaches or exploring Fort Lauderdale's canals, 
                we have the perfect vehicle for your journey.
              </p>
              <p>
                Every vehicle in our fleet is personally inspected and maintained to 
                ensure your safety and comfort. We believe that your transportation 
                should be as memorable as your destination.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">(561) 519-8958</p>
                    <p className="text-sm text-muted-foreground">Available 7 days a week</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">rentwithheldy@gmail.com</p>
                    <p className="text-sm text-muted-foreground">We'll respond within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">Mon-Sun: 8:00 AM - 8:00 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4">Service Areas</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Miami-Dade County</p>
                    <p className="text-sm text-muted-foreground">
                      Miami Beach, Downtown Miami, Coral Gables, Aventura, and surrounding areas
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Broward County</p>
                    <p className="text-sm text-muted-foreground">
                      Fort Lauderdale, Hollywood, Pompano Beach, Davie, and surrounding areas
                    </p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full mt-6 bg-gradient-tropical text-white">
                Book Your Rental Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;