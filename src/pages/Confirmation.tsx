import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CheckCircle, Calendar, MapPin, User, Mail, Phone, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

const Confirmation = () => {
  const { reservationId } = useParams<{ reservationId: string }>();

  const { data: reservation, isLoading } = useQuery({
    queryKey: ["reservation", reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          vehicle_categories (
            name,
            hero_image,
            passenger_capacity,
            bag_capacity
          )
        `)
        .eq("id", reservationId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
            <div className="h-16 w-16 bg-muted rounded-full mx-auto" />
            <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Reservation Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find this reservation. Please check your confirmation email.
          </p>
          <Link to="/categories">
            <Button>Browse Categories</Button>
          </Link>
        </main>
      </div>
    );
  }

  const category = reservation.vehicle_categories;
  const heroImage = category?.hero_image || 
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=400&fit=crop";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-tropical rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Reservation Confirmed!
            </h1>
            <p className="text-muted-foreground">
              Confirmation #{reservation.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Reservation Details */}
          <Card>
            <CardContent className="p-6">
              {/* Vehicle Category */}
              <div className="flex gap-4 mb-6">
                <img
                  src={heroImage}
                  alt={category?.name || "Vehicle"}
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <div>
                  <h2 className="font-semibold text-lg text-foreground">
                    {category?.name || "Vehicle Category"}
                  </h2>
                  <p className="text-sm text-muted-foreground italic">
                    or similar vehicle
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your exact vehicle will be assigned at pickup
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Dates & Location */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Rental Period</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(reservation.start_date), "EEEE, MMMM d, yyyy")} – {format(parseISO(reservation.end_date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Pickup Location</p>
                    <p className="text-sm text-muted-foreground">{reservation.pickup_location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Drop-off Location</p>
                    <p className="text-sm text-muted-foreground">{reservation.dropoff_location}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Renter Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.customer_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.customer_phone}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Important Info */}
              <div className="bg-secondary p-4 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">What's Next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• A confirmation email has been sent to {reservation.customer_email}</li>
                  <li>• Please bring a valid driver's license and credit card at pickup</li>
                  <li>• Your specific vehicle will be assigned when you arrive</li>
                  <li>• Contact us at 786-505-9330 for any questions</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
            <Link to="/categories" className="flex-1">
              <Button className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90">
                Book Another Vehicle
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Confirmation;
