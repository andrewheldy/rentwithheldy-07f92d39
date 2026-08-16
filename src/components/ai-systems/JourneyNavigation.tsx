import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { journeyChapters } from "@/data/ai-systems";

export function JourneyNavigation() {
  const { t } = useTranslation("aiSystems");
  const [activeIndex, setActiveIndex] = useState(0);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const chapters = journeyChapters
      .map((chapter) => document.getElementById(`chapter-${chapter}`))
      .filter((chapter): chapter is HTMLElement => Boolean(chapter));
    if (!chapters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const target = visible[0]?.target as HTMLElement | undefined;
        if (target) setActiveIndex(Number(target.dataset.index ?? 0));
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.08, 0.2, 0.5] },
    );
    chapters.forEach((chapter) => observer.observe(chapter));

    let frame = 0;
    let scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const writeProgress = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      progressRef.current?.style.setProperty("--ai-journey-progress", String(progress));
    };
    const requestWrite = () => {
      if (!frame) frame = window.requestAnimationFrame(writeProgress);
    };
    const handleResize = () => {
      scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      requestWrite();
    };

    writeProgress();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", handleResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const moveToChapter = useCallback((event: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    const target = document.getElementById(`chapter-${journeyChapters[index]}`);
    if (!target) return;
    event.preventDefault();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.history.replaceState(null, "", `#${target.id}`);
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);

  const current = journeyChapters[activeIndex];

  return (
    <>
      <nav className="ai-journey-rail" aria-label={t("journey.label")}>
        <span className="ai-journey-progress" aria-hidden="true">
          <span ref={progressRef} className="ai-journey-progress-fill" />
        </span>
        <ol>
          {journeyChapters.map((chapter, index) => (
            <li key={chapter} data-active={index === activeIndex}>
              <a
                href={`#chapter-${chapter}`}
                aria-current={index === activeIndex ? "location" : undefined}
                onClick={(event) => moveToChapter(event, index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{t(`journey.chapters.${chapter}`)}</strong>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="ai-journey-mobile" aria-live="polite">
        <div>
          <span>{String(activeIndex + 1).padStart(2, "0")} / {String(journeyChapters.length).padStart(2, "0")}</span>
          <strong>{t(`journey.chapters.${current}`)}</strong>
        </div>
        <span className="ai-journey-mobile-line" aria-hidden="true">
          <i style={{ transform: `scaleX(${(activeIndex + 1) / journeyChapters.length})` }} />
        </span>
      </div>
    </>
  );
}
