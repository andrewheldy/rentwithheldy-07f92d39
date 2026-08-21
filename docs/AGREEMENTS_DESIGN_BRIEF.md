# Rent With Heldy Agreements — Design Brief

## Design read

This is product UI for a small internal operations team and a mobile-first legal signing surface for vehicle owners. It must produce calm confidence: staff should always understand agreement state and the next valid action, while signers should feel that a real document was prepared specifically for them. The admin surface should be compact and operational; the public surface should be document-led, spacious, and free of marketing distractions. Quality means exact state communication, readable legal typography, reliable touch signing, and no ambiguity about what is being signed.

## Skill loadout and overrides

- Opinion skill: Anthropic `frontend-design` only, because this is product UI.
- Motion: none beyond existing control-state transitions. The agreement experience does not benefit from animation.
- Brand overrides: preserve the existing Inter/Bricolage Grotesque pairing, warm-white/navy/teal palette, radius scale, and existing shadcn primitives. Legal body copy uses Inter for sustained readability; Bricolage is reserved for page and section headings.
- Accessibility floor: WCAG 2.2 AA, visible focus, non-color status cues, semantic forms, typed-signature alternative, and 320px reflow are non-negotiable.

## Direction

- Admin: a compact agreement ledger with state labels, dates, parties, subjects, and only state-valid actions.
- Signing: the agreement is the dominant artifact. A restrained terms ledger summarizes trial dates, revenue split, and vehicles before the complete frozen document.
- Signature area: one bordered signing surface at the end of the document, with draw/type modes, explicit consent, and a single decisive action.
- Editing: both canonical agreements remain complete HTML documents backed by typed fields. Date fields use the existing calendar/popover stack with month/year navigation and relationship-aware shortcuts, not browser-dependent native date inputs.
- Signature element: a thin teal document rule that begins beside the agreement number and continues through the section rhythm; it recalls a physical contract tab without adding decorative cards.

## Acceptance criteria

1. Agreement status and the next valid action are understandable without relying on color.
2. Admin creation, detail, and signing surfaces reuse the existing token and component system.
3. The complete frozen agreement remains readable and navigable at 320–430px and 200% zoom.
4. Drawn signing works with pointer/touch without fighting page scroll, and typed signing is a complete accessible alternative.
5. All forms have programmatic labels, text errors, visible focus, and appropriate input types/autocomplete.
6. Rendered desktop and mobile surfaces pass Accessibility, Anti-Slop, and Mobile UX review.
7. Both Drive agreements resolve through the same HTML/PDF renderer without changing their supplied legal substance, and no analytics or third-party marketing scripts receive signing tokens or agreement PII.

## Open questions

- Legal counsel should validate both canonical agreements before production use; implementation preserves the supplied Google Doc language without offering legal advice.
- A second owner is supported but optional by default. Staff can mark additional signers required before sending.
