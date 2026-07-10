import { useTranslation } from "react-i18next";
import { useReducedMotion } from "motion/react";

// Ten authentic five-star Turo review screenshots from Rent With Heldy guests.
// Files live in src/assets/testimonials and are shown verbatim — never cropped
// so the guest name, star rating, date, vehicle, and text stay readable
// (object-contain, not cover). Order interleaves short/medium/long reviews and
// alternates vehicles/names for visual variety.
import t01 from "@/assets/testimonials/TESTIMONIALS_01.png";
import t02 from "@/assets/testimonials/TESTIMONIALS_02.png";
import t03 from "@/assets/testimonials/TESTIMONIALS_03.png";
import t04 from "@/assets/testimonials/TESTIMONIALS_04.png";
import t05 from "@/assets/testimonials/TESTIMONIALS_05.png";
import t06 from "@/assets/testimonials/TESTIMONIALS_06.png";
import t07 from "@/assets/testimonials/TESTIMONIALS_07.png";
import t08 from "@/assets/testimonials/TESTIMONIALS_08.png";
import t09 from "@/assets/testimonials/TESTIMONIALS_09.png";
import t10 from "@/assets/testimonials/TESTIMONIALS_10.png";

// Guest name + vehicle drive only the alt text. Proper nouns (names, makes,
// models) are intentionally NOT translated.
type Review = { src: string; name: string; vehicle: string };

const REVIEWS: Review[] = [
  { src: t08, name: "Farah", vehicle: "Audi Q5" },
  { src: t01, name: "Emily", vehicle: "Audi Q5" },
  { src: t05, name: "Sophia", vehicle: "Volkswagen Taos" },
  { src: t02, name: "Steven Vincent", vehicle: "Audi Q5" },
  { src: t09, name: "Christopher", vehicle: "Volkswagen Taos" },
  { src: t04, name: "Domique", vehicle: "Audi Q5" },
  { src: t06, name: "Roy", vehicle: "Volkswagen Taos" },
  { src: t03, name: "Brandon", vehicle: "Audi Q5" },
  { src: t10, name: "Guillaume", vehicle: "Audi Q5" },
  { src: t07, name: "Lawrence", vehicle: "Volkswagen Taos" },
];

const Screenshot = ({ review, alt }: { review: Review; alt: string }) => (
  <div className="h-[220px] shrink-0 overflow-hidden rounded-card border border-border bg-white shadow-card sm:h-[260px]">
    <img
      src={review.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="h-full w-auto max-w-none object-contain"
    />
  </div>
);

const ReviewsMarquee = () => {
  const { t } = useTranslation(["home"]);
  const reduce = useReducedMotion();

  const altFor = (r: Review) =>
    t("reviews.altPattern", { name: r.name, vehicle: r.vehicle });

  // Reduced-motion / no-autoplay: a single static row the user scrolls by hand.
  if (reduce) {
    return (
      <div
        className="flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]"
        role="region"
        aria-label={t("reviews.ariaLabel")}
        tabIndex={0}
      >
        {REVIEWS.map((r, i) => (
          <Screenshot key={i} review={r} alt={altFor(r)} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden"
      role="region"
      aria-label={t("reviews.ariaLabel")}
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

      {/* One track holding two identical sets. The animation shifts it -50% so
          the second set slides exactly into the first's place — no jump, no gap.
          Pauses on hover and keyboard focus so a screenshot can be read. */}
      <div
        className="flex w-max gap-4 py-2 animate-marquee will-change-transform group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
        style={{ animationDuration: "80s" }}
      >
        {/* Real set — announced to assistive tech */}
        {REVIEWS.map((r, i) => (
          <Screenshot key={`a-${i}`} review={r} alt={altFor(r)} />
        ))}
        {/* Visual duplicate for the seamless loop — hidden from screen readers
            so reviews aren't announced twice. */}
        {REVIEWS.map((r, i) => (
          <div key={`b-${i}`} aria-hidden="true">
            <Screenshot review={r} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsMarquee;
