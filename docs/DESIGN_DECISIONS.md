# Design Decisions

## 2026-08-12 - AI Systems Pass 1

- **Accepted:** classify `/ai-systems` as a marketing / landing / portfolio surface and use `taste-skill` as the only opinion skill. Source: Design Director and `taste-skill`. Decider: Andrew Heldy via the implementation specification.
- **Accepted:** preserve Inter and Bricolage Grotesque rather than introduce another type system. Source: brand implementation and Design Engineer. Decider: Andrew Heldy via existing site tokens.
- **Accepted:** use native CSS transitions with the existing IntersectionObserver reveal trigger. Do not use the installed Motion runtime for Pass 1 because no lifecycle, layout-morph, unmount, or gesture gate is passed. Source: `motion-director` / `motion-selection`. Decider: Design Director.
- **Rejected:** add generated hero imagery or generic product screenshots. Source: `taste-skill` imagery recommendation. Reason: conflicts with the project's no-AI-imagery rule and the feature's system-map narrative; sanitized real artifacts are planned for Pass 3. Decider: Design Director.
- **Rejected:** add dark mode specifically for the showcase. Source: `taste-skill` dual-mode default. Reason: the implemented Rent With Heldy public brand is light-only and this feature should extend, not fork, that system. Decider: Design Director.
- **Accepted:** allow the hero and final contact actions to use different labels because they occupy different narrative roles: the hero advances to the conversion section, while the final action opens the existing email channel. Source: feature specification overriding `taste-skill` duplicate-intent preference. Decider: Andrew Heldy via implementation specification.

## 2026-08-15 - AI Systems Pass 3

- **Accepted:** reorganize the existing sections into six navigable chapters and use the muted teal connector as the shared sign for progression, workflow, and transfer. Source: Pass 3 implementation brief and Design Director. Decider: Andrew Heldy via the implementation specification.
- **Accepted:** use IntersectionObserver, native CSS transitions/keyframes, and one passive requestAnimationFrame-coalesced progress write. Do not escalate to Motion or GSAP because no lifecycle morph, gesture, scrubbed timeline, SVG morph, or pinning gate is passed. Source: `motion-director` / `motion-selection`. Decider: Design Director.
- **Accepted:** introduce semi-sticky narrative scenes only at desktop widths with adequate space; mobile and reduced-motion paths remain normal document flow. Source: Accessibility and Mobile UX constraints. Decider: Design Director.
- **Rejected:** preserve the 14rem mobile gallery cards, the 2×2 mobile process grid, and the two-column hero network. Reason: all three obscure the journey or require unnecessary horizontal scanning. Source: Pass 3 brief and Mobile UX review criteria. Decider: Andrew Heldy via the implementation specification.
- **Rejected:** use one literal DOM/SVG path across the full page. Reason: it would couple unrelated layouts, increase scroll complexity, and weaken responsive reliability. Source: Pass 3 brief and Design Engineer. Decider: Design Director.
