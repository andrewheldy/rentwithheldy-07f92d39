import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Check, Phone, Calendar } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { vehicles } from "@/data/vehicles";

const VehicleDetail = () => {
  const { id } = useParams();
  const vehicle = vehicles.find(v => v.id === id);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Vehicle Not Found</h1>
            <Link to="/vehicles">
              <Button className="bg-gradient-tropical text-white">
                Back to Fleet
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          to="/vehicles" 
          className="inline-flex items-center space-x-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Fleet</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-card-hover">
              <img
                src={vehicle.images[0]}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge className="bg-gradient-tropical text-white">
                  ${vehicle.dailyRate}/day
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{vehicle.rating}</span>
                  <span className="text-muted-foreground">({vehicle.trips} trips)</span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              
              <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                <span>Color: {vehicle.color}</span>
                <div className="flex items-center space-x-1">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">{vehicle.hostType}</span>
                </div>
              </div>
              
              <p className="text-foreground leading-relaxed">
                {vehicle.description}
              </p>
            </div>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Features & Amenities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">Pickup Locations</span>
                </div>
                <p className="text-muted-foreground ml-7">
                  Available for pickup in Miami and Fort Lauderdale areas. 
                  Specific location provided upon booking confirmation.
                </p>
              </CardContent>
            </Card>

            {/* Booking Actions */}
            <div className="space-y-4">
              <Button className="w-full bg-gradient-tropical text-white text-lg py-6 shadow-tropical hover:opacity-90">
                <Calendar className="h-5 w-5 mr-2" />
                Book This Vehicle
              </Button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Us
                </Button>
                <Button variant="outline">
                  Ask Questions
                </Button>
              </div>
            </div>

            {/* Contact Info */}
            <Card className="bg-secondary">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Our friendly team is ready to assist you with your rental needs.
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-medium">(305) 555-RENT</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VehicleDetail;