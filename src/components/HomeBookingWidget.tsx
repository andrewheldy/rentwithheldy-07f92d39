import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeLocale } from "@/i18n/config";
import { track } from "@/lib/analytics";
import {
  buildWheelbaseStoreUrl,
  getTripLengthDays,
  getWheelbaseLocale,
  loadWheelbaseComponents,
  toCanonicalWheelbaseDate,
  type LandingWidgetElement,
  type WheelbaseLandingSubmitPayload,
} from "@/lib/wheelbase";

type WidgetStatus = "loading" | "ready" | "failed";

/**
 * Homepage date picker (current Wheelbase <landing-widget>). Submitting sends
 * the visitor straight to our hosted Wheelbase store with the dates prefilled.
 */
const HomeBookingWidget = () => {
  const { t, i18n } = useTranslation("home");
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const trackedView = useRef(false);
  const locale = normalizeLocale(i18n.language);
  const wheelbaseLocale = getWheelbaseLocale(locale);
  const storeUrl = buildWheelbaseStoreUrl(locale);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idleCallback: number | undefined;

    const startLoading = () => {
      void loadWheelbaseComponents()
        .then(() => {
          if (active) setStatus("ready");
        })
        .catch(() => {
          if (!active) return;
          setStatus("failed");
          track("home_booking_widget_fallback", {
            source: "homepage",
            locale,
          });
        });
    };

    if (typeof window.requestIdleCallback === "function") {
      idleCallback = window.requestIdleCallback(startLoading, { timeout: 1_500 });
    } else {
      timer = globalThis.setTimeout(startLoading, 0);
    }

    return () => {
      active = false;
      if (timer !== undefined) globalThis.clearTimeout(timer);
      if (idleCallback !== undefined) window.cancelIdleCallback(idleCallback);
    };
  }, [locale]);

  useEffect(() => {
    if (status !== "ready" || trackedView.current) return;
    trackedView.current = true;
    track("home_booking_widget_view", { source: "homepage", locale });
  }, [locale, status]);

  const handleSubmit = useCallback(
    (payload: WheelbaseLandingSubmitPayload) => {
      let pickup: string;
      let returnDate: string;

      try {
        pickup = toCanonicalWheelbaseDate(payload.pickup);
        returnDate = toCanonicalWheelbaseDate(payload.returnDate);
      } catch {
        window.location.assign(storeUrl);
        return;
      }

      track("home_booking_widget_submit", {
        source: "homepage",
        locale,
        trip_length_days: getTripLengthDays(pickup, returnDate),
      });

      const search = new URLSearchParams({ wb_from: pickup, wb_to: returnDate });
      if (payload.pickupTime) search.set("wb_from_time", payload.pickupTime);
      if (payload.returnTime) search.set("wb_to_time", payload.returnTime);
      window.location.assign(buildWheelbaseStoreUrl(locale, search.toString()));
    },
    [locale, storeUrl],
  );

  const setWidgetRef = useCallback(
    (element: LandingWidgetElement | null) => {
      if (element) element.onSubmit = handleSubmit;
    },
    [handleSubmit],
  );

  return (
    <div
      className="min-w-0 rounded-card bg-white p-2 shadow-card sm:p-3"
      data-testid="home-booking-widget"
      dir="ltr"
    >
      <div className="relative min-h-[10rem] w-full sm:min-h-[5.5rem]">
        {status === "loading" ? (
          <div
            className="grid min-h-[10rem] animate-pulse grid-cols-2 grid-rows-2 gap-3 rounded-control bg-secondary/55 p-4 motion-reduce:animate-none sm:min-h-[5.5rem] sm:grid-cols-[1fr_1fr_0.9fr] sm:grid-rows-1 sm:items-center"
            aria-label={t("bookingWidget.loading")}
            role="status"
          >
            <span className="h-12 rounded-control bg-border/65" />
            <span className="h-12 rounded-control bg-border/65" />
            <span className="col-span-2 h-12 rounded-control bg-primary/25 sm:col-span-1" />
          </div>
        ) : null}

        {status === "ready" ? (
          <landing-widget
            ref={setWidgetRef}
            style={{ display: "block", width: "100%", maxWidth: "100%" }}
            layout={isMobile ? "full" : "horizontal"}
            locale={wheelbaseLocale}
            target-url={storeUrl}
            title=""
            subtitle=""
            button-label={t("bookingWidget.button")}
            primary-color="#11d4d4"
            primary-hover-color="#0fa5a5"
            primary-foreground-color="#12212e"
            surface-color="#ffffff"
            radius="soft"
            aria-label={t("bookingWidget.accessibleLabel")}
            data-testid="wheelbase-landing-widget"
          >
            <span slot="footer" aria-hidden="true" />
          </landing-widget>
        ) : null}

        {status === "failed" ? (
          <div
            className="flex min-h-[10rem] flex-col items-center justify-center rounded-control bg-secondary/45 p-5 text-center sm:min-h-[5.5rem] sm:flex-row sm:justify-between sm:text-start"
            dir={i18n.dir()}
          >
            <p className="max-w-lg text-sm text-muted-foreground">
              {t("bookingWidget.unavailable")}
            </p>
            <a
              href={storeUrl}
              className="mt-4 inline-flex min-h-11 shrink-0 items-center justify-center rounded-control bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[hsl(var(--primary-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:ms-5 sm:mt-0"
            >
              {t("bookingWidget.button")}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HomeBookingWidget;
