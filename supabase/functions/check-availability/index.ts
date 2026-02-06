import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { start_date, end_date, location } = await req.json();

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "start_date and end_date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active categories
    const { data: categories, error: catError } = await supabase
      .from("vehicle_categories")
      .select("*")
      .eq("active", true);

    if (catError) {
      throw catError;
    }

    // For each category, count available vehicles
    const availableCategories = [];

    for (const category of categories || []) {
      // Find vehicles in this category that are available
      let vehicleQuery = supabase
        .from("vehicles")
        .select("id")
        .eq("category_id", category.id)
        .eq("status", "available");

      // Filter by location if provided
      if (location) {
        vehicleQuery = vehicleQuery.eq("location", location);
      }

      const { data: vehicles, error: vehError } = await vehicleQuery;

      if (vehError) {
        console.error("Error fetching vehicles:", vehError);
        continue;
      }

      if (!vehicles || vehicles.length === 0) {
        continue;
      }

      // Check which vehicles are NOT already reserved for overlapping dates
      const vehicleIds = vehicles.map((v) => v.id);

      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("vehicle_id")
        .in("vehicle_id", vehicleIds)
        .not("status", "eq", "cancelled")
        .or(
          `and(start_date.lte.${end_date},end_date.gte.${start_date})`
        );

      if (resError) {
        console.error("Error fetching reservations:", resError);
        continue;
      }

      // Get reserved vehicle IDs
      const reservedVehicleIds = new Set(
        (reservations || []).map((r) => r.vehicle_id).filter(Boolean)
      );

      // Count available vehicles (not reserved)
      const availableCount = vehicleIds.filter(
        (id) => !reservedVehicleIds.has(id)
      ).length;

      if (availableCount > 0) {
        availableCategories.push({
          ...category,
          available_count: availableCount,
        });
      }
    }

    return new Response(
      JSON.stringify({ categories: availableCategories }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
