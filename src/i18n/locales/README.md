# Translation resources

English (`en/`) is the **canonical source of truth**. Every other locale is
compared against it by `npm run i18n:check`.

## Phase 1 status (current)

- `en/` — complete, powers the live English site.
- `es/`, `fr/`, `pt/`, `he/` — **awaiting approved translations (Phase 2).**
  Namespace files are `{}` (or partially filled). Any key not present here
  **falls back to English** at runtime. Users never see a raw key or an empty
  string.

## How to add a translation (Phase 2)

1. Open the matching file, e.g. `es/home.json`.
2. Copy the key structure from `en/home.json` and translate the **values only**.
   Leave keys untouched.
3. You do not need to translate every key at once — partial files are fine and
   merge over the English fallback.
4. Run `npm run i18n:check` to verify structure (no extra keys, no empty
   strings). Use `npm run i18n:check -- --strict` to see how much is still
   untranslated.

## Do NOT translate (keep verbatim)

- The brand name **Rent With Heldy**
- Phone `+1 (786) 505-9330` / `tel:+17865059330` and email
  `rentwithheldy@gmail.com` (these live in `src/lib/contact.ts`, not here)
- Vehicle makes/models, airport codes (MIA, FLL), and proper names such as
  Uber, Lyft, DoorDash, Instacart, PortMiami, Port Everglades, Turo.

Where a brand name appears inside a sentence (e.g. the footer copyright), keep
the name exactly as written and translate the surrounding words only.

## Interpolation

Values may contain `{{placeholders}}` (e.g. `"© {{year}} Rent With Heldy."`).
Keep the placeholder token identical — only translate the words around it.

## Adding a new namespace

Add `en/<name>.json`, register `<name>` in `src/i18n/config.ts` (`NAMESPACES`),
then run `npm run i18n:scaffold` to create the empty `{}` counterparts for every
other locale.
