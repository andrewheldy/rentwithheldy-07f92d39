import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import BookingSearchForm from "@/components/BookingSearchForm";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailableCategories, useCategories } from "@/hooks/useCategories";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const location = searchParams.get("location");

  // If dates are provided, fetch availability; otherwise show all categories
  const { data: availableCategories, isLoading: availLoading, error: availError } = 
    useAvailableCategories(startDate, endDate, location || undefined);
  const { data: allCategories, isLoading: allLoading } = useCategories();

  const hasDateFilter = !!startDate && !!endDate;
  const categories = hasDateFilter ? availableCategories : allCategories;
  const isLoading = hasDateFilter ? availLoading : allLoading;

  const handleSearch = (start: string, end: string, loc: string) => {
    setSearchParams({ start, end, location: loc });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Vehicle Class
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select from our premium vehicle categories. Your specific vehicle 
            will be assigned at pickup based on availability.
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <BookingSearchForm variant="compact" onSearch={handleSearch} />
        </div>

        {/* Date Filter Info */}
        {hasDateFilter && (
          <div className="mb-6 text-center">
            <p className="text-sm text-muted-foreground">
              Showing availability for{" "}
              <span className="font-medium text-foreground">{startDate}</span> to{" "}
              <span className="font-medium text-foreground">{endDate}</span>
              {location && (
                <>
                  {" "}at <span className="font-medium text-foreground">{location}</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Error State */}
        {availError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to check availability. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Category Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories?.map((category) => (
              <CategoryCard 
                key={category.id} 
                category={category}
                startDate={startDate || undefined}
                endDate={endDate || undefined}
                showAvailability={hasDateFilter}
              />
            ))}
          </div>
        )}

        {!isLoading && categories?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              No vehicles available for the selected dates
            </p>
            <p className="text-muted-foreground">
              Try different dates or check back later.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
