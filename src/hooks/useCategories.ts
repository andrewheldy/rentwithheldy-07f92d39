import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type VehicleCategory = Tables<"vehicle_categories">;

export const useCategories = () => {
  return useQuery({
    queryKey: ["vehicle-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_categories")
        .select("*")
        .eq("active", true)
        .order("price_per_day", { ascending: true });

      if (error) throw error;
      return data as VehicleCategory[];
    },
  });
};

export interface AvailableCategory extends VehicleCategory {
  available_count: number;
}

export const useAvailableCategories = (
  startDate: string | null,
  endDate: string | null,
  location?: string
) => {
  return useQuery({
    queryKey: ["available-categories", startDate, endDate, location],
    queryFn: async () => {
      if (!startDate || !endDate) return [];

      const response = await supabase.functions.invoke("check-availability", {
        body: { start_date: startDate, end_date: endDate, location },
      });

      if (response.error) throw response.error;
      return response.data.categories as AvailableCategory[];
    },
    enabled: !!startDate && !!endDate,
  });
};
