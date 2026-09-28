import type { TuroProblem, TuroStatus, TuroTrip } from "./parse.js";

// Turns parsed trips into database writes, given what is already stored.
// Pure: the server loads the inputs and applies the result.
//
// Idempotency: bookings are keyed by (source, external_booking_id =
// Reservation ID). An earnings row (rental_transactions) is found through its
// booking, so an existing row is updated in place whatever external_id it was
// stored under; a trip gets at most one earnings row.

export type TuroVehicleRef = { turoVehicleId: string; vehicleId: string; vin: string | null; name: string };

export type ExistingBooking = {
  id: string;
  external_booking_id: string;
  status: string;
  gross_cents: number;
  start_at: string;
  end_at: string;
  vehicle_id: string;
};

export type ExistingTransaction = {
  id: string;
  external_id: string;
  booking_id: string | null;
  amount_cents: number;
  rental_revenue_cents: number;
  excluded_cents: number;
  unclassified_cents: number;
  collected_on: string;
};

export type BookingWrite = {
  source: "turo";
  external_booking_id: string;
  vehicle_id: string;
  start_at: string;
  end_at: string;
  rental_days: number;
  status: TuroStatus;
  gross_cents: number;
  raw: Record<string, string>;
};

export type TransactionWrite = {
  id: string;
  /** Filled in by the server from the upserted booking. */
  reservationId: string;
  row: {
    id: string;
    source: "turo";
    external_id: string;
    vehicle_id: string;
    category: "charge" | "refund";
    amount_cents: number;
    sales_tax_cents: 0;
    processing_fee_cents: 0;
    platform_fee_cents: 0;
    rental_revenue_cents: number;
    excluded_cents: number;
    excluded_breakdown: Record<string, number>;
    unclassified_cents: number;
    unclassified_breakdown: Record<string, number>;
    collected_on: string;
    raw: Record<string, string>;
  };
};

export type VehicleSummary = {
  vehicleId: string;
  name: string;
  trips: number;
  completed: number;
  earningsCents: number;
  rentalRevenueCents: number;
};

export type TuroImportSummary = {
  trips: number;
  newTrips: number;
  updatedTrips: number;
  unchangedTrips: number;
  byStatus: Record<TuroStatus, number>;
  earningsRows: { new: number; updated: number; unchanged: number; removed: number };
  /** Money on trips that count as collected: completed trips and cancellations that paid. */
  totals: { earningsCents: number; rentalRevenueCents: number; excludedCents: number; unclassifiedCents: number };
  firstTripStart: string | null;
  lastTripStart: string | null;
  vehicles: VehicleSummary[];
};

export type TuroImportPlan = {
  problems: TuroProblem[];
  bookings: BookingWrite[];
  transactions: TransactionWrite[];
  deleteTransactionIds: string[];
  summary: TuroImportSummary;
};

/** Completed trips always; cancellations only when Turo paid something. Booked and in-progress trips have not been collected yet. */
export const countsAsCollected = (trip: Pick<TuroTrip, "status" | "totalCents">) =>
  trip.status === "completed" ||
  ((trip.status === "cancelled_by_guest" || trip.status === "cancelled_by_host") && trip.totalCents !== 0);

/** Completed trips are dated on the trip end; cancellations on the trip start. */
export const collectedOn = (trip: Pick<TuroTrip, "status" | "startDay" | "endDay">) =>
  trip.status === "completed" ? trip.endDay : trip.startDay;

const sameInstant = (a: string, b: string) => new Date(a).getTime() === new Date(b).getTime();

