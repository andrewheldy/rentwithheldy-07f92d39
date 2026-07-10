import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  DEFAULT_NAMESPACE,
  FALLBACK_LOCALE,
  LOCALE_STORAGE_KEY,
  NAMESPACES,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  normalizeLocale,
  type Locale,
} from "./config";
import { applyDocumentDirection } from "./direction";

/**
 * English is bundled EAGERLY: it is the canonical fallback and must paint on
 * the first frame with zero async work. The other locales are LAZY: each is a
 * separate chunk fetched only when that language is selected, so they never
 * weigh down the initial bundle. Until approved translations land (Phase 2)
 * their namespace files are `{}` and every string falls back to English —
 * never a raw key, never an empty string.
 */
const enModules = import.meta.glob("./locales/en/*.json", { eager: true });
const lazyModules = import.meta.glob("./locales/{es,fr,pt,he}/*.json");

/** "./locales/en/home.json" → "home" */
function nsFromPath(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/, "");
}

const enResources: Record<string, Record<string, unknown>> = {};
for (const [path, mod] of Object.entries(enModules)) {
  enResources[nsFromPath(path)] = (
    mod as { default: Record<string, unknown> }
  ).default;
}

const loadedLocales = new Set<Locale>(["en"]);
const loadingLocales = new Map<Locale, Promise<void>>();

/** Lazily import and register every namespace bundle for a locale. */
export async function loadLocale(locale: Locale): Promise<void> {
  if (loadedLocales.has(locale)) return;
  const inFlight = loadingLocales.get(locale);
  if (inFlight) return inFlight;

  const load = (async () => {
    const entries = Object.entries(lazyModules).filter(([p]) =>
      p.includes(`/locales/${locale}/`),
    );
    await Promise.all(
      entries.map(async ([path, importer]) => {
        const mod = (await importer()) as { default: Record<string, unknown> };
        // deep + overwrite so a partial translation merges over English fallback
        i18n.addResourceBundle(locale, nsFromPath(path), mod.default, true, true);
      }),
    );
    loadedLocales.add(locale);
  })().finally(() => {
    loadingLocales.delete(locale);
  });

  loadingLocales.set(locale, load);
  return load;
}

/**
 * Best initial guess before React mounts: a saved manual choice always wins
 * over browser detection. Mirrors the runtime detector order below so the
 * pre-render direction/lang we set matches what i18next resolves to.
 */
function detectInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isSupportedLocale(saved)) return saved;
  } catch {
    /* localStorage blocked (private mode) — fall through to browser language */
  }
  if (typeof navigator !== "undefined") return normalizeLocale(navigator.language);
  return FALLBACK_LOCALE;
}

const initialLocale = detectInitialLocale();

// Paint <html lang/dir> correctly from the very first frame (no RTL flash).
applyDocumentDirection(initialLocale);

const initialization = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: enResources },
    lng: initialLocale,
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    // es-MX → es, pt-BR → pt, etc. — region is stripped to the base language.
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    ns: NAMESPACES as unknown as string[],
    defaultNS: DEFAULT_NAMESPACE,
    fallbackNS: DEFAULT_NAMESPACE,
    interpolation: { escapeValue: false }, // React already escapes
    returnEmptyString: false, // empty translations fall back to English
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ["localStorage"], // persists a manual selection
    },
    react: {
      useSuspense: false, // en is ready synchronously; no suspense
      // Non-English namespaces load lazily via addResourceBundle — after the
      // first paint on initial load, and again after a runtime language switch.
      // Re-render subscribed components when those bundles arrive so the
      // translations actually appear; without this a lazily-loaded locale stays
      // on the English fallback until the next unrelated re-render. English is
      // unaffected: it is bundled eagerly and emits no "added" events.
      bindI18nStore: "added",
    },
  });

// Keep <html lang/dir> in sync and ensure the active locale's bundles exist.
i18n.on("languageChanged", (lng) => {
  const locale = normalizeLocale(lng);
  applyDocumentDirection(locale);
  void loadLocale(locale);
});

/**
 * Initial rendering waits only for the selected locale. English remains fully
 * eager, while each non-English locale is still code-split and fetched only
 * when selected. This prevents an English fallback frame (including Helmet
 * metadata) from being committed before the active locale is ready.
 */
export const i18nReady = initialization.then(async () => {
  await loadLocale(initialLocale);
  applyDocumentDirection(initialLocale);
  return i18n;
});

export default i18n;
