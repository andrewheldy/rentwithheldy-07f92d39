import * as React from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render as a different element (e.g. "section", "li"). Defaults to div. */
  as?: React.ElementType;
  /** Stagger delay in ms applied once the element enters the viewport. */
  delay?: number;
}

/**
 * Scroll-reveal primitive — CSS transition driven by IntersectionObserver.
 * No animation library. Fires once at 20% visibility. Respects
 * prefers-reduced-motion (renders visible immediately, no transition).
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(
  ({ as: Tag = "div", className, delay = 0, style, children, ...props }, forwardedRef) => {
    const innerRef = React.useRef<HTMLElement | null>(null);
    const [shown, setShown] = React.useState(false);

    React.useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      // No observer support, or user prefers reduced motion → show immediately.
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (typeof IntersectionObserver === "undefined" || reduce) {
        setShown(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setShown(true);
              observer.disconnect();
            }
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const setRefs = (node: HTMLElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node as HTMLDivElement);
      else if (forwardedRef) forwardedRef.current = node as HTMLDivElement;
    };

    return (
      <Tag
        ref={setRefs}
        className={cn("reveal", shown && "reveal-in", className)}
        style={{ transitionDelay: shown ? `${delay}ms` : "0ms", ...style }}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
Reveal.displayName = "Reveal";
