# Copy Decisions Required — Rent With Heldy

**Purpose:** Track the customer-facing copy questions that are **still open after** the English overhaul pass. Everything approved in the overhaul brief (trust bar, CTAs, tolls, response-time, airport/cruise/hotel wording, Rent-to-Own pricing removal, Qualifying Period language, FAQ consolidation, SEO migration, About rewrite) has already been applied and is **not** re-listed here.

**Date:** 2026-07-10 · **Branch:** `redesign-v3`
**Status:** English source is otherwise frozen-ready. The items below must be resolved (business) or reviewed (legal) before translation begins.

Legend: **Release blocker** = must resolve before freeze/translate. **Legal** = counsel sign-off required.

---

## 1. Legal review required (block translation of the affected copy)

| ID | Page / Namespace | File | Current wording (excerpt) | Decision required | Why it matters | Safe temporary wording | Legal review |
|----|------------------|------|---------------------------|-------------------|----------------|------------------------|--------------|
| L1 | Privacy · legal | `src/i18n/locales/en/legal.json` → `privacy.*` | Full Privacy Policy incl. "We do not sell your personal information," cookies/analytics claims | Counsel to confirm the policy matches actual data practices and any consent-banner obligation | Enshrined in 4 languages; legally binding | Leave current English as-is until approved | **Yes** |
| L2 | Terms · legal | `src/i18n/locales/en/legal.json` → `terms.*` | Terms of Service — eligibility, liability, cancellations, governing law (FL) | Counsel review before translating | Binding across 4 jurisdictions' languages | Leave current English as-is | **Yes** |
| L3 | Loss of Use · services | `src/i18n/locales/en/services.json` → `lossOfUse.body`, `lossOfUse.faqs` | Statements about Florida loss-of-use law, affidavits, "defensible" daily rates | Attorney verification — this is B2B copy to PI firms | Misstating recovery law is a liability | Leave current English as-is | **Yes** |
| L4 | Rent-to-Own · rentToOwn | `src/i18n/locales/en/rentToOwn.json` | Ownership / equity language now **softened** but not eliminated: `comparison.rentToOwn.items[0]` "A path toward ownership"; `hero.subtitle` "working toward ownership"; `finalCta.subtitle` "working toward vehicle ownership"; `howItWorks.steps.ownVehicle`, `faq` "path toward ownership" | Consumer-finance counsel to confirm ownership/credit language is disclosure-compliant. Confirm whether the 90-day **Qualifying Period** mechanics and any payment-toward-ownership are accurate as written | Rent-to-Own / lease-to-own is a regulated financing concept | Current wording avoids specific $ / % / guaranteed ownership; keep until reviewed | **Yes** |
| L5 | Insurance / protection wording · faq + services + howItWorks | `faq.json` `items[5]`, `howItWorks.json` `pickup.items[2]`, `services.json` | Standardized to "proof of insurance or an active protection plan **through the booking platform**" | Confirm RwH does not offer insurance directly and this phrasing is accurate | Implying RwH provides insurance is a compliance risk | Current "through the booking platform" phrasing is the safe interim | **Yes** |
| L6 | Rent-to-Own "Journey to Ownership" infographic | `src/assets/journey-to-ownership.png` (was rendered in `src/pages/DriveToOwn.tsx`) | Baked-into-image copy: "Every qualifying payment you make **builds equity** and brings you closer to owning your vehicle," "WEEK 78 — Almost There," "OWNERSHIP — It's Yours!" | **Removed from the page in this pass** because the image asserts guaranteed ownership by a fixed week and day-one equity — both explicitly disallowed by the brief and unconfirmed. Needs a **compliant replacement graphic** (or text-only section) before it can return | Strongest financial-guarantee claim on the site; cannot be edited via locale (it's a raster image) | Section removed; asset retained in repo for redesign | **Yes** |

---

## 2. Business confirmation required

| ID | Page / Namespace | File | Current wording | Decision required | Why it matters | Safe temporary wording | Legal |
|----|------------------|------|-----------------|-------------------|----------------|------------------------|-------|
| B1 | Legal — "Last updated" date | `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` | `t("privacy.lastUpdated", { date: new Date()… })` renders **today's month/year on every load** | Provide an **approved fixed effective date**, then replace the dynamic `new Date()` with that constant | Legally misleading; a policy that "updates" on every visit is not defensible | **Left untouched per brief** (no approved date exists) — **RELEASE BLOCKER** | Yes (date) |
| B2 | Site-wide credential | `home.json`, `footer.json`, `locations.json`, `legal.json` | "All-Star Host" / "All-Star Host on Turo" | Confirm All-Star Host status is **currently active** | Stated as fact across many surfaces | Keep; remove if status lapses | No |
| B3 | Site-wide social proof | `home.json`, `locations.json`, `legal.json`, `faq.json` (meta) | "1,400+ five-star reviews" (now the single canonical volume claim; replaced all "hundreds of trips") | Confirm 1,400+ is **current and defensible**, and that "reviews" (not "guests"/"trips") is the accurate unit | Enshrined in 4 languages; primary credibility claim | Keep; adjust the number if the count differs | No |
| B4 | Structured data rating | `src/lib/seo-schemas.ts` → `localBusinessSchema.aggregateRating` | `reviewCount: "120"`, `ratingValue: "4.9"` — **not** aligned with the "1,400+" marketing claim | Decide the correct `reviewCount`/`ratingValue` for JSON-LD, and confirm it maps to reviews Google can verify | Rich-result eligibility; mismatch between schema and on-page claim | Left as-is (unverified change could be worse) | No (SEO) |
| B5 | About — business hours | `src/i18n/locales/en/legal.json` → `about.getInTouch.hoursValue` | "Mon-Sun: 8:00 AM - 8:00 PM" | Confirm these are the real hours | Stated as fact | Keep; correct if wrong | No |
| B6 | Service-page testimonials | `src/i18n/locales/en/services.json` → `airport/hotel/bodyShop/cruise.testimonial` | Single real Turo quotes (Reinah, Monique, Madisol, Christopher) — **kept** as authentic | Confirm authenticity + permission to publish (same guests appear in the home marquee screenshots) | Attributed quotes must be real & consented | Keep; remove any that can't be confirmed | No |

---

## 3. Out-of-locale content decision (before translation)

| ID | Page | File | Situation | Decision required | Safe temporary handling |
|----|------|------|-----------|-------------------|-------------------------|
| O1 | Trip Planner | `src/pages/TripPlanner.tsx` + `src/components/VacationQuiz.tsx` | Entire page + 3-question quiz are **hardcoded English** (zero `useTranslation`), including its `<SEO>` title/description. Linked live from Home and Fleet | **Migrate-and-translate** the page into a namespace, **or** consciously **defer** it from multilingual scope for launch | Page renders English in all languages today. Not blocking English freeze, but must be decided before the site is marketed as multilingual |

---

## 4. Resolved in this pass (for reference — no action needed)

- Trust bar replaced with the approved 6-item set; "Hablamos Español" removed (language help now framed as "Message us in your preferred language").
- CTA system standardized: **Book Now** (booking), **Check Availability** (quote/inquiry), **Find My Match** (Rent-to-Own).
- Tolls standardized everywhere: "billed at the end of the trip with no additional fees."
- Response-time standardized: "A member of our team will reach out as soon as possible" (removed within-minutes / same-day / 24-hour / email-draft-backup claims).
- Same-day rentals: "available, subject to vehicle availability" everywhere.
- Contactless pickup: "available on every rental" (secure lockbox), added across hero, services, FAQ.
- Airport/cruise/hotel wording aligned to operational reality (coordinate most convenient pickup; parking fees may apply; delivery fees vary by location; white-glove / guaranteed valet removed).
- Rent-to-Own: weekly prices ($270/$330/$450/$570) removed; fictional "Future Driver Story" testimonials removed; "Approved for" removed; 90-day Qualifying Period language added.
- Placeholder home reviews replaced with 10 authentic screenshot testimonials.
- FAQ content consolidated into the `faq` and `howItWorks` namespaces (translatable + JSON-LD).
- Page SEO titles/descriptions migrated into namespaces and tightened.
- About page humanized; "premium/trusted" repetition reduced; fleet positioned as economy → newer premium.
- Dead code deleted (see FINAL REPORT).

## 5. Known pre-existing technical issues (NOT English-copy; out of scope, informational)

These fail `tsc`/`eslint` on the branch **independently of this copy work** (verified against the un-touched originals):

- `src/components/Hero.tsx` — `<link fetchpriority>` should be `fetchPriority` (React attribute casing). Pre-existing.
- `src/components/ServicePageLayout.tsx` — `defaultPassengerType` union is wider than `QuickQuoteForm`'s accepted values (includes "Cruise Passenger", etc.). Pre-existing; involves backend-stable `passenger_type` values — do **not** change without backend coordination.
- `src/components/ui/*` + `tailwind.config.ts` — 8 eslint errors in shadcn-generated files (empty-object interfaces, `require()` import). Pre-existing.