export function planTuroImport(
  trips: TuroTrip[],
  refs: TuroVehicleRef[],
  existingBookings: ExistingBooking[],
  existingTransactions: ExistingTransaction[],
  newId: () => string = () => crypto.randomUUID(),
): TuroImportPlan {
  const problems: TuroProblem[] = [];
  const refByTuroId = new Map(refs.map((ref) => [ref.turoVehicleId, ref]));
  const bookingByReservation = new Map(existingBookings.map((b) => [b.external_booking_id, b]));
  const txnsByBooking = new Map<string, ExistingTransaction[]>();
  const txnByExternalId = new Map<string, ExistingTransaction>();
  for (const txn of existingTransactions) {
    if (txn.booking_id) txnsByBooking.set(txn.booking_id, [...(txnsByBooking.get(txn.booking_id) ?? []), txn]);
    txnByExternalId.set(txn.external_id, txn);
  }

  // Vehicle matching: Turo vehicle id → our vehicle, confirmed by VIN. Never by name or plate.
  const unmapped = new Map<string, { vin: string; label: string; trips: number }>();
  const mismatched = new Map<string, { vin: string; ourVin: string | null; name: string }>();
  for (const trip of trips) {
    const ref = refByTuroId.get(trip.turoVehicleId);
    if (!ref) {
      const entry = unmapped.get(trip.turoVehicleId) ?? { vin: trip.vin, label: trip.vehicleLabel, trips: 0 };
      entry.trips += 1;
      unmapped.set(trip.turoVehicleId, entry);
    } else if ((ref.vin ?? "").toUpperCase() !== trip.vin) {
      mismatched.set(trip.turoVehicleId, { vin: trip.vin, ourVin: ref.vin, name: ref.name });
    }
  }
  for (const [turoId, entry] of unmapped) {
    problems.push({
      message: `Turo vehicle ${turoId} (${entry.label}, VIN ${entry.vin}, ${entry.trips} trip${entry.trips > 1 ? "s" : ""}) isn't linked to a vehicle in our fleet. Add its Turo ID to the vehicle first.`,
    });
  }
  for (const [turoId, entry] of mismatched) {
    problems.push({
      message: `Turo vehicle ${turoId} is linked to ${entry.name}, but the VINs differ (Turo ${entry.vin}, ours ${entry.ourVin ?? "none"}). Fix the link before importing.`,
    });
  }

  const bookings: BookingWrite[] = [];
  const transactions: TransactionWrite[] = [];
  const deleteTransactionIds: string[] = [];
  const byStatus: Record<TuroStatus, number> = {
    booked: 0,
    in_progress: 0,
    completed: 0,
    cancelled_by_guest: 0,
    cancelled_by_host: 0,
  };
  const earningsRows = { new: 0, updated: 0, unchanged: 0, removed: 0 };
  const totals = { earningsCents: 0, rentalRevenueCents: 0, excludedCents: 0, unclassifiedCents: 0 };
  const vehicles = new Map<string, VehicleSummary>();
  let newTrips = 0;
  let updatedTrips = 0;
  let unchangedTrips = 0;
  let firstTripStart: string | null = null;
  let lastTripStart: string | null = null;
  const multipleRows: string[] = [];

  for (const trip of trips) {
    byStatus[trip.status] += 1;
    if (!firstTripStart || trip.startDay < firstTripStart) firstTripStart = trip.startDay;
    if (!lastTripStart || trip.startDay > lastTripStart) lastTripStart = trip.startDay;
    const ref = refByTuroId.get(trip.turoVehicleId);
    if (!ref) continue;

    const existing = bookingByReservation.get(trip.reservationId);
    if (!existing) newTrips += 1;
    else if (
      existing.status === trip.status &&
      Number(existing.gross_cents) === trip.totalCents &&
      existing.vehicle_id === ref.vehicleId &&
      sameInstant(existing.start_at, trip.startAt) &&
      sameInstant(existing.end_at, trip.endAt)
    ) unchangedTrips += 1;
    else updatedTrips += 1;

    bookings.push({
      source: "turo",
      external_booking_id: trip.reservationId,
      vehicle_id: ref.vehicleId,
      start_at: trip.startAt,
      end_at: trip.endAt,
      rental_days: trip.rentalDays,
      status: trip.status,
      gross_cents: trip.totalCents,
      raw: trip.raw,
    });

    const current = existing ? txnsByBooking.get(existing.id) ?? [] : [];
    const orphan = txnByExternalId.get(trip.reservationId);
    const candidates = current.length > 0 ? current : orphan && !orphan.booking_id ? [orphan] : [];
    if (candidates.length > 1) {
      multipleRows.push(trip.reservationId);
      continue;
    }
    const previous = candidates[0];

    const vehicle = vehicles.get(ref.vehicleId) ?? {
      vehicleId: ref.vehicleId,
      name: ref.name,
      trips: 0,
      completed: 0,
      earningsCents: 0,
      rentalRevenueCents: 0,
    };
    vehicle.trips += 1;
    if (trip.status === "completed") vehicle.completed += 1;
    vehicles.set(ref.vehicleId, vehicle);

    if (!countsAsCollected(trip)) {
      if (previous) {
        deleteTransactionIds.push(previous.id);
        earningsRows.removed += 1;
      }
      continue;
    }

    vehicle.earningsCents += trip.totalCents;
    vehicle.rentalRevenueCents += trip.includedCents;
    totals.earningsCents += trip.totalCents;
    totals.rentalRevenueCents += trip.includedCents;
    totals.excludedCents += trip.excludedCents;
    totals.unclassifiedCents += trip.unclassifiedCents;

    const day = collectedOn(trip);
    if (!previous) earningsRows.new += 1;
    else if (
      Number(previous.amount_cents) === trip.totalCents &&
      Number(previous.rental_revenue_cents) === trip.includedCents &&
      Number(previous.excluded_cents) === trip.excludedCents &&
      Number(previous.unclassified_cents) === trip.unclassifiedCents &&
      previous.collected_on === day
    ) earningsRows.unchanged += 1;
    else earningsRows.updated += 1;

    const id = previous?.id ?? newId();
    transactions.push({
      id,
      reservationId: trip.reservationId,
      row: {
        id,
        source: "turo",
        external_id: previous?.external_id ?? trip.reservationId,
        vehicle_id: ref.vehicleId,
        category: trip.totalCents < 0 ? "refund" : "charge",
        amount_cents: trip.totalCents,
        sales_tax_cents: 0,
        processing_fee_cents: 0,
        platform_fee_cents: 0,
        rental_revenue_cents: trip.includedCents,
        excluded_cents: trip.excludedCents,
        excluded_breakdown: trip.excludedBreakdown,
        unclassified_cents: trip.unclassifiedCents,
        unclassified_breakdown: trip.unclassifiedBreakdown,
        collected_on: day,
        raw: { "Reservation ID": trip.reservationId },
      },
    });
  }

  if (multipleRows.length > 0) {
    problems.push({
      message: `Some trips already have more than one earnings row, so the import can't tell which to update: ${multipleRows.slice(0, 5).join(", ")}${multipleRows.length > 5 ? ` and ${multipleRows.length - 5} more` : ""}.`,
      reservationIds: multipleRows,
    });
  }

  return {
    problems,
    bookings,
    transactions,
    deleteTransactionIds,
    summary: {
      trips: trips.length,
      newTrips,
      updatedTrips,
      unchangedTrips,
      byStatus,
      earningsRows,
      totals,
      firstTripStart,
      lastTripStart,
      vehicles: [...vehicles.values()].sort((a, b) => b.earningsCents - a.earningsCents || a.name.localeCompare(b.name)),
    },
  };
}
