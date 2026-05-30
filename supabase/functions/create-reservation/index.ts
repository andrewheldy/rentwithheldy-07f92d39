import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,30}$/;

function isValidIsoDate(s: unknown): s is string {
  if (typeof s !== "string" || !ISO_DATE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isStr(s: unknown, min: number, max: number): s is string {
  return typeof s === "string" && s.trim().length >= min && s.length <= max;
}

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function logEvent(params: {
  event_type: string;
  entity_type?: string;
  entity_id?: string | null;
  vertical_path?: string | null;
  severity?: "info" | "warn" | "error";
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await admin.from("event_logs").insert({
      event_type: params.event_type,
      entity_type: params.entity_type ?? "reservation",
      entity_id: params.entity_id ?? null,
      vertical_path: params.vertical_path ?? null,
      severity: params.severity ?? "info",
      message: params.message ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (e) {
    console.error("event_logs insert failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      await logEvent({
        event_type: "reservation.invalid_body",
        severity: "warn",
        message: "Invalid JSON body",
      });
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      category_id,
      start_date,
      end_date,
      pickup_location,
      dropoff_location,
      customer_name,
      customer_email,
      customer_phone,
      vertical_path: rawVertical,
    } = body as Record<string, unknown>;

    const vertical_path =
      typeof rawVertical === "string" && rawVertical.length <= 60
        ? rawVertical
        : "direct";

    const errors: string[] = [];
    if (typeof category_id !== "string" || !UUID_RE.test(category_id)) errors.push("category_id");
    if (!isValidIsoDate(start_date)) errors.push("start_date");
    if (!isValidIsoDate(end_date)) errors.push("end_date");
    if (!isStr(pickup_location, 1, 200)) errors.push("pickup_location");
    if (!isStr(dropoff_location, 1, 200)) errors.push("dropoff_location");
    if (!isStr(customer_name, 1, 100)) errors.push("customer_name");
    if (typeof customer_email !== "string" || !EMAIL_RE.test(customer_email) || customer_email.length > 255) errors.push("customer_email");
    if (typeof customer_phone !== "string" || !PHONE_RE.test(customer_phone)) errors.push("customer_phone");

    if (errors.length > 0) {
      await logEvent({
        event_type: "reservation.validation_failed",
        vertical_path,
        severity: "warn",
        message: `Invalid fields: ${errors.join(", ")}`,
        metadata: { fields: errors },
      });
      return new Response(
        JSON.stringify({ error: `Invalid or missing fields: ${errors.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((end_date as string) < (start_date as string)) {
      await logEvent({
        event_type: "reservation.invalid_date_range",
        vertical_path,
        severity: "warn",
        message: "end_date < start_date",
        metadata: { start_date, end_date },
      });
      return new Response(
        JSON.stringify({ error: "end_date must be greater than or equal to start_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sd = start_date as string;
    const ed = end_date as string;
    const cid = category_id as string;
    const pickup = (pickup_location as string).trim();
    const dropoff = (dropoff_location as string).trim();
    const cname = (customer_name as string).trim();
    const cemail = (customer_email as string).trim();
    const cphone = (customer_phone as string).trim();

    const { data: category, error: catError } = await admin
      .from("vehicle_categories")
      .select("*")
      .eq("id", cid)
      .eq("active", true)
      .single();

    if (catError || !category) {
      await logEvent({
        event_type: "reservation.invalid_category",
        vertical_path,
        severity: "warn",
        message: "Category not found or inactive",
        metadata: { category_id: cid },
      });
      return new Response(
        JSON.stringify({ error: "Invalid or inactive category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: vehicles, error: vehError } = await admin
      .from("vehicles")
      .select("id")
      .eq("category_id", cid)
      .eq("status", "available")
      .eq("location", pickup);

    if (vehError) throw vehError;

    if (!vehicles || vehicles.length === 0) {
      await logEvent({
        event_type: "reservation.no_inventory",
        vertical_path,
        severity: "warn",
        message: "No vehicles in category at location",
        metadata: { category_id: cid, pickup },
      });
      return new Response(
        JSON.stringify({ error: "No vehicles available in this category at this location" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vehicleIds = vehicles.map((v) => v.id);

    const { data: reservations, error: resError } = await admin
      .from("reservations")
      .select("vehicle_id")
      .in("vehicle_id", vehicleIds)
      .neq("status", "cancelled")
      .lte("start_date", ed)
      .gte("end_date", sd);

    if (resError) throw resError;

    const reservedVehicleIds = new Set(
      (reservations || []).map((r) => r.vehicle_id).filter(Boolean)
    );

    const availableVehicleIds = vehicleIds.filter(
      (id) => !reservedVehicleIds.has(id)
    );

    if (availableVehicleIds.length === 0) {
      await logEvent({
        event_type: "reservation.dates_unavailable",
        vertical_path,
        severity: "warn",
        message: "All vehicles in category booked for dates",
        metadata: { category_id: cid, start_date: sd, end_date: ed },
      });
      return new Response(
        JSON.stringify({ error: "No vehicles available for the selected dates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assignedVehicleId = availableVehicleIds[0];

    const { data: reservation, error: insertError } = await admin
      .from("reservations")
      .insert({
        category_id: cid,
        vehicle_id: assignedVehicleId,
        start_date: sd,
        end_date: ed,
        pickup_location: pickup,
        dropoff_location: dropoff,
        customer_name: cname,
        customer_email: cemail,
        customer_phone: cphone,
        status: "confirmed",
        payment_status: "pending",
        vertical_path,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const startDateObj = new Date(sd);
    const endDateObj = new Date(ed);
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

    await logEvent({
      event_type: "reservation.created",
      entity_id: reservation.id,
      vertical_path,
      severity: "info",
      message: `Reservation ${reservation.id} confirmed`,
      metadata: {
        category_id: cid,
        vehicle_id: assignedVehicleId,
        days,
        total_price: totalPrice,
      },
    });

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
    console.error("create-reservation error:", error);
    await logEvent({
      event_type: "reservation.exception",
      severity: "error",
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
