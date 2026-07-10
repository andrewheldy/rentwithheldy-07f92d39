import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Star, Phone, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";

// Permanent hero photograph. Licensed placeholder — swap for real Heldy
// photography when available. Fully static: no crossfade, no zoom, no pan.
// hero_sunset.png is the lossless source of record; .avif/.webp are generated
// from it 1:1 (same 1915x821 frame, no upscale) purely for smaller LCP payload.
import heroSunset from "@/assets/hero_sunset.png";
import heroSunsetAvif from "@/assets/hero_sunset.avif";
import heroSunsetWebp from "@/assets/hero_sunset.webp";

const DESTINATION_KEYS = ["airports", "hotels", "cruisePorts", "repairShops"] as const;
const TRUST_KEYS = [
  "reviews",
  "allStar",
  "delivery",
  "contactless",
  "language",
  "familyOwned",
] as const;

const Hero = () => {
  const reduce = useReducedMotion();
  const { t } = useTranslation(["home", "common"]);

  const rise = reduce ? 0 : 18;
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
  };
  const item = {
    hidden: { opacity: 0, y: rise },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section className="relative isolate flex min-h-[74svh] items-end overflow-hidden bg-ink lg:min-h-[calc(100svh-4rem)]">
      {/* Preload only the AVIF — the format the <picture> below will pick in
          any browser that supports it, so this never causes a second fetch. */}
      <Helmet>
        <link rel="preload" as="image" href={heroSunsetAvif} type="image/avif" fetchpriority="high" />
      </Helmet>

      <picture>
        <source srcSet={heroSunsetAvif} type="image/avif" />
        <source srcSet={heroSunsetWebp} type="image/webp" />
        <img
          src={heroSunset}
          alt={t("hero.imageAlt")}
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[68%_center] lg:object-center"
          fetchPriority="high"
          decoding="async"
          width={1915}
          height={821}
        />
      </picture>

      {/* Legibility scrims — start-to-end + bottom, brand ink */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/50 to-ink/10 rtl:bg-gradient-to-l"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-ink/80 to-transparent"
      />

      {/* ===== Copy ===== */}
      <div className="container mx-auto pb-16 pt-28 sm:pb-20 lg:pb-28">
        <motion.div
          className="max-w-2xl"
          variants={container}
          initial={reduce ? undefined : "hidden"}
          animate="show"
        >
          <motion.p
            variants={item}
            className="text-sm font-medium uppercase tracking-[0.18em] text-white/70"
          >
            {t("hero.eyebrow")}
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-5 font-heading font-bold leading-[1.02] tracking-[-0.02em] text-white text-[clamp(2.75rem,1.1rem+6.2vw,5rem)]"
          >
            {t("hero.title")}
          </motion.h1>

          <motion.div variants={item} className="mt-6 max-w-xl space-y-2">
            <p className="text-lg leading-relaxed text-white/85 sm:text-xl">
              {t("hero.descriptionLine1")}
            </p>
            <p className="text-lg leading-relaxed text-white/85 sm:text-xl">
              {t("hero.descriptionLine2")}
            </p>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-white/70"
          >
            {DESTINATION_KEYS.map((d, i) => (
              <li key={d} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-white/40" />}
                {t(`hero.destinations.${d}`)}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/book" className="sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                {t("hero.primaryCta")} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Button>
            </Link>
            <Link to="/fleet" className="sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white sm:w-auto"
              >
                {t("hero.secondaryCta")}
              </Button>
            </Link>
          </motion.div>

          <motion.a
            variants={item}
            href={CONTACT_PHONE_HREF}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4" />
            <span>{t("common:actions.callOrText")}</span>
            <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
          </motion.a>

          <motion.ul
            variants={item}
            className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-6"
          >
            {TRUST_KEYS.map((key, i) => (
              <li key={key} className="flex items-center gap-1.5 text-sm text-white/75">
                {i === 0 ? (
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                ) : (
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                {t(`hero.trust.${key}`)}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
