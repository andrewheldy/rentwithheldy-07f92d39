import { useRef } from "react";
import { Link } from "react-router-dom";
import { Star, Phone, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

/* ---------------------------------------------------------------------------
   HERO MEDIA — LICENSED PLACEHOLDER, VIDEO-READY
   V1 ships a self-hosted licensed South Florida golden-hour still (~211 KB).
   It is a PLACEHOLDER: swap for real Rent With Heldy photography (a key handoff
   at a hotel porte-cochère, a fleet SUV curbside at FLL arrivals). The still
   lives in the exact container the future loop will occupy — see HeroMedia
   below. To move to video later, no layout/scrim/motion changes are needed.
--------------------------------------------------------------------------- */
import heroPoster from "@/assets/hero-south-florida.jpg";

// Floating light-grain tile (adds filmic texture without hurting LCP).
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const DESTINATIONS = ["Airports", "Hotels", "Cruise ports", "Repair shops"];

const TRUST = [
  "All-Star Host on Turo",
  "Family-owned",
  "Hablamos Español",
  "Open 7 days",
];

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Subtle scroll parallax — the media drifts slower than the copy.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const mediaY = useTransform(scrollYProgress, [0, 1], ["-3%", "9%"]);

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
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-ink lg:min-h-[calc(100svh-4rem)]"
    >
      {/* ===== HeroMedia: the swap point (poster today → hero-loop.mp4 later) =====
          Replace the <motion.img> below with, keeping everything else identical:
            <video autoPlay muted loop playsInline poster={heroPoster}
              className="absolute inset-0 h-full w-full object-cover object-[center_55%]">
              <source src="/media/hero-loop.mp4" type="video/mp4" />
            </video>
      ==================================================================== */}
      <motion.div
        style={reduce ? undefined : { y: mediaY }}
        className="absolute inset-x-0 -top-[8%] -z-10 h-[116%]"
      >
        <motion.img
          src={heroPoster}
          alt="Golden-hour light over South Florida — the start of an easy trip"
          className="h-full w-full object-cover object-[center_55%]"
          fetchPriority="high"
          decoding="async"
          width={1600}
          height={1067}
          initial={reduce ? undefined : { scale: 1 }}
          animate={reduce ? undefined : { scale: 1.03 }}
          transition={
            reduce
              ? undefined
              : { duration: 20, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }
          }
        />
      </motion.div>

      {/* Depth layer: slow drifting warm/teal light */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 55% at 22% 78%, hsl(180 85% 45% / 0.20), transparent 60%)",
          }}
          animate={{ opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
        />
      )}

      {/* Legibility scrims — left-to-right + bottom, brand ink */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/50 to-ink/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-ink/80 to-transparent"
      />

      {/* Floating light grain */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.14] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: "140px 140px" }}
        animate={reduce ? undefined : { x: [0, -6, 0], y: [0, 5, 0] }}
        transition={reduce ? undefined : { duration: 9, ease: "easeInOut", repeat: Infinity }}
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
            Fort Lauderdale · Miami · FLL
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-5 font-heading font-bold leading-[1.02] tracking-[-0.02em] text-white text-[clamp(2.75rem,1.1rem+6.2vw,5rem)]"
          >
            Skip the rental counter.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl"
          >
            Your car, delivered where you need it. A family-owned South Florida
            fleet — we meet you and hand over the keys.
          </motion.p>

          <motion.ul
            variants={item}
            className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-white/70"
          >
            {DESTINATIONS.map((d, i) => (
              <li key={d} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-white/40" />}
                {d}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/book" className="sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Book Your Rental <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/fleet" className="sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white sm:w-auto"
              >
                Browse Fleet
              </Button>
            </Link>
          </motion.div>

          <motion.a
            variants={item}
            href="tel:+15615198958"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4" />
            Call or Text (561) 519-8958
          </motion.a>

          <motion.ul
            variants={item}
            className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-6"
          >
            {TRUST.map((t, i) => (
              <li key={t} className="flex items-center gap-1.5 text-sm text-white/75">
                {i === 0 ? (
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                ) : (
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                {t}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
