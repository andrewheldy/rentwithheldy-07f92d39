import type { Locale } from "./config";

export interface LanguageOption {
  /** BCP-47 base code — also the locale-folder name under locales/. */
  code: Locale;
  /** Native language name shown in the dropdown (never a flag). */
  nativeName: string;
  /** Compact label shown on the collapsed selector trigger. */
  shortLabel: string;
  /** Text direction for this language. */
  dir: "ltr" | "rtl";
}

/**
 * Display metadata for the language selector. Native names only — no flags,
 * since a flag never maps cleanly to a language. Array order is dropdown order.
 */
export const LANGUAGES: LanguageOption[] = [
  { code: "en", nativeName: "English", shortLabel: "EN", dir: "ltr" },
  { code: "es", nativeName: "Español", shortLabel: "ES", dir: "ltr" },
  { code: "fr", nativeName: "Français", shortLabel: "FR", dir: "ltr" },
  { code: "pt", nativeName: "Português", shortLabel: "PT", dir: "ltr" },
  { code: "he", nativeName: "עברית", shortLabel: "HE", dir: "rtl" },
];

export const LANGUAGE_BY_CODE = LANGUAGES.reduce(
  (acc, l) => {
    acc[l.code] = l;
    return acc;
  },
  {} as Record<Locale, LanguageOption>,
);
