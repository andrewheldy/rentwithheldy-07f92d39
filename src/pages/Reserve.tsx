import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, parseISO } from "date-fns";
import { Users, Briefcase, Calendar, MapPin, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleCategory } from "@/hooks/useCategories";

const Reserve = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const startDate = searchParams.get("start") || "";
  const endDate = searchParams.get("end") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Fetch category details
  const { data: category, isLoading } = useQuery({
    queryKey: ["category", categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_categories")
        .select("*")
        .eq("slug", categorySlug)
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;
      return data as VehicleCategory | null;
    },
  });

  // Calculate pricing
  const days = startDate && endDate 
    ? differenceInDays(parseISO(endDate), parseISO(startDate))
    : 0;
  
  const calculateTotal = () => {
    if (!category || days <= 0) return 0;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    if (weeks > 0 && category.price_per_week) {
      return (weeks * category.price_per_week) + (remainingDays * category.price_per_day);
    }
    return days * category.price_per_day;
  };

  const totalPrice = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("create-reservation", {
        body: {
          category_id: category.id,
          start_date: startDate,
          end_date: endDate,
          pickup_location: "Miami International Airport (MIA)",
          dropoff_location: "Miami International Airport (MIA)",
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Reservation Confirmed!",
        description: "Your vehicle will be assigned at pickup.",
      });

      navigate(`/confirmation/${response.data.reservation.id}`);
    } catch (error) {
      console.error("Reservation error:", error);
      toast({
        title: "Reservation Failed",
        description: "Please try again or contact us for assistance.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Category Not Found
          </h1>
          <Button onClick={() => navigate("/categories")}>
            Browse Categories
          </Button>
        </main>
      </div>
    );
  }

  const heroImage = category.hero_image || 
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=400&fit=crop";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Complete Your Reservation
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reservation Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>

                    <Separator className="my-6" />

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90"
                      disabled={isSubmitting || !startDate || !endDate}
                    >
                      {isSubmitting ? "Processing..." : `Complete Reservation - $${totalPrice.toFixed(2)}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="p-0">
                  <img
                    src={heroImage}
                    alt={category.name}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    or similar vehicle
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{category.passenger_capacity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{category.bag_capacity}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {startDate && endDate ? (
                          <>
                            {format(parseISO(startDate), "MMM dd")} - {format(parseISO(endDate), "MMM dd, yyyy")}
                          </>
                        ) : (
                          "Select dates"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Miami International Airport</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        ${category.price_per_day}/day × {days} days
                      </span>
                      <span className="text-foreground">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-primary">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-secondary rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Your exact vehicle will be confirmed at pickup. We guarantee 
                        a vehicle in your selected class or better.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reserve;
