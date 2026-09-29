// Figures for the owner (consigner) dashboard, computed from the rows the
// owner may read. Every dollar amount is the OWNER'S SHARE: each collected
// Rental Revenue amount times the owner_percent of the consignment in force on
// its collection day, rounded per transaction — the same rule as
// v_vehicle_monthly_revenue. Days follow v_vehicle_monthly_rental_days and
// v_vehicle_monthly_available_days (America/New_York calendar days).
//
// Everything is clipped to the owner's consignment periods, so an admin
// previewing a dashboard (who can read every row) sees exactly what the owner
// sees.

export type Channel = "wheelbase" | "turo";
export const CHANNELS: Channel[] = ["wheelbase", "turo"];

export type Consignment = {
  vehicle_id: string;
  owner_percent: number;
  effective_from: string;
  effective_to: string | null;
};

export type OwnerVehicle = {
  id: string;
  in_service_on: string | null;
  out_of_service_on: string | null;
};

export type Booking = {
  id: string;
  vehicle_id: string;
  source: string;
  start_at: string;
  end_at: string;
  status: string;
};

export type Transaction = {
  vehicle_id: string;
  source: string;
  booking_id: string | null;
  collected_on: string;
  rental_revenue_cents: number;
};

export type UnavailablePeriod = { vehicle_id: string; starts_on: string; ends_on: string };

export type DateRange = { from: string; to: string };

export type MonthPoint = { month: string; wheelbase: number; turo: number; total: number };

export type PeriodMetrics = {
  earningsCents: number;
  byChannel: Record<Channel, number>;
  bookedDays: number;
  availableDays: number;
  /** 0–100, null when no available days. */
  utilizationPct: number | null;
  /** Owner's share per booked day, null when no booked days. */
  averageDailyRateCents: number | null;
  /** Completed trips that ended in the period. */
  completedTrips: number;
  /** Average nights per completed trip, null without trips. */
  averageTripDays: number | null;
  monthly: MonthPoint[];
};

export type DashboardMetrics = {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  /** Percent change in earnings vs the previous period; null when it had none. */
  earningsChangePct: number | null;
  /** Change in utilization, in percentage points. */
  utilizationChangePts: number | null;
  /** Months in the range with average owner's share per month. */
  averageMonthlyCents: number;
};

// ---------------------------------------------------------------------------
// Calendar days (YYYY-MM-DD strings compare correctly as text)
// ---------------------------------------------------------------------------

const newYorkDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar day in New York for a timestamp. */
export const toNewYorkDay = (timestamp: string) => newYorkDay.format(new Date(timestamp));

const dayToUtc = (day: string) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
const utcToDay = (millis: number) => new Date(millis).toISOString().slice(0, 10);

export const addDays = (day: string, days: number) => utcToDay(dayToUtc(day) + days * 86_400_000);

/** Inclusive number of days from `from` to `to` (0 when to < from). */
export const daysBetween = (from: string, to: string) => (to < from ? 0 : Math.round((dayToUtc(to) - dayToUtc(from)) / 86_400_000) + 1);

const monthOf = (day: string) => `${day.slice(0, 7)}-01`;

/** First day of every month the range touches. */
export function monthsIn(range: DateRange): string[] {
  const months: string[] = [];
  let cursor = monthOf(range.from);
  while (cursor <= range.to) {
    months.push(cursor);
    const [y, m] = [Number(cursor.slice(0, 4)), Number(cursor.slice(5, 7))];
    cursor = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  }
  return months;
}

/** The same number of days immediately before `range`. */
export function previousRange(range: DateRange): DateRange {
  const length = daysBetween(range.from, range.to);
  return { from: addDays(range.from, -length), to: addDays(range.from, -1) };
}

const clip = (a: DateRange, b: DateRange): DateRange | null => {
  const from = a.from > b.from ? a.from : b.from;
  const to = a.to < b.to ? a.to : b.to;
  return from <= to ? { from, to } : null;
};

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

const isChannel = (source: string): source is Channel => source === "wheelbase" || source === "turo";

function consignmentOn(consignments: Consignment[], vehicleId: string, day: string) {
  return consignments.find(
    (c) => c.vehicle_id === vehicleId && day >= c.effective_from && (c.effective_to === null || day <= c.effective_to),
  );
}

/** Owner's share of one amount (same rounding as the database view). */
export const ownerShareCents = (rentalRevenueCents: number, ownerPercent: number) =>
  Math.round((rentalRevenueCents * ownerPercent) / 100);

export type MetricsInput = {
  consignments: Consignment[];
  vehicles: OwnerVehicle[];
  bookings: Booking[];
  transactions: Transaction[];
  unavailable: UnavailablePeriod[];
  /** YYYY-MM-DD; availability is never counted past today. */
  today: string;
};

