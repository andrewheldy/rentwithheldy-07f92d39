import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeLocale } from "@/i18n/config";
import { track } from "@/lib/analytics";
import {
  getTripLengthDays,
  getWheelbaseLocale,
  loadWheelbaseComponents,
  toCanonicalWheelbaseDate,
  type LandingWidgetElement,
  type WheelbaseLandingSubmitPayload,
} from "@/lib/wheelbase";

type WidgetStatus = "loading" | "ready" | "failed";

const HomeBookingWidget = () => {
  const { t, i18n } = useTranslation("home");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const trackedView = useRef(false);
  const locale = normalizeLocale(i18n.language);
  const wheelbaseLocale = getWheelbaseLocale(locale);

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
        navigate("/book");
        return;
      }

      track("home_booking_widget_submit", {
        source: "homepage",
        locale,
        trip_length_days: getTripLengthDays(pickup, returnDate),
      });

      const search = new URLSearchParams({
        "wb-from": pickup,
        "wb-to": returnDate,
      });
      navigate(`/book?${search.toString()}`);
    },
    [locale, navigate],
  );

  const setWidgetRef = useCallback(
    (element: LandingWidgetElement | null) => {
      if (element) element.onSubmit = handleSubmit;
    },
    [handleSubmit],
  );

  return (
    <section
      aria-labelledby="home-booking-title"
      className="bg-background py-7 sm:py-9"
      data-testid="home-booking-widget"
    >
      <div className="container mx-auto">
        <div className="rounded-card border border-border bg-card p-4 shadow-card sm:p-6 lg:grid lg:grid-cols-[minmax(12rem,0.32fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
          <div className="mb-5 lg:mb-0">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {t("bookingWidget.eyebrow")}
            </p>
            <h2 id="home-booking-title" className="font-heading text-2xl font-bold text-ink sm:text-[1.7rem]">
              {t("bookingWidget.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("bookingWidget.description")}
            </p>
          </div>

          <div className="min-w-0" dir="ltr">
            <div className="relative min-h-[10rem] w-full sm:min-h-[6.75rem]">
              {status === "loading" ? (
                <div
                  className="grid min-h-[10rem] animate-pulse grid-cols-2 grid-rows-2 gap-3 rounded-control bg-secondary/55 p-4 motion-reduce:animate-none sm:min-h-[6.75rem] sm:grid-cols-[1fr_1fr_0.9fr] sm:grid-rows-1 sm:items-center"
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
                <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-control border border-border bg-secondary/45 p-5 text-center sm:min-h-[6.75rem] sm:flex-row sm:justify-between sm:text-start">
                  <p className="max-w-lg text-sm text-muted-foreground">
                    {t("bookingWidget.unavailable")}
                  </p>
                  <Link
                    to="/book"
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[hsl(var(--primary-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:mt-0 sm:ms-5"
                  >
                    {t("bookingWidget.button")}
                  </Link>
                </div>
              ) : null}
            </div>

            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-medium text-muted-foreground sm:justify-start sm:text-start" dir={i18n.dir()}>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {t("bookingWidget.reassurance")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeBookingWidget;
