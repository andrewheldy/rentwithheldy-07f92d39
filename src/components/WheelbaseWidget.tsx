import { useEffect, useRef } from "react";

const WheelbaseWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set global config
    (window as any).Outdoorsy = (window as any).Outdoorsy || {};
    (window as any).Outdoorsy.color = "1b4a8f";

    // Remove any previously injected wheelbase script so it re-scans the DOM
    const existing = document.querySelector('script[src*="wheelbase.min.js"]');
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.src = "https://d3cuf6g1arkgx6.cloudfront.net/sdk/wheelbase.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      script.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="outdoorsy-book-now-container"
      data-owner="4913818"
      data-color="000000"
    />
  );
};

export default WheelbaseWidget;