export function periodMetrics(input: MetricsInput, range: DateRange): PeriodMetrics {
  const { consignments, vehicles, bookings, transactions, unavailable, today } = input;
  const byChannel: Record<Channel, number> = { wheelbase: 0, turo: 0 };
  const monthly = new Map(monthsIn(range).map((month) => [month, { month, wheelbase: 0, turo: 0, total: 0 }]));

  // Owner's share of collected Rental Revenue.
  for (const txn of transactions) {
    if (!isChannel(txn.source) || txn.collected_on < range.from || txn.collected_on > range.to) continue;
    const consignment = consignmentOn(consignments, txn.vehicle_id, txn.collected_on);
    if (!consignment) continue;
    const cents = ownerShareCents(Number(txn.rental_revenue_cents), Number(consignment.owner_percent));
    byChannel[txn.source] += cents;
    const point = monthly.get(monthOf(txn.collected_on));
    if (point) {
      point[txn.source] += cents;
      point.total += cents;
    }
  }

  // Booked nights: every night of a completed or in-progress trip, while the
  // owner held the car, inside the range.
  let bookedDays = 0;
  let completedTrips = 0;
  let completedTripNights = 0;
  for (const booking of bookings) {
    if (booking.status !== "completed" && booking.status !== "in_progress") continue;
    const startDay = toNewYorkDay(booking.start_at);
    const lastNight = (() => {
      const endDay = toNewYorkDay(booking.end_at);
      const before = addDays(endDay, -1);
      return before < startDay ? startDay : before;
    })();
    let nightsInRange = 0;
    for (let day = startDay; day <= lastNight; day = addDays(day, 1)) {
      if (day >= range.from && day <= range.to && consignmentOn(consignments, booking.vehicle_id, day)) nightsInRange += 1;
    }
    bookedDays += nightsInRange;

    const endDay = toNewYorkDay(booking.end_at);
    if (
      booking.status === "completed" &&
      endDay >= range.from &&
      endDay <= range.to &&
      consignmentOn(consignments, booking.vehicle_id, startDay)
    ) {
      completedTrips += 1;
      completedTripNights += daysBetween(startDay, lastNight);
    }
  }

  // Available days: in service, under consignment, not blocked, not in the future.
  let availableDays = 0;
  const window = clip(range, { from: "0000-01-01", to: today });
  if (window) {
    for (const vehicle of vehicles) {
      const service: DateRange = { from: vehicle.in_service_on ?? "0000-01-01", to: vehicle.out_of_service_on ?? "9999-12-31" };
      const inService = clip(window, service);
      if (!inService) continue;
      const blocked = unavailable.filter((u) => u.vehicle_id === vehicle.id);
      for (const consignment of consignments.filter((c) => c.vehicle_id === vehicle.id)) {
        const held = clip(inService, { from: consignment.effective_from, to: consignment.effective_to ?? "9999-12-31" });
        if (!held) continue;
        for (let day = held.from; day <= held.to; day = addDays(day, 1)) {
          if (!blocked.some((u) => day >= u.starts_on && day <= u.ends_on)) availableDays += 1;
        }
      }
    }
  }

  const earningsCents = byChannel.wheelbase + byChannel.turo;
  return {
    earningsCents,
    byChannel,
    bookedDays,
    availableDays,
    utilizationPct: availableDays > 0 ? Math.round((1000 * Math.min(bookedDays, availableDays)) / availableDays) / 10 : null,
    averageDailyRateCents: bookedDays > 0 ? Math.round(earningsCents / bookedDays) : null,
    completedTrips,
    averageTripDays: completedTrips > 0 ? Math.round((10 * completedTripNights) / completedTrips) / 10 : null,
    monthly: [...monthly.values()],
  };
}

export function dashboardMetrics(input: MetricsInput, range: DateRange): DashboardMetrics {
  const current = periodMetrics(input, range);
  const previous = periodMetrics(input, previousRange(range));
  // Average over the months the owner actually held a car in the range, up to today.
  const firstHeld = input.consignments.map((c) => c.effective_from).sort()[0] ?? input.today;
  const heldWindow = clip(range, { from: firstHeld, to: input.today });
  const monthsSoFar = heldWindow ? monthsIn(heldWindow).length : 0;
  return {
    current,
    previous,
    earningsChangePct:
      previous.earningsCents > 0
        ? Math.round((1000 * (current.earningsCents - previous.earningsCents)) / previous.earningsCents) / 10
        : null,
    utilizationChangePts:
      current.utilizationPct !== null && previous.utilizationPct !== null
        ? Math.round(10 * (current.utilizationPct - previous.utilizationPct)) / 10
        : null,
    averageMonthlyCents: monthsSoFar > 0 ? Math.round(current.earningsCents / monthsSoFar) : 0,
  };
}

// ---------------------------------------------------------------------------
// Date range presets
// ---------------------------------------------------------------------------

export type RangePreset = "thisYear" | "last12Months" | "last90Days" | "lastYear" | "allTime";
export const RANGE_PRESETS: RangePreset[] = ["thisYear", "last12Months", "last90Days", "lastYear", "allTime"];

export function presetRange(preset: RangePreset, today: string, earliest: string | null): DateRange {
  const year = Number(today.slice(0, 4));
  switch (preset) {
    case "thisYear":
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case "lastYear":
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    case "last90Days":
      return { from: addDays(today, -89), to: today };
    case "last12Months": {
      const start = monthsIn({ from: `${year - 1}-${today.slice(5, 7)}-01`, to: today })[1] ?? `${year}-01-01`;
      return { from: start, to: today };
    }
    case "allTime":
      return { from: earliest && earliest < today ? monthOf(earliest) : monthOf(today), to: today };
  }
}
