# Site Refresh — September 2026 Verification Record

*Branch `claude/website-refresh-orchestration-0o9yz1` (the approved equivalent of `refresh/ascension-site-polish`; the session's push target) · Starting commit `738a0ba` (main, PR #23) · Evidence captured 2026-09-28.*

A focused refresh of the existing Vite + React + TypeScript site: no rebuild, no framework change, no new dependencies. Orchestrated under the Ascension Website Builder rules (`rules/model-routing.md`, `rules/context-and-state.md`, `rules/engineering.md`).

## Operating record

| Item | Value |
|---|---|
| Root model | `claude-opus-5-5` (verified from the session record), effort high |
| Workers | **0**. Every packet shared the hero, tokens or metadata context and none was large enough to justify one, so nothing was delegated and no worker binding was needed |
| Repairs used | Packet B: 1 of 2 (Apple touch icon had a 1px black top edge from an out-of-bounds crop; regenerated) |
| Escalations | 0 — no visual change required touching a protected system |
| Starting working tree | clean |

### Protected systems — unchanged

Wheelbase booking (`HomeBookingWidget`, `lib/wheelbase`, `/book`), every lead form's fields/payloads/Supabase writes, `api/*` email delivery, auth/admin, agreements/signing, vehicle data and images, analytics event names and properties, routes and redirects, `vercel.json`, environment variables, locale routing and RTL direction handling.

The CTA markup change (below) wraps the same `to`/`href`/`onClick` in a different element; destinations and `track()` calls are byte-identical.

## What changed

### Packet A — Hero (`src/components/Hero.tsx`, `home.json` ×5)

| Width | Before (`object-position`, visible source x-range) | After |
|---|---|---|
| 320 | 68% → 1144–1377: skyline plus a sliver of the SUV's rear | 60% → 973–1266: skyline only |
| 390 | 68% → 1095–1400: same car fragment | 60% → 935–1292: skyline only |
| 768 | 68% → 800–1538: SUV sliced in half behind the booking card | 40% → 433–1265: water and skyline |
| 1024 | 50% → 499–1416: SUV cut off at the right edge | 72% → 640–1666: whole SUV beside the card |
| 1440 | 50% → 312–1603: SUV's tail clipped | 72% → 361–1775: whole SUV, palms framing |

The SUV occupies source x≈1335–1625 of the 1915×821 photograph. There's no distortion, because the aspect ratio is preserved by `object-cover`, and the image was not replaced or re-encoded. There's no parallax or zoom. Hebrew uses the same crop, since mirroring the photograph would misrepresent the real skyline.

- The hero's six-item trust list was removed. The trust strip directly below repeats the same six items, so phones showed twelve trust lines back to back. The `home.hero.trust.*` keys were removed from all five locales; nothing else read them.
- Entrance motion: 550ms / 18px / 120ms delay → 320ms / 12px / 40ms. The interaction spec says reveals should take 200–350ms and never exceed 500ms. Reduced motion still renders the final state with no animation.
- The hero call link now has a 44px touch target.

Comparisons: `refresh-evidence/hero-before-after-{390,768,1024,1440}.jpg` (the 390 sheet includes Hebrew).

### Packet B — Favicon, touch icon, share image, metadata

Production findings (anonymous fetches of rentwithheldy.com, 2026-09-28):

- `/favicon.ico` returned 7,645 bytes that were really a 73×74 PNG of the **Lovable heart logo**, served at the path browsers and crawlers request by default.
- `/apple-touch-icon.png` returned **404**.
- The default `og:image`, the AutoRental `image` and the AutoRental `logo` pointed at a third-party `gpt-engineer-file-uploads` bucket. The share image there was a legacy screenshot with baked-in, outdated claims ("25 Premium Vehicles", "All-Star Hosts").

Changes:

| Asset | Result (decoded, served by `vite preview`) |
|---|---|
| `/favicon.ico` | ICO 16/32/48, 5.7 KB — the logo's palm in brand teal on an ink tile. The full badge is illegible below ~64px (see `refresh-evidence/favicon-sizes.jpg`) |
| `/icon-192.png`, `/icon-512.png` + `/site.webmanifest` | PNG 192², 512²; `application/manifest+json` |
| `/apple-touch-icon.png` | PNG 180², full badge on cream |
| `/share-image.jpg` | JPEG 1200×630, 87 KB — a crop of the hero photograph with no baked-in text (Apple TN3156 prefers text-free preview graphics) |
| `/share-image.png` | Legacy URL kept alive, now serving the same new art (1200×630) |

- `SEO.tsx` defaults to the self-hosted image, emits `og:image:type/width/height`, and uses the translated hero alt text (`home:hero.imageAlt`, all five locales) for `og:image:alt` and `twitter:image:alt`.
- The static `index.html` head, which is all that non-JS social scrapers read, now mirrors the English home meta and declares the image URL (absolute), size and alt, `og:url` and `og:site_name`.
- The blog's server-rendered head (`src/server/blog/html.ts`) now also replaces `og:site_name`, `og:image:*` and `twitter:image:alt`, so the shell's defaults can't duplicate or contradict a post's own image. `html.test.ts` gained assertions for this; they fail on the old patterns and pass on the new ones.

### Packet C — Design-system polish

- **Primary button contrast.** White on the brand teal (`hsl(180 85% 45%)`) measured **1.84:1**, which fails WCAG AA even for large text. `--primary-foreground` and `--accent-foreground` are now ink: **9.05:1** at rest and 6.45:1 on hover. Every use sits on a teal fill, and the Wheelbase widget's teal button already used ink text.
- **One focus stop per CTA.** 20 CTAs rendered `<a><button>` (invalid nesting, and two tab stops for one action, confirmed in the baseline tab order). They now use `<Button asChild>`, so the link itself is styled as the button.
- **Button timing.** Transitions are now 150ms and a press moves the button down 1px, per the spec (buttons 140–180ms).
- **Reveal token.** `--dur-reveal` went from 520ms to 320ms.

### Packet D — SEO/AEO hygiene (audit)

In the browser, all 19 SPA sitemap routes returned exactly one `<h1>`, a self-referencing canonical on rentwithheldy.com, a self-hosted `og:image`, and no duplicate meta tags. `/book` redirects to the hosted Wheelbase store, so its head isn't observable locally; it does render `<SEO>`. `/blog` is served by `api/blog-page` in production and was covered by unit tests instead. No new business claims were introduced; all copy that moved already existed in the locale files.

## Command results

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | pass (exit 0) |
| Lint | `npm run lint` | pass (exit 0) — 9 warnings, same count as `main`; all pre-existing `react-refresh/only-export-components` |
| Unit tests | `npm run test` | pass — 18 files, 107 tests |
| Localization | `npm run i18n:check` | pass (exit 0) — 181 pre-existing warnings (English-identical brand/placeholder values) |
| Production build | `npm run build` | pass (exit 0) — pre-existing chunk-size warning |
| Browser journeys | `playwright test` (full suite, 132 tests) | 131 passed, 1 failed — `multilingual-qa` "1440x900 es" timed out (120s budget for 11 routes) waiting for the Trip Planner luggage step, while a screenshot script was hitting the same dev server. Re-run in isolation (`-g "1440x900 es" --repeat-each=3`): 3/3 passed, ~10s each. Recorded as **flaky under load, not pass**. This refresh only touched the Trip Planner's result-screen CTA, which comes after that step |
| Asset delivery | anonymous `curl` of every new public asset + Pillow decode | pass — all 200 with correct content types; declared sizes match decoded sizes |
| Hero/overflow/RTL/reduced motion | scripted Chromium capture, 320/390/768/1024/1440 × en/he (+ reduced motion for en) | pass — no horizontal overflow, `<h1>` fully opaque, booking card fully in the first viewport at every size except 320×640 (unchanged from baseline, see below), no page errors |

The pinned `@playwright/test` expects Chromium build 1228, and this sandbox ships 1194. The suite ran unchanged through a config that extends `playwright.config.ts` and only sets `launchOptions.executablePath`.

## Not verified here (`not_run`)

- **Live Wheelbase date search.** The external widget script doesn't load in this sandbox, so the widget rendered its existing fallback (a "Check Availability" link to the hosted store). The fallback path and link destination were verified; the live widget should be checked on the Vercel preview.
- **Messages / social rendering on devices.** Documented-guidance compliance and anonymous delivery pass; how iMessage, Slack and others actually render the preview is unverified until this is deployed to a public URL.
- **Screen-reader walkthrough.** Only automated checks and a keyboard tab-order check ran.

## Open findings (not changed in this refresh)

1. **Teal text contrast.** `text-primary` (eyebrows, text links, icons) is 1.84:1 on white and 1.77:1 on cream, across roughly 60 files. Fixing it needs a brand decision on the teal's lightness. `hsl(180 85% 26%)`, already used for blog links, reaches 5.08:1 on white and 4.88:1 on cream.
2. ~~Hebrew brand-name bidi~~ — **corrected and fixed in a follow-up commit.** The example originally cited here was misread: the home heading "מה מביא אתכם ל-Rent With Heldy?" renders in correct RTL order. At 390px it only wraps inside the brand name. The real defects were two other patterns:
   - **Latin items joined by `,` `/` `|` `•`** merged into one left-to-right run. Lists read in reverse order, and a Hebrew prefix landed next to the wrong word. For example, the city `<h1>` rendered `Fort Lauderdale, FL-ב`, and the page titles rendered `Miami | Rent With Heldy-וב`.
   - **Hebrew prefixes before Latin text or digits** (`ו-Pembroke`) could be stranded at a line end.

   Fixed in 202 Hebrew values with invisible marks:
   - an RLM (U+200F) before the next Latin item, which is the convention the Hebrew files already used;
   - a WORD JOINER (U+2060) after a prefix hyphen.

   Values identical to English were not touched. `i18n:check` now warns on either pattern in RTL locales: 165 warnings on the old files, 0 now.
3. **Heading-level skips.** `<h1>` goes straight to `<h3>` on service pages (quote-form card title), How It Works (step cards) and FAQ (Radix accordion questions default to `<h3>`). This is best practice rather than a WCAG failure, and it touches lead-form components.
4. **320×640 booking card.** On very short phones the booking card starts at 667px, below the fold. This is unchanged from the baseline, since it sits above the removed trust list.
5. **Business items already open in `COPY_DECISIONS_REQUIRED.md`**, untouched: B4 (JSON-LD `aggregateRating` 4.9/120 vs the on-page "1,400+" claim) and B1 (legal "last updated" date).
