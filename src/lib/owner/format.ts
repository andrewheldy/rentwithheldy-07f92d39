// Locale-aware formatting for the owner dashboard. Money is USD in every
// locale; only the number and date style follow the viewer's language.

const intlLocale = (language: string) => (language === "he" ? "he-IL" : language === "pt" ? "pt-BR" : language);

export function formatMoney(cents: number, language: string, withCents = false) {
  return new Intl.NumberFormat(intlLocale(language), {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  }).format(cents / 100);
}

/** Axis ticks: $0, $500, $1.5K. */
export function formatMoneyCompact(cents: number, language: string) {
  return new Intl.NumberFormat(intlLocale(language), {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

/** 61 → "61%", 54.5 → "54.5%". */
export function formatPercent(value: number, language: string) {
  return new Intl.NumberFormat(intlLocale(language), { style: "percent", maximumFractionDigits: 1 }).format(value / 100);
}

export function formatNumber(value: number, language: string, fractionDigits = 0) {
  return new Intl.NumberFormat(intlLocale(language), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

const utcDate = (day: string) => new Date(`${day.slice(0, 10)}T12:00:00Z`);

/** "Sep 17, 2026" in the viewer's language. */
export function formatDay(day: string, language: string) {
  return new Intl.DateTimeFormat(intlLocale(language), { dateStyle: "medium", timeZone: "UTC" }).format(utcDate(day));
}

/** "Sep 2026" for a month's first day. */
export function formatMonth(month: string, language: string, style: "short" | "long" = "short") {
  return new Intl.DateTimeFormat(intlLocale(language), { month: style, year: "numeric", timeZone: "UTC" }).format(utcDate(month));
}

export function formatDayRange(from: string, to: string, language: string) {
  const format = new Intl.DateTimeFormat(intlLocale(language), { dateStyle: "medium", timeZone: "UTC" }) as Intl.DateTimeFormat & {
    formatRange: (start: Date, end: Date) => string;
  };
  return format.formatRange(utcDate(from), utcDate(to));
}

/** Share of a total as a percentage, or null for an empty total. */
export const shareOf = (part: number, total: number) => (total > 0 ? Math.round((1000 * part) / total) / 10 : null);
