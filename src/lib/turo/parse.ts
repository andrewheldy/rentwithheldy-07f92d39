import { parseCsv } from "./csv.js";

// Parses Turo's "trip earnings" CSV export into trips ready to store.
// Column treatment follows docs/DATABASE_MIGRATION_PLAN.md section 4.2 and the
// consignment agreement's definition of Rental Revenue (section 5). The parser
// never guesses: a money column it doesn't know, a row whose parts don't add
// up to Total earnings, or an unknown trip status is reported as a problem and
// the import is blocked.

export type TuroStatus = "booked" | "in_progress" | "completed" | "cancelled_by_guest" | "cancelled_by_host";

export type TuroTrip = {
  reservationId: string;
  turoVehicleId: string;
  vin: string;
  vehicleLabel: string;
  status: TuroStatus;
  /** UTC ISO timestamps (export times are America/New_York wall-clock times). */
  startAt: string;
  endAt: string;
  /** America/New_York calendar days, YYYY-MM-DD. */
  startDay: string;
  endDay: string;
  rentalDays: number;
  totalCents: number;
  includedCents: number;
  excludedCents: number;
  excludedBreakdown: Record<string, number>;
  unclassifiedCents: number;
  unclassifiedBreakdown: Record<string, number>;
  /** The source row without renter identity or addresses. */
  raw: Record<string, string>;
};

export type TuroProblem = { message: string; reservationIds?: string[] };

export type TuroParseResult = {
  trips: TuroTrip[];
  problems: TuroProblem[];
  /** Non-money columns the parser doesn't use; kept in `raw`. */
  extraColumns: string[];
  /** Columns dropped because they identify the renter or hold addresses. */
  droppedColumns: string[];
};

const norm = (header: string) => header.trim().toLowerCase().replace(/\s+/g, " ");

const INCLUDED = [
  "Trip price",
  "Boost price",
  "Non-refundable discount",
  "Early bird discount",
  "Host promotional credit",
  "Excess distance",
  "Additional usage",
  "Late fee",
];
const EXCLUDED = [
  // Pass-through or reimbursement
  "Tolls & tickets",
  "Gas reimbursement",
  "Gas fee",
  "On-trip EV charging",
  "Post-trip EV charging",
  "Fines (paid to host)",
  "Airport operations fee",
  "Airport parking credit",
  // Kept by Rent With Heldy
  "Delivery",
  "Extras",
  // Cleaning and turnover
  "Cleaning",
  "Smoking",
  "Improper return fee",
];
/** Awaiting a policy decision (migration plan, section 8, question 2). */
const UNCLASSIFIED = ["Cancellation fee", "Other fees"];

const COLUMN = {
  reservationId: ["Reservation ID"],
  vehicleId: ["Vehicle id", "Vehicle ID"],
  vin: ["VIN"],
  status: ["Trip status", "Status"],
  start: ["Trip start", "Trip start date", "Trip start time", "Start date"],
  end: ["Trip end", "Trip end date", "Trip end time", "End date"],
  total: ["Total earnings"],
  vehicleName: ["Vehicle name"],
  vehicle: ["Vehicle"],
};

const STATUS: Record<string, TuroStatus> = {
  completed: "completed",
  booked: "booked",
  "in-progress": "in_progress",
  "in progress": "in_progress",
  "guest cancellation": "cancelled_by_guest",
  "host cancellation": "cancelled_by_host",
};

/** Headers that identify the renter or hold pickup/return addresses. Never stored. */
const isPrivateHeader = (header: string) => /\b(guest|renter|driver)\b|location|address|phone|email/i.test(header);

/**
 * "$1,039.50" → 103950, "- $6.06" / "-$6.06" / "($6.06)" → -606, "" → 0.
 * Returns null for anything that isn't a money amount.
 */
export function parseMoney(value: string): number | null {
  let text = value.trim();
  if (text === "" || text === "-" || text === "—") return 0;
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1).trim();
  }
  if (text.startsWith("-")) {
    negative = !negative;
    text = text.slice(1).trim();
  }
  text = text.replace(/^\$\s*/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

const looksLikeMoney = (value: string) => /\$/.test(value) && parseMoney(value) !== null;

/** Offset (minutes) of America/New_York from UTC at the given UTC instant. */
function newYorkOffsetMinutes(utcMillis: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMillis));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - utcMillis) / 60000);
}

/** New York wall-clock time → UTC millis (DST-aware). */
export function newYorkToUtc(y: number, m: number, d: number, h: number, min: number, s = 0): number {
  const naive = Date.UTC(y, m - 1, d, h, min, s);
  let utc = naive - newYorkOffsetMinutes(naive) * 60000;
  // Re-check once so times near a DST switch settle on the right offset.
  utc = naive - newYorkOffsetMinutes(utc) * 60000;
  return utc;
}

