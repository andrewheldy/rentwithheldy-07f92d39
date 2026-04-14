import { useEffect, useRef, useState } from "react";

const WheelbaseWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || loaded) return;

    // Set global config
    (window as any).Outdoorsy = (window as any).Outdoorsy || {};
    (window as any).Outdoorsy.color = "1b4a8f";

    // Create the container element that the SDK expects
    const widgetDiv = document.createElement("div");
    widgetDiv.id = "outdoorsy-book-now-container";
    widgetDiv.setAttribute("data-owner", "4913818");
    widgetDiv.setAttribute("data-color", "000000");
    containerRef.current.appendChild(widgetDiv);

    // Load the script fresh — the SDK scans for the container on load
    const script = document.createElement("script");
    script.src = "https://d3cuf6g1arkgx6.cloudfront.net/sdk/wheelbase.min.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {
      script.remove();
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      setLoaded(false);
      // Clean up global state so it can reinitialize
      delete (window as any).Outdoorsy;
    };
  }, []);

  return <div ref={containerRef} className="min-h-[200px]" />;
};

export default WheelbaseWidget;
