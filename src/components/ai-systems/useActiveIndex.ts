import { useEffect, useState } from "react";

export function useActiveIndex(selector: string, itemCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!items.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const next = visible[0]?.target as HTMLElement | undefined;
        if (next) setActiveIndex(Number(next.dataset.index ?? 0));
      },
      {
        rootMargin: "-24% 0px -52% 0px",
        threshold: [0, 0.15, 0.35, 0.65],
      },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [selector]);

  return Math.min(activeIndex, Math.max(0, itemCount - 1));
}
