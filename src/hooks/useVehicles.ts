import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { vehicles as staticVehicles } from "@/data/vehicles";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  rating: number;
  trips: number;
  hostType: string;
  dailyRate: number;
  images: string[];
  description: string;
  features: string[];
  vin?: string;
  licensePlate?: string;
  initialMileage?: number;
  dateAdded?: string;
}

interface DatabaseVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  rating: number | null;
  trips: number | null;
  host_type: string | null;
  daily_rate: number;
  description: string;
  features: string[] | null;
  vin: string | null;
  license_plate: string | null;
  initial_mileage: number | null;
  date_added: string | null;
  vehicle_images: { image_url: string; is_primary: boolean }[];
}

const transformDatabaseVehicle = (dbVehicle: DatabaseVehicle): Vehicle => ({
  id: dbVehicle.id,
  make: dbVehicle.make,
  model: dbVehicle.model,
  year: dbVehicle.year,
  color: dbVehicle.color,
  rating: dbVehicle.rating ?? 4.9,
  trips: dbVehicle.trips ?? 0,
  hostType: dbVehicle.host_type ?? "All-Star Host",
  dailyRate: dbVehicle.daily_rate,
  description: dbVehicle.description,
  features: dbVehicle.features ?? [],
  images: dbVehicle.vehicle_images
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    .map((img) => img.image_url),
  vin: dbVehicle.vin ?? undefined,
  licensePlate: dbVehicle.license_plate ?? undefined,
  initialMileage: dbVehicle.initial_mileage ?? undefined,
  dateAdded: dbVehicle.date_added ?? undefined,
});

export const useVehicles = () => {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_images (
            image_url,
            is_primary
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching vehicles:", error);
        // Fallback to static data if database is empty or error
        return staticVehicles;
      }

      // If no vehicles in database, return static data
      if (!data || data.length === 0) {
        return staticVehicles;
      }

      return data.map(transformDatabaseVehicle);
    },
  });
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: async (): Promise<Vehicle | null> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_images (
            image_url,
            is_primary
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching vehicle:", error);
        // Fallback to static data
        return staticVehicles.find((v) => v.id === id) ?? null;
      }

      // If not found in database, check static data
      if (!data) {
        return staticVehicles.find((v) => v.id === id) ?? null;
      }

      return transformDatabaseVehicle(data);
    },
    enabled: !!id,
  });
};
