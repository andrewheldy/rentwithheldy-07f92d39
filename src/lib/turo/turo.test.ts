import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";
import { newYorkToUtc, parseMoney, parseTuroDateTime, parseTuroExport } from "./parse";
import { planTuroImport, type ExistingBooking, type ExistingTransaction, type TuroVehicleRef } from "./plan";
import { turoCoverage } from "./coverage";

const HEADER = [
  "Reservation ID",
  "Guest",
  "Vehicle",
  "Vehicle name",
  "Vehicle id",
  "VIN",
  "Trip start",
  "Trip end",
  "Pickup location",
  "Return location",
  "Trip status",
  "Check-in odometer",
  "Trip price",
  "Boost price",
  "3-day discount",
  "Early bird discount",
  "Delivery",
  "Tolls & tickets",
  "Cleaning",
  "Cancellation fee",
  "Other fees",
  "Total earnings",
];

type Row = Partial<Record<(typeof HEADER)[number], string>>;

const JETTA_VIN = "3VWE57BU1KM119169";

function row(values: Row): string {
  const base: Row = {
    "Reservation ID": "5001",
    Guest: "Jane Renter",
    Vehicle: "Volkswagen Jetta 2019 (FL #STLN58)",
    "Vehicle name": "Volkswagen Jetta 2019",
    "Vehicle id": "3906429",
    VIN: JETTA_VIN.toLowerCase(),
    "Trip start": "2026-09-19 10:00",
    "Trip end": "2026-09-22 10:00",
    "Pickup location": "123 Main St, Fort Lauderdale",
    "Return location": "123 Main St, Fort Lauderdale",
    "Trip status": "Completed",
    "Check-in odometer": "85,120",
    "Trip price": "$150.00",
    "Boost price": "$0.00",
    "3-day discount": "- $15.00",
    "Early bird discount": "$0.00",
    Delivery: "$40.00",
    "Tolls & tickets": "$6.25",
    Cleaning: "$0.00",
    "Cancellation fee": "$0.00",
    "Other fees": "$0.00",
    "Total earnings": "$181.25",
    ...values,
  };
  return HEADER.map((h) => {
    const v = base[h] ?? "";
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(",");
}

const csv = (...rows: Row[]) => [HEADER.join(","), ...rows.map(row)].join("\r\n");

describe("parseCsv", () => {
  it("handles quotes, commas, newlines, CRLF and a BOM", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi""\nthere"\r\n\r\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });

  it("rejects a file cut off inside quotes", () => {
    expect(() => parseCsv('a,b\n"open')).toThrow(/quoted field/);
  });
});

describe("money and dates", () => {
  it("parses Turo money formats to cents", () => {
    expect(parseMoney("$1,039.50")).toBe(103950);
    expect(parseMoney("- $6.06")).toBe(-606);
    expect(parseMoney("-$6.06")).toBe(-606);
    expect(parseMoney("($6.06)")).toBe(-606);
    expect(parseMoney("$5")).toBe(500);
    expect(parseMoney("$5.5")).toBe(550);
    expect(parseMoney("")).toBe(0);
    expect(parseMoney("12.345")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
  });

  it("converts New York wall-clock times to UTC across DST", () => {
    expect(new Date(newYorkToUtc(2026, 7, 1, 10, 0)).toISOString()).toBe("2026-07-01T14:00:00.000Z");
    expect(new Date(newYorkToUtc(2026, 1, 15, 10, 0)).toISOString()).toBe("2026-01-15T15:00:00.000Z");
    // Day after DST starts (Mar 8, 2026) and ends (Nov 1, 2026).
    expect(new Date(newYorkToUtc(2026, 3, 9, 0, 30)).toISOString()).toBe("2026-03-09T04:30:00.000Z");
    expect(new Date(newYorkToUtc(2026, 11, 2, 0, 30)).toISOString()).toBe("2026-11-02T05:30:00.000Z");
  });

  it("reads the date formats Turo exports use", () => {
    const iso = (v: string) => {
      const parsed = parseTuroDateTime(v);
      return parsed && { at: new Date(parsed.utc).toISOString(), day: parsed.day };
    };
    expect(iso("2026-09-19 10:00")).toEqual({ at: "2026-09-19T14:00:00.000Z", day: "2026-09-19" });
    expect(iso("2026-09-19T22:15:00")).toEqual({ at: "2026-09-20T02:15:00.000Z", day: "2026-09-19" });
    expect(iso("9/19/2026 10:00 PM")).toEqual({ at: "2026-09-20T02:00:00.000Z", day: "2026-09-19" });
    expect(iso("09/19/2026, 12:00 AM")).toEqual({ at: "2026-09-19T04:00:00.000Z", day: "2026-09-19" });
    expect(iso("2026-09-19")).toEqual({ at: "2026-09-19T04:00:00.000Z", day: "2026-09-19" });
    expect(iso("2026-02-30 10:00")).toBeNull();
    expect(iso("13/01/2026 10:00")).toBeNull();
    expect(iso("next Tuesday")).toBeNull();
  });
});

describe("parseTuroExport", () => {
  it("splits earnings into rental revenue, excluded and undecided amounts", () => {
    const result = parseTuroExport(csv({}));
    expect(result.problems).toEqual([]);
    expect(result.trips).toHaveLength(1);
    const [trip] = result.trips;
    expect(trip).toMatchObject({
      reservationId: "5001",
      turoVehicleId: "3906429",
      vin: JETTA_VIN,
      vehicleLabel: "Volkswagen Jetta 2019",
      status: "completed",
      startAt: "2026-09-19T14:00:00.000Z",
      endAt: "2026-09-22T14:00:00.000Z",
      startDay: "2026-09-19",
      endDay: "2026-09-22",
      rentalDays: 3,
      totalCents: 18125,
      includedCents: 13500,
      excludedCents: 4625,
      excludedBreakdown: { Delivery: 4000, "Tolls & tickets": 625 },
      unclassifiedCents: 0,
    });
  });

  it("never keeps the renter's name or addresses", () => {
    const result = parseTuroExport(csv({}));
    expect(result.droppedColumns).toEqual(["Guest", "Pickup location", "Return location"]);
    const stored = JSON.stringify(result.trips[0].raw);
    expect(stored).not.toContain("Jane Renter");
    expect(stored).not.toContain("123 Main St");
    expect(result.trips[0].raw["Check-in odometer"]).toBe("85,120");
    expect(result.extraColumns).toEqual(["Check-in odometer"]);
  });

  it("maps every trip status and holds cancellation and other fees apart", () => {
    const result = parseTuroExport(
      csv(
        { "Reservation ID": "1", "Trip status": "Booked" },
        { "Reservation ID": "2", "Trip status": "In-progress" },
        {
          "Reservation ID": "3",
          "Trip status": "Guest cancellation",
          "Trip price": "$0.00",
          "3-day discount": "$0.00",
          Delivery: "$0.00",
          "Tolls & tickets": "$0.00",
          "Cancellation fee": "$35.00",
          "Total earnings": "$35.00",
        },
        { "Reservation ID": "4", "Trip status": "Host cancellation", "Trip price": "$0.00", "3-day discount": "$0.00", Delivery: "$0.00", "Tolls & tickets": "$0.00", "Total earnings": "$0.00" },
      ),
    );
    expect(result.problems).toEqual([]);
    expect(result.trips.map((t) => t.status)).toEqual(["booked", "in_progress", "cancelled_by_guest", "cancelled_by_host"]);
    expect(result.trips[2]).toMatchObject({ unclassifiedCents: 3500, unclassifiedBreakdown: { "Cancellation fee": 3500 }, includedCents: 0 });
  });

  it("stops when line items don't add up to Total earnings", () => {
    const result = parseTuroExport(csv({ "Reservation ID": "77", "Total earnings": "$200.00" }));
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0].message).toMatch(/don't add up to Total earnings on reservation 77/);
  });

  it("stops on an unrecognized money column", () => {
    const text = csv({}).replace("Check-in odometer", "Mystery fee").replace("85,120", "$5.00");
    const result = parseTuroExport(text);
    expect(result.problems.map((p) => p.message)).toEqual(
      expect.arrayContaining([expect.stringMatching(/Unrecognized money column: Mystery fee/)]),
    );
  });

  it("stops on an unknown status, bad dates, bad money, bad VINs and duplicate reservations", () => {
    const result = parseTuroExport(
      csv(
        { "Reservation ID": "1", "Trip status": "Paused" },
        { "Reservation ID": "2", "Trip start": "someday" },
        { "Reservation ID": "3", "Trip price": "lots" },
        { "Reservation ID": "4", VIN: "NOTAVIN" },
        { "Reservation ID": "5" },
        { "Reservation ID": "5" },
      ),
    );
    const messages = result.problems.map((p) => p.message).join("\n");
    expect(messages).toMatch(/Unknown trip status "Paused" on reservation 1/);
    expect(messages).toMatch(/Trip start or end can't be read on reservation 2/);
    expect(messages).toMatch(/"Trip price" isn't a dollar amount on reservation 3/);
    expect(messages).toMatch(/invalid VIN on reservation 4/);
    expect(messages).toMatch(/Reservation IDs appear more than once: 5/);
  });

  it("explains a file that isn't the trip earnings export", () => {
    const result = parseTuroExport("Date,Amount\n2026-09-01,$5.00\n");
    expect(result.trips).toEqual([]);
    expect(result.problems[0].message).toMatch(/Missing columns: Reservation ID, Vehicle id, VIN, Trip status, Trip start, Trip end, Total earnings/);
  });
});

describe("planTuroImport", () => {
  const jettaRef: TuroVehicleRef = { turoVehicleId: "3906429", vehicleId: "veh-jetta", vin: JETTA_VIN, name: "2019 Volkswagen Jetta" };
  let counter = 0;
  const newId = () => `new-${++counter}`;
  const trips = (...rows: Row[]) => parseTuroExport(csv(...rows)).trips;

  it("creates bookings and earnings rows for new trips", () => {
    counter = 0;
    const plan = planTuroImport(trips({ "Reservation ID": "1" }, { "Reservation ID": "2", "Trip status": "Booked" }), [jettaRef], [], [], newId);
    expect(plan.problems).toEqual([]);
    expect(plan.bookings.map((b) => [b.external_booking_id, b.status, b.vehicle_id])).toEqual([
      ["1", "completed", "veh-jetta"],
      ["2", "booked", "veh-jetta"],
    ]);
    // Only the completed trip has been collected.
    expect(plan.transactions).toHaveLength(1);
    expect(plan.transactions[0].row).toMatchObject({
      id: "new-1",
      external_id: "1",
      category: "charge",
      amount_cents: 18125,
      rental_revenue_cents: 13500,
      excluded_cents: 4625,
      collected_on: "2026-09-22",
    });
    expect(plan.summary).toMatchObject({
      trips: 2,
      newTrips: 2,
      earningsRows: { new: 1, updated: 0, unchanged: 0, removed: 0 },
      totals: { earningsCents: 18125, rentalRevenueCents: 13500, excludedCents: 4625, unclassifiedCents: 0 },
      firstTripStart: "2026-09-19",
      vehicles: [{ vehicleId: "veh-jetta", trips: 2, completed: 1, earningsCents: 18125, rentalRevenueCents: 13500 }],
    });
  });

  it("updates existing rows in place, whatever key they were stored under", () => {
    const booking: ExistingBooking = {
      id: "b1",
      external_booking_id: "1",
      status: "in_progress",
      gross_cents: 0,
      start_at: "2026-09-19T14:00:00Z",
      end_at: "2026-09-22T14:00:00Z",
      vehicle_id: "veh-jetta",
    };
    const unchangedBooking: ExistingBooking = { ...booking, id: "b2", external_booking_id: "2", status: "completed", gross_cents: 18125 };
    const txn: ExistingTransaction = {
      id: "t2",
      external_id: "turo-2",
      booking_id: "b2",
      amount_cents: 18125,
      rental_revenue_cents: 13500,
      excluded_cents: 4625,
      unclassified_cents: 0,
      collected_on: "2026-09-22",
    };
    const plan = planTuroImport(trips({ "Reservation ID": "1" }, { "Reservation ID": "2" }), [jettaRef], [booking, unchangedBooking], [txn], newId);
    expect(plan.summary).toMatchObject({ newTrips: 0, updatedTrips: 1, unchangedTrips: 1, earningsRows: { new: 1, updated: 0, unchanged: 1 } });
    // Only what changed is written: trip 1 (and its new earnings row), not trip 2.
    expect(plan.bookings.map((b) => b.external_booking_id)).toEqual(["1"]);
    expect(plan.transactions.map((t) => [t.reservationId, t.bookingId])).toEqual([["1", "b1"]]);

    // A late fee changes trip 2's earnings: its row is updated in place under its original key.
    const withLateFee = planTuroImport(
      trips({ "Reservation ID": "2", "Trip price": "$175.00", "Total earnings": "$206.25" }),
      [jettaRef],
      [unchangedBooking],
      [txn],
      newId,
    );
    expect(withLateFee.summary).toMatchObject({ updatedTrips: 1, earningsRows: { new: 0, updated: 1, unchanged: 0 } });
    expect(withLateFee.transactions[0]).toMatchObject({ bookingId: "b2", row: { id: "t2", external_id: "turo-2", amount_cents: 20625 } });
  });

  it("writes nothing when the file matches what is stored", () => {
    const booking: ExistingBooking = {
      id: "b1",
      external_booking_id: "5001",
      status: "completed",
      gross_cents: 18125,
      start_at: "2026-09-19T14:00:00Z",
      end_at: "2026-09-22T14:00:00Z",
      vehicle_id: "veh-jetta",
    };
    const txn: ExistingTransaction = {
      id: "t1",
      external_id: "5001",
      booking_id: "b1",
      amount_cents: 18125,
      rental_revenue_cents: 13500,
      excluded_cents: 4625,
      unclassified_cents: 0,
      collected_on: "2026-09-22",
    };
    const plan = planTuroImport(trips({}), [jettaRef], [booking], [txn], newId);
    expect(plan.bookings).toEqual([]);
    expect(plan.transactions).toEqual([]);
    expect(plan.deleteTransactionIds).toEqual([]);
    expect(plan.summary).toMatchObject({ unchangedTrips: 1, earningsRows: { unchanged: 1 } });
  });

  it("removes the earnings row when a paid trip becomes an unpaid cancellation", () => {
    const booking: ExistingBooking = {
      id: "b1",
      external_booking_id: "1",
      status: "completed",
      gross_cents: 18125,
      start_at: "2026-09-19T14:00:00Z",
      end_at: "2026-09-22T14:00:00Z",
      vehicle_id: "veh-jetta",
    };
    const txn: ExistingTransaction = {
      id: "t1",
      external_id: "1",
      booking_id: "b1",
      amount_cents: 18125,
      rental_revenue_cents: 13500,
      excluded_cents: 4625,
      unclassified_cents: 0,
      collected_on: "2026-09-22",
    };
    const cancelled = trips({
      "Reservation ID": "1",
      "Trip status": "Host cancellation",
      "Trip price": "$0.00",
      "3-day discount": "$0.00",
      Delivery: "$0.00",
      "Tolls & tickets": "$0.00",
      "Total earnings": "$0.00",
    });
    const plan = planTuroImport(cancelled, [jettaRef], [booking], [txn], newId);
    expect(plan.transactions).toEqual([]);
    expect(plan.deleteTransactionIds).toEqual(["t1"]);
    expect(plan.summary.earningsRows.removed).toBe(1);
  });

  it("stops on unlinked vehicles, VIN mismatches and duplicate earnings rows", () => {
    const other = trips({ "Reservation ID": "9", "Vehicle id": "111", "Vehicle name": "Chevrolet Equinox 2020", VIN: "2GNAXKEV0L6000000" });
    const unlinked = planTuroImport(other, [jettaRef], [], [], newId);
    expect(unlinked.problems[0].message).toMatch(/Turo vehicle 111 \(Chevrolet Equinox 2020, VIN 2GNAXKEV0L6000000, 1 trip\) isn't linked/);
    expect(unlinked.bookings).toEqual([]);

    const wrongVin = planTuroImport(trips({}), [{ ...jettaRef, vin: "1HGCM82633A004352" }], [], [], newId);
    expect(wrongVin.problems[0].message).toMatch(/VINs differ/);

    const booking: ExistingBooking = {
      id: "b1",
      external_booking_id: "5001",
      status: "completed",
      gross_cents: 18125,
      start_at: "2026-09-19T14:00:00Z",
      end_at: "2026-09-22T14:00:00Z",
      vehicle_id: "veh-jetta",
    };
    const t = (id: string): ExistingTransaction => ({
      id,
      external_id: id,
      booking_id: "b1",
      amount_cents: 1,
      rental_revenue_cents: 1,
      excluded_cents: 0,
      unclassified_cents: 0,
      collected_on: "2026-09-22",
    });
    const duplicated = planTuroImport(trips({}), [jettaRef], [booking], [t("a"), t("b")], newId);
    expect(duplicated.problems[0].message).toMatch(/more than one earnings row/);
    expect(duplicated.transactions).toEqual([]);
  });
});

describe("turoCoverage", () => {
  it("falls back to the direct history load before any page import", () => {
    expect(turoCoverage([])).toEqual({
      importedOn: "2026-09-24",
      fileName: null,
      firstTripStart: null,
      lastTripStart: null,
      initialLoad: true,
      exportFrom: "2026-07-26",
    });
  });

  it("uses the latest successful import and ignores failed ones", () => {
    const coverage = turoCoverage([
      { status: "succeeded", started_at: "2026-09-28T15:00:00", metadata: { file_name: "a.csv", first_trip_start: "2026-08-01", last_trip_start: "2026-11-08" } },
      { status: "failed", started_at: "2026-10-05T15:00:00", metadata: { file_name: "bad.csv" } },
      { status: "succeeded", started_at: "2026-09-01T15:00:00", metadata: { file_name: "old.csv" } },
    ]);
    expect(coverage).toEqual({
      importedOn: "2026-09-28",
      fileName: "a.csv",
      firstTripStart: "2026-08-01",
      lastTripStart: "2026-11-08",
      initialLoad: false,
      exportFrom: "2026-07-30",
    });
  });
});
