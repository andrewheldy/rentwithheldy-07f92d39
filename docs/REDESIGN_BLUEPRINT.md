# Rent With Heldy — Website Modernization Blueprint

*Prepared 2026-07-09 · Audited against `origin/main` @ `0b26ecc` (production) · Branch: `redesign-v3`*

**Goal:** a premium, smooth, hospitality-first car rental website that increases direct bookings and quote submissions — without breaking the Wheelbase booking engine, lead forms, fleet data/images, SEO, deployment, or future analytics readiness.

---

## 0. Ground Truth

- Production = GitHub `andrewheldy/rentwithheldy-07f92d39` branch `main`, auto-deployed by Vercel (project `rentwithheldy-07f92d39`) to https://rentwithheldy.com.
- The previous local checkout was 212 commits stale (Feb 6 base). It has been fast-forwarded; `redesign-v3` is cut from the current production tip. The old `website-rebuild-v2` branch contains nothing unique and should not be used.
- All redesign work happens on `redesign-v3` (or successor branches), merged to `main` only after preview review.

---

## 1. Architecture Audit

- **Framework:** Vite 5 + React 18 + TypeScript SPA (Lovable-scaffolded); react-router-dom 6 client routing; no SSR/prerender.
- **Styling:** Tailwind 3 + shadcn/ui (Radix); HSL token system in `src/index.css` (tropical teal primary `180 85% 45%`, warm cream background, coral complementary). Dark-mode tokens exist but no toggle (dead). **No custom font loaded** — default system stack.
- **Animation:** `tailwindcss-animate` + custom keyframes (fade-in, 40s marquee, accordion). No Framer Motion/GSAP. No `prefers-reduced-motion` handling.
- **Data:** TanStack Query → Supabase (project `zggucizaopvjupfqfzhf`). Tables: `vehicles`, `vehicle_images`, `vehicle_categories`, `reservations`, `booking_inquiries`, `leads`, `event_logs`, `user_roles`; storage bucket `vehicle-images`; edge functions `check-availability` and `create-reservation` (both only reachable from retired routes).
- **Booking:** Wheelbase/Outdoorsy widget on `/book` — the sole live booking engine. The custom Supabase reservation flow is retired behind redirects.
- **Forms/email:** ~10 live lead paths → Supabase inserts (`leads` / `booking_inquiries`) and/or `POST /api/send-booking-email` (Vercel serverless → Resend → rentwithheldy@gmail.com).
- **SEO:** `react-helmet-async` via shared `SEO.tsx` + `seo-schemas.ts` (AutoRental, FAQPage, BreadcrumbList; Product JSON-LD in `FleetGrid`); static Organization/WebSite JSON-LD in `index.html`; `public/sitemap.xml` (12 URLs).
- **Analytics:** none — confirmed absent from source and the shipped bundle. Clean slate.
- **Deployment:** Vercel (framework=vite, Node 24), SPA rewrite in `vercel.json`. Stray `CNAME` file is a GitHub Pages relic. `.env` (Supabase publishable keys) is committed.
- **Performance:** single ~924 KB JS bundle (no route splitting; dead pages ship in it); `hero-banner.png` 1.7 MB eager-loaded LCP; `favicon.png` 1.6 MB; `journey-to-ownership.png` 1.5 MB.
- **Technical debt:** dead routes/components (`Categories`, `Vehicles`, `VehicleDetail`, `Reserve`, `VehicleCard`, `CategoryCard`, `PhotoGallery`, `BookingDialog`, `BookingSearchForm`, orphaned `BodyShopQuoteForm`, unused `RentToOwn` import that duplicates the routed `DriveToOwn`); AddCar stores photos as base64 in the DB while AdminPhotos uses storage URLs; migration `20260418022543` commits a plaintext admin password; unused assets (`hero-miami-skyline.jpg`, all of `src/assets/categories/`).

---

## 2. Protected Assets & Systems Register

Never change without explicit approval and a test plan.

