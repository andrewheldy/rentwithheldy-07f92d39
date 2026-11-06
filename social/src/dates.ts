// Calendar-day helpers in the business timezone (America/New_York).

export function localDate(date: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function offsetMs(instant: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value]),
  );
  const wall = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return wall - instant;
}

/** Unix seconds for local midnight at the start of `day` and of the next day. */
export function dayBounds(day: string, timeZone: string): { since: number; until: number } {
  const midnight = (value: string) => {
    const guess = Date.parse(`${value}T00:00:00Z`);
    const first = guess - offsetMs(guess, timeZone);
    // Second pass handles days where the offset changes (DST).
    return guess - offsetMs(first, timeZone);
  };
  return { since: Math.floor(midnight(day) / 1000), until: Math.floor(midnight(addDays(day, 1)) / 1000) };
}

/** Days to collect: the `count` complete days before today, oldest first. */
export function recentDays(now: Date, timeZone: string, count: number): string[] {
  const today = localDate(now, timeZone);
  return Array.from({ length: count }, (_, index) => addDays(today, -(count - index)));
}