/**
 * Accepts "2026-09-19 10:00", "2026-09-19T10:00:00", "2026-09-19 10:00 AM",
 * "9/19/2026 10:00 AM", "09/19/2026 22:00" and date-only forms (midnight).
 */
export function parseTuroDateTime(value: string): { utc: number; day: string } | null {
  const text = value.trim().replace(/\s+/g, " ");
  let y: number, m: number, d: number;
  let rest: string;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](.*))?$/.exec(text);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
    rest = match[4] ?? "";
  } else {
    match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,? (.*))?$/.exec(text);
    if (!match) return null;
    [m, d, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
    rest = match[4] ?? "";
  }
  let h = 0;
  let min = 0;
  let s = 0;
  if (rest) {
    const time = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*([AaPp][Mm])?$/.exec(rest.trim());
    if (!time) return null;
    [h, min, s] = [Number(time[1]), Number(time[2]), Number(time[3] ?? 0)];
    const meridiem = time[4]?.toLowerCase();
    if (meridiem) {
      if (h < 1 || h > 12) return null;
      if (meridiem === "pm" && h !== 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
    }
    if (h > 23 || min > 59 || s > 59) return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCMonth() !== m - 1) return null;
  const day = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { utc: newYorkToUtc(y, m, d, h, min, s), day };
}

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export function parseTuroExport(text: string): TuroParseResult {
  const problems: TuroProblem[] = [];
  let table: string[][];
  try {
    table = parseCsv(text);
  } catch (error) {
    return { trips: [], problems: [{ message: (error as Error).message }], extraColumns: [], droppedColumns: [] };
  }
  if (table.length < 2) {
    return {
      trips: [],
      problems: [{ message: "The file has no trips. Download the trip earnings export from Turo and try again." }],
      extraColumns: [],
      droppedColumns: [],
    };
  }

  const headers = table[0].map((h) => h.trim());
  const indexOf = new Map(headers.map((h, i) => [norm(h), i]));
  const find = (names: string[]) => {
    for (const name of names) {
      const index = indexOf.get(norm(name));
      if (index !== undefined) return index;
    }
    return -1;
  };

  const col = {
    reservationId: find(COLUMN.reservationId),
    vehicleId: find(COLUMN.vehicleId),
    vin: find(COLUMN.vin),
    status: find(COLUMN.status),
    start: find(COLUMN.start),
    end: find(COLUMN.end),
    total: find(COLUMN.total),
    vehicleName: find(COLUMN.vehicleName),
    vehicle: find(COLUMN.vehicle),
  };
  const missing = (Object.keys(COLUMN) as Array<keyof typeof COLUMN>)
    .filter((key) => !["vehicleName", "vehicle"].includes(key) && col[key] === -1)
    .map((key) => COLUMN[key][0]);
  if (missing.length > 0) {
    return {
      trips: [],
      problems: [
        {
          message: `This doesn't look like Turo's trip earnings export. Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Columns found: ${headers.join(", ")}.`,
        },
      ],
      extraColumns: [],
      droppedColumns: [],
    };
  }

  const included = new Set(INCLUDED.map(norm));
  const excluded = new Set(EXCLUDED.map(norm));
  const unclassified = new Set(UNCLASSIFIED.map(norm));
  const structural = new Set(Object.values(col).filter((i) => i >= 0));
  const body = table.slice(1);

  type Role = "included" | "excluded" | "unclassified" | "private" | "extra";
  const roles: Role[] = headers.map((header, index) => {
    const key = norm(header);
    if (structural.has(index)) return "extra";
    if (isPrivateHeader(header)) return "private";
    if (included.has(key) || /discount/.test(key)) return "included";
    if (excluded.has(key)) return "excluded";
    if (unclassified.has(key)) return "unclassified";
    return "extra";
  });

  // A column we don't recognize that carries money could hide revenue: stop.
  const unknownMoney = headers.filter(
    (header, index) => roles[index] === "extra" && !structural.has(index) && body.some((row) => looksLikeMoney(row[index] ?? "")),
  );
  if (unknownMoney.length > 0) {
    problems.push({
      message: `Unrecognized money column${unknownMoney.length > 1 ? "s" : ""}: ${unknownMoney.join(", ")}. Decide whether ${unknownMoney.length > 1 ? "they count" : "it counts"} as Rental Revenue before importing.`,
    });
  }

  const extraColumns = headers.filter((_, i) => roles[i] === "extra" && !structural.has(i));
  const droppedColumns = headers.filter((_, i) => roles[i] === "private");

  const trips: TuroTrip[] = [];
  const seen = new Map<string, number>();
  const bad = {
    status: new Map<string, string[]>(),
    date: [] as string[],
    money: new Map<string, string[]>(),
    unbalanced: [] as string[],
    vin: [] as string[],
    ids: 0,
  };
  const push = (map: Map<string, string[]>, key: string, id: string) => map.set(key, [...(map.get(key) ?? []), id]);

  body.forEach((row, rowIndex) => {
    const cell = (index: number) => (index >= 0 ? (row[index] ?? "").trim() : "");
    const reservationId = cell(col.reservationId);
    const turoVehicleId = cell(col.vehicleId);
    if (!/^\d+$/.test(reservationId) || !/^\d+$/.test(turoVehicleId)) {
      bad.ids += 1;
      return;
    }
    const label = reservationId || `row ${rowIndex + 2}`;
    seen.set(reservationId, (seen.get(reservationId) ?? 0) + 1);

    const vin = cell(col.vin).toUpperCase();
    if (!VIN_PATTERN.test(vin)) bad.vin.push(label);

    const statusText = cell(col.status);
    const status = STATUS[statusText.toLowerCase()];
    if (!status) push(bad.status, statusText || "(blank)", label);

    const start = parseTuroDateTime(cell(col.start));
    const end = parseTuroDateTime(cell(col.end));
    if (!start || !end || end.utc < start.utc) bad.date.push(label);

    const totalCents = parseMoney(cell(col.total));
    if (totalCents === null) push(bad.money, headers[col.total], label);

    let includedCents = 0;
    let excludedCents = 0;
    let unclassifiedCents = 0;
    const excludedBreakdown: Record<string, number> = {};
    const unclassifiedBreakdown: Record<string, number> = {};
    const raw: Record<string, string> = {};

    headers.forEach((header, index) => {
      const role = roles[index];
      if (role === "private") return;
      const value = cell(index);
      raw[header] = value;
      if (role !== "included" && role !== "excluded" && role !== "unclassified") return;
      const cents = parseMoney(value);
      if (cents === null) {
        push(bad.money, header, label);
        return;
      }
      if (cents === 0) return;
      if (role === "included") includedCents += cents;
      if (role === "excluded") {
        excludedCents += cents;
        excludedBreakdown[header] = cents;
      }
      if (role === "unclassified") {
        unclassifiedCents += cents;
        unclassifiedBreakdown[header] = cents;
      }
    });

    if (totalCents !== null && includedCents + excludedCents + unclassifiedCents !== totalCents) {
      bad.unbalanced.push(label);
    }
    if (!status || !start || !end || totalCents === null) return;

    const hours = (end.utc - start.utc) / 3_600_000;
    trips.push({
      reservationId,
      turoVehicleId,
      vin,
      vehicleLabel: cell(col.vehicleName) || cell(col.vehicle) || `Turo vehicle ${turoVehicleId}`,
      status,
      startAt: new Date(start.utc).toISOString(),
      endAt: new Date(end.utc).toISOString(),
      startDay: start.day,
      endDay: end.day,
      rentalDays: hours <= 0 ? 0 : Math.max(1, Math.ceil(hours / 24 - 1e-9)),
      totalCents,
      includedCents,
      excludedCents,
      excludedBreakdown,
      unclassifiedCents,
      unclassifiedBreakdown,
      raw,
    });
  });

  const sample = (ids: string[]) => (ids.length > 5 ? `${ids.slice(0, 5).join(", ")} and ${ids.length - 5} more` : ids.join(", "));
  if (bad.ids > 0) problems.push({ message: `${bad.ids} row${bad.ids > 1 ? "s have" : " has"} no numeric Reservation ID or Vehicle id.` });
  const duplicates = [...seen].filter(([, count]) => count > 1).map(([id]) => id);
  if (duplicates.length > 0) problems.push({ message: `Reservation IDs appear more than once: ${sample(duplicates)}.`, reservationIds: duplicates });
  for (const [value, ids] of bad.status) {
    problems.push({ message: `Unknown trip status "${value}" on reservation${ids.length > 1 ? "s" : ""} ${sample(ids)}.`, reservationIds: ids });
  }
  if (bad.date.length > 0) {
    problems.push({ message: `Trip start or end can't be read on reservation${bad.date.length > 1 ? "s" : ""} ${sample(bad.date)}.`, reservationIds: bad.date });
  }
  for (const [column, ids] of bad.money) {
    problems.push({ message: `"${column}" isn't a dollar amount on reservation${ids.length > 1 ? "s" : ""} ${sample(ids)}.`, reservationIds: ids });
  }
  if (bad.vin.length > 0) {
    problems.push({ message: `Missing or invalid VIN on reservation${bad.vin.length > 1 ? "s" : ""} ${sample(bad.vin)}.`, reservationIds: bad.vin });
  }
  if (bad.unbalanced.length > 0) {
    problems.push({
      message: `The line items don't add up to Total earnings on reservation${bad.unbalanced.length > 1 ? "s" : ""} ${sample(bad.unbalanced)}. Turo may have added a column.`,
      reservationIds: bad.unbalanced,
    });
  }

  return { trips, problems, extraColumns, droppedColumns };
}
