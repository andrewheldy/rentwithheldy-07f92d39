import { normalizeLocale } from "./config";
import { LANGUAGE_BY_CODE } from "./languages";

export type Direction = "ltr" | "rtl";

/** Text direction for a locale. Hebrew is the only RTL language in Phase 1. */
export function getDirection(locale: string): Direction {
  return LANGUAGE_BY_CODE[normalizeLocale(locale)]?.dir ?? "ltr";
}

export function isRTL(locale: string): boolean {
  return getDirection(locale) === "rtl";
}

/**
 * Reflect the active locale onto <html>. `lang` drives hyphenation and screen
 * readers; `dir` drives logical CSS + document flow. This is the single source
 * of truth for the document's language/direction — Helmet does not manage them,
 * which avoids a race between the two systems.
 */
export function applyDocumentDirection(locale: string): void {
  if (typeof document === "undefined") return;
  const l = normalizeLocale(locale);
  const root = document.documentElement;
  root.setAttribute("lang", l);
  root.setAttribute("dir", getDirection(l));
}
