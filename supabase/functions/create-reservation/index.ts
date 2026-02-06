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
    const {
      category_id,
      start_date,
      end_date,
      pickup_location,
      dropoff_location,
      customer_name,
      customer_email,
      customer_phone,
    } = await req.json();

    // Validate required fields
    if (
      !category_id ||
      !start_date ||
      !end_date ||
      !pickup_location ||
      !dropoff_location ||
      !customer_name ||
      !customer_email ||
      !customer_phone
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify category exists and is active
    const { data: category, error: catError } = await supabase
      .from("vehicle_categories")
      .select("*")
      .eq("id", category_id)
      .eq("active", true)
      .single();

    if (catError || !category) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check availability for this category
    const { data: vehicles, error: vehError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("category_id", category_id)
      .eq("status", "available")
      .eq("location", pickup_location);

    if (vehError) {
      throw vehError;
    }

    if (!vehicles || vehicles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No vehicles available in this category at this location" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleIds = vehicles.map((v) => v.id);

    // Find vehicles not reserved for overlapping dates
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("vehicle_id")
      .in("vehicle_id", vehicleIds)
      .not("status", "eq", "cancelled")
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (resError) {
      throw resError;
    }

    const reservedVehicleIds = new Set(
      (reservations || []).map((r) => r.vehicle_id).filter(Boolean)
    );

    const availableVehicleIds = vehicleIds.filter(
      (id) => !reservedVehicleIds.has(id)
    );

    if (availableVehicleIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No vehicles available for the selected dates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-assign first available vehicle
    const assignedVehicleId = availableVehicleIds[0];

    // Create the reservation
    const { data: reservation, error: insertError } = await supabase
      .from("reservations")
      .insert({
        category_id,
        vehicle_id: assignedVehicleId,
        start_date,
        end_date,
        pickup_location,
        dropoff_location,
        customer_name,
        customer_email,
        customer_phone,
        status: "confirmed",
        payment_status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Calculate price
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    const days = Math.ceil(
      (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    let totalPrice = 0;
    if (category.price_per_week && weeks > 0) {
      totalPrice = weeks * category.price_per_week + remainingDays * category.price_per_day;
    } else {
      totalPrice = days * category.price_per_day;
    }

    return new Response(
      JSON.stringify({
        reservation,
        category,
        total_price: totalPrice,
        rental_days: days,
      }),
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
