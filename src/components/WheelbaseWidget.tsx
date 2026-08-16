import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { track } from "@/lib/analytics";
import { getWheelbaseLocale } from "@/lib/wheelbase";

declare global {
  interface Window {
    Outdoorsy?: { color?: string };
  }
}

const WheelbaseWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation("booking");
  const locale = getWheelbaseLocale(i18n.language);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set global config
    window.Outdoorsy = window.Outdoorsy || {};
    window.Outdoorsy.color = "1b4a8f";

    // Create the container element that the SDK expects
    const widgetDiv = document.createElement("div");
    widgetDiv.id = "outdoorsy-book-now-container";
    widgetDiv.setAttribute("data-owner", "4913818");
    widgetDiv.setAttribute("data-color", "000000");
    widgetDiv.setAttribute("data-locale", locale);
    container.appendChild(widgetDiv);

    // Load the script fresh — the SDK scans for the container on load
    const script = document.createElement("script");
    script.src = "https://d3cuf6g1arkgx6.cloudfront.net/sdk/wheelbase.min.js";
    script.async = true;
    script.addEventListener("load", () => {
      track("wheelbase_widget_loaded", { locale });
    }, { once: true });
    document.body.appendChild(script);

    return () => {
      script.remove();
      container.replaceChildren();
      // Clean up global state so it can reinitialize
      delete window.Outdoorsy;
    };
  }, [locale]);

  return (
    <div
      ref={containerRef}
      data-testid="wheelbase-widget"
      role="region"
      aria-label={t("book.widgetLabel")}
      dir="ltr"
      className="min-h-[200px] w-full max-w-full overflow-x-auto [contain:inline-size]"
    />
  );
};

export default WheelbaseWidget;
