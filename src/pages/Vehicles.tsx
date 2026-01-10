import { useState } from "react";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import VehicleCard from "@/components/VehicleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVehicles } from "@/hooks/useVehicles";

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const { data: vehicles = [], isLoading } = useVehicles();

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = !searchTerm || 
      `${vehicle.make} ${vehicle.model} ${vehicle.year}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMake = !selectedMake || vehicle.make === selectedMake;
    return matchesSearch && matchesMake;
  });

  const uniqueMakes = Array.from(new Set(vehicles.map(v => v.make))).sort();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Our Premium Fleet
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose from our collection of {vehicles.length} carefully maintained vehicles, 
            perfect for exploring Miami and Fort Lauderdale.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedMake === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMake("")}
                className={selectedMake === "" ? "bg-gradient-tropical text-white" : ""}
              >
                All Makes
              </Button>
              {uniqueMakes.map(make => (
                <Button
                  key={make}
                  variant={selectedMake === make ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMake(make)}
                  className={selectedMake === make ? "bg-gradient-tropical text-white" : ""}
                >
                  {make}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredVehicles.length} of {vehicles.length} vehicles
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gradient-tropical text-white">
                All-Star Hosts
              </Badge>
              <Badge variant="outline">
                Premium Quality
              </Badge>
            </div>
          </div>
        </div>

        {/* Vehicle Grid */}
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
            {filteredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}

        {!isLoading && filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              No vehicles found matching your criteria
            </p>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedMake("");
              }}
              className="bg-gradient-tropical text-white"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Vehicles;
