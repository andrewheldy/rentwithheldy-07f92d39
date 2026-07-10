import { useTranslation } from "react-i18next";
import type { Namespace } from "./config";

/**
 * ENGLISH-ONLY LEGAL CONTENT — SINGLE SOURCE OF TRUTH
 * ---------------------------------------------------
 * Substantive legal content (Florida-law explanations, statutory references,
 * loss-of-use methodology, attorney-facing legal statements, and the Terms /
 * Privacy bodies) is authored and displayed in ENGLISH ONLY. A translation
 * could unintentionally alter its legal meaning, so it is never machine-
 * translated or forked into the locale files.
 *
 * This hook returns a `t` bound to the ENGLISH bundle for `ns`, regardless of
 * the active UI language. Non-English locales simply omit these keys and this
 * hook reads them straight from `en/*.json` — the one and only source of truth.
 *
 * Marketing / UI chrome that surrounds the legal body should keep using the
 * normal `useTranslation` so it localizes as usual. Pair this with
 * <EnglishLegalContent> (LTR container) and <EnglishLegalNotice> (translated
 * preface) to render the English body correctly inside any locale, RTL included.
 */
export function useEnglishT(ns: Namespace) {
  // Subscribe to i18n so the component still re-renders on a language change
  // (its surrounding marketing copy needs to re-localize). The returned `t` is
  // pinned to English, so the legal strings it produces never change.
  const { i18n } = useTranslation(ns);
  return i18n.getFixedT("en", ns);
}
