import { Link } from "react-router-dom";
import { Car, Star, MapPin, ArrowRight, Phone } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryCard from "@/components/CategoryCard";
import BookingSearchForm from "@/components/BookingSearchForm";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: categories = [], isLoading } = useCategories();
  const featuredCategories = categories.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      {/* Booking Search Widget */}
      <section className="py-8 -mt-16 relative z-10">
        <div className="container mx-auto px-4">
          <BookingSearchForm />
        </div>
      </section>

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
                <h3 className="text-xl font-semibold mb-2">Premium Fleet</h3>
                <p className="text-muted-foreground">
                  Choose from {categories.length} vehicle classes, from economy cars to luxury SUVs.
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

      {/* Featured Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Vehicle Classes
              </h2>
              <p className="text-xl text-muted-foreground">
                Select your category – your vehicle is assigned at pickup
              </p>
            </div>
            <Link to="/categories">
              <Button className="bg-gradient-tropical text-primary-foreground hover:opacity-90">
                View All Classes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCategories.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
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
            <Link to="/categories">
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
