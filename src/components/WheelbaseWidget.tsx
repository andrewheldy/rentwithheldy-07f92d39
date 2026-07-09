import { useEffect } from "react";

const WheelbaseWidget = () => {
  useEffect(() => {
    // Avoid loading the script more than once
    if (document.querySelector('script[src*="wheelbase.min.js"]')) return;

    const script = document.createElement("script");
    script.src = "https://d3cuf6g1arkgx6.cloudfront.net/sdk/wheelbase.min.js";
    script.async = true;
    const entry = document.getElementsByTagName("script")[0];
    entry.parentNode?.insertBefore(script, entry);
  }, []);

  return (
    <div
      id="outdoorsy-book-now-container"
      data-owner="4913818"
      data-color="000000"
    />
  );
};

export default WheelbaseWidget;
