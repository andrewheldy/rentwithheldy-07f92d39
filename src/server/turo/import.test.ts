import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runTuroImport } from "./import";

// In-memory stand-in for the few PostgREST calls runTuroImport makes.
type Row = Record<string, unknown>;

function fakeSupabase(tables: Record<string, Row[]>) {
  let seq = 0;
  const id = () => `id-${++seq}`;

  function query(table: string) {
    const filters: Array<(row: Row) => boolean> = [];
    let action: "select" | "insert" | "upsert" | "update" | "delete" = "select";
    let payload: Row[] = [];
    let patch: Row = {};
    let onConflict = "";
    let single = false;

    const run = () => {
      const rows = (tables[table] ??= []);
      if (action === "insert") {
        const created = payload.map((r) => ({ id: id(), ...r }));
        rows.push(...created);
        return created;
      }
      if (action === "upsert") {
        const keys = onConflict.split(",");
        return payload.map((r) => {
          const existing = rows.find((row) => keys.every((k) => row[k] === r[k]));
          if (existing) return Object.assign(existing, r);
          const created = { id: id(), ...r };
          rows.push(created);
          return created;
        });
      }
      const matched = rows.filter((row) => filters.every((f) => f(row)));
      if (action === "update") matched.forEach((row) => Object.assign(row, patch));
      if (action === "delete") tables[table] = rows.filter((row) => !matched.includes(row));
      return matched;
    };

    const builder = {
      select: () => builder,
      eq: (column: string, value: unknown) => (filters.push((row) => row[column] === value), builder),
      in: (column: string, values: unknown[]) => (filters.push((row) => values.includes(row[column])), builder),
      insert: (rows: Row | Row[]) => ((action = "insert"), (payload = [rows].flat()), builder),
      upsert: (rows: Row[], options: { onConflict: string }) => ((action = "upsert"), (payload = rows), (onConflict = options.onConflict), builder),
      update: (values: Row) => ((action = "update"), (patch = values), builder),
      delete: () => ((action = "delete"), builder),
      single: () => ((single = true), builder),
      then: (resolve: (value: { data: unknown; error: null }) => void) => {
        const data = run();
        resolve({ data: single ? data[0] : data, error: null });
      },
    };
    return builder;
  }

  return { from: query } as unknown as SupabaseClient;
}

const HEADER =
  "Reservation ID,Guest,Vehicle name,Vehicle id,VIN,Trip start,Trip end,Trip status,Trip price,Delivery,Total earnings";
const exportCsv = (...rows: string[]) => [HEADER, ...rows].join("\n");
const JETTA_VIN = "3VWE57BU1KM119169";

function seed() {
  return {
    vehicle_external_refs: [
      { external_id: "3906429", source: "turo", vehicle: { id: "veh-jetta", year: 2019, make: "Volkswagen", model: "Jetta", color: "White", vin: JETTA_VIN } },
    ],
    rental_bookings: [] as Row[],
    rental_transactions: [] as Row[],
    sync_runs: [] as Row[],
  };
}

describe("runTuroImport", () => {
  const completed = `7001,Jane Renter,Volkswagen Jetta 2019,3906429,${JETTA_VIN},2026-09-19 10:00,2026-09-22 10:00,Completed,$150.00,$40.00,$190.00`;
  const booked = `7002,Sam Renter,Volkswagen Jetta 2019,3906429,${JETTA_VIN},2026-10-01 10:00,2026-10-03 10:00,Booked,$100.00,$0.00,$100.00`;

  it("checks without writing anything", async () => {
    const tables = seed();
    const result = await runTuroImport(fakeSupabase(tables), { csv: exportCsv(completed, booked), fileName: "trips.csv", mode: "check", userId: "admin" });
    expect(result.problems).toEqual([]);
    expect(result.summary).toMatchObject({ trips: 2, newTrips: 2 });
    expect(tables.rental_bookings).toEqual([]);
    expect(tables.sync_runs).toEqual([]);
  });

  it("imports, links earnings to their trip, and is idempotent", async () => {
    const tables = seed();
    const supabase = fakeSupabase(tables);
    const first = await runTuroImport(supabase, { csv: exportCsv(completed, booked), fileName: "trips.csv", mode: "import", userId: "admin" });
    expect(first.problems).toEqual([]);
    expect(tables.rental_bookings).toHaveLength(2);
    expect(tables.rental_transactions).toHaveLength(1);
    const booking = tables.rental_bookings.find((b) => b.external_booking_id === "7001")!;
    expect(tables.rental_transactions[0]).toMatchObject({
      booking_id: booking.id,
      vehicle_id: "veh-jetta",
      amount_cents: 19000,
      rental_revenue_cents: 15000,
      excluded_cents: 4000,
      excluded_breakdown: { delivery: 4000 },
      collected_on: "2026-09-22",
    });
    expect(JSON.stringify(tables)).not.toContain("Renter");
    expect(tables.sync_runs[0]).toMatchObject({ source: "turo", status: "succeeded", rows_upserted: 3 });

    // The booked trip completes; re-uploading updates it and adds its earnings, nothing doubles.
    const nowCompleted = booked.replace("Booked", "Completed");
    const second = await runTuroImport(supabase, { csv: exportCsv(completed, nowCompleted), fileName: "trips-2.csv", mode: "import", userId: "admin" });
    expect(second.summary).toMatchObject({ newTrips: 0, updatedTrips: 1, unchangedTrips: 1, earningsRows: { new: 1, unchanged: 1 } });
    expect(tables.rental_bookings).toHaveLength(2);
    expect(tables.rental_transactions).toHaveLength(2);
    expect(tables.sync_runs).toHaveLength(2);
    // Only the changed trip and its new earnings row were written.
    expect(tables.sync_runs[1]).toMatchObject({ status: "succeeded", rows_upserted: 2 });
    const unchangedTrip = tables.rental_bookings.find((b) => b.external_booking_id === "7001")!;
    const syncedAt = unchangedTrip.synced_at;

    // Same file again: nothing is written.
    const third = await runTuroImport(supabase, { csv: exportCsv(completed, nowCompleted), fileName: "trips-2.csv", mode: "import", userId: "admin" });
    expect(third.summary).toMatchObject({ newTrips: 0, updatedTrips: 0, unchangedTrips: 2 });
    expect(tables.sync_runs[2]).toMatchObject({ rows_upserted: 0 });
    expect(unchangedTrip.synced_at).toBe(syncedAt);
  });

  it("writes nothing when the file has a problem", async () => {
    const tables = seed();
    const unbalanced = completed.replace("$190.00", "$999.00");
    const result = await runTuroImport(fakeSupabase(tables), { csv: exportCsv(unbalanced), fileName: "bad.csv", mode: "import", userId: "admin" });
    expect(result.problems[0].message).toMatch(/don't add up/);
    expect(tables.rental_bookings).toEqual([]);
    expect(tables.sync_runs).toEqual([]);
  });
});
