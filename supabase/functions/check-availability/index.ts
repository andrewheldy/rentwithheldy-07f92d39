import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(s: unknown): s is string {
  if (typeof s !== "string" || !ISO_DATE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isSafeShortString(s: unknown, max = 200): s is string {
  return typeof s === "string" && s.length > 0 && s.length <= max;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { start_date, end_date, location } = body as Record<string, unknown>;

    if (!isValidIsoDate(start_date) || !isValidIsoDate(end_date)) {
      return new Response(
        JSON.stringify({ error: "start_date and end_date must be valid ISO dates (YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (end_date < start_date) {
      return new Response(
        JSON.stringify({ error: "end_date must be greater than or equal to start_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let safeLocation: string | undefined;
    if (location !== undefined && location !== null && location !== "") {
      if (!isSafeShortString(location, 200)) {
        return new Response(
          JSON.stringify({ error: "Invalid location" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      safeLocation = location as string;
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
      if (safeLocation) {
        vehicleQuery = vehicleQuery.eq("location", safeLocation);
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

      // Use chained filters instead of string interpolation in .or() to prevent
      // PostgREST filter injection via user-supplied dates.
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("vehicle_id")
        .in("vehicle_id", vehicleIds)
        .neq("status", "cancelled")
        .lte("start_date", end_date)
        .gte("end_date", start_date);

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
    console.error("check-availability error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
