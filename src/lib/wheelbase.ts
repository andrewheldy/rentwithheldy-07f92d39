import { normalizeLocale, type Locale } from "@/i18n/config";

export const WHEELBASE_WIDGET_SRC =
  "https://d2toxav8qvoos4.cloudfront.net/latest/wheelbase-widget.js";

const WHEELBASE_LOCALES: Partial<Record<Locale, string>> = {
  en: "en-us",
  es: "es-es",
  fr: "fr-fr",
};

const LANDING_WIDGET_TAG = "landing-widget";
const LOAD_TIMEOUT_MS = 15_000;

let wheelbaseLoadPromise: Promise<void> | null = null;

export type WheelbaseLandingSubmitPayload = {
  pickup: Date | string;
  returnDate: Date | string;
  pickupTime?: string;
  returnTime?: string;
  url: string;
};

export type LandingWidgetElement = HTMLElement & {
  onSubmit?: (payload: WheelbaseLandingSubmitPayload) => void;
};

export function getWheelbaseLocale(locale: string): string {
  return WHEELBASE_LOCALES[normalizeLocale(locale)] ?? "en-us";
}
function waitForLandingWidget(): Promise<void> {
  if (customElements.get(LANDING_WIDGET_TAG)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Wheelbase landing widget did not initialize in time."));
    }, LOAD_TIMEOUT_MS);

    customElements.whenDefined(LANDING_WIDGET_TAG).then(() => {
      window.clearTimeout(timeout);
      resolve();
    });
  });
}

/**
 * Loads the current Wheelbase web-component module once per page lifecycle.
 * The promise is shared across mounts and route changes, including StrictMode.
 * A failed load is cleared so a later mount can retry.
 *
 * Future pass: migrate /book to current <wheelbase-store> after verified
 * date-prefill behavior. Do not reuse the legacy owner ID as dealer-id unless
 * Wheelbase verifies that mapping.
 */
export function loadWheelbaseComponents(): Promise<void> {
  if (typeof window === "undefined" || typeof customElements === "undefined") {
    return Promise.reject(new Error("Wheelbase requires a browser environment."));
  }

  if (customElements.get(LANDING_WIDGET_TAG)) return Promise.resolve();
  if (wheelbaseLoadPromise) return wheelbaseLoadPromise;

  wheelbaseLoadPromise = new Promise<void>((resolve, reject) => {
    const selector = `script[src="${WHEELBASE_WIDGET_SRC}"]`;
    let script = document.querySelector<HTMLScriptElement>(selector);

    if (script?.dataset.wheelbaseState === "failed") {
      script.remove();
      script = null;
    }

    const handleLoad = () => {
      if (script) script.dataset.wheelbaseState = "loaded";
      void waitForLandingWidget().then(resolve, reject);
    };
    const handleError = () => {
      if (script) script.dataset.wheelbaseState = "failed";
      reject(new Error("Wheelbase script failed to load."));
    };

    if (script) {
      if (script.dataset.wheelbaseState === "loaded") {
        handleLoad();
      } else {
        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener("error", handleError, { once: true });
      }
      return;
    }

    script = document.createElement("script");
    script.type = "module";
    script.async = true;
    script.src = WHEELBASE_WIDGET_SRC;
    script.dataset.wheelbaseSdk = "current";
    script.dataset.wheelbaseState = "loading";
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    wheelbaseLoadPromise = null;
    throw error;
  });

  return wheelbaseLoadPromise;
}

const CANONICAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toCanonicalWheelbaseDate(value: Date | string): string {
  if (typeof value === "string" && CANONICAL_DATE.test(value)) return value;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Wheelbase returned an invalid date.");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTripLengthDays(pickup: string, returnDate: string): number {
  const from = Date.parse(`${pickup}T00:00:00Z`);
  const to = Date.parse(`${returnDate}T00:00:00Z`);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}
