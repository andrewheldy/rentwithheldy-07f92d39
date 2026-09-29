import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  dashboardMetrics,
  monthsIn,
  ownerShareCents,
  periodMetrics,
  presetRange,
  previousRange,
  toNewYorkDay,
  type MetricsInput,
} from "./metrics";

const JETTA = "veh-jetta";

const input = (overrides: Partial<MetricsInput> = {}): MetricsInput => ({
  consignments: [{ vehicle_id: JETTA, owner_percent: 60, effective_from: "2026-09-17", effective_to: null }],
  vehicles: [{ id: JETTA, in_service_on: "2026-09-17", out_of_service_on: null }],
  bookings: [
    // Sep 19 10:00 → Sep 22 10:00 New York: nights of the 19th, 20th, 21st.
    { id: "b1", vehicle_id: JETTA, source: "turo", start_at: "2026-09-19T14:00:00Z", end_at: "2026-09-22T14:00:00Z", status: "completed" },
    // Started before the consignment: not the owner's.
    { id: "b0", vehicle_id: JETTA, source: "turo", start_at: "2026-09-10T14:00:00Z", end_at: "2026-09-12T14:00:00Z", status: "completed" },
    // Booked (future) trips never count.
    { id: "b2", vehicle_id: JETTA, source: "turo", start_at: "2026-10-05T14:00:00Z", end_at: "2026-10-08T14:00:00Z", status: "booked" },
    // In progress on the 28th/29th: nights count, the trip doesn't yet.
    { id: "b3", vehicle_id: JETTA, source: "wheelbase", start_at: "2026-09-28T14:00:00Z", end_at: "2026-10-02T14:00:00Z", status: "in_progress" },
  ],
  transactions: [
    { vehicle_id: JETTA, source: "turo", booking_id: "b1", collected_on: "2026-09-22", rental_revenue_cents: 13500 },
    { vehicle_id: JETTA, source: "turo", booking_id: "b0", collected_on: "2026-09-12", rental_revenue_cents: 9999 },
    { vehicle_id: JETTA, source: "wheelbase", booking_id: "b3", collected_on: "2026-10-02", rental_revenue_cents: 10000 },
  ],
  unavailable: [{ vehicle_id: JETTA, starts_on: "2026-09-25", ends_on: "2026-09-26" }],
  today: "2026-09-29",
  ...overrides,
});

describe("calendar helpers", () => {
  it("reads timestamps as New York days", () => {
    expect(toNewYorkDay("2026-09-20T02:00:00Z")).toBe("2026-09-19");
    expect(toNewYorkDay("2026-01-15T05:00:00Z")).toBe("2026-01-15");
  });

  it("does day and month arithmetic", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(daysBetween("2026-09-17", "2026-09-29")).toBe(13);
    expect(daysBetween("2026-09-30", "2026-09-29")).toBe(0);
    expect(monthsIn({ from: "2025-11-15", to: "2026-02-01" })).toEqual(["2025-11-01", "2025-12-01", "2026-01-01", "2026-02-01"]);
    expect(previousRange({ from: "2026-09-01", to: "2026-09-30" })).toEqual({ from: "2026-08-02", to: "2026-08-31" });
  });

  it("rounds the owner's share like the database view", () => {
    expect(ownerShareCents(13500, 60)).toBe(8100);
    expect(ownerShareCents(1001, 62.5)).toBe(626);
  });
});

describe("periodMetrics", () => {
  it("shows only the owner's share, days and trips while they held the car", () => {
    const m = periodMetrics(input(), { from: "2026-09-01", to: "2026-09-30" });
    expect(m.earningsCents).toBe(8100);
    expect(m.byChannel).toEqual({ turo: 8100, wheelbase: 0 });
    // 3 nights of b1 + the 28th and 29th of b3 (the 30th is in range too).
    expect(m.bookedDays).toBe(6);
    // Sep 17–29 in service (today is the 29th) minus the 25th and 26th.
    expect(m.availableDays).toBe(11);
    expect(m.utilizationPct).toBe(54.5);
    expect(m.averageDailyRateCents).toBe(1350);
    expect(m.completedTrips).toBe(1);
    expect(m.averageTripDays).toBe(3);
    expect(m.monthly).toEqual([{ month: "2026-09-01", wheelbase: 0, turo: 8100, total: 8100 }]);
  });

  it("splits months and channels", () => {
    const m = periodMetrics(input({ today: "2026-10-31" }), { from: "2026-09-01", to: "2026-10-31" });
    expect(m.byChannel).toEqual({ turo: 8100, wheelbase: 6000 });
    expect(m.monthly).toEqual([
      { month: "2026-09-01", wheelbase: 0, turo: 8100, total: 8100 },
      { month: "2026-10-01", wheelbase: 6000, turo: 0, total: 6000 },
    ]);
    expect(m.completedTrips).toBe(1);
  });

  it("stops counting after the consignment ends", () => {
    const ended = input({
      consignments: [{ vehicle_id: JETTA, owner_percent: 60, effective_from: "2026-09-17", effective_to: "2026-09-20" }],
    });
    const m = periodMetrics(ended, { from: "2026-09-01", to: "2026-09-30" });
    expect(m.availableDays).toBe(4);
    expect(m.bookedDays).toBe(2);
    expect(m.earningsCents).toBe(0);
  });

  it("returns empty figures when nothing happened", () => {
    const m = periodMetrics(input(), { from: "2026-01-01", to: "2026-01-31" });
    expect(m).toMatchObject({ earningsCents: 0, bookedDays: 0, availableDays: 0, utilizationPct: null, averageDailyRateCents: null, averageTripDays: null });
  });
});

describe("dashboardMetrics", () => {
  it("compares with the previous period and averages over held months", () => {
    const withAugust = input({
      consignments: [{ vehicle_id: JETTA, owner_percent: 60, effective_from: "2026-08-01", effective_to: null }],
      transactions: [
        ...input().transactions,
        { vehicle_id: JETTA, source: "turo", booking_id: null, collected_on: "2026-08-20", rental_revenue_cents: 10000 },
      ],
    });
    const m = dashboardMetrics(withAugust, { from: "2026-09-01", to: "2026-09-30" });
    // August 2–31: the Aug 20 trip. September: Sep 12 (now consigned) and Sep 22.
    expect(m.previous.earningsCents).toBe(6000);
    expect(m.current.earningsCents).toBe(5999 + 8100);
    expect(m.earningsChangePct).toBe(135);
    expect(m.averageMonthlyCents).toBe(14099);

    const yearly = dashboardMetrics(input(), { from: "2026-01-01", to: "2026-12-31" });
    // The year's $141.00 is averaged over September only: the car was consigned on Sep 17
    // and later months haven't happened yet.
    expect(yearly.current.earningsCents).toBe(14100);
    expect(yearly.averageMonthlyCents).toBe(14100);
    expect(yearly.earningsChangePct).toBeNull();
  });
});

describe("presetRange", () => {
  it("builds the date range presets", () => {
    expect(presetRange("thisYear", "2026-09-29", null)).toEqual({ from: "2026-01-01", to: "2026-12-31" });
    expect(presetRange("lastYear", "2026-09-29", null)).toEqual({ from: "2025-01-01", to: "2025-12-31" });
    expect(presetRange("last90Days", "2026-09-29", null)).toEqual({ from: "2026-07-02", to: "2026-09-29" });
    expect(presetRange("last12Months", "2026-09-29", null)).toEqual({ from: "2025-10-01", to: "2026-09-29" });
    expect(presetRange("allTime", "2026-09-29", "2026-09-17")).toEqual({ from: "2026-09-01", to: "2026-09-29" });
  });
});