| System | Files / details |
|---|---|
| **Wheelbase booking** | `src/components/WheelbaseWidget.tsx` (owner `4913818`, `window.Outdoorsy.color="1b4a8f"`, container `outdoorsy-book-now-container`, CloudFront `wheelbase.min.js`), `src/pages/Book.tsx`, route `/book`. Every form redirects here post-submit — `/book` must never break. |
| **Email pipeline** | `api/send-booking-email.ts` — field names (`source, formType, passengerType, name, phone, email, company, claimNumber, location, when, startDate, endDate, referredBy, notes`), `SUBJECT_MAP` keys, recipient `rentwithheldy@gmail.com`, env `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. |
| **Lead forms (10 paths)** | `QuickQuoteForm` (home + all ServicePageLayout pages), `AirportQuoteForm`, `HotelQuoteForm`, `BodyShopForm`, `PartnerIntakeForm`, `DriveToOwnQuiz`, `DriveToOwn` page form, `RentToOwn` page form (unrouted duplicate), `Contact` form, `BookingDialog` (currently unreachable). Preserve exact Supabase columns and `form_type` / `vertical_path` / `source` strings — `AdminLeads` filtering and email subjects depend on them. |
| **Fleet data & images** | Supabase `vehicles` + `vehicle_images` (live source of truth: storage/base64 URLs) with `src/data/vehicles.ts` + `src/assets/vehicles/*` (34 files) as fallback. Do not rename/move/compress/regenerate fleet files. Keep the `useVehicles()` return shape (`Vehicle.images: string[]`); never add `vin`/`license_plate`/`initial_mileage` to public selects. |
| **Admin** | `/auth`, `/addcars`, `/admin/leads`, `/admin/photos`, `ProtectedRoute`, `AuthContext` (`user_roles` admin check), RLS policies. |
| **SEO** | `SEO.tsx`, `seo-schemas.ts`, `public/sitemap.xml`, `public/robots.txt`, all indexed URLs, `FleetGrid` Product JSON-LD, static JSON-LD in `index.html`. |
| **Env/deploy** | `vercel.json` (the SPA rewrite keeps deep links alive), Vercel env vars, `.env` Supabase keys, GitHub→Vercel auto-deploy from `main`. |
| **Contact constants** | `tel:+15615198958` / “(561) 519-8958”, `rentwithheldy@gmail.com` — used everywhere including the email API. |

---

## 3. Phase 0 — Revenue-Critical Repairs (before any redesign)

Each touches a protected system: verify live first, fix surgically, get approval per item.

1. **`QuickQuoteForm` submit likely crashes.** It destructures a nonexistent `when` from the zod result and references an undefined `dateRange` variable outside the try/catch — a `ReferenceError` on the primary lead form on the homepage and every service page. Verify with a live test submit, then fix.
2. **`leads.form_type` CHECK constraint mismatch.** Migrations only allow `quick_quote`/`partner_intake`, but the app inserts `airport_quote`, `hotel_quote`, `contact`, `rent_to_own`. If the live constraint was never relaxed, those forms are silently failing their DB writes. Verify in Supabase; relax via a proper migration.
3. **Hotel page renders the wrong form.** `HotelConciergeRentals` passes `customForm=` but `ServicePageLayout` only accepts `formSlot=` — the purpose-built hotel form never renders. One-line fix.
4. **Add server-side 301s in `vercel.json`** for `/drive-to-own`, `/chariot`, `/airport-rentals`, `/insurance-replacement`, `/categories`, `/vehicles`, `/vehicle/:id`, `/reserve/*`, plus **www→apex** (www currently serves duplicate 200s). Keep the SPA rewrite intact and last.
5. **Sitemap gaps:** add `/airport-trips`, `/body-shop-delivery`, `/hotel-concierge-rentals`, `/cruise-port-delivery`, `/loss-of-use-claims`, `/rent-to-own`, `/local-car-rentals`, `/trip-planner`. Resolve the FLL airport canonical: pick one canonical URL (recommend `/fort-lauderdale-airport-car-rental`) and 301 the other.
6. **Swap the 1.6 MB favicon** for a proper 32/180/512px set.
7. **Hardcoded `aggregateRating` 4.9/120** in JSON-LD with no on-page rating: render the rating visibly beside reviews or remove it from schema (Google policy risk).
8. **Housekeeping (with sign-off):** remove dead routes/components/imports; resolve the `DriveToOwn` vs `RentToOwn` duplication (keep one).

Also flagged (decide later): rotate the admin password committed in migration `20260418022543`; add a honeypot + rate limit to public forms (no CAPTCHA needed).

---

## 4. UX / Design Audit — why it feels AI-generated

- **The hero is a picture of a website.** `hero-banner.png` bakes the headline into pixels — no real `<h1>`, no responsive text, 1.7 MB eager PNG as LCP.
- **No typeface.** System-default font + untouched shadcn defaults is the strongest generic signal.
- **Teal gradient on everything** — nearly every button, icon chip, and CTA band; `bg-gradient-subtle` is used on three hero bands but never defined (renders flat).
- **Trust asserted, never shown.** “All-Star Host” with no rating number or badge; reviews component named `PLACEHOLDER_REVIEWS`, one review praises “Gary”; Rent-to-Own shows fabricated “Future Driver Story” testimonials; no photo of Heldy anywhere.
- **Navigation hides the money pages.** The five verticals and city pages are reachable only from homepage hero tiles and the footer; no Fleet link in main nav; no phone in desktop header.
- **Inconsistent CTA vocabulary** for `/book`: “Check Our Availability” / “Book Instantly” / “Book Now” / “Start Booking” / “See More”.
- **Conflicting promises:** About says “respond within 24 hours”; Contact says “same day”.
- **Mobile:** hero shortcut grid is `grid-cols-5` at every width (11px labels); marquee never pauses; no reduced-motion support.
- **Off-brand 404** (raw Tailwind defaults, no header/footer) returning HTTP 200 (soft-404).
- **Copy** leans on boilerplate instead of the real story: family-owned, bilingual, FLL delivery, body-shop partnerships.

---

## 5. Hero Strategy

Principles: real photography, real `<h1>`, one primary action, fast.

1. **Structure (image-agnostic, build first):** full-bleed coded hero — left-aligned `<h1>`, one-line subhead naming Fort Lauderdale/FLL/Miami, one primary CTA (Book Now → `/book`) + one secondary (Get a Quote), slim trust row (★ All-Star Host · 25-vehicle fleet · Family-owned · Hablamos Español). Move the five vertical tiles to a clean band below the hero (2×3 or horizontal scroll on mobile).
2. **Imagery, in order of preference:**
   - **Best:** a half-day real photo shoot — Heldy handing keys at a hotel porte-cochère, a fleet SUV curbside at FLL arrivals, the fleet lined up. Only option that makes the site un-copyable.
   - **Interim:** licensed real photography, South Florida-specific, chosen for editorial realism (no renders/AI look), graded toward brand teal/sand. The unused `hero-miami-skyline.jpg` can serve as a temporary backplate.
   - **Later:** 6–10s muted looping video (coastal drive), poster fallback, reduced-motion disabled — only after CWV is healthy.
3. **Treatment:** subtle left-to-right dark scrim (~35%→0); optional very slow Ken Burns (20s, 1.0→1.05, disabled on mobile/reduced-motion). No parallax gimmicks in the hero.
4. **Performance contract:** AVIF/WebP ≤200 KB @1600w with `srcset` (800/1200/1600/2000), `fetchpriority="high"`, preloaded. Never touch `src/assets/vehicles/*`.

---

## 6. Design & Motion System

**Typography** (highest-leverage change): self-hosted variable fonts, preloaded woff2, `font-display: swap`. Display: Bricolage Grotesque or General Sans. Body/UI: Inter (or Geist), 16–18px, 1.6 line-height. Fluid `clamp()` scale — h1 40→64, h2 30→44, h3 22→28; tight tracking on display sizes only; sentence case.

**Color:** keep teal as identity but demote from “paint everything” to “signal action”: ink navy (`210 30% 12%`) anchors headings/footer; cream/sand warm surfaces; solid teal (not gradient) primary buttons; coral exclusively for quote/secondary accents; gradients only on 1–2 full-bleed CTA bands per page. Define the missing `--gradient-subtle` properly.

**Spacing/grid:** 8px scale; section rhythm `py-16/24/32`; `max-w-7xl`; two-tier radius (`--radius-card: 16px`, `--radius-control: 10px`).

**Buttons:** three variants only — primary (solid teal, hover darken + 1px lift), secondary (ink outline), ghost. One vocabulary: **Book Now** (`/book`), **Get a Quote** (forms), **Call or Text (561) 519-8958** (tel). Kill `hover:opacity-90`.

**Cards:** flat white, 1px warm border, radius 16, shadow only on hover (4px lift, 200ms ease-out). Retire gradient-circle icons: 20px lucide strokes in teal on a 10%-tint rounded square.

**Forms:** 48px min control height, visible labels, inline validation on blur, one column, tel fallback on error, invisible honeypot. Success = confirmation state with “what happens next”, not just a toast.

**Image treatments:** fleet photos in 4/3 containers, `object-cover`, no filters/overlays on vehicle photos; lazy + explicit dimensions below the fold (CLS).

**Motion rules:** 150–300ms UI, 400–600ms section reveals; ease-out in, ease-in out. Scroll reveals: opacity 0→1 + translateY 16px→0, staggered ≤80ms, once at 20% visibility, via IntersectionObserver + CSS (Framer Motion `LazyMotion` is an optional later upgrade — requires approval to install). Sticky storytelling reserved for How It Works steps and the Rent-to-Own journey (replace the 1.5 MB infographic PNG with a coded, scroll-revealed timeline). Mandatory global `prefers-reduced-motion` guard; marquee pauses on hover/focus. Page transitions: subtle 150ms fade at most.

---

## 7. Page-by-Page Roadmap (build order)

One phase = one PR with a Vercel preview. Protected deps called out in the PR before merge.

| # | Phase | Goal | Key changes | Protected deps | Risk |
|---|---|---|---|---|---|
| 0 | Repairs | Stop lead loss | §3 items 1–8 | Forms, leads table, vercel.json, sitemap | **Med** — test each fix live |
| 1 | Design system | Foundation | Fonts, tokens, button/card/form primitives, fix `gradient-subtle`, reduced-motion base | None (additive) | Low |
| 2 | Nav + Footer | Expose money pages | Header Services dropdown (5 verticals) + Locations, Fleet link, desktop phone; refined mobile sheet; footer Miami link; on-brand 404 with noindex | Header/Footer everywhere | Low-Med |
| 3 | Homepage | First impression + lead capture | Coded hero (§5); verticals band; QuickQuote as styled card; attributed reviews + rating badge; “meet Heldy” block; remove Unsplash CTA bg | QuickQuoteForm payload, `/book` links | Med |
| 4 | Fleet | Browsing that sells | Redesigned `FleetGrid` cards (photos untouched): price framing, feature chips, per-card Book Now; client-side filters; skeletons | `useVehicles` shape, DB images, Product JSON-LD | Med |
| 5 | Airport | Own “FLL car rental” | Rebuild on refreshed ServicePageLayout; arrival-flow storytelling; styled AirportQuoteForm; resolve dual-URL canonical | AirportQuoteForm insert, FLL routes | Med |
| 6 | Hotel | Concierge partnerships | Fix formSlot (Phase 0); guest vs. concierge dual paths; partner strip | HotelQuoteForm, PartnerIntakeForm | Med |
| 7 | Body Shop | B2B referral engine | 3-step insurance/claim flow; shop-partner block; insurer trust logos | BodyShopForm payload + `source:"body-shop-delivery"` | Med |
| 8 | Rent-To-Own | Driver applications | Merge DriveToOwn/RentToOwn into one page/quiz/form; coded journey timeline replaces infographic; honest testimonials or none | Both forms’ `leads` payloads, quiz | **Med-High** |
| 9 | FAQ + How It Works + Trip Planner | Reassurance | Restyled accordion + grouping; sticky-step How It Works; quiz polish | `faqs.ts` powers FAQPage schema | Low |
| 10 | Contact + About | Human trust | Real photos, bilingual note, unified response-time promise; real family story | Contact form insert | Low |
| 11 | City/verticals sweep | Consistency | Miami, Fort Lauderdale, Local, Cruise, Loss-of-Use inherit refreshed layouts; specificity copy pass | Layout SEO props | Low |
| 12 | Final optimization | Speed + polish | Route-level `React.lazy` splitting; delete dead code; image `srcset` sweep (rendering only, not fleet files); Lighthouse/CWV pass; a11y sweep | Bundle, everything | Med |

Per-page details (goal, conversion focus, SEO notes, motion ideas) are in the session audit; each PR should restate them for its page.

---

## 8. Analytics Readiness (nothing installed — recommendation only)

- Create `src/lib/analytics.ts` with a typed `track(event, props)` that no-ops today; instrument call sites during the rebuild so enabling GA4 later is a one-file change.
- **Event map:** `booking_cta_click` (source page, label), `wheelbase_widget_loaded`, `phone_click`, `email_click`, `quote_form_start/submit/error` (form_type, vertical_path), `partner_form_submit`, `rto_quiz_start/complete`, `fleet_vehicle_view` (vehicle id), `fleet_filter_used`, `faq_expanded`, `mailto_fallback_used`.
- When approved: GA4 via gtag (no GTM initially) + optionally Microsoft Clarity. Privacy page already anticipates “basic analytics.”

---

## 9. QA Checklist (run after every phase)

- **Booking:** `/book` loads the Wheelbase widget on mobile + desktop; script injects once and cleans up across route changes; test date-search returns vehicles; widget unaffected by CSS changes.
- **Forms (all 10):** test submit → correct Supabase row (`form_type`/`vertical_path`) → email arrives with correct subject → success state/redirect → error path shows call fallback.
- **Fleet:** all vehicles render with live DB images; static fallback works; `git diff --stat src/assets/vehicles` is empty.
- **SEO:** unique title/description/canonical per indexed page; sitemap URLs all 200 and self-canonical; 301s verified via `curl -I` for every legacy URL + www + http; Rich Results Test passes; social preview correct via a non-JS scraper.
- **Responsive:** 360/390/768/1024/1440; tap targets ≥44px.
- **Performance:** Lighthouse mobile ≥90 on Home/Fleet/Book; LCP <2.5s on 4G; CLS <0.1; bundle diff reviewed per PR.
- **Accessibility:** keyboard-only pass (nav, forms, accordion); visible focus; AA contrast (re-check teal-on-white); reduced-motion verified.
- **Cross-browser:** Safari iOS first, then Chrome, Firefox, Edge.
- **Analytics stubs:** every mapped event location fires the no-op `track()` in dev.

---

## 10. Implementation Rules

1. All work on `redesign-v3` (or successors) — never directly on `main`; `main` = production via Vercel auto-deploy.
2. One phase = one PR; small, reviewable commits; Vercel preview linked in every PR for visual sign-off before merge.
3. Before touching any file in the Protected Register (§2): state in the PR what is touched, why, and the rollback path. Booking widget, email API, form payloads, fleet data/images, and env are change-by-approval-only.
4. Fleet images: rendering may change; files may not (no rename/move/compress/replace). Same for `data/vehicles.ts` content and Supabase fleet rows.
5. After each phase, report: what changed / what was protected and untouched / what to test manually / residual risks.
6. No new packages without approval (self-hosted fonts are assets; `framer-motion` needs a yes).
7. Any SEO-affecting change gets its own risk note; no URL is removed without a 301.
