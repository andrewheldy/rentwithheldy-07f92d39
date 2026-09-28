import type { SupabaseClient } from "@supabase/supabase-js";
import { parseTuroExport } from "../../lib/turo/parse.js";
import {
  planTuroImport,
  type ExistingBooking,
  type ExistingTransaction,
  type TuroVehicleRef,
} from "../../lib/turo/plan.js";
import type { TuroImportResult } from "../../lib/turo/result.js";

// Loads what the plan needs, and (for an import) applies it with the secret
// key. Runs only behind requireAdmin in api/turo-import.ts.

const LOOKUP_CHUNK = 200;
const WRITE_CHUNK = 500;

const chunks = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

type VehicleRow = { id: string; year: number; make: string; model: string; color: string | null; vin: string | null };

async function loadVehicleRefs(supabase: SupabaseClient): Promise<TuroVehicleRef[]> {
  const { data, error } = await supabase
    .from("vehicle_external_refs")
    .select("external_id, vehicle:vehicles(id, year, make, model, color, vin)")
    .eq("source", "turo");
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const vehicle = row.vehicle as unknown as VehicleRow | null;
    if (!vehicle) return [];
    return [
      {
        turoVehicleId: String(row.external_id),
        vehicleId: vehicle.id,
        vin: vehicle.vin,
        name: [vehicle.year, vehicle.make, vehicle.model].join(" ") + (vehicle.color ? ` (${vehicle.color})` : ""),
      },
    ];
  });
}

async function loadExisting(supabase: SupabaseClient, reservationIds: string[]) {
  const bookings: ExistingBooking[] = [];
  const transactions: ExistingTransaction[] = [];
  for (const ids of chunks(reservationIds, LOOKUP_CHUNK)) {
    const { data, error } = await supabase
      .from("rental_bookings")
      .select("id, external_booking_id, status, gross_cents, start_at, end_at, vehicle_id")
      .eq("source", "turo")
      .in("external_booking_id", ids);
    if (error) throw error;
    bookings.push(...((data ?? []) as ExistingBooking[]));
  }
  const txnColumns = "id, external_id, booking_id, amount_cents, rental_revenue_cents, excluded_cents, unclassified_cents, collected_on";
  for (const ids of chunks(bookings.map((b) => b.id), LOOKUP_CHUNK)) {
    const { data, error } = await supabase.from("rental_transactions").select(txnColumns).eq("source", "turo").in("booking_id", ids);
    if (error) throw error;
    transactions.push(...((data ?? []) as ExistingTransaction[]));
  }
  // Earnings rows not attached to a booking, keyed by the reservation ID.
  const known = new Set(transactions.map((t) => t.id));
  for (const ids of chunks(reservationIds, LOOKUP_CHUNK)) {
    const { data, error } = await supabase.from("rental_transactions").select(txnColumns).eq("source", "turo").in("external_id", ids);
    if (error) throw error;
    for (const txn of (data ?? []) as ExistingTransaction[]) if (!known.has(txn.id)) transactions.push(txn);
  }
  return { bookings, transactions };
}

export async function runTuroImport(
  supabase: SupabaseClient,
  input: { csv: string; fileName: string; mode: "check" | "import"; userId: string },
): Promise<TuroImportResult> {
  const parsed = parseTuroExport(input.csv);
  const base = {
    mode: input.mode,
    fileName: input.fileName,
    extraColumns: parsed.extraColumns,
    droppedColumns: parsed.droppedColumns,
  };
  if (parsed.trips.length === 0) return { ...base, problems: parsed.problems, summary: null };

  const refs = await loadVehicleRefs(supabase);
  const existing = await loadExisting(supabase, parsed.trips.map((t) => t.reservationId));
  const plan = planTuroImport(parsed.trips, refs, existing.bookings, existing.transactions);
  const problems = [...parsed.problems, ...plan.problems];
  if (input.mode === "check" || problems.length > 0) return { ...base, problems, summary: plan.summary };

  const { data: run, error: runError } = await supabase
    .from("sync_runs")
    .insert({
      source: "turo",
      status: "running",
      metadata: { file_name: input.fileName, imported_by: input.userId, trips: plan.summary.trips },
    })
    .select("id")
    .single();
  if (runError) throw runError;

  try {
    const bookingIds = new Map<string, string>();
    for (const batch of chunks(plan.bookings, WRITE_CHUNK)) {
      const { data, error } = await supabase
        .from("rental_bookings")
        .upsert(batch.map((b) => ({ ...b, synced_at: new Date().toISOString() })), { onConflict: "source,external_booking_id" })
        .select("id, external_booking_id");
      if (error) throw error;
      for (const row of data ?? []) bookingIds.set(row.external_booking_id, row.id);
    }

    const rows = plan.transactions.map((t) => {
      const bookingId = t.bookingId ?? bookingIds.get(t.reservationId);
      if (!bookingId) throw new Error(`Booking for reservation ${t.reservationId} was not saved.`);
      return { ...t.row, booking_id: bookingId, synced_at: new Date().toISOString() };
    });
    for (const batch of chunks(rows, WRITE_CHUNK)) {
      const { error } = await supabase.from("rental_transactions").upsert(batch, { onConflict: "id" });
      if (error) throw error;
    }
    for (const ids of chunks(plan.deleteTransactionIds, LOOKUP_CHUNK)) {
      const { error } = await supabase.from("rental_transactions").delete().in("id", ids);
      if (error) throw error;
    }

    const written = plan.bookings.length + rows.length + plan.deleteTransactionIds.length;
    await supabase
      .from("sync_runs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        rows_upserted: written,
        metadata: {
          file_name: input.fileName,
          imported_by: input.userId,
          trips: plan.summary.trips,
          new_trips: plan.summary.newTrips,
          updated_trips: plan.summary.updatedTrips,
          earnings_rows: plan.summary.earningsRows,
          totals: plan.summary.totals,
          first_trip_start: plan.summary.firstTripStart,
          last_trip_start: plan.summary.lastTripStart,
        },
      })
      .eq("id", run.id);
    return { ...base, problems: [], summary: plan.summary, runId: run.id };
  } catch (error) {
    await supabase
      .from("sync_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error: (error as Error).message })
      .eq("id", run.id);
    throw error;
  }
}
