import { Link } from "react-router-dom";
import { Users, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VehicleCategory, AvailableCategory } from "@/hooks/useCategories";

interface CategoryCardProps {
  category: VehicleCategory | AvailableCategory;
  startDate?: string;
  endDate?: string;
  showAvailability?: boolean;
}

const CategoryCard = ({ category, startDate, endDate, showAvailability }: CategoryCardProps) => {
  const availableCount = "available_count" in category ? category.available_count : null;
  
  // Build reservation URL with search params if dates are provided
  const reserveUrl = startDate && endDate 
    ? `/reserve/${category.slug}?start=${startDate}&end=${endDate}`
    : `/reserve/${category.slug}`;

  // Default placeholder image for categories without hero_image
  const heroImage = category.hero_image || 
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&h=300&fit=crop";

  return (
    <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={heroImage}
          alt={`${category.name} or similar`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-gradient-tropical text-primary-foreground shadow-sm">
            From ${category.price_per_day}/day
          </Badge>
        </div>
        {showAvailability && availableCount !== null && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-card/90 text-foreground">
              {availableCount} available
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-2">
          {category.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {category.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{category.passenger_capacity} passengers</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            <span>{category.bag_capacity} bags</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 italic">
          * Actual vehicle assigned at pickup
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Link to={reserveUrl} className="w-full">
          <Button 
            className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Reserve Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CategoryCard;
