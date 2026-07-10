/**
 * i18n configuration constants and pure helpers.
 *
 * English is the default AND fallback language. Spanish, French, Portuguese,
 * and Hebrew fall back to English until approved translations land in Phase 2
 * (see src/i18n/locales/README.md). These helpers are pure so they can be unit
 * tested without booting i18next.
 */

export const SUPPORTED_LOCALES = ["en", "es", "fr", "pt", "he"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const FALLBACK_LOCALE: Locale = "en";

/** localStorage key holding the user's manual language choice. */
export const LOCALE_STORAGE_KEY = "rwh.lang";

/**
 * Translation namespaces. English is the canonical key set that `i18n:check`
 * compares every other locale against. Keep this list in sync with the JSON
 * files under locales/en/.
 */
export const NAMESPACES = [
  "common",
  "navigation",
  "home",
  "fleet",
  "services",
  "locations",
  "rentToOwn",
  "howItWorks",
  "faq",
  "contact",
  "forms",
  "footer",
  "booking",
  "legal",
  "seo",
] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: Namespace = "common";

const SUPPORTED_SET = new Set<string>(SUPPORTED_LOCALES);

export function isSupportedLocale(
  value: string | null | undefined,
): value is Locale {
  return typeof value === "string" && SUPPORTED_SET.has(value);
}

/**
 * Normalize a raw BCP-47 language tag to a supported locale. Regional variants
 * collapse to their base language (es-MX → es, fr-CA → fr, pt-BR / pt-PT → pt,
 * he-IL → he). Anything unsupported falls back to English.
 */
export function normalizeLocale(raw: string | null | undefined): Locale {
  if (!raw) return DEFAULT_LOCALE;
  const base = raw.toLowerCase().split(/[-_]/)[0];
  return isSupportedLocale(base) ? base : DEFAULT_LOCALE;
}
