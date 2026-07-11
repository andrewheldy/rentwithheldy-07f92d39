# Rent With Heldy — Claude Project Instructions

## Project Context

This repository powers the Rent With Heldy website.

Rent With Heldy is a family-owned South Florida car rental company focused on hospitality, convenient vehicle delivery, direct customer relationships, and a smooth booking experience.

Primary business goals:

- Increase direct bookings
- Reduce dependency on marketplace platforms
- Improve airport, hotel, cruise-port, and body-shop rental conversions
- Present Rent With Heldy as a trusted local hospitality-driven business
- Maintain a premium, simple, and approachable customer experience

## Source-of-Truth Documents

Before making significant design, copy, UX, interaction, or layout changes, review the relevant files in `/docs`.

Primary documents:

- `docs/REDESIGN_BLUEPRINT.md`
- `docs/ART_DIRECTION.md`
- `docs/CREATIVE_DIRECTION.md`
- `docs/INTERACTION_PRINCIPLES.md`
- `docs/COPY_PRINCIPLES.md`
- `docs/ENGLISH_COPY_AUDIT.md`
- `docs/COPY_DECISIONS_REQUIRED.md`

Use these documents as project guidance.

Do not assume every requirement in them has already been implemented. Inspect the current code and running application before marking anything complete.

If two documents conflict, use this priority:

1. The user's latest explicit instruction
2. `docs/REDESIGN_BLUEPRINT.md`
3. `docs/ART_DIRECTION.md`
4. `docs/CREATIVE_DIRECTION.md`
5. `docs/INTERACTION_PRINCIPLES.md`
6. `docs/COPY_PRINCIPLES.md`
7. Existing implementation

Do not treat the legacy `README.md` as the design or product source of truth.

## Design and Implementation Rules

- Preserve the established design system unless explicitly asked to revise it.
- Reuse shared components, tokens, and patterns.
- Avoid one-off CSS patches when a shared component should be fixed.
- Do not redesign unrelated sections while completing a focused task.
- Do not remove working functionality without explicit approval.
- Do not introduce placeholder content.
- Do not claim a task is complete without browser verification.
- Prefer practical, conversion-focused improvements over decorative complexity.
- Maintain responsive behavior across mobile, tablet, and desktop.
- Maintain accessibility, keyboard navigation, visible focus states, and reduced-motion support.
- Prevent text clipping, horizontal overflow, layout collisions, and content hidden by fixed dimensions.

## Localization Requirements

English is the canonical source locale, but no user-facing copy change is complete until every supported locale has been updated.

Supported locales:

- English: `en`
- Spanish: `es`
- French: `fr`
- Portuguese: `pt`
- Hebrew: `he`

Whenever you add, remove, rename, or change a user-facing string in the English locale, make the corresponding change in every other supported locale in the same task.

This applies to:

- headings
- body copy
- buttons
- navigation labels
- form labels
- placeholders
- validation messages
- success messages
- error messages
- accessibility labels
- metadata
- legal copy
- tooltips
- banners
- empty states
- confirmation text
- any other customer-visible language

### Localization workflow

1. Treat the English locale as the canonical key structure.
2. Add or update the same key in Spanish, French, Portuguese, and Hebrew.
3. Preserve identical key names and nesting across all locale files.
4. Translate for natural meaning and syntax, not literal word-for-word equivalence.
5. Preserve placeholders, interpolation variables, tags, and formatting exactly.
6. Do not translate stable internal values used by:
   - routes
   - APIs
   - analytics
   - form submissions
   - application logic
   - external widget configuration
7. Verify Hebrew RTL presentation.
8. Isolate LTR content in Hebrew where appropriate, including:
   - phone numbers
   - email addresses
   - URLs
   - airport codes
   - prices
   - dates
   - vehicle names
9. Do not leave English fallback copy in translated locales unless an external service does not support that locale.
10. Do not complete a task while locale keys are missing, stale, duplicated, or inconsistent.

### Mandatory copy-change rule

A change to English customer-facing copy must not be committed by itself.

The same change must include:

- English
- Spanish
- French
- Portuguese
- Hebrew
- any layout or RTL adjustment required by the new text length

Longer translations must be tested for wrapping, clipping, overflow, and responsive layout problems.

## Routing and Internal Values

- Keep route paths and internal identifiers stable unless explicitly instructed otherwise.
- Do not translate internal enum values, form values, analytics event names, API payload values, or database-facing values.
- Translate display labels only.
- Preserve existing CTA destinations when changing CTA copy or layout.
- Verify all links after editing shared navigation or CTA components.

## Testing and Validation

Before declaring work complete, run the relevant project checks, including where available:

- lint
- TypeScript type-check
- unit tests
- localization validation
- production build
- Playwright or browser tests
- responsive overflow checks

For user-facing changes, inspect the running application in the browser.

For localization changes, verify all five locales.

For responsive changes, test representative mobile, tablet, and desktop sizes.

At minimum, check:

- no horizontal overflow
- no clipped text
- no overlapping content
- no broken RTL layout
- no dead links
- no missing locale keys
- no untranslated user-facing strings
- no broken booking or contact paths

Report exact command results. Do not say a check passed unless it was actually run.

## Git and File Safety

- Do not commit `.env` files or secrets. `.env` is gitignored; use `.env.example` as the template for required variable names.
- Do not expose API keys, tokens, credentials, or private customer data.
- Do not discard unrelated working-tree changes.
- Inspect `git status` before and after changes.
- Keep commits focused and clearly named.
- `CLAUDE.md` should be tracked in Git.
- Project-wide documentation belongs in the repository unless it contains secrets or machine-specific information.

## Package Manager

Local development is documented with npm (`package-lock.json`). `bun.lock` and `bun.lockb` also exist in the repository, and commit history contains conflicting claims about which lockfile Vercel actually uses for production deploys. This is unresolved — do not delete either Bun lockfile or assert which package manager is authoritative for deployment without checking the Vercel project's actual Install Command / detected framework first.

## Completion Standard

A task is complete only when:

- the requested change is implemented
- all affected locales are updated
- affected routes and links still work
- responsive behavior is verified
- relevant tests pass
- the production build passes
- browser behavior has been inspected
- remaining issues are reported honestly
