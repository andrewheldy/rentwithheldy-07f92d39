import { Link } from "react-router-dom";
import { Star, MapPin, Verified } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@/data/vehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const { t } = useTranslation(["fleet", "common"]);
  return (
    <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={vehicle.images[0]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 start-3">
          <Badge className="bg-gradient-tropical text-white shadow-sm">
            {t("card.pricePerDay", { price: vehicle.dailyRate })}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-foreground">
            {vehicle.make} {vehicle.model} {vehicle.year}
          </h3>
          <div className="flex items-center space-x-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{vehicle.rating}</span>
          </div>
        </div>
        
        <p className="text-muted-foreground mb-3">
          {vehicle.color}
        </p>
        
        <div className="flex items-center space-x-2 mb-3">
          <Verified className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            {vehicle.hostType}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {vehicle.description}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Link to={`/vehicle/${vehicle.id}`} className="w-full">
          <Button
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            {t("card.viewDetails")}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default VehicleCard;