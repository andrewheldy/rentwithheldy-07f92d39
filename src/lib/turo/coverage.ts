import { format, parseISO, subDays } from "date-fns";

/**
 * How far back each new export should reach before the previous import.
 * Turo keeps changing recent trips (completions, cancellations, tolls and late
 * fees added after the trip), so the next file overlaps the last one; trips
 * already imported come back as "unchanged" and cost nothing.
 */
export const EXPORT_OVERLAP_DAYS = 60;

/** The history loaded directly into the database (docs/DATABASE_MIGRATION_PLAN.md). */
export const INITIAL_TURO_LOAD_DAY = "2026-09-24";

type RunLike = {
  status: string;
  started_at: string;
  metadata: { file_name?: string; first_trip_start?: string | null; last_trip_start?: string | null } | null;
};

export type TuroCoverage = {
  /** Local calendar day of the last successful import, YYYY-MM-DD. */
  importedOn: string;
  fileName: string | null;
  firstTripStart: string | null;
  lastTripStart: string | null;
  /** True when no import has run from the admin page yet. */
  initialLoad: boolean;
  /** Suggested first trip-start day for the next export, YYYY-MM-DD. */
  exportFrom: string;
};

export function turoCoverage(runs: RunLike[]): TuroCoverage {
  const latest = runs
    .filter((run) => run.status === "succeeded")
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  const importedOn = latest ? format(new Date(latest.started_at), "yyyy-MM-dd") : INITIAL_TURO_LOAD_DAY;
  return {
    importedOn,
    fileName: latest?.metadata?.file_name ?? null,
    firstTripStart: latest?.metadata?.first_trip_start ?? null,
    lastTripStart: latest?.metadata?.last_trip_start ?? null,
    initialLoad: !latest,
    exportFrom: format(subDays(parseISO(importedOn), EXPORT_OVERLAP_DAYS), "yyyy-MM-dd"),
  };
}
