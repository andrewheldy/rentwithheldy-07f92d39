import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Search } from "lucide-react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BookingSearchFormProps {
  variant?: "hero" | "compact";
  onSearch?: (startDate: string, endDate: string, location: string) => void;
}

const LOCATIONS = [
  "Miami International Airport (MIA)",
  "Fort Lauderdale Airport (FLL)",
  "Downtown Miami",
  "Miami Beach",
  "Brickell",
];

const BookingSearchForm = ({ variant = "hero", onSearch }: BookingSearchFormProps) => {
  const navigate = useNavigate();
  const [pickupDate, setPickupDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [returnDate, setReturnDate] = useState<Date | undefined>(addDays(new Date(), 4));
  const [location, setLocation] = useState<string>(LOCATIONS[0]);

  const handleSearch = () => {
    if (!pickupDate || !returnDate) return;
    
    const startStr = format(pickupDate, "yyyy-MM-dd");
    const endStr = format(returnDate, "yyyy-MM-dd");
    
    if (onSearch) {
      onSearch(startStr, endStr, location);
    } else {
      navigate(`/categories?start=${startStr}&end=${endStr}&location=${encodeURIComponent(location)}`);
    }
  };

  const isCompact = variant === "compact";

  return (
    <div className={cn(
      "bg-card rounded-lg border border-border p-6",
      isCompact ? "shadow-sm" : "shadow-tropical"
    )}>
      <div className={cn(
        "grid gap-4",
        isCompact ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        {/* Pickup Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Pickup Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !pickupDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {pickupDate ? format(pickupDate, "MMM dd, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={pickupDate}
                onSelect={(date) => {
                  setPickupDate(date);
                  if (date && returnDate && date >= returnDate) {
                    setReturnDate(addDays(date, 1));
                  }
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Return Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !returnDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {returnDate ? format(returnDate, "MMM dd, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={returnDate}
                onSelect={setReturnDate}
                disabled={(date) => !pickupDate || date <= pickupDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Pickup Location</label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground invisible">Search</label>
          <Button 
            onClick={handleSearch}
            className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90"
            disabled={!pickupDate || !returnDate}
          >
            <Search className="mr-2 h-4 w-4" />
            Search Vehicles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSearchForm;
