export type AnalyticsEvent =
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
  | "wheelbase_widget_loaded";

type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, AnalyticsValue>>;
  }
}

const getDeviceContext = () => {
  if (typeof window === "undefined") return "unknown";
  if (window.matchMedia("(max-width: 639px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1023px)").matches) return "tablet";
  return "desktop";
};

const getAttribution = (): AnalyticsProperties => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);

  return {
    page_path: window.location.pathname,
    device_context: getDeviceContext(),
    referrer: document.referrer || "direct",
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

  const detail = {
    event,
    ...getAttribution(),
    ...properties,
  };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(detail);
  window.dispatchEvent(
    new CustomEvent("rentwithheldy:analytics", { detail }),
  );
};
