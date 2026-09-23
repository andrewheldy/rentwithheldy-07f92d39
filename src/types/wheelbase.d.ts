import type React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "landing-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          layout?: "full" | "horizontal" | "compact";
          locale?: string;
          "target-url"?: string;
          title?: string;
          subtitle?: string;
          "button-label"?: string;
          "primary-color"?: string;
          "primary-hover-color"?: string;
          "primary-foreground-color"?: string;
          "surface-color"?: string;
          radius?: "subtle" | "soft" | "round";
        },
        HTMLElement
      >;
    }
  }
}

export {};
