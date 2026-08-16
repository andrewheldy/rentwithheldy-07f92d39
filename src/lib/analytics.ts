export type AnalyticsEvent =
  | "conversion_path_selected"
  | "drive_for_work_view"
  | "driver_funnel_started"
  | "driver_platform_selected"
  | "driver_vehicle_category_selected"
  | "driver_budget_selected"
  | "empower_referral_clicked"
  | "driver_funnel_completed"
  | "list_vehicle_view"
  | "consignment_funnel_started"
  | "consignment_vehicle_type_selected"
  | "consignment_photo_uploaded"
  | "consignment_funnel_completed"
  | "passenger_vans_page_view"
  | "passenger_vans_cta_click"
  | "passenger_vans_vehicle_cta"
  | "passenger_vans_wheelbase_launch"
  | "passenger_vans_use_case_select"
  | "passenger_vans_inquiry_start"
  | "passenger_vans_inquiry_submit"
  | "passenger_vans_concierge_inquiry"
  | "passenger_vans_professional_driver_inquiry"
  | "passenger_vans_consignment_cta"
  | "passenger_vans_consignment_start"
  | "passenger_vans_consignment_submit"
  | "home_booking_widget_view"
  | "home_booking_widget_submit"
  | "home_plan_trip_click"
  | "home_browse_fleet_click"
  | "home_booking_widget_fallback"
  | "wheelbase_widget_loaded";

type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsValue>;

const SENSITIVE_PROPERTY_KEY = /(^|_)(first_?name|last_?name|full_?name|name|email|phone|mobile|vin)($|_)/i;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, AnalyticsValue>>;
  }
}

const getDeviceContext = () => {
  if (typeof window === "undefined") return "unknown";
  if (typeof window.matchMedia !== "function") return "unknown";
  if (window.matchMedia("(max-width: 639px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1023px)").matches) return "tablet";
  return "desktop";
};

const getAttribution = (): AnalyticsProperties => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);

  let safeReferrer = "direct";
  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      safeReferrer = `${referrer.origin}${referrer.pathname}`;
    } catch {
      safeReferrer = "direct";
    }
  }

  return {
    page_path: window.location.pathname,
    device_context: getDeviceContext(),
    referrer: safeReferrer,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
};

/**
 * Provider-neutral analytics bridge. The site does not currently ship an
 * analytics provider, so events are exposed to an existing/future dataLayer
 * and as a DOM CustomEvent without adding another vendor or blocking the UI.
 */
export const track = (
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
) => {
  if (typeof window === "undefined") return;

  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([key]) => !SENSITIVE_PROPERTY_KEY.test(key)),
  );
  const detail = {
    event,
    ...getAttribution(),
    ...safeProperties,
  };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(detail);
  window.dispatchEvent(
    new CustomEvent("rentwithheldy:analytics", { detail }),
  );
};
