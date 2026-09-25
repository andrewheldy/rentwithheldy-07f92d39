import { format, parseISO } from "date-fns";

type VehicleLike = { year: number; make: string; model: string; color?: string | null; license_plate?: string | null };
type Period = { effective_from: string; effective_to: string | null };

/** Today's date as YYYY-MM-DD in the viewer's time zone. */
export const todayISO = (now: Date = new Date()) => format(now, "yyyy-MM-dd");

export const vehicleName = (vehicle: VehicleLike) => `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

export const vehicleDetail = (vehicle: VehicleLike) =>
  [vehicle.color, vehicle.license_plate].filter(Boolean).join(" · ");

/** "Sep 17, 2026" for a YYYY-MM-DD date (no time-zone shift). */
export const formatDay = (day: string) => format(parseISO(day), "MMM d, yyyy");

/**
 * Parses the owner's share typed by an admin. Accepts 0–100 with up to two
 * decimals (the column is numeric(5,2)); anything else returns null.
 */
export function parseOwnerPercent(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= 0 && value <= 100 ? value : null;
}

/** The operator's share for a given owner's share, without float noise. */
export const operatorPercent = (ownerPercent: number) => Math.round((100 - ownerPercent) * 100) / 100;

export const formatPercent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, "")}%`;

export type PeriodState = "upcoming" | "current" | "ended";

export function periodState(period: Period, today: string): PeriodState {
  if (period.effective_from > today) return "upcoming";
  if (period.effective_to !== null && period.effective_to < today) return "ended";
  return "current";
}

/** True while the assignment still blocks new assignments of the same vehicle. */
export const blocksNewAssignment = (period: Period, today: string) =>
  period.effective_to === null || period.effective_to >= today;

export function periodLabel(period: Period, today: string): string {
  const from = formatDay(period.effective_from);
  if (period.effective_to === null) {
    return periodState(period, today) === "upcoming" ? `Starts ${from}` : `Since ${from}`;
  }
  return `${from} – ${formatDay(period.effective_to)}`;
}

const PROVIDER_LABELS: Record<string, string> = { email: "Email", google: "Google" };

export const providerLabel = (providers: string[]) =>
  providers.length === 0 ? "Email" : providers.map((p) => PROVIDER_LABELS[p] ?? p).join(" + ");
