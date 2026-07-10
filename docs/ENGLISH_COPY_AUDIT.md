# English Copy Audit — Rent With Heldy

**Purpose:** Finalize the English *source of truth* before translating 684+ keys into Spanish, French, Portuguese (pt‑BR), and Hebrew.
**Date:** 2026‑07‑10
**Branch:** `redesign-v3`
**Status:** Audit only — **no copy was changed, no files rewritten, nothing committed.**

> **How to read this doc.** Every issue is tagged with a stable ID (`C#` critical, `R#` recommended, `O#` optional) so it can be tracked through approval. Priorities mean:
> - **Critical before translation** — fix/confirm *first*; translating this as‑is would lock in a placeholder, an unverified claim, a legal risk, or a half‑translated core surface across four languages.
> - **Recommended before translation** — a quality/consistency fix that is far cheaper to make once in English than to make (or repeat) 4× after translation.
> - **Optional polish** — nice to have; safe to do later.

---

## 0. Executive summary

- **Locale keys reviewed:** 684 across 14 namespaces (`common, navigation, home, fleet, services, locations, rentToOwn, howItWorks, faq, contact, forms, footer, booking, legal`).
- **Additional customer‑facing English reviewed outside the locale system:** ~90+ strings (two FAQ data sets, home testimonials, the Rent‑to‑Own quiz result engine, the Trip Planner + its quiz, 8 pages' hardcoded SEO, JSON‑LD descriptions).
- **Critical items:** 8 clusters (`C1–C8`).
- **Recommended items:** 11 clusters (`R1–R11`).
- **Optional items:** 6 clusters (`O1–O6`).
- **Overall verdict:** **The English source is NOT yet ready to translate.** The *localized* namespaces are structurally sound and mostly well‑written, but three things must be resolved first: (1) **placeholder/fictional testimonials** on the home and Rent‑to‑Own pages, (2) **unverified claims and Rent‑to‑Own pricing**, and (3) a **decision on the large blocks of customer copy that live outside the locale files** (FAQs, reviews, Trip Planner, page SEO). With `C1–C8` cleared and `R1–R7` applied, the source is ready.

**Pages with the most copy risk (highest → lowest):**
1. **Rent‑to‑Own** (`/rent-to-own`) — fictional testimonials, unverified pricing/approval language, financing/ownership claims.
2. **Home** (`/`) — placeholder testimonials, hardcoded SEO, delivery‑promise vs. reality.
3. **Loss of Use Claims** — legal statements to attorneys; must be counsel‑approved.
4. **About / Privacy / Terms** — corporate/AI‑ish tone, dynamic "last updated" date, legal review.
5. **Airport / Hotel / Cruise** — delivery wording vs. operations; inconsistent toll policy.

---

## 1. Translation‑readiness blockers — customer copy that lives OUTSIDE the locale files

This is the gating section. The 14 namespaces are wired through `useTranslation()`, but a meaningful amount of **customer‑facing English is hardcoded in components, data files, and page SEO props** and will therefore **not translate** — the site would render half‑Spanish/half‑English on these surfaces. Before paying to translate, decide for each: **migrate into a namespace** (translate it) or **consciously accept English** (and document that).

| ID | Source (file) | What renders | Where users see it | Recommendation | Priority |
|---|---|---|---|---|---|
| **C6** | `src/data/faqs.ts` → `GENERAL_FAQS` (8 Q&A) | Full FAQ content | Home FAQ preview, `/faq`, **FAQPage JSON‑LD** | Migrate to a `faq` namespace (e.g. `faq.items[]`) so it translates; it is core content on 3 pages | **Critical** |
| **C6** | `src/pages/HowItWorks.tsx` → inline `const FAQS` (5 Q&A) | A *second* FAQ set | `/how-it-works` (visible **+ JSON‑LD**) | Same: migrate to `howItWorks.faqs[]`. Also de‑duplicate vs. `GENERAL_FAQS` (see R10) | **Critical** |
| **C1** | `src/components/ReviewsMarquee.tsx` → `PLACEHOLDER_REVIEWS` (11) | Testimonials | Home reviews marquee | Replace with real, attributable reviews (see C1 detail); decide if testimonials stay in original language | **Critical** |
| **C3** | `src/components/DriveToOwnQuiz.tsx` → `recommend()` | Tier, category, "why" sentences, "fits" chips, **weekly $ price** | `/rent-to-own` quiz result | Confirm pricing; move descriptive copy into `rentToOwn` namespace or accept English (see C3) | **Critical** |
| **R11** | `src/pages/TripPlanner.tsx` + `src/components/VacationQuiz.tsx` | Whole page + 3‑question quiz (headings, options, recommendations, CTAs) | `/trip-planner` (linked from Home & Fleet) — **live**, zero `useTranslation` | Decide: internationalize before launch, or defer the page from the multilingual scope and note it | **Recommended** |
| **R7** | 8 page components pass **literal** `title`/`description` to `<SEO>` | Browser tab title + meta description | `/`, `/book`, `/fleet`, `/rent-to-own`, `/trip-planner`, `/about`, `/privacy`, `/terms` | Add `meta` keys to `home`, `booking`, `fleet`, `rentToOwn`, `legal` namespaces and read via `t()` (pattern already used by Contact/FAQ/HowItWorks/service/location pages) | **Recommended** |
| **O2** | `src/lib/seo-schemas.ts` → `localBusinessSchema.description` | JSON‑LD business description | Nearly every page (structured data) | Optional; machine‑facing. Align wording with footer/brand description | **Optional** |
| **O4** | Hardcoded `alt` / `aria-label` (Hero, Header, Footer, FleetGrid, ReviewsMarquee, DriveToOwn hero images, breadcrumbs) | Screen‑reader & image alt text | All pages (assistive tech, image SEO) | Route through `t()` if accessibility parity across languages matters | **Optional** |
| **O4** | JSON‑LD breadcrumb `name` literals (`"Home"`, `"About"`, …) across pages + `ServicePageLayout`/`LocationPageLayout` | BreadcrumbList structured data | Search results | Optional; low priority | **Optional** |

**Already clean (fully translatable):** Contact, FAQ (chrome), How It Works (chrome), all 4 location pages (Fort Lauderdale, Miami, Local, FLL Airport), all 4 `ServicePageLayout` pages (Body Shop, Cruise, Hotel, Loss of Use), Confirmation, 404, Footer, Header, all four live lead forms, and the Rent‑to‑Own page body/quiz **chrome**.

**Do NOT translate (dead code — recommend deleting instead, see O6):** `RentToOwn.tsx`, `Vehicles.tsx`, `Categories.tsx`, `VehicleDetail.tsx`, `Reserve.tsx` (orphaned pages), `BodyShopQuoteForm.tsx`, `ServiceAreasGrid.tsx` (unimported components). The live body‑shop form is the already‑translated `BodyShopForm.tsx`.

**Out of customer scope (admin / auth):** `AddCar`, `AdminLeads`, `AdminPhotos`, `Auth`, `admin/*`, `ProtectedRoute` — hardcoded English by design.

---

## 2. Claims requiring BUSINESS confirmation

These are stated as fact to customers and will be enshrined in four languages. Confirm each is **currently true and defensible** before translation.

| ID | Namespace / source | Key | Current English (excerpt) | Confirm |
|---|---|---|---|---|
| **C7** | home / footer / legal / locations / services | `hero.trust.allStar`, `brand.badge`, `about.values.trusted.description`, … | "All‑Star Host on Turo" | Is All‑Star Host status **currently active**? |
| **C7** | locations | `fortLauderdale.sections[…]`, `miami.sections[…]`, `local.sections[…]` | "hundreds of completed trips", "hundreds of five‑star trips" | Is the volume accurate? Prefer a verifiable range or drop the number |
| **C1** | ReviewsMarquee | `PLACEHOLDER_REVIEWS[…]` | "**Gary** was an excellent host!…" (const literally named `PLACEHOLDER_REVIEWS`) | Are these **real RwH reviews** with permission to publish? The "Gary" quote names a different host |
| **C1** | services | `airport/hotel/bodyShop/cruise.testimonial` | Reinah, Monique, Madisol, Christopher quotes | Same pool as the home marquee — confirm authenticity/permission |
| **C2** | rentToOwn | `testimonials.items[]` | name: "**Future Driver Story**" + invented quotes | These are **fictional**. Replace with real ones or remove the section |
| **C3** | DriveToOwnQuiz | `recommend().weekly` | "$270 / $330 / $450 / $570 **/ week**" | Are these the **real** weekly prices? They also post into lead emails |
| **C3** | rentToOwn / quiz | `quiz.result.approvedFor`, result screen | "**Approved for** [Uber X, Lyft…]" | "Approved" implies pre‑approval before any application — confirm or soften |
| **C8** | services (airport) | `airport.body[…]`, nav/footer labels | "Airport **Delivery**" / "FLL pickup & drop‑off" vs. body "a convenient spot **near** the airport", "meet just **off‑airport**" | What actually happens — terminal‑curb delivery, or a nearby meeting point? |
| **C8** | services (hotel) | `hotel.valueProps[…]`, `hotel.faqs[…]` | "We coordinate directly with the **valet** to stage the car" | Do you actually do valet coordination at hotels? |
| **R5** | services (hotel vs cruise) | `hotel.valueProps[3]`, `cruise.faqs[3]`, `cruise.valueProps[3]` | Tolls "passed through **at cost** with no padded surcharges" **vs.** "at cost with a **small flat convenience fee**" | Which is the real toll policy? Unify |
| **R2** | about / contact / footer / forms | `about.getInTouch.emailNote`, `contact.cards.email.note`, `forms.shared.savedDesc` | "within **24 hours**" vs. "**Same‑day** reply" vs. "within **minutes**" | Pick one response‑time promise you can keep |
| — | legal | `about.getInTouch.hoursValue` | "Mon‑Sun: 8:00 AM ‑ 8:00 PM" | Are these the real hours? |
| — | services (bodyShop) | `bodyShop.valueProps[2]` | "**Same‑Day Availability** … met the same day across Broward and Miami‑Dade" | Operational guarantee — confirm |

---

## 3. Legal / policy language requiring review

Translate faithfully **only after counsel signs off on the English** — translation locks in legal meaning across four jurisdictions' languages.

| ID | Namespace | Key | Issue | Priority |
|---|---|---|---|---|
| **C4** | legal | `privacy.lastUpdated`, `terms.lastUpdated` | Rendered from `new Date()` → **always shows today's month/year** ("Last updated: July 2026" on every load). Legally misleading; use a **fixed** approved date | **Critical** |
| **C5** | legal | `terms.*` (all) | Terms of Service — eligibility, liability, cancellations, governing law (FL). Attorney review before translating | **Critical** |
| **C5** | legal | `privacy.*` (all) | Privacy Policy — "We do not sell your personal information", cookies/analytics claims must match reality (and any consent‑banner obligation) | **Critical** |
| **C5** | services | `lossOfUse.body[…]`, `lossOfUse.faqs[…]` | Statements about **Florida loss‑of‑use law** and offered documentation (affidavits, demand‑letter support, "defensible rates"). Must be attorney‑verified — this is B2B copy to PI firms | **Critical** |
| **C5** | services / data | `faq`/`GENERAL_FAQS`, `howItWorks.pickup` | "proof of insurance or **our offered protection plan**" — implies RwH offers insurance directly; verify wording vs. "the booking platform's protection plan" used elsewhere | **Critical** |
| **C5** | rentToOwn | `hero.*`, `features.*`, `faq.items[…]` | Rent‑to‑Own / lease‑to‑own is a **regulated financing concept**. Vague ownership language ("a portion of qualifying payments contributes toward ownership", "until ownership requirements are met") should be reviewed for consumer‑finance disclosure risk | **Critical** |

---

## 4. Findings by audit area

Each area lists the material issues. Trivial one‑offs are folded into the closest cluster.

### 4.1 Positioning consistency
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| R6 | legal | `about.hero.subtitle` | "Your trusted partner for premium car rentals… committed to providing exceptional service and quality vehicles for all your transportation needs." | Generic, corporate, reads AI‑written — off the "local, human, hospitality" brand | Rewrite in first person and specific: who you are, South Florida, delivered to you | Recommended |
| R6 | legal | `about.values.*.description` | "Carefully maintained fleet of vehicles ranging from economy to luxury." etc. | Generic trust triad (Trusted/Premium/Local) | Make concrete and human, or fold into the story | Recommended |
| R8 | (site‑wide) | multiple | "premium" (premium fleet/private/options), "trusted" | Over‑used qualifiers dilute meaning | Reserve "premium" for genuinely premium vehicles; show, don't assert | Recommended |

### 4.2 Headline quality
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| — | (various) | `home.hero.title`, `home.why.title`, `rentToOwn.hero.title` | "Skip the rental counter." / "Big rental brands make you come to them. We come to you." / "Drive Today. Own Tomorrow." | **Strong — keep.** Benchmarks for the rest | — |
| O1 | services | `lossOfUse.h1` | "Loss of Use Rentals & Documentation for PI Attorneys." | Trailing period in an H1 (other H1s have none); slightly jargon‑front‑loaded | Drop the period; keep audience‑specific | Optional |
| R6 | legal | `about.hero.title` | "About Rent With Heldy" | Fine but flat for the brand's warmest page | Optional warmer headline | Optional |

### 4.3 CTA consistency
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| R1 | common / home / services | `actions.bookNow`, `actions.bookInstantly`, `home.hero.primaryCta` | "Book Now" / "Book Instantly" / "Book Your Rental" | Three labels for the **same** primary action; `ServicePageLayout` uses "Book Instantly" while location/home use "Book Now" | Standardize the primary booking CTA to **one** label | Recommended |
| R1 | forms / common | `quickQuote.cta`, `actions.getMyQuote`, `airportQuote.cta`, `hotelQuote.cta` | "Check Our Availability" / "Get My Quote" / "Get My Airport Quote" / "Get My Hotel Delivery Quote" | Same quote form shows different CTAs by context | Acceptable if intentional; otherwise unify the quote‑CTA voice | Recommended |
| R1 | (tension) | `actions.bookInstantly` vs `quickQuote.subtitle` | "Book Instantly" vs "We'll text you back fast" | "Instantly" (widget) vs. "we'll follow up" (quote) set different expectations | Distinguish "Book now" (instant widget) from "Get a quote" (we reply) clearly | Recommended |

### 4.4 Repeated claims
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| R8 | home / footer / legal / locations | "All‑Star Host on Turo" | (many) | Appears on nearly every surface | Keep as a credential but reduce frequency | Recommended |
| C7 | locations | "hundreds of … trips" | (many) | Repeated unverifiable volume claim | Verify; state once, prominently | Critical (verify) |
| R10 | data / howItWorks | `GENERAL_FAQS` vs inline `FAQS` | "What documents do I need?" ≈ "What do I need to bring to pickup?"; extend vs cancel overlap | Two FAQ sets overlap | Consolidate into one canonical FAQ source | Recommended |
| — | services / home | "skip the rental counter", "no lines, no shuttle" | (many) | Core motif repeated — mostly intentional | Leave; watch for verbatim fatigue | Optional |

### 4.5 Unsupported claims
See **§2** (`C1, C2, C3, C7, C8`) and **§3** (`C5`). All "Unsupported claims" findings are consolidated there so business/legal can review them in one place.

### 4.6 Program terminology
| ID | Namespace / source | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| R4 | navigation / footer / rentToOwn | `links.rentToOwn`, `services.rentToOwn`, `hero.badge` | "Rent‑**T**o‑Own" | Non‑standard capital "To"; standard is "Rent‑to‑Own" | Standardize casing everywhere (translators mirror casing) | Recommended |
| R4 | code (backend notes) | `DriveToOwnQuiz` notes, route/vertical | "**Chariot** Quiz match", `vertical_path:"drive-to-own"`, passenger_type "Rideshare / Delivery Driver" | Internal names ("Chariot", "Drive‑to‑Own") leak into lead emails the team reads; program is "Rent‑to‑Own" externally | Unify internal naming; not user‑facing but causes ops confusion | Recommended |
| O5 | forms | `quickQuote.passengerTypes.localRental` | "Local Rental" | It's a *rental type* used as a *customer type* in "I am a…" | Reword to a person ("Local Renter" / "Local Resident") | Optional |
| C5 | data / services | insurance vs "protection plan" | see §3 | Terminology inconsistency with legal weight | Align wording | Critical (legal) |

### 4.7 Delivery wording
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| C8 | services (airport) | `airport.intro`, `airport.body[…]`, `airport.faqs[0]` | "Airport delivery" / "meet‑and‑greet **near** the terminal" / "**off‑airport**" | Promise ("delivery/at the airport") vs. reality ("near/off airport") | Align to what actually happens; set the expectation the ops can meet | Critical |
| C8 | services (cruise) | `cruise.valueProps[0]` vs `cruise.faqs[0]` | "Curb‑side… we meet you **at the terminal** as you disembark" vs "designated rideshare/private‑vehicle **pickup area**" | "Curbside at your ship" vs "designated pickup area" differ | Pick one accurate description | Recommended |
| R9 | services (hotel) | `hotel.*` | "upscale", "white‑glove", "premium travelers" | Luxury register drifts from "premium **but approachable**" | Warm the tone to match the rest of the site | Recommended |

### 4.8 Rent‑to‑Own clarity
| ID | Namespace / source | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| C2 | rentToOwn | `testimonials.items[]` | "Future Driver Story" | Fictional testimonials presented as social proof | Remove or replace with real stories | Critical |
| C3 | DriveToOwnQuiz | `recommend()` + `quiz.result.approvedFor` | "$X/week", "Approved for…" | Unverified price + "approved" pre‑commitment; hardcoded (untranslated) | Verify price; "Eligible/Qualifies for"; move copy into locale or accept English | Critical |
| C5 | rentToOwn | `features.*`, `faq.items[…]`, `howItWorks.steps[…]` | "a portion of qualifying payments contributes toward ownership… until ownership requirements are met" | Vague on term/%, and it's a regulated finance concept | Add concrete, counsel‑approved mechanics (or explicit "details at approval") | Critical (legal) |

### 4.9 Form instructions
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| — | forms | `quickQuote.*`, `airportQuote.*`, `hotelQuote.*`, `bodyShopForm.*` | Per‑type hints, example placeholders | **Strong** — clear, specific, helpful | Keep | — |
| R3 | forms | `quickQuote.subtitle` | "We'll text you back fast with a quote." | On submit the user is routed to the booking widget (`/book`); no text‑back confirmation shown | Align copy with the actual post‑submit experience | Recommended |
| — | forms | placeholders "e.g. American Airlines / Marriott… / Maaco… / State Farm" | Brand examples in placeholders | Fine, but examples should read naturally per language (keep brand names) | Note for translators | Optional |

### 4.10 Error & success messages
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| R3 | forms | `shared.savedDesc` | "We'll respond within minutes. **Email draft opened as a backup.**" | Describes a mailto‑fallback the live forms **don't perform**; `shared.*` appears unused vs. `quickQuote.errorRetry` | Remove/rewrite; delete dead keys if unused | Recommended |
| R2 | forms | `shared.savedDesc` "within minutes" | see §2 | Third response‑time promise | Unify (see R2) | Recommended |
| — | forms / contact / booking | `quickQuote.errorRetry`, `contact.toast.*`, `booking.confirmation.*` | "Something went wrong. Please call or text us directly." etc. | **Good** — human and actionable | Keep | — |

### 4.11 Mobile text length
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| — | navigation | `links.rentToOwn`, `links.howItWorks` | "Rent‑To‑Own", "How It Works" | Longest desktop‑nav items; fine in English at `lg+`. **Risk is post‑translation expansion** (es/fr/pt run 15–25% longer) | Keep concise localized nav labels in the translation phase; QA the `lg` breakpoint | Note (translation phase) |
| O3 | fleet | `grid.empty`, `grid.photoComingSoon` | "Our fleet is being updated…", "Photo coming soon" | Temporary/placeholder empty‑states read as "unfinished" | Soften; ensure photos exist before launch | Optional |
| — | services | `airport.h1`, `lossOfUse.h1` | Long H1s | Wrap to 3–4 lines at 375 px but sizing is responsive | Acceptable; watch after translation | Optional |

### 4.12 Legal & policy language
Consolidated in **§3** (`C4, C5`).

### 4.13 SEO copy
| ID | Namespace / source | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| R7 | (8 pages) | hardcoded `<SEO title/description>` | Home, Book, Fleet, DriveToOwn, TripPlanner, About, Privacy, Terms | Not in the content layer → not translatable and not auditable centrally | Move into namespaces; add `meta` keys | Recommended |
| R7 | services / locations | `*.meta.title` / `*.metaTitle` | e.g. "Cruise Port Car Rental Delivery in Miami & Fort Lauderdale \| Rent With Heldy" (~76 chars) | Several titles exceed ~60 chars and truncate in search results | Tighten to ≤60 chars; front‑load the keyword | Recommended |
| O2 | footer | `seoParagraph` | "Rent With Heldy is a private car rental service based in South Florida, serving…" | Keyword‑stuffed footer paragraph reads as SEO filler | Optional lighter rewrite (it **is** translated) | Optional |
| O2 | seo‑schemas | `localBusinessSchema.description` | "Private car rental serving Fort Lauderdale, Miami…" | Hardcoded; duplicates other descriptions | Align + centralize | Optional |

### 4.14 Tone consistency
| ID | Namespace | Key | Current | Problem | Recommendation | Priority |
|---|---|---|---|---|---|---|
| R6 | legal | `about.*` | see §4.1 | Corporate/AI‑generic on the brand's warmest page | Humanize | Recommended |
| R9 | services | `hotel.*` | "white‑glove", luxury register | Drifts upscale vs. "approachable" | Warm the tone | Recommended |
| — | services | `lossOfUse.*` | Formal/legal | Audience‑appropriate (B2B/attorneys) — acceptable divergence | Keep | — |

### 4.15 Translation readiness
Consolidated in **§1** (`C6, R7, R11, O2, O4`) plus these structural notes for the translation phase:

- **Arrays are index‑flattened** by `i18n:check` (e.g. `pickup.items.0`). Translators must **preserve array element counts exactly** or the check fails.
- **Placeholder inventory (preserve verbatim):** `{{seats}} {{price}} {{code}} {{email}} {{phone}} {{year}} {{date}} {{context}} {{number}} {{current}} {{total}}`. Note `services.layout.valueProps.subtitle` interpolates `{{context}}` with the (English) `crumbLabel.toLowerCase()` — the surrounding sentence must stay grammatical when a possibly‑English word is injected.
- **HTML inside strings:** `howItWorks.walkthrough.step1.body` contains `<strong>…</strong>` and escaped quotes — keep tags/escapes intact.
- **"Hablamos Español"** appears inside the English source as a trust signal — decide a consistent handling across all languages (recommend keeping it verbatim as a badge).
- **Config note:** `NAMESPACES` in `src/i18n/config.ts` lists `"seo"` but there is no `en/seo.json`. Harmless, but either add the file or drop the entry.

---

## 5. Recommended order for approving changes

1. **Business confirmation pass (§2).** Owner confirms/curates: real testimonials (`C1`), remove/replace Rent‑to‑Own stories (`C2`), Rent‑to‑Own pricing + "approved" language (`C3`), All‑Star/volume claims (`C7`), delivery reality + toll policy (`C8`, `R5`), hours & same‑day guarantees, one response‑time promise (`R2`).
2. **Legal pass (§3).** Counsel approves Terms, Privacy, Loss‑of‑Use statements, insurance/"protection plan" wording, Rent‑to‑Own finance language; set the fixed "last updated" date (`C4`, `C5`).
3. **Out‑of‑locale content decision (§1).** For each block (FAQs `C6`, home reviews `C1`, R2O quiz `C3`, Trip Planner `R11`, page SEO `R7`) decide **migrate‑and‑translate** vs **accept‑English**, and migrate the ones you'll translate into namespaces. Delete dead code (`O6`) so it isn't translated.
4. **Copy‑quality pass (Recommended).** Apply `R1` (CTA standardization), `R3` (form success/stale copy), `R4` (Rent‑to‑Own naming/casing), `R6` (de‑corporate About), `R8` (reduce "premium/trust" repetition), `R9` (hotel tone), `R10` (merge FAQ sets), `R7` (tighten SEO titles).
5. **Optional polish.** `O1`–`O5` as time allows.
6. **Freeze English → run `npm run i18n:check` → begin translation.** Only after the English keys are final (re‑running the check confirms 684 canonical keys with no empties/extras).

---

## Appendix A — Issue index

**Critical (8):** C1 home/service testimonials authenticity · C2 fictional R2O testimonials · C3 R2O quiz pricing/"approved" · C4 dynamic legal "last updated" date · C5 legal/finance copy review · C6 out‑of‑locale FAQ content · C7 unverified All‑Star/volume claims · C8 delivery promise vs. reality.

**Recommended (11):** R1 CTA standardization · R2 response‑time consistency · R3 form success/stale copy · R4 Rent‑to‑Own naming/casing · R5 toll‑policy consistency · R6 de‑corporate About · R7 page SEO into namespaces + title length · R8 reduce premium/trust repetition · R9 hotel tone · R10 merge duplicate FAQ sets · R11 Trip Planner internationalization decision.

**Optional (6):** O1 H1 style · O2 SEO paragraph/schema polish · O3 fleet placeholder states · O4 alt/aria/JSON‑LD strings · O5 "Local Rental" label · O6 delete dead code/pages.

## Appendix B — Namespace inventory (English source)
`common` (25) · `navigation` · `home` · `fleet` · `services` (largest) · `locations` (largest) · `rentToOwn` · `howItWorks` · `faq` · `contact` · `forms` · `footer` · `booking` · `legal` — 14 namespaces, **684 keys** per `npm run i18n:check`.
